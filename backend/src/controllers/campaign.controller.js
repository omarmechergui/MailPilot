import { CampaignService } from '../services/campaign.service.js';
import { createCampaignSchema, updateCampaignSchema, campaignQuerySchema, sendCampaignSchema } from '../validators/campaign.validator.js';
import { z } from 'zod';

const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const getCampaigns = async (req, res, next) => {
  try {
    const query = campaignQuerySchema.parse(req.query);
    const result = await CampaignService.getCampaigns(query);
    res.json({ success: true, data: result.campaigns, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const createDraft = async (req, res, next) => {
  try {
    const campaign = await CampaignService.createDraft(req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const campaign = await CampaignService.getCampaignById(id);
    res.json({ success: true, data: campaign });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    }
    next(error);
  }
};

export const updateDraft = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const campaign = await CampaignService.updateDraft(id, req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    }
    if (error.code === 'CONFLICT') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message } });
    }
    next(error);
  }
};

export const deleteDraft = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    await CampaignService.deleteDraft(id);
    res.status(204).send();
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    }
    if (error.code === 'CONFLICT') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message } });
    }
    next(error);
  }
};

export const sendCampaign = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    sendCampaignSchema.parse(req); // validates body.confirm === true
    const result = await CampaignService.startCampaign(id);
    res.status(202).json({ success: true, data: result });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0]?.message || 'Invalid input' } });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    }
    if (error.code === 'CONFLICT') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message } });
    }
    if (error.code === 'BAD_REQUEST') {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
    next(error);
  }
};

export const getCampaignStatus = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const result = await CampaignService.getCampaignStatus(id);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    }
    next(error);
  }
};
