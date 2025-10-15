import { Response } from 'express';
import { OrganizationRole, OrganizationStatus, TennesseeRegion } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { clerkClient } from '../config/clerk.js';
import { prisma } from '../config/prisma.js';

// Helper: Check if user is admin
const isAdmin = (role?: OrganizationRole) => role === 'ADMIN' || role === 'SUPER_ADMIN';
// Helper: Resolve target ID (profile or explicit ID)
const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);

/**
 * @desc    Get all organizations with optional search/filter
 * @route   GET /api/organizations?query
 * @access  Admin/Super Admin only
 */
export const getAllOrganizations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, role, city, state, tags, region, membershipActive, organizationType } =
      req.query;
    const where: any = {
      ...(status && { status: status as OrganizationStatus }),
      ...(role && { role: role as OrganizationRole }),
      ...(city && { city: { contains: city as string, mode: 'insensitive' } }),
      ...(state && { state: { contains: state as string, mode: 'insensitive' } }),
      ...(region && { region: region as TennesseeRegion }),
      ...(membershipActive !== undefined && { membershipActive: membershipActive === 'true' }),
      ...(organizationType && {
        organizationType: { contains: organizationType as string, mode: 'insensitive' },
      }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { primaryContactName: { contains: search as string, mode: 'insensitive' } },
          { primaryContactEmail: { contains: search as string, mode: 'insensitive' } },
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
 * @desc    Register new organization
 * @route   POST /api/organizations/register
 * @access  Public
 */
export const registerOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      membershipDate,
      membershipRenewalDate,
      membershipActive,
      tags,
    } = req.body;
    if (
      !email ||
      !password ||
      !name ||
      !primaryContactName ||
      !primaryContactEmail ||
      !primaryContactPhone
    ) {
      return res
        .status(400)
        .json({
          error:
            'Email, password, name, and primary contact information (name, email, phone) are required',
        });
    }
    const existingOrg = await prisma.organization.findFirst({
      where: { OR: [{ email }, { name }] },
    });
    if (existingOrg)
      return res.status(400).json({ error: 'Organization with this email or name already exists' });
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      publicMetadata: { organizationName: name, role: 'MEMBER' },
    });
    const newOrg = await prisma.organization.create({
      data: {
        ...req.body,
        membershipActive: membershipActive || false,
        membershipDate: membershipDate ? new Date(membershipDate) : null,
        membershipRenewalDate: membershipRenewalDate ? new Date(membershipRenewalDate) : null,
        tags: tags || [],
        clerkId: clerkUser.id,
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
    if (role && req.user?.role !== 'SUPER_ADMIN')
      return res.status(403).json({ error: 'Only super admins can change organization roles' });
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
        return res
          .status(400)
          .json({
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
 * @desc    Delete organization
 * @route   DELETE /api/organizations/:id
 * @access  Admin/Super Admin only
 */
export const deleteOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!isAdmin(req.user?.role)) return res.status(403).json({ error: 'Access denied' });
    if (req.user?.id === id)
      return res.status(400).json({ error: 'Cannot delete your own organization' });
    const orgToDelete = await prisma.organization.findUnique({ where: { id } });
    if (!orgToDelete) return res.status(404).json({ error: 'Organization not found' });
    if (orgToDelete.role === 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can delete admin organizations' });
    }
    await prisma.organization.delete({ where: { id } });
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
};
