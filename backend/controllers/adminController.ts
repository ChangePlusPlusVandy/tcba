import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { clerkClient } from '../config/clerk.js';
import { prisma } from '../config/prisma.js';

const isSuperAdmin = (isSuperAdmin?: boolean) => isSuperAdmin === true;

/**
 * @desc    Get all admins
 * @route   GET /api/admins
 * @access  Super Admin only
 */
export const getAllAdmins = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if the current user is a super admin
    // First, we need to get the admin user from the database using the clerkId
    const currentAdmin = await (prisma as any).adminUser.findUnique({
      where: { clerkId: req.user?.clerkId || '' },
    });

    if (!currentAdmin || !currentAdmin.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
    }

    const { email, name, isSuperAdmin, isActive } = req.query;
    const where: any = {
      ...(email && { email: { contains: email as string, mode: 'insensitive' } }),
      ...(name && { name: { contains: name as string, mode: 'insensitive' } }),
      ...(isSuperAdmin !== undefined && { isSuperAdmin: isSuperAdmin === 'true' }),
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
 * @access  Super Admin only
 */
export const getAdminById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if the current user is a super admin
    const currentAdmin = await (prisma as any).adminUser.findUnique({
      where: { clerkId: req.user?.clerkId || '' },
    });

    if (!currentAdmin || !currentAdmin.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
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
 * @access  Super Admin only
 */
export const createAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if the current user is a super admin
    const currentAdmin = await (prisma as any).adminUser.findUnique({
      where: { clerkId: req.user?.clerkId || '' },
    });

    if (!currentAdmin || !currentAdmin.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
    }

    const { email, name, isSuperAdmin, clerkId } = req.body;

    // Validate required fields
    if (!email || !name || !clerkId) {
      return res.status(400).json({ error: 'Email, name, and clerkId are required' });
    }

    // Create the new admin user
    const newAdmin = await (prisma as any).adminUser.create({
      data: {
        clerkId,
        email,
        name,
        isSuperAdmin: isSuperAdmin || false,
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
 * @access  Super Admin only
 */
export const updateAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if the current user is a super admin
    const currentAdmin = await (prisma as any).adminUser.findUnique({
      where: { clerkId: req.user?.clerkId || '' },
    });
    if (!currentAdmin || !currentAdmin.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
    }

    const { id } = req.params;
    const { email, name, isSuperAdmin } = req.body;

    const updatedAdmin = await (prisma as any).adminUser.update({
      where: { id },
      data: { email, name, isSuperAdmin: isSuperAdmin || false, isActive: true },
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
 * @access  Super Admin only
 */
export const deleteAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if the current user is a super admin
    const currentAdmin = await (prisma as any).adminUser.findUnique({
      where: { clerkId: req.user?.clerkId || '' },
    });

    if (!currentAdmin || !currentAdmin.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
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
