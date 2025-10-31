// config/aws-ses.ts
import { SESClient } from '@aws-sdk/client-ses';

// Initialize AWS SES Client
export const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// SES Configuration Constants
export const sesConfig = {
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@tcba.org',
  replyToEmail: process.env.SES_REPLY_TO_EMAIL || 'info@tcba.org',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@tcba.org',
};
