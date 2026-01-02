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
import {
  sendWelcomeEmail,
  sendRejectionEmail,
  sendDeletionEmail,
} from './notificationController.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, sesConfig } from '../config/aws-ses.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';
const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);

/**
 * @desc    Get organizations visible in directory (for org panel)
 * @route   GET /api/organizations/directory
 * @access  Authenticated organizations
 */
export const getDirectoryOrganizations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        status: 'ACTIVE',
        visibleInDirectory: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        description: true,
        website: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        primaryContactName: true,
        primaryContactEmail: true,
        primaryContactPhone: true,
        secondaryContactName: true,
        secondaryContactEmail: true,
        region: true,
        organizationType: true,
        organizationSize: true,
        status: true,
        tags: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(organizations);
  } catch (error) {
    console.error('Error fetching directory organizations:', error);
    res.status(500).json({ error: 'Failed to fetch directory organizations' });
  }
};

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
      state,
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

    console.log('[Registration] Received data:', {
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      secondaryContactName,
      secondaryContactEmail,
    });

    if (!name || !email) {
      return res.status(400).json({
        error: 'Organization name and email are required',
      });
    }

    if (!primaryContactName || !primaryContactEmail || !primaryContactPhone) {
      return res.status(400).json({
        error: 'Primary contact information (name, email, phone) is required',
      });
    }

    if (!organizationSize) {
      return res.status(400).json({
        error: 'Organization size is required',
      });
    }

    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [{ name }, { email }],
      },
    });
    if (existingOrg) {
      if (existingOrg.email === email) {
        return res.status(400).json({ error: 'An organization with this email already exists' });
      }
      if (existingOrg.name === name) {
        return res.status(400).json({ error: 'Organization with this name already exists' });
      }
    }

    const tempClerkId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Auto-geocode address if lat/lng not provided
    let finalLatitude = latitude ? parseFloat(latitude) : null;
    let finalLongitude = longitude ? parseFloat(longitude) : null;

    if (!finalLatitude && !finalLongitude && (address || city)) {
      try {
        const fullAddress = `${address || ''}, ${city || ''}, ${zipCode || ''}, Tennessee`.trim();
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (apiKey) {
          console.log('[Registration] Geocoding address:', fullAddress);
          const encodedAddress = encodeURIComponent(fullAddress);
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

          const response = await fetch(geocodeUrl);
          const data: any = await response.json();

          if (data.status === 'OK' && data.results.length > 0) {
            finalLatitude = data.results[0].geometry.location.lat;
            finalLongitude = data.results[0].geometry.location.lng;
            console.log('[Registration] ✓ Geocoded to:', finalLatitude, finalLongitude);
          } else {
            console.log('[Registration] Geocoding failed:', data.status);
          }
        }
      } catch (geocodeError) {
        console.error('[Registration] Geocoding error:', geocodeError);
        // Continue without coordinates if geocoding fails
      }
    }

    const newOrg = await prisma.organization.create({
      data: {
        clerkId: tempClerkId,
        email,
        name,
        description: additionalNotes || description || null,
        website: website || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        latitude: finalLatitude,
        longitude: finalLongitude,
        primaryContactName: primaryContactName || '',
        primaryContactEmail: primaryContactEmail || '',
        primaryContactPhone: primaryContactPhone || '',
        secondaryContactName: secondaryContactName || null,
        secondaryContactEmail: secondaryContactEmail || null,
        region: region || null,
        organizationType: organizationType || null,
        organizationSize: organizationSize,
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
      id,
      clerkId,
      createdAt,
      updatedAt,
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

    if (updateData.region) {
      updateData.region = updateData.region.toUpperCase();
    }

    if (updateData.organizationSize) {
      updateData.organizationSize = updateData.organizationSize.toUpperCase().replace(/ /g, '_');
    }

    if (updateFields.address || updateFields.city || updateFields.zipCode) {
      const currentOrg = await prisma.organization.findUnique({ where: { id: targetId } });
      if (!currentOrg) return res.status(404).json({ error: 'Organization not found' });

      const newAddress = updateFields.address ?? currentOrg.address;
      const newCity = updateFields.city ?? currentOrg.city;
      const newZipCode = updateFields.zipCode ?? currentOrg.zipCode;

      if (newAddress || newCity) {
        try {
          const fullAddress =
            `${newAddress || ''}, ${newCity || ''}, ${newZipCode || ''}, Tennessee`.trim();
          const apiKey = process.env.GOOGLE_MAPS_API_KEY;

          if (apiKey) {
            console.log('[Update] Geocoding address:', fullAddress);
            const encodedAddress = encodeURIComponent(fullAddress);
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

            const response = await fetch(geocodeUrl);
            const data: any = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
              updateData.latitude = data.results[0].geometry.location.lat;
              updateData.longitude = data.results[0].geometry.location.lng;
              console.log('[Update] ✓ Geocoded to:', updateData.latitude, updateData.longitude);
            } else {
              console.log('[Update] Geocoding failed:', data.status);
            }
          }
        } catch (geocodeError) {
          console.error('[Update] Geocoding error:', geocodeError);
        }
      }
    }

    if (email) {
      const currentOrg = await prisma.organization.findUnique({ where: { id: targetId } });
      if (!currentOrg) return res.status(404).json({ error: 'Organization not found' });

      if (email !== currentOrg.email) {
        const existingOrg = await prisma.organization.findFirst({
          where: { email, NOT: { id: targetId } },
        });
        if (existingOrg)
          return res.status(400).json({ error: 'Email is already in use by another organization' });

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
    console.log('[APPROVE] Starting approval for organization:', id);

    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      console.log('[APPROVE] Organization not found:', id);
      return res.status(404).json({ error: 'Organization not found' });
    }

    console.log('[APPROVE] Organization details:', {
      name: org.name,
      email: org.email,
      status: org.status,
      organizationSize: org.organizationSize,
    });

    if (org.status !== 'PENDING') {
      console.log('[APPROVE] Organization is not pending, status:', org.status);
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
    console.log('[APPROVE] Generated password for new user');

    // Check if email already exists in Clerk
    console.log('[APPROVE] Checking if email already exists in Clerk...');
    try {
      const existingClerkUsers = await clerkClient.users.getUserList({
        emailAddress: [org.email],
      });
      if (existingClerkUsers.data && existingClerkUsers.data.length > 0) {
        console.log('[APPROVE] Email already exists in Clerk');
        return res.status(400).json({
          error:
            'This email is already registered in the system. If this organization was previously deleted, please contact support.',
        });
      }
    } catch (clerkCheckError) {
      console.error('[APPROVE] Error checking Clerk for existing email:', clerkCheckError);
      // Continue anyway - the create will fail if it exists
    }

    console.log('[APPROVE] Creating Clerk user...');
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.createUser({
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
      console.log('[APPROVE] Clerk user created successfully:', clerkUser.id);
    } catch (clerkError: any) {
      console.error('[APPROVE] Clerk user creation failed:', {
        error: clerkError?.message,
        status: clerkError?.status,
        clerkTraceId: clerkError?.clerkTraceId,
        errors: clerkError?.errors,
      });
      return res.status(500).json({
        error: 'Failed to create user account',
        details: clerkError?.errors?.[0]?.message || clerkError?.message || 'Unknown Clerk error',
      });
    }

    console.log('[APPROVE] Updating organization in database...');
    let updatedOrg;
    try {
      updatedOrg = await prisma.organization.update({
        where: { id },
        data: {
          clerkId: clerkUser.id,
          status: 'ACTIVE',
          membershipActive: true,
          membershipDate: new Date(),
          // Set default organizationSize if null (for legacy pending orgs)
          organizationSize: org.organizationSize || 'MEDIUM',
        },
      });
      console.log('[APPROVE] Organization updated successfully');
    } catch (dbError: any) {
      console.error('[APPROVE] Database update failed:', {
        error: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta,
      });
      return res.status(500).json({
        error: 'Failed to update organization',
        details: dbError?.message || 'Unknown database error',
      });
    }

    console.log('[APPROVE] Sending welcome email...');
    try {
      await sendWelcomeEmail(org.email, org.name, generatedPassword);
      console.log('[APPROVE] Welcome email sent successfully');
    } catch (emailError) {
      console.error('[APPROVE] Error sending welcome email:', emailError);
    }

    console.log('[APPROVE] Organization approval completed successfully');
    res.json({
      message: 'Organization approved successfully and welcome email sent',
      organization: updatedOrg,
    });
  } catch (error: any) {
    console.error('[APPROVE] Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(500).json({
      error: 'Failed to approve organization',
      details: error?.message || String(error),
    });
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
    const { reason } = req.body;

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

    console.log('[DECLINE] Checking email addresses:', {
      email: org.email,
      primaryContactEmail: org.primaryContactEmail,
    });

    // Send to both org email and primary contact email
    const emailsToSend = new Set<string>();
    if (org.email) emailsToSend.add(org.email);
    if (org.primaryContactEmail) emailsToSend.add(org.primaryContactEmail);

    if (emailsToSend.size > 0) {
      console.log('[DECLINE] Attempting to send rejection emails to:', Array.from(emailsToSend));
      for (const email of emailsToSend) {
        try {
          await sendRejectionEmail(email, org.name, reason);
          console.log(`[DECLINE] SUCCESS - Sent rejection notification to ${email}`);
        } catch (emailError) {
          console.error(`[DECLINE] ERROR - Failed to send rejection email to ${email}:`, emailError);
        }
      }
    } else {
      console.log('[DECLINE] No email addresses found, skipping email notification');
    }

    await prisma.organization.delete({ where: { id } });

    res.json({ message: 'Organization request declined and notification sent' });
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
    const { reason } = req.body;

    if (!isAdmin(req.user?.role)) return res.status(403).json({ error: 'Admin access required' });

    const orgToDelete = await prisma.organization.findUnique({ where: { id } });
    if (!orgToDelete) return res.status(404).json({ error: 'Organization not found' });

    console.log(
      `Admin ${req.user?.id} is deleting organization ${orgToDelete.name} (${orgToDelete.id})`
    );

    console.log('[DELETE] Checking email addresses:', {
      email: orgToDelete.email,
      primaryContactEmail: orgToDelete.primaryContactEmail,
    });

    // Send to both org email and primary contact email
    const emailsToSend = new Set<string>();
    if (orgToDelete.email) emailsToSend.add(orgToDelete.email);
    if (orgToDelete.primaryContactEmail) emailsToSend.add(orgToDelete.primaryContactEmail);

    if (emailsToSend.size > 0) {
      console.log('[DELETE] Attempting to send deletion emails to:', Array.from(emailsToSend));
      for (const email of emailsToSend) {
        try {
          await sendDeletionEmail(email, orgToDelete.name, reason);
          console.log(`[DELETE] SUCCESS - Sent deletion notification to ${email}`);
        } catch (emailError) {
          console.error(`[DELETE] ERROR - Failed to send deletion email to ${email}:`, emailError);
        }
      }
    } else {
      console.log('[DELETE] No email addresses found, skipping email notification');
    }

    const admins = await prisma.organization.findMany({
      where: {
        role: 'ADMIN',
        id: { not: req.user?.id },
      },
      select: { email: true },
    });

    const adminEmails = admins.map(admin => admin.email);

    if (adminEmails.length > 0 && reason) {
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .reason-box { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Organization Deleted by Admin</h1>
            </div>
            <div class="content">
              <p>An organization has been deleted from the Tennessee Coalition for Better Aging by an administrator.</p>

              <p><strong>Organization Name:</strong> ${orgToDelete.name}</p>

              <div class="reason-box">
                <h3>Reason for Deletion:</h3>
                <p>${reason.replace(/\n/g, '<br>')}</p>
              </div>

              <p>This notification has been sent to all administrators.</p>
            </div>
            <div class="footer">
              <p>Tennessee Coalition for Better Aging</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
Organization Deleted by Admin

An organization has been deleted from the Tennessee Coalition for Better Aging by an administrator.

Organization Name: ${orgToDelete.name}

Reason for Deletion:
${reason}

This notification has been sent to all administrators.

Tennessee Coalition for Better Aging
      `;

      const command = new SendEmailCommand({
        Source: sesConfig.fromEmail,
        Destination: {
          ToAddresses: adminEmails,
        },
        Message: {
          Subject: {
            Data: `Org ${orgToDelete.name} deleted`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
        ReplyToAddresses: [sesConfig.replyToEmail],
      });

      try {
        await sesClient.send(command);
        console.log(`Sent admin deletion notification to ${adminEmails.length} admins`);
      } catch (emailError) {
        console.error('Error sending admin deletion notification email:', emailError);
      }
    }

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

/**
 * @desc    Deactivate own organization account (self-deactivation)
 * @route   DELETE /api/organizations/profile/deactivate
 * @access  Own organization only
 */
export const deactivateAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'Deactivation reason is required' });
    }

    const orgToDelete = await prisma.organization.findUnique({
      where: { id: req.user.id },
    });

    if (!orgToDelete) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    console.log(
      `Organization ${orgToDelete.name} (${orgToDelete.id}) is requesting account deactivation`
    );

    const admins = await prisma.adminUser.findMany({
      select: { email: true },
    });

    const adminEmails = admins.map(admin => admin.email);

    if (adminEmails.length > 0) {
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D54242; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .reason-box { background-color: white; padding: 20px; border-left: 4px solid #D54242; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Organization Account Deleted</h1>
            </div>
            <div class="content">
              <p>An organization has deleted their account from the Tennessee Coalition for Better Aging.</p>

              <p><strong>Organization Name:</strong> ${orgToDelete.name}</p>

              <div class="reason-box">
                <h3>Reason for Deletion:</h3>
                <p>${reason.replace(/\n/g, '<br>')}</p>
              </div>

              <p>This notification has been sent to all administrators.</p>
            </div>
            <div class="footer">
              <p>Tennessee Coalition for Better Aging</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
Organization Account Deleted

An organization has deleted their account from the Tennessee Coalition for Better Aging.

Organization Name: ${orgToDelete.name}

Reason for Deletion:
${reason}

This notification has been sent to all administrators.

Tennessee Coalition for Better Aging
      `;

      const command = new SendEmailCommand({
        Source: sesConfig.fromEmail,
        Destination: {
          ToAddresses: adminEmails,
        },
        Message: {
          Subject: {
            Data: `Org ${orgToDelete.name} deleted`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
        ReplyToAddresses: [sesConfig.replyToEmail],
      });

      try {
        await sesClient.send(command);
        console.log(`Sent deactivation notification to ${adminEmails.length} admins`);
      } catch (emailError) {
        console.error('Error sending deactivation notification email:', emailError);
      }
    }

    if (orgToDelete.clerkId) {
      try {
        console.log(`Deleting Clerk user: ${orgToDelete.clerkId}`);
        await clerkClient.users.deleteUser(orgToDelete.clerkId);
        console.log(`Successfully deleted Clerk user: ${orgToDelete.clerkId}`);
      } catch (clerkError: any) {
        console.error('Error deleting Clerk user:', {
          clerkId: orgToDelete.clerkId,
          error: clerkError.message,
          status: clerkError.status,
        });
      }
    }

    await prisma.organization.delete({ where: { id: req.user.id } });

    console.log(`Successfully deactivated and deleted organization: ${orgToDelete.name}`);
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating account:', error);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
};

/**
 * @desc    Mark content as viewed by updating lastCheckedAt timestamp
 * @route   PUT /api/organizations/mark-viewed
 * @access  Organization only
 */
export const markContentAsViewed = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contentType } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validTypes = ['alerts', 'announcements', 'blogs', 'messages'];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const now = new Date();
    const updateData: any = {};

    switch (contentType) {
      case 'alerts':
        updateData.lastCheckedAlertsAt = now;
        break;
      case 'announcements':
        updateData.lastCheckedAnnouncementsAt = now;
        break;
      case 'blogs':
        updateData.lastCheckedBlogsAt = now;
        break;
      case 'messages':
        updateData.lastCheckedMessagesAt = now;
        break;
    }

    await prisma.organization.update({
      where: { id: req.user.id },
      data: updateData,
    });

    res.json({ success: true, lastCheckedAt: now });
  } catch (error) {
    console.error('Error marking content as viewed:', error);
    res.status(500).json({ error: 'Failed to mark content as viewed' });
  }
};
