import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as SegmentController from '../controllers/segment.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', SegmentController.getSegments);
router.post('/', SegmentController.createSegment);
router.post('/preview', SegmentController.previewSegment);
router.get('/:id', SegmentController.getSegmentById);
router.patch('/:id', SegmentController.updateSegment);
router.delete('/:id', SegmentController.deleteSegment);

// Campaign integration: add recipients from a segment
router.post('/apply/:campaignId/:segmentId', SegmentController.addRecipientsFromSegment);

export default router;
