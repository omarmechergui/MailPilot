import db from '../db.js';

export class RecipientService {
  static async getEligibleContacts(campaignId, query) {
    const { page = 1, pageSize = 20, search } = query;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      const err = new Error('Campaign not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const existingRecipients = await db.campaignRecipient.findMany({
      where: { campaignId },
      select: { emailAtSend: true }
    });
    const existingEmails = existingRecipients.map(r => r.emailAtSend);

    const where = {
      AND: [
        { status: 'ACTIVE' },
        { isSubscribed: true },
        {
          OR: [
            { archivedAt: null },
            { archivedAt: { isSet: false } }
          ]
        },
        {
          OR: [
            { deletedAt: null },
            { deletedAt: { isSet: false } }
          ]
        },
        {
          emailNormalized: { notIn: existingEmails }
        }
      ]
    };

    if (search) {
      where.AND.push({
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const [contacts, totalItems] = await Promise.all([
      db.contact.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.contact.count({ where }),
    ]);

    return {
      contacts,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  static async getRecipients(campaignId, query) {
    const { page = 1, pageSize = 20, status } = query;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = { campaignId };
    if (status) {
      where.status = status;
    }

    const [recipients, totalItems] = await Promise.all([
      db.campaignRecipient.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.campaignRecipient.count({ where }),
    ]);

    return {
      recipients,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  static async addRecipients(campaignId, contactIds) {
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      const err = new Error('Campaign not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (campaign.status !== 'DRAFT') {
      const err = new Error('Can only add recipients to DRAFT campaigns');
      err.code = 'CONFLICT';
      throw err;
    }

    const contacts = await db.contact.findMany({
      where: { id: { in: contactIds } }
    });

    const result = { added: 0, skipped: 0, errors: [] };

    for (const contact of contacts) {
      if (
        contact.status !== 'ACTIVE' ||
        !contact.isSubscribed ||
        contact.archivedAt ||
        contact.deletedAt
      ) {
        result.skipped++;
        result.errors.push({ contactId: contact.id, reason: 'Ineligible' });
        continue;
      }

      try {
        await db.campaignRecipient.create({
          data: {
            campaignId,
            contactId: contact.id,
            emailAtSend: contact.emailNormalized,
            nameAtSend: contact.name,
            status: 'PENDING'
          }
        });
        result.added++;
      } catch (err) {
        if (err.code === 'P2002') {
          result.skipped++;
          result.errors.push({ contactId: contact.id, reason: 'Duplicate' });
        } else {
          result.skipped++;
          result.errors.push({ contactId: contact.id, reason: err.message });
        }
      }
    }
    return result;
  }

  static async removeRecipient(campaignId, recipientId) {
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      const err = new Error('Campaign not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (campaign.status !== 'DRAFT') {
      const err = new Error('Can only remove recipients from DRAFT campaigns');
      err.code = 'CONFLICT';
      throw err;
    }

    const recipient = await db.campaignRecipient.findUnique({ where: { id: recipientId } });
    if (!recipient || recipient.campaignId !== campaignId) {
       return true;
    }

    await db.campaignRecipient.delete({ where: { id: recipientId } });
    return true;
  }

  static async clearRecipients(campaignId) {
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      const err = new Error('Campaign not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (campaign.status !== 'DRAFT') {
      const err = new Error('Can only clear recipients from DRAFT campaigns');
      err.code = 'CONFLICT';
      throw err;
    }

    await db.campaignRecipient.deleteMany({ where: { campaignId } });
    return true;
  }
}
