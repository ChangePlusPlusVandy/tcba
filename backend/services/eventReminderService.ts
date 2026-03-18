import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { sendEventReminderEmail } from './eventNotificationService.js';

/**
 * Check and send 1-day reminders
 */
async function send1DayReminders() {
  try {
    console.log('[EventReminder] Checking for 1-day reminders...');

    // Calculate time range: events starting 23-25 hours from now
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const buffer = 1 * 60 * 60 * 1000; // 1 hour buffer

    const startRange = new Date(oneDayFromNow.getTime() - buffer);
    const endRange = new Date(oneDayFromNow.getTime() + buffer);

    // Get organization RSVPs that need reminders
    const orgRsvps = await prisma.eventRSVP.findMany({
      where: {
        status: 'GOING',
        reminder1DaySent: false,
        event: {
          startTime: {
            gte: startRange,
            lte: endRange,
          },
          status: 'PUBLISHED',
        },
      },
      include: {
        event: true,
        organization: {
          select: {
            name: true,
            email: true,
            primaryContactName: true,
          },
        },
      },
    });

    // Get public RSVPs that need reminders
    const publicRsvps = await prisma.publicEventRSVP.findMany({
      where: {
        status: 'GOING',
        reminder1DaySent: false,
        event: {
          startTime: {
            gte: startRange,
            lte: endRange,
          },
          status: 'PUBLISHED',
        },
      },
      include: {
        event: true,
      },
    });

    let sent = 0;

    // Send to organizations
    for (const rsvp of orgRsvps) {
      const email = rsvp.attendeeEmail || rsvp.organization.email;
      const name =
        rsvp.attendeeName || rsvp.organization.primaryContactName || rsvp.organization.name;

      const success = await sendEventReminderEmail(email, name, rsvp.event, '1_DAY');

      if (success) {
        await prisma.eventRSVP.update({
          where: { id: rsvp.id },
          data: { reminder1DaySent: true },
        });
        sent++;
      }
    }

    // Send to public RSVPs
    for (const rsvp of publicRsvps) {
      const success = await sendEventReminderEmail(rsvp.email, rsvp.name, rsvp.event, '1_DAY');

      if (success) {
        await prisma.publicEventRSVP.update({
          where: { id: rsvp.id },
          data: { reminder1DaySent: true },
        });
        sent++;
      }
    }

    console.log(
      `[EventReminder] Sent ${sent} 1-day reminders (${orgRsvps.length} org + ${publicRsvps.length} public)`
    );
  } catch (error) {
    console.error('[EventReminder] Error sending 1-day reminders:', error);
  }
}

/**
 * Check and send 1-hour reminders
 */
async function send1HourReminders() {
  try {
    console.log('[EventReminder] Checking for 1-hour reminders...');

    // Calculate time range: events starting 50-70 minutes from now
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const buffer = 10 * 60 * 1000; // 10 minute buffer

    const startRange = new Date(oneHourFromNow.getTime() - buffer);
    const endRange = new Date(oneHourFromNow.getTime() + buffer);

    // Get organization RSVPs that need reminders
    const orgRsvps = await prisma.eventRSVP.findMany({
      where: {
        status: 'GOING',
        reminder1HourSent: false,
        event: {
          startTime: {
            gte: startRange,
            lte: endRange,
          },
          status: 'PUBLISHED',
        },
      },
      include: {
        event: true,
        organization: {
          select: {
            name: true,
            email: true,
            primaryContactName: true,
          },
        },
      },
    });

    // Get public RSVPs that need reminders
    const publicRsvps = await prisma.publicEventRSVP.findMany({
      where: {
        status: 'GOING',
        reminder1HourSent: false,
        event: {
          startTime: {
            gte: startRange,
            lte: endRange,
          },
          status: 'PUBLISHED',
        },
      },
      include: {
        event: true,
      },
    });

    let sent = 0;

    // Send to organizations
    for (const rsvp of orgRsvps) {
      const email = rsvp.attendeeEmail || rsvp.organization.email;
      const name =
        rsvp.attendeeName || rsvp.organization.primaryContactName || rsvp.organization.name;

      const success = await sendEventReminderEmail(email, name, rsvp.event, '1_HOUR');

      if (success) {
        await prisma.eventRSVP.update({
          where: { id: rsvp.id },
          data: { reminder1HourSent: true },
        });
        sent++;
      }
    }

    // Send to public RSVPs
    for (const rsvp of publicRsvps) {
      const success = await sendEventReminderEmail(rsvp.email, rsvp.name, rsvp.event, '1_HOUR');

      if (success) {
        await prisma.publicEventRSVP.update({
          where: { id: rsvp.id },
          data: { reminder1HourSent: true },
        });
        sent++;
      }
    }

    console.log(
      `[EventReminder] Sent ${sent} 1-hour reminders (${orgRsvps.length} org + ${publicRsvps.length} public)`
    );
  } catch (error) {
    console.error('[EventReminder] Error sending 1-hour reminders:', error);
  }
}

/**
 * Initialize cron jobs for event reminders
 */
export function initializeEventReminders() {
  // Run every day at 9:00 AM for 1-day reminders
  cron.schedule('0 9 * * *', async () => {
    console.log('[EventReminder] Running 1-day reminder check...');
    await send1DayReminders();
  });

  // Run every 30 minutes for 1-hour reminders
  cron.schedule('*/30 * * * *', async () => {
    console.log('[EventReminder] Running 1-hour reminder check...');
    await send1HourReminders();
  });

  console.log('[EventReminder] Event reminder cron jobs initialized');
  console.log('[EventReminder] - 1-day reminders: Daily at 9:00 AM');
  console.log('[EventReminder] - 1-hour reminders: Every 30 minutes');
}
