// Basic types for the TCBA application

import { Request } from 'express';
import { OrganizationRole, OrganizationStatus } from '@prisma/client';

// Express request extended with authenticated user data
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firebaseUid: string;
    role: OrganizationRole;
    email: string;
    name: string;
  };
}

// Full organization model (matches simplified Prisma schema)
export interface Organization {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  contactPerson?: string;
  contactTitle?: string;
  role: OrganizationRole;
  status: OrganizationStatus;
  isActive: boolean;
  tags: string[];
  emailVerified: boolean;
}

// Input validation interfaces for API endpoints

// For updating organization profiles (self-service)
export interface UpdateOrganizationProfileInput {
  name?: string;
  email?: string; // Requires email verification after change
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  contactPerson?: string;
  contactTitle?: string;
  tags?: string[];
}

// For admin updates to organizations
export interface UpdateOrganizationInput {
  name?: string;
  email?: string; // Requires email verification after change
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  contactPerson?: string;
  contactTitle?: string;
  tags?: string[];
  role?: OrganizationRole; // Only super admins
  status?: OrganizationStatus; // Only admins
  isActive?: boolean; // Only admins
}