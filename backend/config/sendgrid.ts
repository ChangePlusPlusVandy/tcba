import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is required');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default sgMail;