import { prisma } from '../config/prisma.js';
import { Request, Response } from 'express';

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcements.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

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
    });

    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements by published date:', error);
    res.status(500).json({ error: 'Failed to fetch announcements by published date' });
  }
};
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
        tags,
        createdByAdminId,
      },
    });

    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedAnnouncement = await prisma.announcements.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.announcements.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};
