import { prisma } from '../config/prisma.js';
import { Request, Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { createNotification } from './inAppNotificationController.js';
import { sendAnnouncementEmails } from '../services/emailNotificationService.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

const generateSlug = async (title: string, id: string): Promise<string> => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseSlug}-${id.substring(0, 8)}`;
};

/**
 * @desc    Get all announcements
 * @route   GET /api/announcements
 * @access  Public (returns only published) / Admin (returns all)
 */
export const getAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let isAuthenticatedAdmin = false;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { verifyToken } = await import('@clerk/express');
        const verifiedToken = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
          clockSkewInMs: 5000,
        });

        const adminUser = await prisma.adminUser.findUnique({
          where: { clerkId: verifiedToken.sub },
        });

        if (adminUser) {
          isAuthenticatedAdmin = true;
          console.log('Admin authenticated in getAnnouncements');
        }
      } catch (error) {
        console.log('Auth failed in getAnnouncements, treating as public');
      }
    }

    const announcements = await prisma.announcements.findMany({
      where: isAuthenticatedAdmin ? {} : { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: { tags: true },
    });

    console.log(`Returning ${announcements.length} announcements (admin: ${isAuthenticatedAdmin})`);
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

/**
 * @desc    Get announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Public
 */
export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.status(200).json(announcement);
  } catch (error) {
    console.error('Error fetching announcement by ID:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
};

/**
 * @desc    Get announcement by slug
 * @route   GET /api/announcements/slug/:slug
 * @access  Public
 */
export const getAnnouncementBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const announcement = await prisma.announcements.findUnique({
      where: { slug },
      include: { tags: true },
    });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.status(200).json(announcement);
  } catch (error) {
    console.error('Error fetching announcement by slug:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
};

/**
 * @desc    Get announcements by published date
 * @route   GET /api/announcements/published-date/:publishedDate
 * @access  Public
 */
export const getAnnouncementsByPublishedDate = async (req: Request, res: Response) => {
  try {
    const { publishedDate } = req.params;
    if (!publishedDate) {
      return res.status(400).json({ error: 'publishedDate path parameter is required' });
    }
    const parsedDate = new Date(publishedDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid publishedDate. Provide a valid ISO 8601 date, e.g. 2024-05-01',
      });
    }
    const startOfDay = new Date(parsedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const announcements = await prisma.announcements.findMany({
      where: {
        publishedDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { tags: true },
    });
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements by published date:', error);
    res.status(500).json({ error: 'Failed to fetch announcements by published date' });
  }
};

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Admin/Super Admin
 */
export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('createAnnouncement called');
    console.log('req.user:', req.user);
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const { title, content, publishedDate, isPublished, attachmentUrls, tagIds, createdByAdminId } =
      req.body;

    console.log('Creating announcement with data:', { title, isPublished, tagIds });

    const tempAnnouncement = await prisma.announcements.create({
      data: {
        title,
        content,
        slug: 'temp',
        publishedDate: publishedDate ? new Date(publishedDate) : null,
        isPublished: isPublished ?? false,
        attachmentUrls: attachmentUrls ?? [],
        createdByAdminId: createdByAdminId ?? 'system',
      },
    });
    console.log('Temp announcement created:', tempAnnouncement.id);

    const slug = await generateSlug(title, tempAnnouncement.id);
    console.log('Generated slug:', slug);

    const updateData: any = { slug };
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      updateData.tags = {
        connect: tagIds.map((id: string) => ({ id })),
      };
    }
    console.log('Update data:', updateData);

    const newAnnouncement = await prisma.announcements.update({
      where: { id: tempAnnouncement.id },
      data: updateData,
      include: { tags: true },
    });
    console.log('Announcement updated successfully:', newAnnouncement.id);

    if (newAnnouncement.isPublished) {
      try {
        await createNotification('ANNOUNCEMENT', newAnnouncement.title, newAnnouncement.slug);
        // Send email notifications to organizations with announcement notifications enabled
        await sendAnnouncementEmails(newAnnouncement.id);
        console.log('Announcement notifications sent successfully');
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    }

    console.log('Sending response...');
    res.status(201).json(newAnnouncement);
    console.log('Response sent');
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement', details: error });
  }
};

/**
 * @desc    Update an announcement
 * @route   PUT /api/announcements/:id
 * @access  Admin/Super Admin
 */
export const updateAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const { tags, ...otherData } = req.body;
    const updateData: any = { ...otherData };
    if (tags !== undefined) {
      if (tags.length === 0) {
        updateData.tags = { set: [] };
      } else {
        updateData.tags = {
          set: [],
          connectOrCreate: tags.map((tagName: string) => ({
            where: { name: tagName },
            create: { name: tagName },
          })),
        };
      }
    }
    const updatedAnnouncement = await prisma.announcements.update({
      where: { id },
      data: updateData,
      include: { tags: true },
    });
    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Admin/Super Admin
 */
export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    await prisma.announcements.delete({ where: { id } });
    await prisma.tag.deleteMany({
      where: {
        announcements: {
          none: {},
        },
      },
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

/**
 * @desc    Publish an announcement
 * @route   POST /api/announcements/:id/publish
 * @access  Admin/Super Admin
 */
export const publishAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const announcement = await prisma.announcements.findUnique({ where: { id } });
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

    const publishedAnnouncement = await prisma.announcements.update({
      where: { id },
      data: {
        isPublished: true,
        publishedDate: new Date(),
      },
      include: { tags: true },
    });

    try {
      await createNotification('ANNOUNCEMENT', publishedAnnouncement.title, publishedAnnouncement.slug);
      // Send email notifications to organizations with announcement notifications enabled
      await sendAnnouncementEmails(publishedAnnouncement.id);
      console.log('Announcement notifications sent successfully');
    } catch (notifError) {
      console.error('Failed to create notification or send emails:', notifError);
    }

    res.json(publishedAnnouncement);
  } catch (error) {
    console.error('Error publishing announcement:', error);
    res.status(500).json({ error: 'Failed to publish announcement' });
  }
};

/**
 * @desc    Unpublish an announcement
 * @route   POST /api/announcements/:id/unpublish
 * @access  Admin/Super Admin
 */
export const unpublishAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const announcement = await prisma.announcements.findUnique({ where: { id } });
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

    const unpublishedAnnouncement = await prisma.announcements.update({
      where: { id },
      data: {
        isPublished: false,
      },
      include: { tags: true },
    });

    res.json(unpublishedAnnouncement);
  } catch (error) {
    console.error('Error unpublishing announcement:', error);
    res.status(500).json({ error: 'Failed to unpublish announcement' });
  }
};
