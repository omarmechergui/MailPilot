import { RecipientService } from '../services/recipient.service.js';
import { addRecipientsSchema, recipientQuerySchema } from '../validators/recipient.validator.js';
import { z } from 'zod';

const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const handleError = (error, res, next) => {
  if (error.name === 'ZodError') {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid format' } });
  }
  if (error.code === 'NOT_FOUND') {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
  }
  if (error.code === 'CONFLICT') {
    return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message } });
  }
  next(error);
};

export const getEligibleContacts = async (req, res, next) => {
  try {
    const campaignId = idSchema.parse(req.params.id);
    const query = recipientQuerySchema.parse(req.query);
    const result = await RecipientService.getEligibleContacts(campaignId, query);
    res.json({ success: true, data: result.contacts, pagination: result.pagination });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getRecipients = async (req, res, next) => {
  try {
    const campaignId = idSchema.parse(req.params.id);
    const query = recipientQuerySchema.parse(req.query);
    const result = await RecipientService.getRecipients(campaignId, query);
    res.json({ success: true, data: result.recipients, pagination: result.pagination });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const addRecipients = async (req, res, next) => {
  try {
    const campaignId = idSchema.parse(req.params.id);
    const result = await RecipientService.addRecipients(campaignId, req.body.contactIds);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const removeRecipient = async (req, res, next) => {
  try {
    const campaignId = idSchema.parse(req.params.id);
    const recipientId = idSchema.parse(req.params.recipientId);
    await RecipientService.removeRecipient(campaignId, recipientId);
    res.status(204).send();
  } catch (error) {
    handleError(error, res, next);
  }
};

export const clearRecipients = async (req, res, next) => {
  try {
    const campaignId = idSchema.parse(req.params.id);
    await RecipientService.clearRecipients(campaignId);
    res.status(204).send();
  } catch (error) {
    handleError(error, res, next);
  }
};
