// Basic types for the TCBA application

import { Request } from 'express';
import { OrganizationRole, OrganizationStatus } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
  };
  user?: {
    id: string;
    clerkId: string;
    role: OrganizationRole;
    email: string;
    name: string;
  };
}

// Full organization model
export interface Organization {
  id: string;
  clerkId: string;
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
  tags: string[];
}

// For organization self-registration
export interface RegisterOrganizationInput {
  email: string;
  password: string;
  name: string;
  contactPerson: string;
  contactTitle?: string;
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  tags?: string[];
}

// For updating organization profiles
export interface UpdateOrganizationProfileInput {
  name?: string;
  email?: string;
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
  email?: string;
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
  role?: OrganizationRole;
  status?: OrganizationStatus;
}
