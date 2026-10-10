import { ContactService } from '../services/contact.service.js';
import { 
  contactQuerySchema, 
  createContactSchema, 
  updateContactSchema,
  subscriptionUpdateSchema 
} from '../validators/contact.validator.js';

export const getContacts = async (req, res, next) => {
  try {
    const query = contactQuerySchema.parse(req.query);
    const result = await ContactService.getContacts(query);
    res.json({ success: true, data: result.contacts, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const data = createContactSchema.parse(req.body);
    const contact = await ContactService.createContact(data);
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    if (error.code === 'CONFLICT') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message } });
    }
    next(error);
  }
};

export const getContactById = async (req, res, next) => {
  try {
    const contact = await ContactService.getContactById(req.params.id);
    res.json({ success: true, data: contact });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const data = updateContactSchema.parse(req.body);
    const contact = await ContactService.updateContact(req.params.id, data);
    res.json({ success: true, data: contact });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }
    if (error.code === 'CONFLICT') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message } });
    }
    next(error);
  }
};

export const archiveContact = async (req, res, next) => {
  try {
    const contact = await ContactService.archiveContact(req.params.id);
    res.json({ success: true, data: contact });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }
    next(error);
  }
};

export const restoreContact = async (req, res, next) => {
  try {
    const contact = await ContactService.restoreContact(req.params.id);
    res.json({ success: true, data: contact });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }
    next(error);
  }
};

export const softDeleteContact = async (req, res, next) => {
  try {
    await ContactService.softDeleteContact(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { isSubscribed } = subscriptionUpdateSchema.parse(req.body);
    const contact = await ContactService.updateSubscription(req.params.id, isSubscribed);
    res.json({ success: true, data: contact });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }
    next(error);
  }
};
