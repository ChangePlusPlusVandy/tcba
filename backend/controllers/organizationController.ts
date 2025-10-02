import { Request, Response } from 'express';
import { PrismaClient, OrganizationRole, OrganizationStatus } from '@prisma/client';
import admin from 'firebase-admin';
import { AuthenticatedRequest } from '../types/index.js';

const prisma = new PrismaClient();

/**
 * @desc    Get all organizations with optional search/filter
 * @route   GET /api/organizations?query
 * @access  Admin/Super Admin only
 */
export const getAllOrganizations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, role, city, state, tags } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status as OrganizationStatus;
    }
    if (role) {
      where.role = role as OrganizationRole;
    }
    if (city) {
      where.city = { contains: city as string, mode: 'insensitive' };
    }
    if (state) {
      where.state = { contains: state as string, mode: 'insensitive' };
    }
    if (tags) {
      const tagArray = (tags as string).split(',').map(tag => tag.trim());
      where.tags = {
        hasSome: tagArray,
      };
    }

    const organizations = await prisma.organization.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
};

/**
 * @desc    Register new organization (self-registration)
 * @route   POST /api/organizations/register
 * @access  Public
 */
export const registerOrganization = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      contactPerson,
      contactTitle,
      description,
      website,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      tags,
    } = req.body;

    if (!email || !password || !name || !contactPerson) {
      return res.status(400).json({ error: 'Email, password, name, and contact person are required' });
    }
    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [{ email }, { name }],
      },
    });
    if (existingOrg) {
      return res.status(400).json({ error: 'Organization with this email or name already exists' });
    }
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      displayName: name,
    });
    const newOrg = await prisma.organization.create({
      data: {
        email,
        name,
        contactPerson,
        contactTitle,
        description,
        website,
        address,
        city,
        state,
        zipCode,
        phoneNumber,
        tags: tags || [],
        firebaseUid: firebaseUser.uid,
        role: 'MEMBER',
        status: 'PENDING',
      },
    });
    res.status(201).json(newOrg);
  } catch (error) {
    console.error('Error registering organization:', error);
    res.status(500).json({ error: 'Failed to register organization' });
  }
};

/**
 * @desc    Get organization by ID or current user's profile
 * @route   GET /api/organizations/:id  or  GET /api/organizations/profile
 * @access  Admin/Super Admin or own organization only
 */
export const getOrganizationById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const targetId = id === 'profile' ? currentUser?.id : id;
    if (!targetId) {
      return res.status(401).json({ error: 'Organization not authenticated' });
    }
    if (
      currentUser?.role !== 'ADMIN' &&
      currentUser?.role !== 'SUPER_ADMIN' &&
      currentUser?.id !== targetId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const organization = await prisma.organization.findUnique({
      where: { id: targetId },
    });
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
};

/**
 * @desc    Update organization
 * @route   PUT /api/organizations/:id  or  PUT /api/organizations/profile
 * @access  Admin/Super Admin for any org, or own organization only
 */
export const updateOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const {
      name,
      email,
      description,
      website,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      contactPerson,
      contactTitle,
      tags,
      role,
      status,
    } = req.body;
    const targetId = id === 'profile' ? currentUser?.id : id;

    if (!targetId) {
      return res.status(401).json({ error: 'Organization not authenticated' });
    }
    const isOwnOrg = currentUser?.id === targetId;
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
    if (!isOwnOrg && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (role && currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can change organization roles' });
    }

    if (status && !isAdmin) {
      return res.status(403).json({ error: 'Only admins can change organization status' });
    }
    let updateData: any = {
      name,
      description,
      website,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      contactPerson,
      contactTitle,
      tags,
    };
    if (isAdmin) {
      updateData.role = role;
      updateData.status = status;
    }
    if (email) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          email: email,
          NOT: { id: targetId },
        },
      });
      if (existingOrg) {
        return res.status(400).json({ error: 'Email is already in use by another organization' });
      }
      const currentOrg = await prisma.organization.findUnique({
        where: { id: targetId },
      });
      if (!currentOrg) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      try {
        await admin.auth().updateUser(currentOrg.firebaseUid, {
          email: email,
        });
      } catch (firebaseError: any) {
        console.error('Firebase email update failed:', firebaseError);
        return res.status(400).json({
          error: 'Failed to update email in authentication system',
          details: firebaseError.message,
        });
      }
      updateData.email = email;
    }
    const updatedOrg = await prisma.organization.update({
      where: { id: targetId },
      data: updateData,
    });
    res.json(updatedOrg);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

/**
 * @desc    Delete organization by admin
 * @route   DELETE /api/organizations/:id
 * @access  Admin/Super Admin only
 */
export const deleteOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (currentUser?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own organization' });
    }
    const orgToDelete = await prisma.organization.findUnique({
      where: { id },
    });
    if (!orgToDelete) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    if (orgToDelete.role === 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can delete admin organizations' });
    }
    await prisma.organization.delete({
      where: { id },
    });
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
};
