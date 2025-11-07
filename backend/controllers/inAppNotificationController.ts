import { prisma } from '../config/prisma.js';
import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { lastChecked } = req.query;

    const where = lastChecked
      ? { createdAt: { gt: new Date(lastChecked as string) } }
      : {};

    const count = await prisma.notification.count({ where });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { lastCheckedAt } = req.body;

    res.status(200).json({ success: true, lastCheckedAt: lastCheckedAt || new Date() });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export const createNotification = async (
  type: NotificationType,
  title: string,
  contentId: string
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        contentId,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
