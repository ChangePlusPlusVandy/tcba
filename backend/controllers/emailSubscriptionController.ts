import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';

// Helper: Check if user is admin
const isAdmin = (role?: OrganizationRole) => role === 'ADMIN' || role === 'SUPER_ADMIN';
// Helper: Resolve target ID (profile or explicit ID)
const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);

/**
 * @desc    Get all subscriptions with optional search/filter
 * @route   GET /api/subscriptions?query
 * @access  Admin/Super Admin only
 */
export const getAllSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { search, isActive } = req.query;
    const where: any = {
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };
    const subscriptions = await prisma.emailSubscription.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
};

/**
 * @desc    Register new subscription
 * @route   POST /api/subscriptions/register
 * @access  Public
 */
export const registerSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, subscriptionTypes, isActive } = req.body;
    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required',
      });
    }
    const existingSub = await prisma.emailSubscription.findFirst({
      where: { email },
    });
    if (existingSub)
      return res.status(400).json({ error: 'Subscription with this email already exists' });
    // const currentTime = new Date();
    const newSub = await prisma.emailSubscription.create({
      data: {
        email,
        name,
        isActive,
        subscriptionTypes: subscriptionTypes || [],
        // createdAt: currentTime,
        // updatedAt: currentTime,
      },
    });
    res.status(201).json(newSub);
  } catch (error) {
    console.error('Error registering subscription:', error);
    res.status(500).json({ error: 'Failed to register subscription' });
  }
};

/**
 * @desc    Get subscription by ID or profile
 * @route   GET /api/subscriptions/:id
 * @access  Admin/Super Admin
 */
export const getSubscriptionById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const subscription = await prisma.emailSubscription.findUnique({
      where: { id: req.params.id },
    });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

/**
 * @desc    Update subscription
 * @route   PUT /api/subscriptions/:id
 * @access  Public
 */
export const updateSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, subscriptionTypes, isActive, ...updateFields } = req.body;
    const { id } = req.params;

    if (email) {
      const subExists = await prisma.emailSubscription.findFirst({
        where: { email, NOT: { id } },
      });
      if (subExists) {
        return res.status(400).json({ error: 'Email is already in use by another subscription' });
      }
    }
    const updateData: any = {
      ...updateFields,
      ...(email && { email }),
      ...(name && { name }),
      ...(subscriptionTypes && { subscriptionTypes }),
      ...(isActive !== undefined && { isActive }),
      //   updatedAt: new Date(),
    };

    const updatedSub = await prisma.emailSubscription.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedSub);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};

/**
 * @desc    Delete subscription
 * @route   DELETE /api/subscriptions/:id
 * @access  Admin/Super Admin
 */
export const deleteSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req.user?.role)) return res.status(403).json({ error: 'Access denied' });

    const subToChange = await prisma.emailSubscription.findUnique({ where: { id } });
    if (!subToChange) return res.status(404).json({ error: 'Subscription not found' });

    await prisma.emailSubscription.delete({ where: { id } });
    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
};
