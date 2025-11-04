import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, sesConfig } from '../config/aws-ses.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

export const sendWelcomeEmail = async (
  organizationEmail: string,
  organizationName: string,
  generatedPassword: string
) => {
  const loginUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/login`
    : 'http://localhost:5173/login';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
        .button { display: inline-block; background-color: #D54242; color: white; padding: 12px 30px; text-decoration: none; border-radius: 18px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to TCBA!</h1>
        </div>
        <div class="content">
          <h2>Hello ${organizationName},</h2>
          <p>Your organization has been approved to join the Tennessee Coalition for Better Aging!</p>

          <div class="credentials">
            <h3>Your Login Credentials</h3>
            <p><strong>Email:</strong> ${organizationEmail}</p>
            <p><strong>Temporary Password:</strong> ${generatedPassword}</p>
          </div>

          <p>You can now log in to access your dashboard and participate in coalition activities.</p>

          <a href="${loginUrl}" class="button">Log In Now</a>

          <p><strong>Important:</strong> For security, we recommend changing your password after your first login. You can do this by clicking on the account profile picture in the top right, manage account, security, and then change password</p>

          <p>If you have any questions, please don't hesitate to reach out to us at ${sesConfig.replyToEmail}.</p>

          <p>We're excited to have you as part of our coalition!</p>

          <p>Best regards,<br>The TCBA Team</p>
        </div>
        <div class="footer">
          <p>Tennessee Coalition for Better Aging</p>
          <p>This email was sent to ${organizationEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Welcome to TCBA!

Hello ${organizationName},

Your organization has been approved to join the Tennessee Coalition for Better Aging!

Your Login Credentials:
Email: ${organizationEmail}
Temporary Password: ${generatedPassword}

You can now log in at ${loginUrl} to access your dashboard and participate in coalition activities.

Important: For security, we recommend changing your password after your first login. You can do this by navigating to your account profile after logging in, clicking manage account, privacy, and update password. We also recommend navigating to the organization panel, your organization profile, and inputting fields like primary and secondary contact, your organization tags for receiving specialized notifications and updates relating to your organization's focuses, and the size range of your organization.

If you have any questions, please reach out to us at ${sesConfig.replyToEmail}.

We're excited to have you as part of our coalition!

Best regards,
The TCBA Team

Tennessee Coalition for Better Aging
  `;

  const command = new SendEmailCommand({
    Source: `${sesConfig.fromEmail}`,
    Destination: {
      ToAddresses: [organizationEmail],
    },
    Message: {
      Subject: {
        Data: 'Welcome to TCBA! - Your Login Credentials',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
      },
    },
    ReplyToAddresses: [sesConfig.replyToEmail],
  });

  await sesClient.send(command);
};

// Send custom email to organizations, if no tags/regions specified, sends to all orgs
export const sendCustomEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { targetTags, targetRegions, subject, message, html } = req.body;
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({ error: 'Failed to send custom email' });
  }
};

// Send announcement email to organizations matching tags/regions, if none specified, send to all, and all email subscribers
export const sendAnnouncementNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { id } = req.params;
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error sending announcement notification:', error);
    res.status(500).json({ error: 'Failed to send announcement notification' });
  }
};

// send survey invitation to organizations matching targetTags/targetRegions, if none specified, send to all
export const sendSurveyNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { id } = req.params;
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error sending survey notification:', error);
    res.status(500).json({ error: 'Failed to send survey notification' });
  }
};

// send blog notification to all email subscribers
export const sendBlogNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { id } = req.params;
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error sending blog notification:', error);
    res.status(500).json({ error: 'Failed to send blog notification' });
  }
};

// send alerts notification to organizations matching targetTags/targetRegions, if none specified, send to all
export const sendAlertNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { targetTags, targetRegions, subject, message } = req.body;
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error sending alert notification:', error);
    res.status(500).json({ error: 'Failed to send alert notification' });
  }
};
