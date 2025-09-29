// Organization management controller for coalition platform
// Handles CRUD operations for the 45+ nonprofit organizations in the coalition
import { Request, Response } from 'express';
import { PrismaClient, OrganizationRole, OrganizationStatus } from '@prisma/client';
import crypto from 'crypto'; // For generating secure invitation tokens
import admin from 'firebase-admin'; // Firebase Auth - handles passwords
import {
  CreateOrganizationInput,
  UpdateOrganizationProfileInput,
  UpdateOrganizationInput,
  GetOrganizationsQuery,
  OrganizationPublic,
  PaginatedOrganizationsResponse,
  OrganizationActivityResponse
} from '../types';
// TODO: Implement email service

const prisma = new PrismaClient();

// Extended request type with authenticated organization info
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firebaseUid: string; // Links to Firebase Auth
    role: OrganizationRole;
    email: string;
    name: string;
  };
}

// @desc    Get all organizations with pagination and filtering
// @route   GET /api/organizations
// @access  Admin/Super Admin only
export const getAllOrganizations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Extract query parameters for filtering and pagination
    const { page = 1, limit = 10, role, status, city, state, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic where clause based on filters
    const where: any = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (city) where.city = city;
    if (state) where.state = state;
    if (search) {
      // Search across organization name, contact person, and email
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [organizations, totalCount] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.organization.count({ where })
    ]);

    // Remove sensitive data and format as OrganizationPublic
    const sanitizedOrgs: OrganizationPublic[] = organizations.map(org => ({
      id: org.id,
      name: org.name,
      email: org.email,
      description: org.description,
      website: org.website,
      address: org.address,
      city: org.city,
      state: org.state,
      zipCode: org.zipCode,
      phoneNumber: org.phoneNumber,
      contactPerson: org.contactPerson,
      contactTitle: org.contactTitle,
      role: org.role,
      status: org.status,
      tags: org.tags,
      joinedAt: org.joinedAt,
      updatedAt: org.updatedAt
    }));

    const response: PaginatedOrganizationsResponse = {
      organizations: sanitizedOrgs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
};

// @desc    Get organization by ID
// @route   GET /api/organizations/:id
// @access  Admin/Super Admin or own organization only
export const getOrganizationById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check if organization can access this profile
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN' && currentUser?.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeOrg } = organization;

    res.json(safeOrg);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
};

// @desc    Get current authenticated organization's profile
// @route   GET /api/organizations/profile
// @access  Private (own organization only)
export const getCurrentOrganizationProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.id;

    if (!orgId) {
      return res.status(401).json({ error: 'Organization not authenticated' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeOrg } = organization;

    res.json(safeOrg);
  } catch (error) {
    console.error('Error fetching current organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization profile' });
  }
};

// @desc    Update organization's own profile (self-service)
// @route   PUT /api/organizations/profile
// @access  Private (own organization only)
export const updateOrganizationProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.id;
    const input = req.body as UpdateOrganizationProfileInput;
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
      tags
    } = input;

    if (!orgId) {
      return res.status(401).json({ error: 'Organization not authenticated' });
    }

    // Handle email updates (requires Firebase Auth integration)
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
      updatedAt: new Date()
    };

    if (email) {
      // Check if email already exists for another organization
      const existingOrg = await prisma.organization.findFirst({
        where: {
          email: email,
          NOT: { id: orgId } // Exclude current organization
        }
      });

      if (existingOrg) {
        return res.status(400).json({ error: 'Email is already in use by another organization' });
      }

      // Get current organization to access firebaseUid
      const currentOrg = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { firebaseUid: true, email: true }
      });

      if (!currentOrg) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Update Firebase Auth user email
      try {
        await admin.auth().updateUser(currentOrg.firebaseUid, {
          email: email
        });
      } catch (firebaseError: any) {
        console.error('Firebase email update failed:', firebaseError);
        return res.status(400).json({
          error: 'Failed to update email in authentication system',
          details: firebaseError.message
        });
      }

      // Add email to update data and reset email verification
      updateData.email = email;
      updateData.emailVerified = false; // Require re-verification after email change
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: updateData
    });

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeOrg } = updatedOrg;

    res.json(safeOrg);
  } catch (error) {
    console.error('Error updating organization profile:', error);
    res.status(500).json({ error: 'Failed to update organization profile' });
  }
};

// @desc    Update any organization by admin
// @route   PUT /api/organizations/:id
// @access  Admin/Super Admin only
export const updateOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const input = req.body as UpdateOrganizationInput;
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
      isActive
    } = input;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only SUPER_ADMIN can change roles or create other admins
    if (role && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can change organization roles' });
    }

    // Handle email updates (requires Firebase Auth integration)
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
      role,
      status,
      isActive,
      updatedAt: new Date()
    };

    if (email) {
      // Check if email already exists for another organization
      const existingOrg = await prisma.organization.findFirst({
        where: {
          email: email,
          NOT: { id: id } // Exclude current organization
        }
      });

      if (existingOrg) {
        return res.status(400).json({ error: 'Email is already in use by another organization' });
      }

      // Get current organization to access firebaseUid
      const currentOrg = await prisma.organization.findUnique({
        where: { id },
        select: { firebaseUid: true, email: true }
      });

      if (!currentOrg) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Update Firebase Auth user email
      try {
        await admin.auth().updateUser(currentOrg.firebaseUid, {
          email: email
        });
      } catch (firebaseError: any) {
        console.error('Firebase email update failed:', firebaseError);
        return res.status(400).json({
          error: 'Failed to update email in authentication system',
          details: firebaseError.message
        });
      }

      // Add email to update data and reset email verification
      updateData.email = email;
      updateData.emailVerified = false; // Require re-verification after email change
    }

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: updateData
    });

    // Remove sensitive data (inviteToken if present)
    const { inviteToken, inviteTokenExp, ...safeOrg } = updatedOrg;

    res.json(safeOrg);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

// @desc    Delete organization by admin
// @route   DELETE /api/organizations/:id
// @access  Admin/Super Admin only (cannot delete own organization)
export const deleteOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent self-deletion
    if (currentUser.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own organization' });
    }

    // Check if organization exists
    const orgToDelete = await prisma.organization.findUnique({
      where: { id }
    });

    if (!orgToDelete) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Only SUPER_ADMIN can delete other admins
    if (orgToDelete.role === 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can delete admin organizations' });
    }

    await prisma.organization.delete({
      where: { id }
    });

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
};

// @desc    Invite new organization to join the coalition
// @route   POST /api/organizations/invite
// @access  Admin/Super Admin only
export const inviteOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = req.body as CreateOrganizationInput;
    const {
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
      tags,
      role = 'MEMBER'
    } = input;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only SUPER_ADMIN can invite admins
    if (role === 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can invite admin organizations' });
    }

    // Check if organization already exists in our database
    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { email },
          { name }
        ]
      }
    });

    if (existingOrg) {
      return res.status(400).json({ error: 'Organization with this email or name already exists' });
    }

    // Generate secure tokens for invitation process
    const tempPassword = crypto.randomBytes(12).toString('hex'); // Temporary password
    const inviteToken = crypto.randomBytes(32).toString('hex');   // For setup link

    try {
      // Step 1: Create organization in Firebase Auth (handles password securely)
      const firebaseUser = await admin.auth().createUser({
        email,
        password: tempPassword,
        emailVerified: false,
        displayName: name
      });

      // Step 2: Create organization record in our database (linked to Firebase)
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
          role: role as OrganizationRole,
          status: 'PENDING' as OrganizationStatus,
          inviteToken,
          inviteTokenExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // TODO: Send invitation email with temp password and setup link
      console.log('TODO: Send invitation email to:', email, 'for organization:', name, 'with temp password:', tempPassword);

      // Remove sensitive data
      const { inviteToken: token, inviteTokenExp, ...safeOrg } = newOrg;

      res.status(201).json({
        ...safeOrg,
        message: 'Organization invited successfully. They will receive setup instructions via email.'
      });

    } catch (firebaseError) {
      console.error('Error creating Firebase user:', firebaseError);
      res.status(500).json({ error: 'Failed to create organization account' });
    }

  } catch (error) {
    console.error('Error inviting organization:', error);
    res.status(500).json({ error: 'Failed to invite organization' });
  }
};

// @desc    Get organization activity and audit log
// @route   GET /api/organizations/:id/activity
// @access  Admin/Super Admin only
export const getOrganizationActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check permissions
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        contactPerson: true,
        lastLoginAt: true,
        joinedAt: true,
        updatedAt: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // TODO: Add audit log model and fetch actual activity data
    // For now, return basic activity info
    const activity: OrganizationActivityResponse = {
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        contactPerson: organization.contactPerson
      },
      lastLogin: organization.lastLoginAt,
      accountCreated: organization.joinedAt,
      lastUpdated: organization.updatedAt
      // TODO: Add vote history, survey responses, etc.
    };

    res.json(activity);
  } catch (error) {
    console.error('Error fetching organization activity:', error);
    res.status(500).json({ error: 'Failed to fetch organization activity' });
  }
};