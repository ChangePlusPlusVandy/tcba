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

// Send custom email to organizations, if no tags/regions specified, sends to all orgs
export const sendCustomEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { targetTags, targetRegions, subject, message, html } = req.body;

    if (!subject || (!message && !html)) {
      return res.status(400).json({ error: 'Subject and message or html are required' });
    }

    // Fetch organizations filtered by tags/regions, or all if none
    const where: any = { status: 'ACTIVE' };
    if (targetTags?.length) where.tags = { hasSome: targetTags };
    if (targetRegions?.length) where.region = { in: targetRegions };

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

    const { SendEmailCommand } = await import('@aws-sdk/client-ses');
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

// Send announcement email to organizations matching tags/regions, if none specified, send to all, and all email subscribers
export const sendAnnouncementNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only admins can send
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

    // Get all active email subscribers
    const subscribers = await prisma.emailSubscription.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    const subscriberEmails = subscribers.map(s => s.email.toLowerCase());

    // Combine all recipients and remove duplicates
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

    const { SendEmailCommand } = await import('@aws-sdk/client-ses');
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

// send survey invitation to organizations matching targetTags/targetRegions, if none specified, send to all
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

    const { SendEmailCommand } = await import('@aws-sdk/client-ses');
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

// send blog notification to all email subscribers
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

    const { SendEmailCommand } = await import('@aws-sdk/client-ses');
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

// send alerts notification to organizations matching targetTags/targetRegions, if none specified, send to all
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

    const { SendEmailCommand } = await import('@aws-sdk/client-ses');
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
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Title and message are required',
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
