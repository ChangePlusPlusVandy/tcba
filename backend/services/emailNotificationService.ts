import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, sesConfig } from '../config/aws-ses.js';
import { prisma } from '../config/prisma.js';

type NotificationType = 'ANNOUNCEMENT' | 'BLOG' | 'ALERT' | 'SURVEY';

interface EmailContent {
  subject: string;
  htmlBody: string;
  textBody: string;
}

async function getNotificationRecipients(
  notificationType: NotificationType,
  tags?: string[]
): Promise<string[]> {
  const where: any = {
    status: 'ACTIVE',
  };

  switch (notificationType) {
    case 'ANNOUNCEMENT':
      where.notifyAnnouncements = true;
      break;
    case 'BLOG':
      where.notifyBlogs = true;
      break;
    case 'ALERT':
      break;
    case 'SURVEY':
      where.notifySurveys = true;
      break;
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
    console.log(`[${notificationType}] Filtering by tags:`, tags);
  } else {
    console.log(`[${notificationType}] No tags specified, sending to all eligible organizations`);
  }

  console.log(`[${notificationType}] Query where clause:`, JSON.stringify(where));

  const orgs = await prisma.organization.findMany({
    where,
    select: { email: true, primaryContactEmail: true, name: true },
  });

  console.log(`[${notificationType}] Found ${orgs.length} organizations`);

  const emails = Array.from(
    new Set(
      orgs
        .map(o => o.primaryContactEmail || o.email)
        .filter(Boolean)
        .map(e => e!.toLowerCase())
    )
  );

  console.log(`[${notificationType}] Sending to ${emails.length} email addresses`);

  return emails;
}

async function getEmailSubscribers(notificationType: NotificationType): Promise<string[]> {
  const subscribers = await prisma.emailSubscription.findMany({
    where: {
      isActive: true,
      subscriptionTypes: { has: notificationType },
    },
    select: { email: true },
  });

  return Array.from(new Set(subscribers.map(s => s.email.toLowerCase())));
}

async function sendEmails(
  recipients: string[],
  emailContent: EmailContent,
  frontendUrl: string,
  isOrgEmail: boolean = true
) {
  let sent = 0;
  const errors: any[] = [];

  for (const email of recipients) {
    let unsubscribeUrl: string;
    if (isOrgEmail) {
      unsubscribeUrl = `${frontendUrl}/settings`;
    } else {
      unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
    }

    const personalizedHtmlBody = emailContent.htmlBody
      .replace(/href="[^"]*\/unsubscribe"/g, `href="${unsubscribeUrl}"`)
      .replace(/href="[^"]*\/settings"/g, `href="${unsubscribeUrl}"`);

    const personalizedTextBody = emailContent.textBody
      .replace(/Unsubscribe: [^\n]*/g, `Unsubscribe: ${unsubscribeUrl}`)
      .replace(/Manage preferences: [^\n]*/g, `Manage preferences: ${unsubscribeUrl}`);

    const command = new SendEmailCommand({
      Source: sesConfig.fromEmail,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: emailContent.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: personalizedHtmlBody, Charset: 'UTF-8' },
          Text: { Data: personalizedTextBody, Charset: 'UTF-8' },
        },
      },
      ReplyToAddresses: [sesConfig.replyToEmail],
    });

    try {
      await sesClient.send(command);
      sent++;
      console.log(`Email sent successfully to ${email}`);
    } catch (err) {
      console.error(`Failed to send email to ${email}:`, err);
      errors.push({ email, error: String(err) });
    }
  }

  return { sent, errors, total: recipients.length };
}

export async function sendAnnouncementEmails(announcementId: string) {
  try {
    const announcement = await prisma.announcements.findUnique({
      where: { id: announcementId },
      include: { tags: true },
    });

    if (!announcement || !announcement.isPublished) {
      console.log('Announcement not found or not published');
      return { sent: 0, total: 0, errors: [] };
    }

    const tagNames = announcement.tags.map(t => t.name);
    const orgRecipients = await getNotificationRecipients('ANNOUNCEMENT', tagNames);
    const individualSubscribers = await getEmailSubscribers('ANNOUNCEMENT');

    if (orgRecipients.length === 0 && individualSubscribers.length === 0) {
      console.log('No recipients for announcement notification');
      return { sent: 0, total: 0, errors: [] };
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const emailContent: EmailContent = {
      subject: `New Announcement: ${announcement.title}`,
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #D54242; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Announcement</h1>
            </div>
            <div class="content">
              <h2>${announcement.title}</h2>
              <div>${announcement.content.replace(/\n/g, '<br>')}</div>
              <p style="text-align: center;">
                <a href="${frontendUrl}/announcements/${announcement.slug}" class="button">Read Full Announcement</a>
              </p>
            </div>
            <div class="footer">
              <p>Tennessee Coalition for Better Aging</p>
              <p>You received this email because you have announcement notifications enabled</p>
              <p><a href="${frontendUrl}/settings" style="color: #666; text-decoration: underline;">Manage email preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
New Announcement: ${announcement.title}

${announcement.content}

Read more: ${frontendUrl}/announcements/${announcement.slug}

---
Tennessee Coalition for Better Aging
You received this email because you have announcement notifications enabled

Manage preferences: ${frontendUrl}/settings
      `,
    };

    let orgResults = { sent: 0, total: 0, errors: [] as any[] };
    if (orgRecipients.length > 0) {
      console.log(`Sending announcement emails to ${orgRecipients.length} organizations`);
      orgResults = await sendEmails(orgRecipients, emailContent, frontendUrl, true);
    }

    let individualResults = { sent: 0, total: 0, errors: [] as any[] };
    if (individualSubscribers.length > 0) {
      console.log(
        `Sending announcement emails to ${individualSubscribers.length} individual subscribers`
      );
      individualResults = await sendEmails(individualSubscribers, emailContent, frontendUrl, false);
    }

    return {
      sent: orgResults.sent + individualResults.sent,
      total: orgResults.total + individualResults.total,
      errors: [...orgResults.errors, ...individualResults.errors],
    };
  } catch (error) {
    console.error('Error sending announcement emails:', error);
    throw error;
  }
}

export async function sendBlogEmails(blogId: string) {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: { tags: true },
    });

    if (!blog || !blog.isPublished) {
      console.log('Blog not found or not published');
      return { sent: 0, total: 0, errors: [] };
    }

    const tagNames = blog.tags.map(t => t.name);
    const orgRecipients = await getNotificationRecipients('BLOG', tagNames);
    const individualSubscribers = await getEmailSubscribers('BLOG');

    if (orgRecipients.length === 0 && individualSubscribers.length === 0) {
      console.log('No recipients for blog notification');
      return { sent: 0, total: 0, errors: [] };
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const blogPreview = blog.content.replace(/<[^>]*>/g, '').substring(0, 300);

    const emailContent: EmailContent = {
      subject: `New Blog Post: ${blog.title}`,
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #D54242; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .author { color: #666; font-style: italic; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Blog Post</h1>
            </div>
            <div class="content">
              <h2>${blog.title}</h2>
              <p class="author">by ${blog.author}</p>
              <p>${blogPreview}...</p>
              <p style="text-align: center;">
                <a href="${frontendUrl}/blogs/${blog.slug}" class="button">Read Full Post</a>
              </p>
            </div>
            <div class="footer">
              <p>Tennessee Coalition for Better Aging</p>
              <p>You received this email because you have blog notifications enabled</p>
              <p><a href="${frontendUrl}/settings" style="color: #666; text-decoration: underline;">Manage email preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
New Blog Post: ${blog.title}
by ${blog.author}

${blogPreview}...

Read the full post: ${frontendUrl}/blogs/${blog.slug}

---
Tennessee Coalition for Better Aging
You received this email because you have blog notifications enabled

Manage preferences: ${frontendUrl}/settings
      `,
    };

    let orgResults = { sent: 0, total: 0, errors: [] as any[] };
    if (orgRecipients.length > 0) {
      console.log(`Sending blog emails to ${orgRecipients.length} organizations`);
      orgResults = await sendEmails(orgRecipients, emailContent, frontendUrl, true);
    }

    let individualResults = { sent: 0, total: 0, errors: [] as any[] };
    if (individualSubscribers.length > 0) {
      console.log(`Sending blog emails to ${individualSubscribers.length} individual subscribers`);
      individualResults = await sendEmails(individualSubscribers, emailContent, frontendUrl, false);
    }

    return {
      sent: orgResults.sent + individualResults.sent,
      total: orgResults.total + individualResults.total,
      errors: [...orgResults.errors, ...individualResults.errors],
    };
  } catch (error) {
    console.error('Error sending blog emails:', error);
    throw error;
  }
}

export async function sendAlertEmails(alertId: string) {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!alert || !alert.isPublished) {
      console.log('Alert not found or not published');
      return { sent: 0, total: 0, errors: [] };
    }

    const recipients = await getNotificationRecipients('ALERT');

    if (recipients.length === 0) {
      console.log('No recipients for alert notification');
      return { sent: 0, total: 0, errors: [] };
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const priorityLabel =
      alert.priority === 'URGENT' ? '[URGENT] ' : alert.priority === 'MEDIUM' ? '[IMPORTANT] ' : '';

    const emailContent: EmailContent = {
      subject: `${priorityLabel}Alert: ${alert.title}`,
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${alert.priority === 'URGENT' ? '#DC2626' : '#D54242'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
            .priority-urgent { background-color: #FEE2E2; color: #DC2626; }
            .priority-medium { background-color: #FED7AA; color: #EA580C; }
            .priority-low { background-color: #DBEAFE; color: #2563EB; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${priorityLabel}Alert</h1>
            </div>
            <div class="content">
              <span class="priority priority-${alert.priority.toLowerCase()}">${alert.priority} PRIORITY</span>
              <h2>${alert.title}</h2>
              <div class="alert-box">
                ${alert.content.replace(/\n/g, '<br>')}
              </div>
              ${alert.attachmentUrls.length > 0 ? '<p><strong>This alert includes attachments. Log in to view them.</strong></p>' : ''}
            </div>
            <div class="footer">
              <p>Tennessee Coalition for Better Aging</p>
              <p>All member organizations receive alert notifications</p>
              <p><a href="${frontendUrl}/settings" style="color: #666; text-decoration: underline;">Manage other email preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
${priorityLabel}Alert: ${alert.title}

Priority: ${alert.priority}

${alert.content}

${alert.attachmentUrls.length > 0 ? 'This alert includes attachments. Log in to view them.' : ''}

---
Tennessee Coalition for Better Aging
All member organizations receive alert notifications

Manage other email preferences: ${frontendUrl}/settings
      `,
    };

    console.log(`Sending alert emails to ${recipients.length} recipients`);
    return await sendEmails(recipients, emailContent, frontendUrl);
  } catch (error) {
    console.error('Error sending alert emails:', error);
    throw error;
  }
}

export async function sendSurveyEmails(
  surveyId: string,
  targetTags?: string[],
  targetRegions?: string[]
) {
  try {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey || !survey.isPublished) {
      console.log('Survey not found or not published');
      return { sent: 0, total: 0, errors: [] };
    }

    const where: any = {
      status: 'ACTIVE',
      notifySurveys: true,
    };

    if (targetTags && targetTags.length > 0) {
      where.tags = { hasSome: targetTags };
    }

    if (targetRegions && targetRegions.length > 0) {
      where.region = { in: targetRegions };
    }

    const orgs = await prisma.organization.findMany({
      where,
      select: { email: true, primaryContactEmail: true, name: true },
    });

    const recipients = Array.from(
      new Set(
        orgs
          .map(o => o.primaryContactEmail || o.email)
          .filter(Boolean)
          .map(e => e!.toLowerCase())
      )
    );

    if (recipients.length === 0) {
      console.log('No recipients for survey notification');
      return { sent: 0, total: 0, errors: [] };
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const surveyUrl = `${frontendUrl}/surveys/${survey.id}`;

    const emailContent: EmailContent = {
      subject: `New Survey: ${survey.title}`,
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #D54242; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .due-date { background-color: #FEF3C7; padding: 10px; border-radius: 4px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Survey</h1>
            </div>
            <div class="content">
              <h2>${survey.title}</h2>
              ${survey.description ? `<p>${survey.description.replace(/\n/g, '<br>')}</p>` : ''}
              ${survey.dueDate ? `<div class="due-date"><strong>Due Date:</strong> ${new Date(survey.dueDate).toLocaleDateString()}</div>` : ''}
              <p style="text-align: center;">
                <a href="${surveyUrl}" class="button">Take Survey Now</a>
              </p>
            </div>
            <div class="footer">
              <p>Tennessee Coalition for Better Aging</p>
              <p>You received this email because you have survey notifications enabled</p>
              <p><a href="${frontendUrl}/settings" style="color: #666; text-decoration: underline;">Manage email preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
New Survey: ${survey.title}

${survey.description || ''}

${survey.dueDate ? `Due Date: ${new Date(survey.dueDate).toLocaleDateString()}` : ''}

Take the survey here: ${surveyUrl}

---
Tennessee Coalition for Better Aging
You received this email because you have survey notifications enabled

Manage preferences: ${frontendUrl}/settings
      `,
    };

    console.log(`Sending survey emails to ${recipients.length} recipients`);
    return await sendEmails(recipients, emailContent, frontendUrl);
  } catch (error) {
    console.error('Error sending survey emails:', error);
    throw error;
  }
}
