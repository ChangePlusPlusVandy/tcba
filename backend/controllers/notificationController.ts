import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, sesConfig } from '../config/aws-ses.js';
import { createNotification } from './inAppNotificationController.js';

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

export const sendRejectionEmail = async (
  organizationEmail: string,
  organizationName: string,
  reason?: string
) => {
  console.log('[sendRejectionEmail] Starting email send to:', organizationEmail);
  console.log('[sendRejectionEmail] Organization name:', organizationName);
  console.log('[sendRejectionEmail] Reason:', reason);

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .reason-box { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${organizationName},</p>

          <p>Thank you for your interest in joining the Tennessee Coalition for Better Aging.</p>

          <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>

          ${reason ? `<div class="reason-box"><h3>Feedback:</h3><p>${reason.replace(/\n/g, '<br>')}</p></div>` : ''}

          <p>If you have any questions or would like to discuss this decision, please feel free to contact us at ${sesConfig.replyToEmail}.</p>

          <p>We appreciate your interest in our coalition and wish you the best in your endeavors.</p>

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
Application Status Update

Dear ${organizationName},

Thank you for your interest in joining the Tennessee Coalition for Better Aging.

After careful review, we regret to inform you that your application has not been approved at this time.

${reason ? `Feedback:\n${reason}\n\n` : ''}

If you have any questions or would like to discuss this decision, please feel free to contact us at ${sesConfig.replyToEmail}.

We appreciate your interest in our coalition and wish you the best in your endeavors.

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
        Data: 'Application Status - Tennessee Coalition for Better Aging',
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

  console.log('[sendRejectionEmail] Sending email via AWS SES...');
  const result = await sesClient.send(command);
  console.log('[sendRejectionEmail] Email sent successfully! MessageId:', result.MessageId);
};

export const sendDeletionEmail = async (
  organizationEmail: string,
  organizationName: string,
  reason?: string
) => {
  console.log('[sendDeletionEmail] Starting email send to:', organizationEmail);
  console.log('[sendDeletionEmail] Organization name:', organizationName);
  console.log('[sendDeletionEmail] Reason:', reason);

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .reason-box { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${organizationName},</p>

          <p>We are writing to inform you that your organization's membership with the Tennessee Coalition for Better Aging has been terminated.</p>

          ${reason ? `<div class="reason-box"><h3>Reason:</h3><p>${reason.replace(/\n/g, '<br>')}</p></div>` : ''}

          <p>Your account and all associated data have been removed from our system.</p>

          <p>If you believe this was done in error or have any questions, please contact us at ${sesConfig.replyToEmail}.</p>

          <p>Thank you for your time with the coalition.</p>

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
Account Status Update

Dear ${organizationName},

We are writing to inform you that your organization's membership with the Tennessee Coalition for Better Aging has been terminated.

${reason ? `Reason:\n${reason}\n\n` : ''}

Your account and all associated data have been removed from our system.

If you believe this was done in error or have any questions, please contact us at ${sesConfig.replyToEmail}.

Thank you for your time with the coalition.

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
        Data: 'Account Status Update - Tennessee Coalition for Better Aging',
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

  console.log('[sendDeletionEmail] Sending email via AWS SES...');
  const result = await sesClient.send(command);
  console.log('[sendDeletionEmail] Email sent successfully! MessageId:', result.MessageId);
};

export const sendCustomEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      targetTags,
      targetRegions,
      subject,
      message,
      html,
      recipientEmails,
      filters,
      scheduledFor,
    } = req.body;

    if (!subject || (!message && !html)) {
      return res.status(400).json({ error: 'Subject and message or html are required' });
    }

    let emails: string[];

    if (recipientEmails && Array.isArray(recipientEmails) && recipientEmails.length > 0) {
      emails = Array.from(new Set(recipientEmails.map((e: string) => e.toLowerCase())));
    } else {
      const where: any = { status: 'ACTIVE' };
      if (targetTags?.length) where.tags = { hasSome: targetTags };
      if (targetRegions?.length) where.region = { in: targetRegions };

      const orgs = await prisma.organization.findMany({
        where,
        select: { email: true, primaryContactEmail: true },
      });

      emails = Array.from(
        new Set(
          orgs
            .map(o => o.primaryContactEmail || o.email)
            .filter(Boolean)
            .map(e => e!.toLowerCase())
        )
      );
    }

    if (emails.length === 0) {
      return res.status(200).json({ message: 'No matching organizations found' });
    }

    const htmlBody =
      html ??
      `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${subject}</h2>
          <p>${(message ?? '').replace(/\n/g, '<br>')}</p>
        </body>
      </html>
    `;
    const textBody = message ?? htmlBody.replace(/<[^>]+>/g, '');

    if (scheduledFor) {
      console.log('[sendCustomEmail] Scheduling email for:', scheduledFor);
      try {
        const emailHistory = await prisma.emailHistory.create({
          data: {
            subject,
            body: htmlBody,
            recipientEmails: emails,
            recipientCount: emails.length,
            filters: filters || null,
            scheduledFor: new Date(scheduledFor),
            status: 'SCHEDULED',
            createdByAdminId: req.user.id,
          },
        });

        console.log('[sendCustomEmail] Email scheduled successfully:', emailHistory.id);
        return res.status(200).json({
          message: 'Email scheduled successfully',
          total: emails.length,
          scheduledFor,
          emailHistoryId: emailHistory.id,
        });
      } catch (scheduleError) {
        console.error('[sendCustomEmail] Failed to schedule email:', scheduleError);
        throw scheduleError;
      }
    }

    console.log('[sendCustomEmail] Sending email immediately to', emails.length, 'recipients');

    let sent = 0;
    const errors: any[] = [];

    for (const email of emails) {
      const command = new SendEmailCommand({
        Source: sesConfig.fromEmail,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
            Text: { Data: textBody, Charset: 'UTF-8' },
          },
        },
        ReplyToAddresses: [sesConfig.replyToEmail],
      });

      try {
        await sesClient.send(command);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err);
        errors.push({ email, error: String(err) });
      }
    }

    const status = sent > 0 ? 'SENT' : 'FAILED';
    try {
      await prisma.emailHistory.create({
        data: {
          subject,
          body: htmlBody,
          recipientEmails: emails,
          recipientCount: emails.length,
          filters: filters || null,
          sentAt: new Date(),
          status,
          createdByAdminId: req.user.id,
        },
      });
      console.log('[sendCustomEmail] Email history saved successfully');
    } catch (historyError) {
      console.error('[sendCustomEmail] Failed to save email history:', historyError);
    }

    return res.status(200).json({
      message: 'Custom email send complete',
      total: emails.length,
      sent,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error sending custom email:', error);
    return res.status(500).json({ error: 'Failed to send custom email' });
  }
};

export const getEmailHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const emailHistory = await prisma.emailHistory.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(emailHistory);
  } catch (error) {
    console.error('Error fetching email history:', error);
    return res.status(500).json({ error: 'Failed to fetch email history' });
  }
};

export const deleteScheduledEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const email = await prisma.emailHistory.findUnique({
      where: { id },
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    if (email.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Can only delete scheduled emails' });
    }

    await prisma.emailHistory.delete({
      where: { id },
    });

    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting scheduled email:', error);
    return res.status(500).json({ error: 'Failed to delete scheduled email' });
  }
};

export const sendAnnouncementNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Fetch the announcement with its tags
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (!announcement.isPublished) {
      return res.status(400).json({ error: 'Announcement is not published' });
    }

    // Collect tag names
    const tagNames = announcement.tags.map(t => t.name);

    // Filter organizations that match the announcement tags (or all if no tags)
    const where: any = { status: 'ACTIVE' };
    if (tagNames.length > 0) where.tags = { hasSome: tagNames };

    const orgs = await prisma.organization.findMany({
      where,
      select: { email: true, primaryContactEmail: true },
    });

    const orgEmails = Array.from(
      new Set(
        orgs
          .map(o => o.primaryContactEmail || o.email)
          .filter(Boolean)
          .map(e => e!.toLowerCase())
      )
    );

    const subscribers = await prisma.emailSubscription.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    const subscriberEmails = subscribers.map(s => s.email.toLowerCase());

    const allRecipients = Array.from(new Set([...orgEmails, ...subscriberEmails]));

    if (allRecipients.length === 0) {
      return res.status(200).json({ message: 'No recipients found for this announcement' });
    }

    const subject = `New Announcement: ${announcement.title}`;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${announcement.title}</h2>
          <div>${announcement.content.replace(/\n/g, '<br>')}</div>
          <p><a href="${frontendUrl}/announcements/${announcement.slug}" style="color:#D54242;">Read full announcement</a></p>
          <p style="font-size:12px;color:#666;">Tennessee Coalition for Better Aging</p>
        </body>
      </html>
    `;
    const textBody = `${announcement.title}\n\n${announcement.content}\n\nRead more: ${frontendUrl}/announcements/${announcement.slug}`;

    let sent = 0;
    const errors: any[] = [];

    for (const email of allRecipients) {
      const command = new SendEmailCommand({
        Source: sesConfig.fromEmail,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
            Text: { Data: textBody, Charset: 'UTF-8' },
          },
        },
        ReplyToAddresses: [sesConfig.replyToEmail],
      });

      try {
        await sesClient.send(command);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err);
        errors.push({ email, error: String(err) });
      }
    }

    return res.status(200).json({
      message: 'Announcement emails sent',
      total: allRecipients.length,
      sent,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error sending announcement notification:', error);
    return res.status(500).json({ error: 'Failed to send announcement notification' });
  }
};

export const sendSurveyNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { targetTags, targetRegions } = req.body;

    // Find the survey
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (!survey.isPublished) {
      return res.status(400).json({ error: 'Survey is not published' });
    }

    // Build org filters
    const where: any = { status: 'ACTIVE' };
    if (targetTags?.length) where.tags = { hasSome: targetTags };
    if (targetRegions?.length) where.region = { in: targetRegions };

    // Fetch active organizations (filtered or all)
    const orgs = await prisma.organization.findMany({
      where,
      select: { email: true, primaryContactEmail: true },
    });

    const emails = Array.from(
      new Set(
        orgs
          .map(o => o.primaryContactEmail || o.email)
          .filter(Boolean)
          .map(e => e!.toLowerCase())
      )
    );

    if (emails.length === 0) {
      return res.status(200).json({ message: 'No organizations matched filters' });
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const surveyUrl = `${frontendUrl}/surveys/${survey.id}`;

    const subject = `New Survey: ${survey.title}`;
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${survey.title}</h2>
          ${survey.description ? `<p>${survey.description.replace(/\n/g, '<br>')}</p>` : ''}
          <p><a href="${surveyUrl}" style="color:#D54242;">Click here to take the survey</a></p>
          ${survey.dueDate ? `<p><strong>Due:</strong> ${new Date(survey.dueDate).toLocaleDateString()}</p>` : ''}
          <p style="font-size:12px;color:#666;">Tennessee Coalition for Better Aging</p>
        </body>
      </html>
    `;
    const textBody = `${survey.title}\n\n${survey.description ?? ''}\n\nTake the survey here: ${surveyUrl}`;

    let sent = 0;
    const errors: any[] = [];

    for (const email of emails) {
      const command = new SendEmailCommand({
        Source: sesConfig.fromEmail,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
            Text: { Data: textBody, Charset: 'UTF-8' },
          },
        },
        ReplyToAddresses: [sesConfig.replyToEmail],
      });

      try {
        await sesClient.send(command);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err);
        errors.push({ email, error: String(err) });
      }
    }

    return res.status(200).json({
      message: 'Survey invitations sent',
      total: emails.length,
      sent,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error sending survey notification:', error);
    return res.status(500).json({ error: 'Failed to send survey notification' });
  }
};

export const sendBlogNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Fetch the published blog post
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (!blog.isPublished) {
      return res.status(400).json({ error: 'Blog is not published' });
    }

    // Get all active email subscribers
    const subscribers = await prisma.emailSubscription.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    const emails = Array.from(new Set(subscribers.map(s => s.email.toLowerCase())));

    if (emails.length === 0) {
      return res.status(200).json({ message: 'No active email subscribers found' });
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const blogUrl = `${frontendUrl}/blogs/${blog.slug}`;
    const subject = `New Blog Post: ${blog.title}`;

    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${blog.title}</h2>
          ${blog.featuredImageUrl ? `<img src="${blog.featuredImageUrl}" alt="Blog image" style="max-width:100%; border-radius:8px;">` : ''}
          <p>by <strong>${blog.author}</strong></p>
          <div>${blog.content.substring(0, 300).replace(/\n/g, '<br>')}...</div>
          <p><a href="${blogUrl}" style="color:#D54242;">Read the full post</a></p>
          <p style="font-size:12px;color:#666;">Tennessee Coalition for Better Aging</p>
        </body>
      </html>
    `;

    const textBody = `${blog.title}\nby ${blog.author}\n\n${blog.content.substring(0, 300)}...\n\nRead the full post: ${blogUrl}`;

    let sent = 0;
    const errors: any[] = [];

    for (const email of emails) {
      const command = new SendEmailCommand({
        Source: sesConfig.fromEmail,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
            Text: { Data: textBody, Charset: 'UTF-8' },
          },
        },
        ReplyToAddresses: [sesConfig.replyToEmail],
      });

      try {
        await sesClient.send(command);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err);
        errors.push({ email, error: String(err) });
      }
    }

    return res.status(200).json({
      message: 'Blog notifications sent successfully',
      total: emails.length,
      sent,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error sending blog notification:', error);
    return res.status(500).json({ error: 'Failed to send blog notification' });
  }
};

export const sendAlertNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only admins can send alerts
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { targetTags, targetRegions, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Build org filters
    const where: any = { status: 'ACTIVE', membershipActive: true };
    if (targetTags?.length) where.tags = { hasSome: targetTags };
    if (targetRegions?.length) where.region = { in: targetRegions };

    // Fetch matching (or all active) organizations
    const orgs = await prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        primaryContactEmail: true,
        primaryContactName: true,
      },
    });

    const emails = Array.from(
      new Set(
        orgs
          .map(o => o.primaryContactEmail || o.email)
          .filter(Boolean)
          .map(e => e!.toLowerCase())
      )
    );

    if (emails.length === 0) {
      return res.status(200).json({ message: 'No matching organizations found' });
    }

    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.5;">
          <div style="border-left: 4px solid #D54242; padding-left: 12px; margin-bottom: 16px;">
            <h2 style="color:#D54242;">${subject}</h2>
          </div>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p style="font-size:12px;color:#666;">Tennessee Coalition for Better Aging</p>
        </body>
      </html>
    `;
    const textBody = `${subject}\n\n${message}`;

    let sent = 0;
    const errors: any[] = [];

    for (const email of emails) {
      const command = new SendEmailCommand({
        Source: sesConfig.fromEmail,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: `[ALERT] ${subject}`, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
            Text: { Data: textBody, Charset: 'UTF-8' },
          },
        },
        ReplyToAddresses: [sesConfig.replyToEmail],
      });

      try {
        await sesClient.send(command);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err);
        errors.push({ email, error: String(err) });
      }
    }

    // Optionally record an in-app notification
    try {
      await createNotification('ALERT', subject, `manual-alert-${Date.now()}`);
    } catch (notifError) {
      console.error('Failed to create in-app alert notification:', notifError);
    }

    return res.status(200).json({
      message: 'Alert notifications sent',
      total: emails.length,
      sent,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error sending alert notification:', error);
    return res.status(500).json({ error: 'Failed to send alert notification' });
  }
};

export const sendContactFormEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, title, message } = req.body;

    if (!email || !title || !message) {
      return res.status(400).json({
        error: 'Email, title, and message are required',
      });
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .email-box { background-color: white; padding: 15px; border-left: 4px solid #194B90; margin: 20px 0; }
          .message-box { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="email-box">
              <p style="margin: 0;"><strong>Reply to:</strong> ${email}</p>
            </div>
            <h2>Subject: ${title}</h2>
            <div class="message-box">
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p class="footer">Submitted at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Contact Form Submission

Reply to: ${email}

Subject: ${title}

Message:
${message}

Submitted at ${new Date().toLocaleString()}
    `;

    const command = new SendEmailCommand({
      Source: `${sesConfig.fromEmail}`,
      Destination: {
        ToAddresses: ['tcbadevs@gmail.com'],
      },
      Message: {
        Subject: {
          Data: `Contact Form: ${title}`,
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

    res.status(200).json({
      message: 'Contact form submitted successfully',
    });
  } catch (error) {
    console.error('Error sending contact form email:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
