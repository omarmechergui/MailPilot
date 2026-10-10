import nodemailer from 'nodemailer';
import config from '../config/index.js';

let transporter = null;

export class EmailService {
  static getTransporter() {
    if (!transporter) {
      if (!config.smtp.host) {
         throw new Error('SMTP_HOST is not configured');
      }
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465, // true for 465, false for other ports
        auth: (config.smtp.user && config.smtp.pass) ? {
          user: config.smtp.user,
          pass: config.smtp.pass,
        } : undefined,
      });
    }
    return transporter;
  }

  static applyPersonalization(template, name) {
    if (!template) return '';
    return template.replace(/\{\{\s*name\s*\}\}/g, name || '');
  }

  static async sendEmail({ to, name, subject, html, text }) {
    const t = this.getTransporter();
    
    const personalizedHtml = this.applyPersonalization(html, name);
    const personalizedText = this.applyPersonalization(text, name);
    const personalizedSubject = this.applyPersonalization(subject, name);

    const mailOptions = {
      from: config.smtp.from,
      to,
      subject: personalizedSubject,
      html: personalizedHtml,
      text: personalizedText,
    };

    try {
      const info = await t.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, response: info.response };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}
