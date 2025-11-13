import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, sesConfig } from '../config/aws-ses.js';

export const processScheduledEmails = async () => {
  try {
    const now = new Date();

    const dueEmails = await prisma.emailHistory.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: now,
        },
      },
    });

    if (dueEmails.length === 0) {
      return;
    }

    console.log(`[ScheduledEmailService] Processing ${dueEmails.length} scheduled email(s)`);

    for (const emailRecord of dueEmails) {
      console.log(
        `[ScheduledEmailService] Processing email ${emailRecord.id} scheduled for ${emailRecord.scheduledFor}`
      );

      let sent = 0;
      const errors: any[] = [];

      for (const recipientEmail of emailRecord.recipientEmails) {
        const command = new SendEmailCommand({
          Source: sesConfig.fromEmail,
          Destination: { ToAddresses: [recipientEmail] },
          Message: {
            Subject: { Data: emailRecord.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: emailRecord.body, Charset: 'UTF-8' },
              Text: {
                Data: emailRecord.body.replace(/<[^>]+>/g, ''),
                Charset: 'UTF-8',
              },
            },
          },
          ReplyToAddresses: [sesConfig.replyToEmail],
        });

        try {
          await sesClient.send(command);
          sent++;
        } catch (err) {
          console.error(`[ScheduledEmailService] Failed to send to ${recipientEmail}:`, err);
          errors.push({ email: recipientEmail, error: String(err) });
        }
      }

      const status = sent > 0 ? 'SENT' : 'FAILED';
      await prisma.emailHistory.update({
        where: { id: emailRecord.id },
        data: {
          status,
          sentAt: new Date(),
        },
      });

      console.log(
        `[ScheduledEmailService] Email ${emailRecord.id} processed: ${sent}/${emailRecord.recipientCount} sent, status: ${status}`
      );
    }

    console.log(
      `[ScheduledEmailService] Completed processing ${dueEmails.length} scheduled email(s)`
    );
  } catch (error) {
    console.error('[ScheduledEmailService] Error processing scheduled emails:', error);
  }
};

export const startScheduledEmailService = () => {
  console.log('[ScheduledEmailService] Starting scheduled email service (runs every minute)');

  cron.schedule('* * * * *', async () => {
    await processScheduledEmails();
  });

  processScheduledEmails();
};
