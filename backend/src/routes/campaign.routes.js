import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createCampaignSchema, updateCampaignSchema } from '../validators/campaign.validator.js';
import { getCampaigns, createDraft, getCampaignById, updateDraft, deleteDraft, sendCampaign, getCampaignStatus } from '../controllers/campaign.controller.js';
import { getEligibleContacts, getRecipients, addRecipients, removeRecipient, clearRecipients } from '../controllers/recipient.controller.js';
import { addRecipientsSchema } from '../validators/recipient.validator.js';

const router = Router();

// All campaign routes are protected
router.use(requireAuth);

router.get('/', getCampaigns);
router.post('/', validateRequest(createCampaignSchema), createDraft);
router.get('/:id', getCampaignById);
router.patch('/:id', validateRequest(updateCampaignSchema), updateDraft);
router.delete('/:id', deleteDraft);
router.post('/:id/send', sendCampaign);
router.get('/:id/status', getCampaignStatus);

// Recipient routes
router.get('/:id/eligible-contacts', getEligibleContacts);
router.get('/:id/recipients', getRecipients);
router.post('/:id/recipients', validateRequest(addRecipientsSchema), addRecipients);
router.delete('/:id/recipients/:recipientId', removeRecipient);
router.delete('/:id/recipients', clearRecipients);

export default router;
