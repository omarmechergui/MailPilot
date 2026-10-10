import db from '../db.js';
import { htmlToText } from 'html-to-text';
import { SendingService } from './sending.service.js';

export class CampaignService {
  static async createDraft(data) {
    let plainText = data.textContent;
    
    if (data.htmlContent && (!plainText || plainText.trim() === '')) {
      plainText = htmlToText(data.htmlContent, {
        wordwrap: 130,
      });
    }

    return db.campaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent || null,
        textContent: plainText || null,
        status: 'DRAFT',
      },
    });
  }

  static async getCampaigns(query) {
    const { page, pageSize, status } = query;
    const skip = (page - 1) * pageSize;

    const where = {};
    if (status) {
      where.status = status;
    }

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
           _count: {
             select: { recipients: true }
           }
        }
      }),
      db.campaign.count({ where }),
    ]);

    // Map to include totalRecipients safely
    const formatted = campaigns.map(c => ({
      ...c,
      totalRecipients: c.totalRecipients || c._count.recipients
    }));

    return {
      campaigns: formatted,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  static async getCampaignById(id) {
    const campaign = await db.campaign.findUnique({
      where: { id },
    });
    
    if (!campaign) {
      const error = new Error('Campaign not found');
      error.code = 'NOT_FOUND';
      throw error;
    }
    
    return campaign;
  }

  static async updateDraft(id, data) {
    const campaign = await this.getCampaignById(id);
    
    if (campaign.status !== 'DRAFT') {
      const error = new Error('Only draft campaigns can be modified');
      error.code = 'CONFLICT';
      throw error;
    }

    let plainText = data.textContent !== undefined ? data.textContent : campaign.textContent;
    const htmlContent = data.htmlContent !== undefined ? data.htmlContent : campaign.htmlContent;
    
    if (htmlContent && (!data.textContent || data.textContent.trim() === '')) {
      if (data.htmlContent !== undefined && data.textContent !== undefined) {
         plainText = htmlToText(htmlContent, { wordwrap: 130 });
      }
    }

    return db.campaign.update({
      where: { id },
      data: {
        name: data.name,
        subject: data.subject,
        htmlContent: htmlContent || null,
        textContent: plainText || null,
      },
    });
  }

  static async deleteDraft(id) {
    const campaign = await this.getCampaignById(id);
    
    if (campaign.status !== 'DRAFT') {
      const error = new Error('Only draft campaigns can be deleted');
      error.code = 'CONFLICT';
      throw error;
    }

    // Must delete recipients first if any
    await db.campaignRecipient.deleteMany({ where: { campaignId: id } });

    await db.campaign.delete({
      where: { id },
    });
    
    return true;
  }

  static async startCampaign(id) {
    const campaign = await this.getCampaignById(id);
    
    if (campaign.status !== 'DRAFT') {
      const error = new Error('Only draft campaigns can be sent');
      error.code = 'CONFLICT';
      throw error;
    }

    if (!campaign.htmlContent && !campaign.textContent) {
      const error = new Error('Campaign must have content to send');
      error.code = 'BAD_REQUEST';
      throw error;
    }

    const pendingCount = await db.campaignRecipient.count({
      where: { campaignId: id, status: 'PENDING' }
    });

    if (pendingCount === 0) {
      const error = new Error('Campaign has no pending recipients');
      error.code = 'BAD_REQUEST';
      throw error;
    }

    // Atomic update
    const updated = await db.campaign.updateMany({
      where: { id, status: 'DRAFT' },
      data: {
        status: 'SENDING',
        totalRecipients: pendingCount,
        startedAt: new Date(),
        updatedAt: new Date()
      }
    });

    if (updated.count === 0) {
      const error = new Error('Campaign is already sending or was modified concurrently');
      error.code = 'CONFLICT';
      throw error;
    }

    // Start background task
    SendingService.startCampaign(id);

    return db.campaign.findUnique({ where: { id } });
  }

  static async getCampaignStatus(id) {
    const campaign = await this.getCampaignById(id);
    
    const stats = await db.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { _all: true }
    });

    const statusCounts = {
      PENDING: 0,
      SENDING: 0,
      ACCEPTED: 0,
      FAILED: 0,
      SKIPPED: 0,
      UNKNOWN: 0
    };

    stats.forEach(stat => {
      statusCounts[stat.status] = stat._count._all;
    });

    return {
      campaignId: campaign.id,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients || statusCounts.PENDING + statusCounts.SENDING + statusCounts.ACCEPTED + statusCounts.FAILED + statusCounts.SKIPPED + statusCounts.UNKNOWN,
      pending: statusCounts.PENDING,
      accepted: statusCounts.ACCEPTED,
      failed: statusCounts.FAILED,
      skipped: statusCounts.SKIPPED,
      unknown: statusCounts.UNKNOWN,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt
    };
  }
}
