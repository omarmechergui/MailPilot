import fs from 'fs';
import path from 'path';
import { ImportService } from '../services/import.service.js';

const ALLOWED_MIMETYPES = ['text/csv', 'application/vnd.ms-excel', 'application/octet-stream'];

export const importContacts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No CSV file provided' },
      });
    }

    // Validate file extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.csv') {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Only .csv files are accepted' },
      });
    }

    // Process the file
    const report = await ImportService.importContactsCsv(req.file.path);

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to clean up uploaded CSV');
    });

    res.json({ success: true, data: report });
  } catch (error) {
    // Ensure we clean up the file on unexpected errors
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

export const downloadImportTemplate = (req, res) => {
  const template = 'email,name\nperson@example.com,Example Person\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="mailpilot_import_template.csv"');
  res.send(template);
};
