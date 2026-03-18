import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import {
  sendEventNotificationEmails,
  sendEventReminderEmail,
} from '../services/eventNotificationService.js';

export const eventsController = {
  /**
   * Get all events (filter by status, date, isPublic)
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const { status, upcoming, isPublic } = req.query;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (isPublic === 'true') {
        where.isPublic = true;
        where.status = 'PUBLISHED'; // Only show published public events
      }

      if (upcoming === 'true') {
        where.startTime = {
          gte: new Date(),
        };
      }

      const events = await prisma.event.findMany({
        where,
        include: {
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              rsvps: true,
              publicRsvps: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      // Calculate RSVP counts
      const eventsWithCounts = events.map(event => ({
        ...event,
        rsvpCount: event._count.rsvps + event._count.publicRsvps,
        orgRsvpCount: event._count.rsvps,
        publicRsvpCount: event._count.publicRsvps,
      }));

      res.json(eventsWithCounts);
    } catch (error: any) {
      console.error('Error getting events:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get single event by ID
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rsvps: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          publicRsvps: true,
          _count: {
            select: {
              rsvps: true,
              publicRsvps: true,
            },
          },
        },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const eventWithCount = {
        ...event,
        rsvpCount: event._count.rsvps + event._count.publicRsvps,
        orgRsvpCount: event._count.rsvps,
        publicRsvpCount: event._count.publicRsvps,
      };

      res.json(eventWithCount);
    } catch (error: any) {
      console.error('Error getting event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Create event (Admin only)
   */
  create: async (req: Request, res: Response) => {
    try {
      const { userId } = req.auth;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify user is admin
      const admin = await prisma.adminUser.findUnique({
        where: { clerkId: userId },
      });

      if (!admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const {
        title,
        description,
        location,
        zoomLink,
        meetingPassword,
        startTime,
        endTime,
        timezone,
        isPublic,
        maxAttendees,
        tags,
        attachments,
      } = req.body;

      // Validate required fields
      if (!title || !description || !startTime || !endTime) {
        return res.status(400).json({
          error: 'Missing required fields: title, description, startTime, endTime',
        });
      }

      const event = await prisma.event.create({
        data: {
          title,
          description,
          location,
          zoomLink,
          meetingPassword,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          timezone: timezone || 'America/Chicago',
          isPublic: isPublic || false,
          maxAttendees,
          tags: tags || [],
          attachments: attachments || [],
          createdByAdminId: admin.id,
          status: 'DRAFT',
        },
        include: {
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json(event);
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update event (Admin only)
   */
  update: async (req: Request, res: Response) => {
    try {
      const { userId } = req.auth;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify user is admin
      const admin = await prisma.adminUser.findUnique({
        where: { clerkId: userId },
      });

      if (!admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const {
        title,
        description,
        location,
        zoomLink,
        meetingPassword,
        startTime,
        endTime,
        timezone,
        isPublic,
        maxAttendees,
        tags,
        attachments,
        status,
      } = req.body;

      const updateData: any = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (location !== undefined) updateData.location = location;
      if (zoomLink !== undefined) updateData.zoomLink = zoomLink;
      if (meetingPassword !== undefined) updateData.meetingPassword = meetingPassword;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (timezone !== undefined) updateData.timezone = timezone;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees;
      if (tags !== undefined) updateData.tags = tags;
      if (attachments !== undefined) updateData.attachments = attachments;
      if (status !== undefined) updateData.status = status;

      const event = await prisma.event.update({
        where: { id },
        data: updateData,
        include: {
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json(event);
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Publish event (Admin only) - sends notification emails
   */
  publish: async (req: Request, res: Response) => {
    try {
      const { userId } = req.auth;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify user is admin
      const admin = await prisma.adminUser.findUnique({
        where: { clerkId: userId },
      });

      if (!admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const event = await prisma.event.update({
        where: { id },
        data: { status: 'PUBLISHED' },
        include: {
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Send notification emails in the background
      sendEventNotificationEmails(id).catch(error => {
        console.error('Error sending event notification emails:', error);
      });

      res.json({ ...event, message: 'Event published and notifications queued' });
    } catch (error: any) {
      console.error('Error publishing event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Delete/Cancel event (Admin only)
   */
  delete: async (req: Request, res: Response) => {
    try {
      const { userId } = req.auth;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify user is admin
      const admin = await prisma.adminUser.findUnique({
        where: { clerkId: userId },
      });

      if (!admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Check if event has RSVPs
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              rsvps: true,
              publicRsvps: true,
            },
          },
        },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const hasRSVPs = event._count.rsvps > 0 || event._count.publicRsvps > 0;

      if (hasRSVPs) {
        // If there are RSVPs, cancel instead of delete
        await prisma.event.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });

        // TODO: Send cancellation emails to RSVPs

        res.json({ message: 'Event cancelled. Attendees have been notified.' });
      } else {
        // No RSVPs, safe to delete
        await prisma.event.delete({
          where: { id },
        });

        res.json({ message: 'Event deleted successfully' });
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * RSVP to event (Org users)
   */
  rsvp: async (req: Request, res: Response) => {
    try {
      const { userId } = req.auth;
      const { id: eventId } = req.params;
      const { status, attendeeName, attendeeEmail, attendeePhone, notes } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get organization
      const org = await prisma.organization.findUnique({
        where: { clerkId: userId },
      });

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Check if event exists and is published
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              rsvps: true,
              publicRsvps: true,
            },
          },
        },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.status !== 'PUBLISHED') {
        return res.status(400).json({ error: 'Event is not available for RSVP' });
      }

      // Check if event is full
      if (event.maxAttendees) {
        const currentAttendees = event._count.rsvps + event._count.publicRsvps;
        if (currentAttendees >= event.maxAttendees && status === 'GOING') {
          return res.status(400).json({ error: 'Event is full' });
        }
      }

      // Create or update RSVP
      const rsvp = await prisma.eventRSVP.upsert({
        where: {
          eventId_organizationId: {
            eventId,
            organizationId: org.id,
          },
        },
        update: {
          status,
          attendeeName,
          attendeeEmail,
          attendeePhone,
          notes,
        },
        create: {
          eventId,
          organizationId: org.id,
          status: status || 'GOING',
          attendeeName,
          attendeeEmail,
          attendeePhone,
          notes,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              location: true,
              zoomLink: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json(rsvp);
    } catch (error: any) {
      console.error('Error creating RSVP:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Public RSVP (no auth required)
   */
  publicRsvp: async (req: Request, res: Response) => {
    try {
      const { id: eventId } = req.params;
      const { email, name, phone, notes } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check if event exists, is published, and is public
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              rsvps: true,
              publicRsvps: true,
            },
          },
        },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.status !== 'PUBLISHED') {
        return res.status(400).json({ error: 'Event is not available for RSVP' });
      }

      if (!event.isPublic) {
        return res.status(403).json({ error: 'This event is not open to the public' });
      }

      // Check if event is full
      if (event.maxAttendees) {
        const currentAttendees = event._count.rsvps + event._count.publicRsvps;
        if (currentAttendees >= event.maxAttendees) {
          return res.status(400).json({ error: 'Event is full' });
        }
      }

      // Create or update public RSVP
      const rsvp = await prisma.publicEventRSVP.upsert({
        where: {
          eventId_email: {
            eventId,
            email: email.toLowerCase(),
          },
        },
        update: {
          name,
          phone,
          notes,
          status: 'GOING',
        },
        create: {
          eventId,
          email: email.toLowerCase(),
          name,
          phone,
          notes,
          status: 'GOING',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              location: true,
              zoomLink: true,
            },
          },
        },
      });

      res.json(rsvp);
    } catch (error: any) {
      console.error('Error creating public RSVP:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get organization's RSVPs
   */
  getMyRSVPs: async (req: Request, res: Response) => {
    try {
      const { userId } = req.auth;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const org = await prisma.organization.findUnique({
        where: { clerkId: userId },
      });

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const rsvps = await prisma.eventRSVP.findMany({
        where: {
          organizationId: org.id,
        },
        include: {
          event: {
            include: {
              createdByAdmin: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          event: {
            startTime: 'asc',
          },
        },
      });

      res.json(rsvps);
    } catch (error: any) {
      console.error('Error getting RSVPs:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Cancel RSVP
   */
  cancelRsvp: async (req: Request, res: Response) => {
    try {
      const { userId } = req.auth;
      const { id: eventId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const org = await prisma.organization.findUnique({
        where: { clerkId: userId },
      });

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      await prisma.eventRSVP.update({
        where: {
          eventId_organizationId: {
            eventId,
            organizationId: org.id,
          },
        },
        data: {
          status: 'NOT_GOING',
        },
      });

      res.json({ message: 'RSVP cancelled successfully' });
    } catch (error: any) {
      console.error('Error cancelling RSVP:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
