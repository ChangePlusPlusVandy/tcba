import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, sesConfig } from '../config/aws-ses.js';
import { prisma } from '../config/prisma.js';

interface EmailContent {
  subject: string;
  htmlBody: string;
  textBody: string;
}

async function sendEmails(recipients: string[], emailContent: EmailContent) {
  let sent = 0;
  const errors: any[] = [];

  for (const email of recipients) {
    const command = new SendEmailCommand({
      Source: sesConfig.fromEmail,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: emailContent.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: emailContent.htmlBody, Charset: 'UTF-8' },
          Text: { Data: emailContent.textBody, Charset: 'UTF-8' },
        },
      },
      ReplyToAddresses: [sesConfig.replyToEmail],
    });

    try {
      await sesClient.send(command);
      sent++;
      console.log(`[EventNotification] Email sent successfully to ${email}`);
    } catch (err) {
      console.error(`[EventNotification] Failed to send email to ${email}:`, err);
      errors.push({ email, error: String(err) });
    }
  }

  return { sent, errors, total: recipients.length };
}

/**
 * Send notification emails when an event is published
 */
export async function sendEventNotificationEmails(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdByAdmin: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!event || event.status !== 'PUBLISHED') {
      console.log('[EventNotification] Event not found or not published');
      return { sent: 0, total: 0, errors: [] };
    }

    // Get organization emails (active organizations only)
    const orgs = await prisma.organization.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: { email: true, name: true },
    });

    let recipients = Array.from(
      new Set(
        orgs
          .map(o => o.email)
          .filter(Boolean)
          .map(e => e!.toLowerCase())
      )
    );

    // If event is public, also include public email subscribers
    if (event.isPublic) {
      const subscribers = await prisma.emailSubscription.findMany({
        where: {
          isActive: true,
        },
        select: { email: true },
      });

      const subscriberEmails = subscribers.map(s => s.email.toLowerCase());
      recipients = Array.from(new Set([...recipients, ...subscriberEmails]));
    }

    if (recipients.length === 0) {
      console.log('[EventNotification] No recipients for event notification');
      return { sent: 0, total: 0, errors: [] };
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const eventUrl = `${frontendUrl}/events/${event.id}`;

    const formattedStartTime = new Date(event.startTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: event.timezone,
    });

    const emailContent: EmailContent = {
      subject: `New Event: ${event.title}`,
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .event-details { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
            .detail-row { margin: 10px 0; }
            .detail-label { font-weight: bold; color: #666; }
            .button { display: inline-block; background-color: #D54242; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 New Event Available</h1>
            </div>
            <div class="content">
              <h2>${event.title}</h2>
              <p>${event.description.replace(/\n/g, '<br>')}</p>

              <div class="event-details">
                <div class="detail-row">
                  <span class="detail-label">📅 When:</span> ${formattedStartTime}
                </div>
                ${event.location ? `
                <div class="detail-row">
                  <span class="detail-label">📍 Location:</span> ${event.location}
                </div>
                ` : ''}
                ${event.zoomLink ? `
                <div class="detail-row">
                  <span class="detail-label">💻 Virtual Meeting:</span> Available
                </div>
                ` : ''}
                ${event.maxAttendees ? `
                <div class="detail-row">
                  <span class="detail-label">👥 Capacity:</span> ${event.maxAttendees} attendees
                </div>
                ` : ''}
              </div>

              <p style="text-align: center;">
                <a href="${eventUrl}" class="button">View Event & RSVP</a>
              </p>
            </div>
            <div class="footer">
              <p>Tennessee Coalition for Better Aging</p>
              <p>You received this email because you are a member of our coalition</p>
              <p><a href="${frontendUrl}/settings" style="color: #666; text-decoration: underline;">Manage email preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
New Event: ${event.title}

${event.description}

Event Details:
📅 When: ${formattedStartTime}
${event.location ? `📍 Location: ${event.location}` : ''}
${event.zoomLink ? `💻 Virtual Meeting: Available` : ''}
${event.maxAttendees ? `👥 Capacity: ${event.maxAttendees} attendees` : ''}

View event and RSVP: ${eventUrl}

---
Tennessee Coalition for Better Aging
You received this email because you are a member of our coalition

Manage preferences: ${frontendUrl}/settings
      `,
    };

    console.log(`[EventNotification] Sending event notification emails to ${recipients.length} recipients`);
    return await sendEmails(recipients, emailContent);
  } catch (error) {
    console.error('[EventNotification] Error sending event notification emails:', error);
    throw error;
  }
}

/**
 * Send reminder email to a single RSVP
 */
export async function sendEventReminderEmail(
  email: string,
  name: string | null,
  event: any,
  timeFrame: '1_DAY' | '1_HOUR'
) {
  try {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const eventUrl = `${frontendUrl}/events/${event.id}`;

    const formattedStartTime = new Date(event.startTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: event.timezone,
    });

    const timeFrameText = timeFrame === '1_DAY' ? 'tomorrow' : 'in 1 hour';
    const greeting = name ? `Hello ${name}` : 'Hello';

    const emailContent: EmailContent = {
      subject: `Reminder: ${event.title} is ${timeFrameText}`,
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .reminder-box { background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .event-details { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
            .detail-row { margin: 10px 0; }
            .detail-label { font-weight: bold; color: #666; }
            .button { display: inline-block; background-color: #D54242; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Event Reminder</h1>
            </div>
            <div class="content">
              <p>${greeting},</p>

              <div class="reminder-box">
                <h3 style="margin: 0;">This is a reminder that the following event is ${timeFrameText}!</h3>
              </div>

              <h2>${event.title}</h2>

              <div class="event-details">
                <div class="detail-row">
                  <span class="detail-label">📅 When:</span> ${formattedStartTime}
                </div>
                ${event.location ? `
                <div class="detail-row">
                  <span class="detail-label">📍 Location:</span> ${event.location}
                </div>
                ` : ''}
                ${event.zoomLink ? `
                <div class="detail-row">
                  <span class="detail-label">💻 Join Meeting:</span> <a href="${event.zoomLink}">${event.zoomLink}</a>
                  ${event.meetingPassword ? `<br><span class="detail-label">Password:</span> ${event.meetingPassword}` : ''}
                </div>
                ` : ''}
              </div>

              <p>We look forward to seeing you there!</p>

              <p style="text-align: center;">
                <a href="${eventUrl}" class="button">View Event Details</a>
              </p>
            </div>
            <div class="footer">
              <p>Tennessee Coalition for Better Aging</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
⏰ Event Reminder

${greeting},

This is a reminder that the following event is ${timeFrameText}!

${event.title}

Event Details:
📅 When: ${formattedStartTime}
${event.location ? `📍 Location: ${event.location}` : ''}
${event.zoomLink ? `💻 Join Meeting: ${event.zoomLink}${event.meetingPassword ? `\nPassword: ${event.meetingPassword}` : ''}` : ''}

We look forward to seeing you there!

View event details: ${eventUrl}

---
Tennessee Coalition for Better Aging
      `,
    };

    const command = new SendEmailCommand({
      Source: sesConfig.fromEmail,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: emailContent.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: emailContent.htmlBody, Charset: 'UTF-8' },
          Text: { Data: emailContent.textBody, Charset: 'UTF-8' },
        },
      },
      ReplyToAddresses: [sesConfig.replyToEmail],
    });

    await sesClient.send(command);
    console.log(`[EventReminder] Reminder sent to ${email} for event ${event.title} (${timeFrame})`);
    return true;
  } catch (error) {
    console.error(`[EventReminder] Error sending reminder to ${email}:`, error);
    return false;
  }
}
