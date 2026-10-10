import { TemplateService } from '../services/template.service.js';
import { templateSchema, templateQuerySchema } from '../validators/template.validator.js';
import { z } from 'zod';

const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const getTemplates = async (req, res, next) => {
  try {
    const query = templateQuerySchema.parse(req.query);
    const result = await TemplateService.getTemplates(query);
    res.json({ success: true, data: result.templates, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const template = await TemplateService.getTemplateById(id);
    res.json({ success: true, data: template });
  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Not found' } });
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const data = templateSchema.parse(req.body);
    const template = await TemplateService.createTemplate(data);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const data = templateSchema.parse(req.body);
    const template = await TemplateService.updateTemplate(id, data);
    res.json({ success: true, data: template });
  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Not found' } });
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    await TemplateService.deleteTemplate(id);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Not found' } });
    next(error);
  }
};
