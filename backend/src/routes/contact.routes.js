import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as contactController from '../controllers/contact.controller.js';
import { importContacts, downloadImportTemplate } from '../controllers/import.controller.js';

const router = Router();

// Ensure uploads directory exists
const UPLOAD_DIR = 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Protect all contact routes
router.use(requireAuth);

// Static routes MUST come before parameterized /:id routes
router.get('/import-template', downloadImportTemplate);
router.post('/import', upload.single('file'), importContacts);

router.get('/', contactController.getContacts);
router.post('/', contactController.createContact);
router.get('/:id', contactController.getContactById);
router.patch('/:id', contactController.updateContact);
router.delete('/:id', contactController.softDeleteContact);

router.post('/:id/archive', contactController.archiveContact);
router.post('/:id/restore', contactController.restoreContact);
router.patch('/:id/subscription', contactController.updateSubscription);

export default router;
