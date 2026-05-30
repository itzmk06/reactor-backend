import nodemailer from 'nodemailer';
import { env } from '../lib/env';
import { AppError } from '../lib/error';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
  service: 'gmail',
  pool: true,
  maxConnections: 2,
  maxMessages: 100,
});

export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log('[EMAIL SERVICE] Mailer is ready');
  } catch (error) {
    console.error(error);
    throw new AppError('[EMAIL SERVICE] Mailer is not ready');
  }
}

export async function sendMail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: `${env.APP_NAME} <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ''),
    });
  } catch (error) {
    console.error(error);
    throw new AppError('[EMAIL SERVICE] Failed to send email');
  }
}
