import fs from 'fs';
import { parse } from 'csv-parse';
import { z } from 'zod';
import db from '../db.js';

const MAX_ROW_COUNT = 1000;

const csvRowSchema = z.object({
  email: z.string().email('Invalid email address').trim(),
  name: z.string().trim().optional().nullable(),
});

export class ImportService {
  /**
   * Processes a CSV file for contact import.
   * Validates headers, rows, duplicates, and uses bounded batches.
   */
  static async importContactsCsv(filePath) {
    const report = {
      totalRows: 0,
      accepted: 0,
      duplicates: 0,
      invalid: 0,
      rejected: 0,
      errors: [],
    };

    const validContacts = [];
    const normalizedEmailsInCsv = new Set();
    let rowNumber = 0;
    let headersValidated = false;

    // 1. Read and parse the CSV
    const parser = fs.createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      })
    );

    for await (const row of parser) {
      // Validate that the CSV has an 'email' header on first row
      if (!headersValidated) {
        if (!('email' in row)) {
          report.rejected = 1;
          report.errors.push({
            row: 0,
            reason: 'CSV file is missing the required "email" column header',
          });
          return report;
        }
        headersValidated = true;
      }

      rowNumber++;
      report.totalRows++;

      // Enforce row count limit
      if (rowNumber > MAX_ROW_COUNT) {
        report.rejected++;
        report.errors.push({
          row: rowNumber,
          reason: `Exceeds maximum row count of ${MAX_ROW_COUNT}`,
        });
        continue;
      }

      // Validate row
      const parsed = csvRowSchema.safeParse(row);
      if (!parsed.success) {
        report.invalid++;
        report.errors.push({
          row: rowNumber,
          reason: parsed.error.errors[0].message,
        });
        continue;
      }

      const { email, name } = parsed.data;
      const emailNormalized = email.toLowerCase();

      // Check CSV-internal duplicates
      if (normalizedEmailsInCsv.has(emailNormalized)) {
        report.duplicates++;
        report.errors.push({
          row: rowNumber,
          reason: 'Duplicate email within the CSV file',
        });
        continue;
      }

      normalizedEmailsInCsv.add(emailNormalized);
      validContacts.push({ email: email.trim(), emailNormalized, name: name || null });
    }

    // Handle empty file (no data rows after header)
    if (report.totalRows === 0) {
      return report;
    }

    // 2. Process in bounded batches to avoid overwhelming the database
    const BATCH_SIZE = 50;

    for (let i = 0; i < validContacts.length; i += BATCH_SIZE) {
      const batch = validContacts.slice(i, i + BATCH_SIZE);
      const batchEmails = batch.map((c) => c.emailNormalized);

      // Check existing contacts in the database for this batch
      const existingDbContacts = await db.contact.findMany({
        where: { emailNormalized: { in: batchEmails } },
        select: { emailNormalized: true },
      });

      const existingEmailsSet = new Set(existingDbContacts.map((c) => c.emailNormalized));

      const newContactsToInsert = [];

      for (const contact of batch) {
        if (existingEmailsSet.has(contact.emailNormalized)) {
          report.duplicates++;
          // We do not silently overwrite existing contacts or their subscription status
          continue;
        }

        newContactsToInsert.push({
          email: contact.email,
          emailNormalized: contact.emailNormalized,
          name: contact.name,
          status: 'ACTIVE',
          isSubscribed: true,
          source: 'CSV',
        });
      }

      // Insert the new contacts
      if (newContactsToInsert.length > 0) {
        try {
          const insertResult = await db.contact.createMany({
            data: newContactsToInsert,
          });
          report.accepted += insertResult.count;
        } catch (error) {
          // If the batch fails, mark them as rejected and sanitize the error
          report.rejected += newContactsToInsert.length;
          report.errors.push({
            row: -1,
            reason: 'Database insertion failed for a batch of records',
          });
        }
      }
    }

    return report;
  }
}
