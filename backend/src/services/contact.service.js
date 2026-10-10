import db from '../db.js';

export class ContactService {
  /**
   * Retrieves a paginated list of contacts based on filters
   */
  static async getContacts({ page = 1, pageSize = 20, search, status, subscription, archived, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = {
      AND: [
        {
          OR: [
            { deletedAt: null },
            { deletedAt: { isSet: false } },
          ],
        },
      ],
    };

    // Apply search filter (name or email)
    if (search) {
      where.AND.push({
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Apply status filter
    if (status) {
      where.status = status;
    }

    // Apply subscription filter
    if (subscription) {
      where.isSubscribed = subscription === 'subscribed';
    }

    // Apply archived filter. Default to excluding archived unless requested.
    if (archived === 'true') {
      where.AND.push({ archivedAt: { not: null } });
    } else {
      where.AND.push({
        OR: [
          { archivedAt: null },
          { archivedAt: { isSet: false } },
        ],
      });
    }

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [contacts, totalItems] = await Promise.all([
      db.contact.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      db.contact.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      contacts,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Creates a new contact
   */
  static async createContact(data) {
    const emailNormalized = data.email.trim().toLowerCase();

    // Check for existing contact
    const existing = await db.contact.findUnique({
      where: { emailNormalized },
    });

    if (existing) {
      if (existing.deletedAt) {
         // Optionally revive soft-deleted contact or handle according to policy.
         // Requirements: "Define how a deleted address interacts with uniqueness and re-import rules."
         // For Phase 1, we will reject and tell them it's soft-deleted or revive it. Let's just reject.
         const err = new Error('Contact already exists (soft-deleted)');
         err.code = 'CONFLICT';
         throw err;
      }
      const err = new Error('Contact already exists');
      err.code = 'CONFLICT';
      throw err;
    }

    return db.contact.create({
      data: {
        ...data,
        email: data.email.trim(),
        emailNormalized,
        status: data.status || 'ACTIVE',
        isSubscribed: data.isSubscribed !== undefined ? data.isSubscribed : true,
      },
    });
  }

  /**
   * Gets a contact by ID
   */
  static async getContactById(id) {
    const contact = await db.contact.findUnique({
      where: { id },
    });

    if (!contact || contact.deletedAt) {
      const err = new Error('Contact not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    return contact;
  }

  /**
   * Updates a contact
   */
  static async updateContact(id, updateData) {
    // Verify it exists and is not deleted
    const contact = await this.getContactById(id);

    const data = { ...updateData };

    if (data.email) {
      data.email = data.email.trim();
      data.emailNormalized = data.email.toLowerCase();

      // Check duplicate if email is changing
      if (data.emailNormalized !== contact.emailNormalized) {
        const existing = await db.contact.findUnique({
          where: { emailNormalized: data.emailNormalized },
        });
        if (existing) {
          const err = new Error('Email already in use');
          err.code = 'CONFLICT';
          throw err;
        }
      }
    }

    return db.contact.update({
      where: { id },
      data,
    });
  }

  /**
   * Archives a contact
   */
  static async archiveContact(id) {
    const contact = await this.getContactById(id);
    if (contact.archivedAt) return contact;

    return db.contact.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  /**
   * Restores an archived contact
   */
  static async restoreContact(id) {
    const contact = await db.contact.findUnique({ where: { id }});
    if (!contact || contact.deletedAt) {
      const err = new Error('Contact not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!contact.archivedAt) return contact;

    return db.contact.update({
      where: { id },
      data: { archivedAt: null },
    });
  }

  /**
   * Soft-deletes a contact
   */
  static async softDeleteContact(id) {
    const contact = await this.getContactById(id);
    
    return db.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Updates subscription status
   */
  static async updateSubscription(id, isSubscribed) {
    const contact = await this.getContactById(id);
    
    return db.contact.update({
      where: { id },
      data: { 
        isSubscribed,
        unsubscribedAt: isSubscribed ? null : new Date(),
      },
    });
  }
}
