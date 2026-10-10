import { SegmentService } from '../services/segment.service.js';
import { segmentSchema, segmentQuerySchema } from '../validators/segment.validator.js';
import { z } from 'zod';

const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const getSegments = async (req, res, next) => {
  try {
    const query = segmentQuerySchema.parse(req.query);
    const result = await SegmentService.getSegments(query);
    res.json({ success: true, data: result.segments, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getSegmentById = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const segment = await SegmentService.getSegmentById(id);
    res.json({ success: true, data: segment });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, error: { message: 'Invalid ID format' } });
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Segment not found' } });
    next(error);
  }
};

export const createSegment = async (req, res, next) => {
  try {
    const data = segmentSchema.parse(req.body);
    const segment = await SegmentService.createSegment(data);
    res.status(201).json({ success: true, data: segment });
  } catch (error) {
    next(error);
  }
};

export const updateSegment = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const data = segmentSchema.parse(req.body);
    const segment = await SegmentService.updateSegment(id, data);
    res.json({ success: true, data: segment });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, error: { message: 'Invalid input' } });
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Segment not found' } });
    next(error);
  }
};

export const deleteSegment = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    await SegmentService.deleteSegment(id);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Segment not found' } });
    next(error);
  }
};

export const previewSegment = async (req, res, next) => {
  try {
    const data = segmentSchema.parse(req.body);
    const count = await SegmentService.previewCount(data.filters);
    res.json({ success: true, data: { matchingContacts: count } });
  } catch (error) {
    next(error);
  }
};

export const addRecipientsFromSegment = async (req, res, next) => {
  try {
    const campaignId = idSchema.parse(req.params.campaignId);
    const segmentId = idSchema.parse(req.params.segmentId);
    const result = await SegmentService.addRecipientsFromSegment(campaignId, segmentId);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, error: { message: 'Invalid ID format' } });
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: { message: error.message } });
    if (error.code === 'CONFLICT') return res.status(409).json({ success: false, error: { message: error.message } });
    next(error);
  }
};
