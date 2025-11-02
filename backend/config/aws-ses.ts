import { SESClient } from '@aws-sdk/client-ses';

export const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const sesConfig = {
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@tcba.org',
  replyToEmail: process.env.SES_REPLY_TO_EMAIL || 'info@tcba.org',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@tcba.org',
};
