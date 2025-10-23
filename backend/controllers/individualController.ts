import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';

// Helper: Check if user is admin
const isAdmin = (role?: OrganizationRole) => role === 'ADMIN' || role === 'SUPER_ADMIN';
// Helper: Resolve target ID (profile or explicit ID)
const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);

/**
 * @desc    Get all individuals with optional search/filter
 * @route   GET /api/individuals?query
 * @access  Admin/Super Admin only
 */
export const getAllIndividuals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, isSubscribed } = req.query;
    const where: any = {
      ...(isSubscribed !== undefined && { isSubscribed: isSubscribed === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };
    const individuals = await prisma.individual.findMany({ where, orderBy: { name: 'asc' } });
    res.json(individuals);
  } catch (error) {
    console.error('Error fetching individuals:', error);
    res.status(500).json({ error: 'Failed to fetch individuals' });
  }
};

/**
 * @desc    Register new individual
 * @route   POST /api/individuals/register
 * @access  Public
 */
export const registerIndividual = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, phone, isSubscribed, subscriptionDate } = req.body;
    if (!email || !name || !phone) {
      return res.status(400).json({
        error: 'Email, password, name, and phone are required',
      });
    }
    const existingIndividual = await prisma.individual.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingIndividual)
      return res.status(400).json({ error: 'Individual with this email or phone already exists' });
    const currentTime = new Date();
    const newUser = await prisma.individual.create({
      data: {
        email,
        name,
        phone,
        isSubscribed: isSubscribed || false,
        subscriptionDate: subscriptionDate ? new Date(subscriptionDate) : currentTime,
        createdAt: currentTime,
        updatedAt: currentTime,
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error registering individual:', error);
    res.status(500).json({ error: 'Failed to register individual' });
  }
};

/**
 * @desc    Get individual by ID or profile
 * @route   GET /api/individuals/:id
 * @access  Admin/Super Admin or own organization
 */
export const getIndividualById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetId = resolveTargetId(req.params.id, req.user?.id);
    if (!targetId) return res.status(401).json({ error: 'Individual not authenticated' });
    if (!isAdmin(req.user?.role) && req.user?.id !== targetId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const individual = await prisma.individual.findUnique({ where: { id: targetId } });
    if (!individual) return res.status(404).json({ error: 'Individual not found' });
    res.json(individual);
  } catch (error) {
    console.error('Error fetching individual:', error);
    res.status(500).json({ error: 'Failed to fetch individual' });
  }
};

/**
 * @desc    Update individual
 * @route   PUT /api/individuals/:id
 * @access  Admin/Super Admin or individual
 */
export const updateIndividual = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, phone, isSubscribed, subscriptionDate, ...updateFields } = req.body;
    const targetId = resolveTargetId(req.params.id, req.user?.id);
    if (!targetId) return res.status(401).json({ error: 'User not authenticated' });
    const isOwnUser = req.user?.id === targetId;
    const userIsAdmin = isAdmin(req.user?.role);
    if (!isOwnUser && !userIsAdmin) return res.status(403).json({ error: 'Access denied' });
    if (email) {
      const userExists = await prisma.organization.findFirst({
        where: { email, NOT: { id: targetId } },
      });
      if (userExists)
        return res.status(400).json({ error: 'Email is already in use by another user' });
    }
    const updateData: any = {
      ...updateFields,
      ...(email && { email }),
      ...(name && { name }),
      ...(phone && { phone }),
      ...(isSubscribed !== undefined && { isSubscribed }),
      ...(subscriptionDate && { subscriptionDate: new Date(subscriptionDate) }),
      updatedAt: new Date(),
    };

    const updatedUser = await prisma.individual.update({
      where: { id: targetId },
      data: updateData,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating individual:', error);
    res.status(500).json({ error: 'Failed to update individual' });
  }
};

/**
 * @desc    Delete individual
 * @route   DELETE /api/individuals/:id
 * @access  Admin/Super Admin
 */
export const deleteIndividual = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req.user?.role)) return res.status(403).json({ error: 'Access denied' });

    const userToDelete = await prisma.individual.findUnique({ where: { id } });
    if (!userToDelete) return res.status(404).json({ error: 'User not found' });

    await prisma.individual.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting individual:', error);
    res.status(500).json({ error: 'Failed to delete individual' });
  }
};
