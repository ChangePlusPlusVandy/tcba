import { Response } from 'express';
import { AlertPriority, OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { EmailService } from '../services/EmailService.js';
import { createNotification } from './inAppNotificationController.js';
import { sendAlertEmails as sendAlertEmailNotifications } from '../services/emailNotificationService.js';
import { CacheService, CacheKeys, CacheTTL } from '../utils/cache.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

/**
 * @desc    Get all alerts with pagination
 * @route   GET /api/alerts?priority&page=1&limit=20
 * @access  Public (optional authentication)
 */
export const getAlerts = async (req: AuthenticatedRequest, res: Response) => {
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
          console.log('Admin authenticated in getAlerts');
        }
      } catch (error) {
        console.log('Auth failed in getAlerts, treating as public');
      }
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { priority, isPublished } = req.query;

    const cacheKey = CacheKeys.alerts(
      page,
      limit,
      isAuthenticatedAdmin
        ? isPublished === 'true'
          ? true
          : isPublished === 'false'
            ? false
            : undefined
        : true,
      priority as string
    );
    const cachedData = await CacheService.get<any>(cacheKey);

    if (cachedData) {
      console.log(`Returning cached alerts (admin: ${isAuthenticatedAdmin})`);
      return res.status(200).json(cachedData);
    }

    const where: any = {
      ...(priority && { priority: priority as AlertPriority }),

      ...(!isAuthenticatedAdmin && { isPublished: true }),

      ...(isAuthenticatedAdmin &&
        isPublished !== undefined && { isPublished: isPublished === 'true' }),
    };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip,
      }),
      prisma.alert.count({ where }),
    ]);

    const response = {
      data: alerts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + alerts.length < total,
      },
    };

    await CacheService.set(cacheKey, response, CacheTTL.ALERTS_LIST);

    console.log(`Returning ${alerts.length} alerts (admin: ${isAuthenticatedAdmin})`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

/**
 * @desc    Get alert by ID (filtered by matching tags for non-admins)
 * @route   GET /api/alerts/:id
 * @access  Authenticated organizations and admins only
 */
export const getAlertById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const userIsAdmin = isAdmin(req.user?.role);

    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (!userIsAdmin && !alert.isPublished) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!userIsAdmin) {
      const userOrganization = await prisma.organization.findUnique({
        where: { id: req.user.id },
        select: { tags: true },
      });

      if (alert.tags && alert.tags.length > 0 && userOrganization) {
        const hasMatchingTag = alert.tags.some(alertTag =>
          userOrganization.tags.includes(alertTag)
        );

        if (!hasMatchingTag) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
    }

    res.status(200).json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
};

/**
 * @desc    Get alerts by priority (filtered by matching tags for non-admins)
 * @route   GET /api/alerts/priority/:priority
 * @access  Authenticated organizations and admins only
 */
export const getAlertsByPriority = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { priority } = req.params;
    const userIsAdmin = isAdmin(req.user?.role);

    if (!['URGENT', 'MEDIUM', 'LOW'].includes(priority.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid priority. Must be URGENT, MEDIUM, or LOW' });
    }

    let userOrganization;
    if (!userIsAdmin) {
      userOrganization = await prisma.organization.findUnique({
        where: { id: req.user.id },
        select: { tags: true },
      });
    }

    let alerts = await prisma.alert.findMany({
      where: {
        priority: priority.toUpperCase() as AlertPriority,

        ...(!userIsAdmin && { isPublished: true }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!userIsAdmin && userOrganization) {
      alerts = alerts.filter(alert => {
        if (!alert.tags || alert.tags.length === 0) {
          return true;
        }

        return alert.tags.some(alertTag => userOrganization.tags.includes(alertTag));
      });
    }

    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alerts by priority:', error);
    res.status(500).json({ error: 'Failed to fetch alerts by priority' });
  }
};

/**
 * @desc    Create new alert
 * @route   POST /api/alerts
 * @access  Admin/Super Admin only
 */
export const createAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      title,
      content,
      priority,
      publishedDate,
      isPublished,
      attachmentUrls,
      tags,
      questions,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newAlert = await prisma.alert.create({
      data: {
        title,
        content,
        priority: priority || 'MEDIUM',
        publishedDate: publishedDate ? new Date(publishedDate) : null,
        isPublished: isPublished || false,
        attachmentUrls: attachmentUrls || [],
        tags: tags || [],
        createdByAdminId: req.user?.id || 'system',
        questions: questions || [],
      },
    });

    await CacheService.deletePattern(CacheKeys.alertsAll());

    if (newAlert.isPublished) {
      try {
        await createNotification('ALERT', newAlert.title, newAlert.id);
        await sendAlertEmailNotifications(newAlert.id);
        console.log('Alert notifications sent successfully');
      } catch (notifError) {
        console.error('Failed to create notification or send emails:', notifError);
      }
    }

    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

/**
 * @desc    Update alert
 * @route   PUT /api/alerts/:id
 * @access  Admin/Super Admin only
 */
export const updateAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { publishedDate, ...updateData } = req.body;

    const existingAlert = await prisma.alert.findUnique({ where: { id } });
    if (!existingAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: {
        ...updateData,
        ...(publishedDate && { publishedDate: new Date(publishedDate) }),
      },
    });

    await CacheService.deletePattern(CacheKeys.alertsAll());
    await CacheService.delete(CacheKeys.alertById(id));

    if (updatedAlert.isPublished && !existingAlert.isPublished) {
      await sendAlertEmails(updatedAlert);
    }

    res.status(200).json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

/**
 * @desc    Delete alert
 * @route   DELETE /api/alerts/:id
 * @access  Admin/Super Admin only
 */
export const deleteAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const alertToDelete = await prisma.alert.findUnique({ where: { id } });
    if (!alertToDelete) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await prisma.alert.delete({ where: { id } });

    await CacheService.deletePattern(CacheKeys.alertsAll());
    await CacheService.delete(CacheKeys.alertById(id));

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};

/**
 * @desc    Publish alert and send notifications
 * @route   POST /api/alerts/:id/publish
 * @access  Admin/Super Admin only
 */
export const publishAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alert.isPublished) {
      return res.status(400).json({ error: 'Alert is already published' });
    }

    const publishedAlert = await prisma.alert.update({
      where: { id },
      data: {
        isPublished: true,
        publishedDate: new Date(),
      },
    });

    await CacheService.deletePattern(CacheKeys.alertsAll());
    await CacheService.delete(CacheKeys.alertById(id));

    try {
      await sendAlertEmailNotifications(publishedAlert.id);
      console.log('Alert notifications sent successfully');
    } catch (emailError) {
      console.error('Failed to send alert email notifications:', emailError);
    }

    res.status(200).json(publishedAlert);
  } catch (error) {
    console.error('Error publishing alert:', error);
    res.status(500).json({ error: 'Failed to publish alert' });
  }
};

/**
 * Helper function to send alert emails to organizations with matching tags
 * This will be connected to the automated email system. It isn't currently fully developed and needs to
 * be developed later.
 */
async function sendAlertEmails(alert: any): Promise<void> {
  try {
    const activeOrganizations = await prisma.organization.findMany({
      where: {
        membershipActive: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        primaryContactEmail: true,
        primaryContactName: true,
        tags: true,
      },
    });

    let targetOrganizations = activeOrganizations;

    if (alert.tags && alert.tags.length > 0) {
      targetOrganizations = activeOrganizations.filter(org => {
        return alert.tags.some((alertTag: string) => org.tags.includes(alertTag));
      });
    }

    console.log(
      `Sending alert "${alert.title}" to ${targetOrganizations.length} organizations` +
        (alert.tags && alert.tags.length > 0
          ? ` with matching tags: [${alert.tags.join(', ')}]`
          : ' (broadcast to all)')
    );

    // Send email to each targeted organization
    for (const org of targetOrganizations) {
      try {
        await EmailService.sendAlertEmail({
          to: org.primaryContactEmail,
          organizationName: org.name,
          alertTitle: alert.title,
          alertContent: alert.content,
          alertPriority: alert.priority,
          attachmentUrls: alert.attachmentUrls,
        });
      } catch (emailError) {
        console.error(`Failed to send alert email to ${org.name}:`, emailError);
        // Continue sending to other organizations even if one fails
      }
    }
  } catch (error) {
    console.error('Error sending alert emails:', error);
  }
}
