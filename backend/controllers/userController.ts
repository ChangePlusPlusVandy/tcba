import { Request, Response } from 'express';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import crypto from 'crypto';
import admin from 'firebase-admin';
// TODO: Implement email service

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firebaseUid: string;
    role: UserRole;
    organizationId?: string;
    email: string;
  };
}

// Get all users (admin only)
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, role, status, organizationId, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              tags: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { inviteToken, inviteTokenExp, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      users: sanitizedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check if user can access this profile
    if (currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN && currentUser?.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            tags: true,
            city: true,
            state: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeUser } = user;

    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Get current user profile
export const getCurrentUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            tags: true,
            city: true,
            state: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeUser } = user;

    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, title, phoneNumber, profilePicture } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        title,
        phoneNumber,
        profilePicture,
        updatedAt: new Date()
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            tags: true
          }
        }
      }
    });

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeUser } = updatedUser;

    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
};

// Update user (admin only)
export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, status, title, phoneNumber, organizationId } = req.body;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only SUPER_ADMIN can change roles or create other admins
    if (role && currentUser.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Only super admins can change user roles' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        role,
        status,
        title,
        phoneNumber,
        organizationId,
        updatedAt: new Date()
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            tags: true
          }
        }
      }
    });

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeUser } = updatedUser;

    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent self-deletion
    if (currentUser.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only SUPER_ADMIN can delete other admins
    if (userToDelete.role === UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Only super admins can delete admin users' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Invite new user (admin only) - Firebase version
export const inviteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, firstName, lastName, organizationId, role = 'MEMBER' } = req.body;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only SUPER_ADMIN can invite admins
    if (role === 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can invite admin users' });
    }

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate temporary password for Firebase
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const inviteToken = crypto.randomBytes(32).toString('hex');

    try {
      // Create user in Firebase
      const firebaseUser = await admin.auth().createUser({
        email,
        password: tempPassword,
        emailVerified: false,
        displayName: `${firstName} ${lastName}`
      });

      // Create user in our database
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          firebaseUid: firebaseUser.uid,
          role: role as UserRole,
          status: 'PENDING' as UserStatus,
          organizationId,
          inviteToken,
          inviteTokenExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // TODO: Send invitation email with temp password and setup link
      console.log('TODO: Send invitation email to:', email, 'with temp password:', tempPassword);

      // Remove sensitive data
      const { inviteToken: token, inviteTokenExp, ...safeUser } = newUser;

      res.status(201).json({
        ...safeUser,
        message: 'User invited successfully. They will receive setup instructions via email.'
      });

    } catch (firebaseError) {
      console.error('Error creating Firebase user:', firebaseError);
      res.status(500).json({ error: 'Failed to create user account' });
    }

  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
};

// Assign user to organization (admin only)
export const assignUserToOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.body;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        organizationId,
        updatedAt: new Date()
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            tags: true
          }
        }
      }
    });

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeUser } = updatedUser;

    res.json(safeUser);
  } catch (error) {
    console.error('Error assigning user to organization:', error);
    res.status(500).json({ error: 'Failed to assign user to organization' });
  }
};

// Get user activity log (admin only)
export const getUserActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // TODO: Add audit log model and fetch actual activity data
    // For now, return basic activity info
    const activity = {
      user,
      lastLogin: user.lastLoginAt,
      accountCreated: user.createdAt,
      lastUpdated: user.updatedAt,
      // TODO: Add vote history, survey responses, etc.
    };

    res.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};