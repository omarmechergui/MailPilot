import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as TemplateController from '../controllers/template.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', TemplateController.getTemplates);
router.post('/', TemplateController.createTemplate);
router.get('/:id', TemplateController.getTemplateById);
router.patch('/:id', TemplateController.updateTemplate);
router.delete('/:id', TemplateController.deleteTemplate);

export default router;
