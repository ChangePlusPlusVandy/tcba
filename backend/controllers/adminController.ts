import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { clerkClient } from '../config/clerk.js';
import { prisma } from '../config/prisma.js';

const isAdmin = (role?: string) => role === 'ADMIN';

/**
 * @desc    Get all admins
 * @route   GET /api/admins
 * @access  Admin only
 */
export const getAllAdmins = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { email, name, isActive } = req.query;
    const where: any = {
      ...(email && { email: { contains: email as string, mode: 'insensitive' } }),
      ...(name && { name: { contains: name as string, mode: 'insensitive' } }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const admins = await (prisma as any).adminUser.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

/**
 * @desc    Get an admin by id
 * @route   GET /api/admins/:id
 * @access  Admin only
 */
export const getAdminById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;

    const admin = await (prisma as any).adminUser.findUnique({
      where: { id },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Error fetching admin by id:', error);
    res.status(500).json({ error: 'Failed to fetch admin by id' });
  }
};
/**
 * @desc    Create a new admin
 * @route   POST /api/admins
 * @access  Admin only
 */
export const createAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { email, name, clerkId } = req.body;
    if (!email || !name || !clerkId) {
      return res.status(400).json({ error: 'Email, name, and clerkId are required' });
    }
    const newAdmin = await (prisma as any).adminUser.create({
      data: {
        clerkId,
        email,
        name,
        isActive: true,
      },
    });

    res.status(201).json(newAdmin);
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

/**
 * @desc    Update an admin
 * @route   PUT /api/admins/:id
 * @access  Admin only
 */
export const updateAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;
    const { email, name } = req.body;

    const updatedAdmin = await (prisma as any).adminUser.update({
      where: { id },
      data: { email, name, isActive: true },
    });

    res.json(updatedAdmin);
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
};

/**
 * @desc    Delete an admin
 * @route   DELETE /api/admins/:id
 * @access  Admin only
 */
export const deleteAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;

    await (prisma as any).adminUser.delete({
      where: { id },
    });

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
};

/**
 * @desc    Promote a user or organization to admin
 * @route   POST /api/admins/promote
 * @access  Admin only
 */

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admins/stats
 * @access  Admin only
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const [
      totalOrganizations,
      pendingOrganizations,
      approvedOrganizations,
      totalAnnouncements,
      totalBlogs,
      totalSurveys,
      activeSurveys,
      totalEmailSubscribers,
      totalAlerts,
      recentActivity,
      organizationsWithLocation,
      upcomingSurveyDeadlines,
      recentSurveyResponses,

      orgGrowthData,
      subscriptionGrowthData,

      allSurveys,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'PENDING' } }),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),

      prisma.announcements.count(),
      prisma.blog.count(),
      prisma.survey.count(),
      prisma.survey.count({ where: { isActive: true } }),
      prisma.emailSubscription.count(),
      prisma.alert.count(),

      Promise.all([
        prisma.organization.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, createdAt: true, status: true },
        }),
        prisma.announcements.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, createdAt: true },
        }),
        prisma.survey.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, createdAt: true },
        }),
        prisma.blog.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, createdAt: true },
        }),
        prisma.alert.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, createdAt: true },
        }),
      ]),

      prisma.organization.findMany({
        where: {
          status: 'ACTIVE',
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          address: true,
          city: true,
          website: true,
        },
      }),

      prisma.survey.findMany({
        where: {
          isActive: true,
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        select: { id: true, title: true, dueDate: true },
      }),

      prisma.surveyResponse.findMany({
        where: {
          submittedDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        take: 10,
        orderBy: { submittedDate: 'desc' },
        select: {
          id: true,
          submittedDate: true,
          survey: { select: { id: true, title: true } },
          organization: { select: { id: true, name: true } },
        },
      }),

      prisma.organization.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      prisma.emailSubscription.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      prisma.survey.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          _count: {
            select: { surveyResponses: true },
          },
        },
      }),
    ]);

    const aggregateByMonth = (items: { createdAt: Date }[]) => {
      const months: Record<string, number> = {};
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        months[key] = 0;
      }

      items.forEach(item => {
        const date = new Date(item.createdAt);
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (months[key] !== undefined) {
          months[key]++;
        }
      });

      let cumulative = 0;
      return Object.entries(months).map(([month, count]) => {
        cumulative += count;
        return { month, count: cumulative };
      });
    };

    const growthData = {
      organizations: aggregateByMonth(orgGrowthData),
      subscriptions: aggregateByMonth(subscriptionGrowthData),
    };

    const totalActiveOrgs = approvedOrganizations;
    const surveyResponseRates = allSurveys.map((survey: any) => ({
      id: survey.id,
      title: survey.title,
      totalSent: totalActiveOrgs,
      totalResponded: survey._count.surveyResponses,
      responseRate:
        totalActiveOrgs > 0
          ? Math.round((survey._count.surveyResponses / totalActiveOrgs) * 100)
          : 0,
    }));

    const [recentOrgs, recentAnnouncements, recentSurveys, recentBlogs, recentAlerts] =
      recentActivity;
    const formattedActivity = [
      ...recentOrgs.map((org: any) => ({
        id: org.id,
        type: 'organization',
        title: org.name,
        description:
          org.status === 'PENDING' ? 'New registration (pending)' : 'Organization registered',
        createdAt: org.createdAt,
      })),
      ...recentAnnouncements.map((ann: any) => ({
        id: ann.id,
        type: 'announcement',
        title: ann.title,
        description: 'Announcement created',
        createdAt: ann.createdAt,
      })),
      ...recentSurveys.map((survey: any) => ({
        id: survey.id,
        type: 'survey',
        title: survey.title,
        description: 'Survey created',
        createdAt: survey.createdAt,
      })),
      ...recentBlogs.map((blog: any) => ({
        id: blog.id,
        type: 'blog',
        title: blog.title,
        description: 'Blog post created',
        createdAt: blog.createdAt,
      })),
      ...recentAlerts.map((alert: any) => ({
        id: alert.id,
        type: 'alert',
        title: alert.title,
        description: 'Alert created',
        createdAt: alert.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    res.json({
      stats: {
        totalOrganizations,
        pendingOrganizations,
        approvedOrganizations,
        totalAnnouncements,
        totalBlogs,
        totalSurveys,
        activeSurveys,
        totalEmailSubscribers,
        totalAlerts,
      },
      recentActivity: formattedActivity,
      organizationsWithLocation,
      actionItems: {
        pendingOrganizations,
        upcomingSurveyDeadlines: upcomingSurveyDeadlines.map((s: any) => ({
          id: s.id,
          title: s.title,
          endDate: s.dueDate,
        })),
        recentSurveyResponses: recentSurveyResponses.map((r: any) => ({
          id: r.id,
          surveyId: r.survey.id,
          surveyTitle: r.survey.title,
          organizationName: r.organization.name,
          submittedDate: r.submittedDate,
        })),
      },
      growthData,
      surveyResponseRates,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

export const promoteToAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { email, organizationId } = req.body;

    if (!email && !organizationId) {
      return res.status(400).json({ error: 'Either email or organizationId is required' });
    }

    let targetUser;
    let isOrganization = false;

    if (organizationId) {
      targetUser = await (prisma as any).organization.findUnique({
        where: { id: organizationId },
      });
      isOrganization = true;
    } else if (email) {
      targetUser = await (prisma as any).organization.findUnique({
        where: { email },
      });

      if (targetUser) {
        isOrganization = true;
      } else {
        targetUser = await (prisma as any).adminUser.findUnique({
          where: { email },
        });

        if (targetUser) {
          return res.status(400).json({ error: 'User is already an admin' });
        }
      }
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User or organization not found' });
    }

    if (isOrganization) {
      if (!targetUser.clerkId) {
        return res.status(400).json({
          error:
            'Organization must be approved and have an active account before being promoted to admin',
        });
      }

      const newAdmin = await (prisma as any).adminUser.create({
        data: {
          clerkId: targetUser.clerkId,
          email: targetUser.email,
          name: targetUser.name,
          isActive: true,
        },
      });
      await clerkClient.users.updateUser(targetUser.clerkId, {
        publicMetadata: {
          role: 'ADMIN',
          adminUserId: newAdmin.id,
        },
      });
      await (prisma as any).organization.delete({
        where: { id: targetUser.id },
      });

      return res.json({
        message: 'Organization successfully promoted to admin',
        admin: newAdmin,
      });
    }
    return res.status(400).json({ error: 'Unable to promote user' });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ error: 'Failed to promote user to admin' });
  }
};
