import { prisma } from '../config/prisma.js';
import { Request, Response } from 'express';

/**
 * @desc    Get all announcements
 * @route   GET /api/announcements
 * @access  Public
 */
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcements.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tags: true },
    });
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
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content, publishedDate, isPublished, attachmentUrls, tags, createdByAdminId } =
      req.body;
    const newAnnouncement = await prisma.announcements.create({
      data: {
        title,
        content,
        publishedDate,
        isPublished,
        attachmentUrls,
        createdByAdminId,
        tags:
          tags?.length > 0
            ? {
                connectOrCreate: tags.map((tagName: string) => ({
                  where: { name: tagName },
                  create: { name: tagName },
                })),
              }
            : undefined,
      },
      include: { tags: true },
    });
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

/**
 * @desc    Update an announcement
 * @route   PUT /api/announcements/:id
 * @access  Admin/Super Admin
 */
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
