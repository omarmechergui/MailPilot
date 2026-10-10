import db from '../db.js';
import { htmlToText } from 'html-to-text';

export class TemplateService {
  static async createTemplate(data) {
    let plainText = data.textContent;
    if (data.htmlContent && (!plainText || plainText.trim() === '')) {
      plainText = htmlToText(data.htmlContent, { wordwrap: 130 });
    }
    return db.template.create({
      data: {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent || null,
        textContent: plainText || null,
      },
    });
  }

  static async getTemplates(query) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const [templates, total] = await Promise.all([
      db.template.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      db.template.count(),
    ]);
    return {
      templates,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  static async getTemplateById(id) {
    const template = await db.template.findUnique({ where: { id } });
    if (!template) {
      const error = new Error('Template not found');
      error.code = 'NOT_FOUND';
      throw error;
    }
    return template;
  }

  static async updateTemplate(id, data) {
    await this.getTemplateById(id);
    let plainText = data.textContent;
    if (data.htmlContent && (!plainText || plainText.trim() === '')) {
      plainText = htmlToText(data.htmlContent, { wordwrap: 130 });
    }
    return db.template.update({
      where: { id },
      data: {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent || null,
        textContent: plainText || null,
      },
    });
  }

  static async deleteTemplate(id) {
    await this.getTemplateById(id);
    await db.template.delete({ where: { id } });
    return true;
  }
}
