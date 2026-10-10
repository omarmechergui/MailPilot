import db from '../db.js';

const MAX_SEGMENT_RECIPIENTS = 500;

export class SegmentService {
  /**
   * Translate validated filter rules into a Prisma `where` clause.
   * Only whitelisted fields and operators are accepted.
   */
  static buildPrismaWhere(filters) {
    const conditions = [];
    for (const rule of filters) {
      const { field, operator, value } = rule;
      let condition = {};

      // Map field name to actual Prisma field
      const prismaField = field === 'email' ? 'emailNormalized' : field;

      switch (operator) {
        case 'equals':
          condition[prismaField] = value;
          break;
        case 'notEquals':
          condition[prismaField] = { not: value };
          break;
        case 'contains':
          condition[prismaField] = { contains: String(value), mode: 'insensitive' };
          break;
        case 'startsWith':
          condition[prismaField] = { startsWith: String(value), mode: 'insensitive' };
          break;
        case 'endsWith':
          condition[prismaField] = { endsWith: String(value), mode: 'insensitive' };
          break;
        default:
          break;
      }
      conditions.push(condition);
    }
    return conditions;
  }

  /**
   * Build the full eligibility + filter where clause.
   * Always excludes unsubscribed, archived, deleted, and non-ACTIVE contacts.
   */
  static buildEligibleWhere(filters) {
    const filterConditions = this.buildPrismaWhere(filters);
    return {
      AND: [
        { status: 'ACTIVE' },
        { isSubscribed: true },
        {
          OR: [
            { archivedAt: null },
            { archivedAt: { isSet: false } },
          ],
        },
        {
          OR: [
            { deletedAt: null },
            { deletedAt: { isSet: false } },
          ],
        },
        ...filterConditions,
      ],
    };
  }

  static async createSegment(data) {
    return db.segment.create({
      data: {
        name: data.name,
        description: data.description || null,
        filters: data.filters,
      },
    });
  }

  static async getSegments(query) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const [segments, total] = await Promise.all([
      db.segment.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      db.segment.count(),
    ]);
    return {
      segments,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  static async getSegmentById(id) {
    const segment = await db.segment.findUnique({ where: { id } });
    if (!segment) {
      const error = new Error('Segment not found');
      error.code = 'NOT_FOUND';
      throw error;
    }
    return segment;
  }

  static async updateSegment(id, data) {
    await this.getSegmentById(id);
    return db.segment.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        filters: data.filters,
      },
    });
  }

  static async deleteSegment(id) {
    await this.getSegmentById(id);
    await db.segment.delete({ where: { id } });
    return true;
  }

  /**
   * Preview: count how many eligible contacts match a segment's filters.
   */
  static async previewCount(filters) {
    const where = this.buildEligibleWhere(filters);
    return db.contact.count({ where });
  }

  /**
   * Add matching contacts from a segment to a DRAFT campaign as recipients.
   * - Enforces campaign DRAFT status
   * - Excludes ineligible contacts
   * - Prevents duplicates via the @@unique([campaignId, emailAtSend]) constraint
   * - Bounded to MAX_SEGMENT_RECIPIENTS
   */
  static async addRecipientsFromSegment(campaignId, segmentId) {
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

    const segment = await this.getSegmentById(segmentId);
    const where = this.buildEligibleWhere(segment.filters);

    const totalEligible = await db.contact.count({ where });

    let added = 0;
    let skipped = 0;
    let skipOffset = 0;
    const batchSize = 100;
    let aborted = false;

    while (added < MAX_SEGMENT_RECIPIENTS) {
      // Recheck campaign status per batch to minimize race condition with senders
      const currentCampaign = await db.campaign.findUnique({ where: { id: campaignId }, select: { status: true } });
      if (!currentCampaign || currentCampaign.status !== 'DRAFT') {
        aborted = true;
        break;
      }

      const matchingContacts = await db.contact.findMany({
        where,
        take: batchSize,
        skip: skipOffset,
        orderBy: { createdAt: 'desc' },
      });

      if (matchingContacts.length === 0) {
        break; // Exhausted all matching contacts
      }

      for (const contact of matchingContacts) {
        if (added >= MAX_SEGMENT_RECIPIENTS) break;
        
        try {
          await db.campaignRecipient.create({
            data: {
              campaignId,
              contactId: contact.id,
              emailAtSend: contact.emailNormalized,
              nameAtSend: contact.name,
              status: 'PENDING',
            },
          });
          added++;
        } catch (err) {
          // P2002 = unique constraint violation (duplicate recipient for this campaign)
          if (err.code === 'P2002') {
            skipped++;
          } else {
            // Propagate critical errors (timeouts, network drops, validation failures)
            throw err;
          }
        }
      }
      skipOffset += batchSize;
    }

    return { 
      added, 
      skipped, 
      totalEligible, 
      limitApplied: added >= MAX_SEGMENT_RECIPIENTS && skipOffset < totalEligible,
      aborted 
    };
  }
}
