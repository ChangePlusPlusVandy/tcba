import { Response } from 'express';
import {
  OrganizationRole,
  OrganizationStatus,
  TennesseeRegion,
  OrganizationSize,
} from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { clerkClient } from '../config/clerk.js';
import { prisma } from '../config/prisma.js';
import { sendWelcomeEmail } from './notificationController.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';
const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);

/**
 * @desc    Get all organizations with optional search/filter
 * @route   GET /api/organizations?query
 * @access  Admin/Super Admin only
 */
export const getAllOrganizations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      status,
      role,
      city,
      state,
      tags,
      region,
      membershipActive,
      organizationType,
      organizationSize,
    } = req.query;
    const where: any = {
      ...(status && { status: status as OrganizationStatus }),
      ...(role && { role: role as OrganizationRole }),
      ...(city && { city: { contains: city as string, mode: 'insensitive' } }),
      ...(state && { state: { contains: state as string, mode: 'insensitive' } }),
      ...(region && { region: region as TennesseeRegion }),
      ...(organizationSize && { organizationSize: organizationSize as OrganizationSize }),
      ...(membershipActive !== undefined && { membershipActive: membershipActive === 'true' }),
      ...(organizationType && {
        organizationType: { contains: organizationType as string, mode: 'insensitive' },
      }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { primaryContactName: { contains: search as string, mode: 'insensitive' } },
          { primaryContactEmail: { contains: search as string, mode: 'insensitive' } },
          { secondaryContactName: { contains: search as string, mode: 'insensitive' } },
          { secondaryContactEmail: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
      ...(tags && { tags: { hasSome: (tags as string).split(',').map(tag => tag.trim()) } }),
    };
    const organizations = await prisma.organization.findMany({ where, orderBy: { name: 'asc' } });
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
};

/**
 * @desc    Register new organization (creates PENDING org, no Clerk user yet)
 * @route   POST /api/organizations/register
 * @access  Public
 */
export const registerOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      email,
      name,
      description,
      website,
      address,
      city,
      zipCode,
      latitude,
      longitude,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      secondaryContactName,
      secondaryContactEmail,
      region,
      organizationType,
      organizationSize,
      tags,
      additionalNotes,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Organization name and email are required',
      });
    }

    const existingOrg = await prisma.organization.findFirst({
      where: { OR: [{ name }] },
    });
    if (existingOrg) {
      return res.status(400).json({ error: 'Organization with this name already exists' });
    }

    const tempClerkId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newOrg = await prisma.organization.create({
      data: {
        clerkId: tempClerkId,
        email,
        name,
        description: additionalNotes || description || null,
        website: website || null,
        address: address || null,
        city: city || null,
        zipCode: zipCode || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        primaryContactName: '',
        primaryContactEmail: '',
        primaryContactPhone: primaryContactPhone || '',
        secondaryContactName: null,
        secondaryContactEmail: null,
        region: region || null,
        organizationType: organizationType || null,
        organizationSize: organizationSize || null,
        membershipActive: false,
        membershipDate: null,
        membershipRenewalDate: null,
        tags: tags || [],
        role: 'MEMBER',
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Application submitted successfully. A TCBA administrator will review your request.',
      organization: newOrg,
    });
  } catch (error) {
    console.error('Error registering organization:', error);
    res.status(500).json({ error: 'Failed to register organization' });
  }
};

/**
 * @desc    Get organization by ID or profile
 * @route   GET /api/organizations/:id
 * @access  Admin/Super Admin or own organization
 */
export const getOrganizationById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetId = resolveTargetId(req.params.id, req.user?.id);
    if (!targetId) return res.status(401).json({ error: 'Organization not authenticated' });
    if (!isAdmin(req.user?.role) && req.user?.id !== targetId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const organization = await prisma.organization.findUnique({ where: { id: targetId } });
    if (!organization) return res.status(404).json({ error: 'Organization not found' });
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
};

/**
 * @desc    Update organization
 * @route   PUT /api/organizations/:id
 * @access  Admin/Super Admin or own organization
 */
export const updateOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      email,
      role,
      status,
      membershipDate,
      membershipRenewalDate,
      password,
      ...updateFields
    } = req.body;
    const targetId = resolveTargetId(req.params.id, req.user?.id);
    if (!targetId) return res.status(401).json({ error: 'Organization not authenticated' });
    const isOwnOrg = req.user?.id === targetId;
    const userIsAdmin = isAdmin(req.user?.role);
    if (!isOwnOrg && !userIsAdmin) return res.status(403).json({ error: 'Access denied' });
    if (role && !userIsAdmin)
      return res.status(403).json({ error: 'Only admins can change organization roles' });
    if (status && !userIsAdmin)
      return res.status(403).json({ error: 'Only admins can change organization status' });
    const updateData: any = {
      ...updateFields,
      ...(membershipDate && { membershipDate: new Date(membershipDate) }),
      ...(membershipRenewalDate && { membershipRenewalDate: new Date(membershipRenewalDate) }),
      ...(userIsAdmin && role && { role }),
      ...(userIsAdmin && status && { status }),
    };
    if (email) {
      const existingOrg = await prisma.organization.findFirst({
        where: { email, NOT: { id: targetId } },
      });
      if (existingOrg)
        return res.status(400).json({ error: 'Email is already in use by another organization' });
      const currentOrg = await prisma.organization.findUnique({ where: { id: targetId } });
      if (!currentOrg) return res.status(404).json({ error: 'Organization not found' });
      try {
        await clerkClient.users.updateUser(currentOrg.clerkId, { externalId: email });
      } catch (clerkError: any) {
        console.error('Clerk email update failed:', clerkError);
        return res.status(400).json({
          error: 'Failed to update email in authentication system',
          details: clerkError.message,
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
 * @desc    Approve pending organization (creates Clerk user with generated password)
 * @route   PUT /api/organizations/:id/approve
 * @access  Admin only
 */
export const approveOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.status !== 'PENDING') {
      return res.status(400).json({ error: 'Organization is not in pending status' });
    }

    const generatePassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const generatedPassword = generatePassword();

    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [org.email],
      password: generatedPassword,
      firstName: org.name.split(' ')[0] || org.name,
      lastName: org.name.split(' ').slice(1).join(' ') || '',
      publicMetadata: {
        organizationName: org.name,
        role: org.role || 'MEMBER',
        organizationId: org.id,
      },
    });

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: {
        clerkId: clerkUser.id,
        status: 'ACTIVE',
        membershipActive: true,
        membershipDate: new Date(),
      },
    });
    try {
      await sendWelcomeEmail(org.email, org.name, generatedPassword);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    res.json({
      message: 'Organization approved successfully and welcome email sent',
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error approving organization:', error);
    res.status(500).json({ error: 'Failed to approve organization' });
  }
};

/**
 * @desc    Decline pending organization request
 * @route   PUT /api/organizations/:id/decline
 * @access  Admin only
 */
export const declineOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending organizations can be declined' });
    }

    await prisma.organization.delete({ where: { id } });

    res.json({ message: 'Organization request declined and removed' });
  } catch (error) {
    console.error('Error declining organization:', error);
    res.status(500).json({ error: 'Failed to decline organization' });
  }
};

/**
 * @desc    Archive organization (set status to INACTIVE)
 * @route   PUT /api/organizations/:id/archive
 * @access  Admin only
 */
export const archiveOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.status === 'INACTIVE') {
      return res.status(400).json({ error: 'Organization is already archived' });
    }

    if (org.status === 'PENDING') {
      return res
        .status(400)
        .json({ error: 'Cannot archive pending organizations. Use decline instead.' });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        membershipActive: false,
      },
    });

    res.json({
      message: 'Organization archived successfully',
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error archiving organization:', error);
    res.status(500).json({ error: 'Failed to archive organization' });
  }
};

/**
 * @desc    Unarchive organization (set status to ACTIVE)
 * @route   PUT /api/organizations/:id/unarchive
 * @access  Admin only
 */
export const unarchiveOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.status !== 'INACTIVE') {
      return res.status(400).json({ error: 'Only archived organizations can be unarchived' });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        membershipActive: true,
      },
    });

    res.json({
      message: 'Organization unarchived successfully',
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error unarchiving organization:', error);
    res.status(500).json({ error: 'Failed to unarchive organization' });
  }
};

/**
 * @desc    Delete organization
 * @route   DELETE /api/organizations/:id
 * @access  Admin only
 */
export const deleteOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!isAdmin(req.user?.role)) return res.status(403).json({ error: 'Admin access required' });

    const orgToDelete = await prisma.organization.findUnique({ where: { id } });
    if (!orgToDelete) return res.status(404).json({ error: 'Organization not found' });

    if (orgToDelete.clerkId) {
      try {
        console.log(`Attempting to delete Clerk user with ID: ${orgToDelete.clerkId}`);
        await clerkClient.users.deleteUser(orgToDelete.clerkId);
        console.log(`Successfully deleted Clerk user: ${orgToDelete.clerkId}`);
      } catch (clerkError: any) {
        console.error('Error deleting Clerk user:', {
          clerkId: orgToDelete.clerkId,
          error: clerkError.message,
          status: clerkError.status,
          details: clerkError,
        });
      }
    } else {
      console.log('Organization has no Clerk account (clerkId is null), skipping Clerk deletion');
    }

    await prisma.organization.delete({ where: { id } });
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
};
