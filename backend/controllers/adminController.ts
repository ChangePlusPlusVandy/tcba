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
