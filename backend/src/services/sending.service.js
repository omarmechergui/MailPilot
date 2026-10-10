import db from '../db.js';
import { EmailService } from './email.service.js';

export class SendingService {
  static async startCampaign(campaignId) {
    // In Phase 5, this runs in-process.
    this.executeCampaign(campaignId).catch(err => {
      console.error(`[SendingService] Unhandled error during campaign ${campaignId} execution:`, err);
    });
  }

  static async executeCampaign(campaignId) {
    const maxAttempts = 3;

    try {
      const campaign = await db.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) return;

      while (true) {
        // Find next pending or retryable recipient
        const recipient = await db.campaignRecipient.findFirst({
          where: {
            campaignId,
            OR: [
              { status: 'PENDING' },
              {
                status: 'SENDING',
                attemptCount: { lt: maxAttempts }
              }
            ]
          },
          orderBy: { createdAt: 'asc' }
        });

        if (!recipient) {
          // No more recipients to process. Finalize campaign.
          await this.finalizeCampaign(campaignId);
          break;
        }

        await this.processRecipient(campaign, recipient);
      }
    } catch (error) {
      console.error(`[SendingService] Error in executeCampaign for ${campaignId}:`, error);
    }
  }

  static async processRecipient(campaign, recipient) {
    // Eligibility re-check
    const contact = await db.contact.findFirst({
      where: {
        emailNormalized: recipient.emailAtSend,
      }
    });

    if (
      !contact ||
      contact.status !== 'ACTIVE' ||
      !contact.isSubscribed ||
      contact.archivedAt ||
      contact.deletedAt
    ) {
      await db.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'SKIPPED',
          lastErrorCode: 'INELIGIBLE',
          lastErrorMessage: 'Contact is no longer eligible',
          updatedAt: new Date()
        }
      });
      return;
    }

    // Mark as SENDING (Atomic)
    const updated = await db.campaignRecipient.updateMany({
      where: {
        id: recipient.id,
        status: { in: ['PENDING', 'SENDING'] }
      },
      data: {
        status: 'SENDING',
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
        updatedAt: new Date()
      }
    });

    if (updated.count === 0) {
       return;
    }

    const currentAttempt = recipient.attemptCount + 1;

    // Send email
    const result = await EmailService.sendEmail({
      to: recipient.emailAtSend,
      name: recipient.nameAtSend,
      subject: campaign.subject,
      html: campaign.htmlContent,
      text: campaign.textContent
    });

    if (result.success) {
      await db.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          lastErrorMessage: result.response,
          updatedAt: new Date()
        }
      });
      await db.campaign.update({
        where: { id: campaign.id },
        data: { sentCount: { increment: 1 } }
      });
    } else {
      const errorStr = String(result.error);
      const isPermanent = result.error?.responseCode >= 500 && result.error?.responseCode <= 599;
      // SMTP timeout after DATA command is ambiguous
      const isAmbiguous = result.error?.code === 'ETIMEDOUT' && result.error?.command === 'DATA'; 
      
      let nextStatus = 'SENDING';
      let failedAt = null;

      if (isAmbiguous) {
        nextStatus = 'UNKNOWN';
      } else if (isPermanent || currentAttempt >= recipient.maxAttempts) {
        nextStatus = 'FAILED';
        failedAt = new Date();
        await db.campaign.update({
          where: { id: campaign.id },
          data: { failedCount: { increment: 1 } }
        });
      }

      await db.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: nextStatus,
          failedAt,
          lastErrorCode: result.error?.code || 'ERROR',
          lastErrorMessage: result.error?.message || errorStr,
          updatedAt: new Date()
        }
      });

      if (nextStatus === 'SENDING') {
         // Backoff 2 seconds
         await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  static async finalizeCampaign(campaignId) {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId }
    });
    if (!campaign || !['SENDING'].includes(campaign.status)) return;

    let finalStatus = 'COMPLETED';
    if (campaign.sentCount === 0 && campaign.failedCount > 0) {
      finalStatus = 'FAILED';
    } else if (campaign.failedCount > 0) {
      finalStatus = 'COMPLETED_WITH_FAILURES';
    }

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}
