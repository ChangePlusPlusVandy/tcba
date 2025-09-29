// Basic types for the TCBA application

import { OrganizationRole, OrganizationStatus } from '@prisma/client';

// Full organization model (matches Prisma schema)
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
  lastLoginAt?: Date;
  emailVerified: boolean;
  joinedAt: Date;
  updatedAt: Date;
  inviteToken?: string;
  inviteTokenExp?: Date;
}

// Input validation interfaces for API endpoints

// For creating/inviting new organizations
export interface CreateOrganizationInput {
  email: string;
  name: string;
  contactPerson?: string;
  contactTitle?: string;
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  tags?: string[];
  role?: OrganizationRole; // Only super admins can set this
}

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

// Query parameters for getAllOrganizations
export interface GetOrganizationsQuery {
  page?: string;
  limit?: string;
  search?: string;
  role?: OrganizationRole;
  status?: OrganizationStatus;
  city?: string;
  state?: string;
}

// Response interfaces (what gets sent back to client)

// Public organization data (excludes sensitive fields)
export interface OrganizationPublic {
  id: string;
  name: string;
  email: string;
  description?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  phoneNumber?: string | null;
  contactPerson?: string | null;
  contactTitle?: string | null;
  role: OrganizationRole;
  status: OrganizationStatus;
  tags: string[];
  joinedAt: Date;
  updatedAt: Date;
}

// Paginated response for organizations list
export interface PaginatedOrganizationsResponse {
  organizations: OrganizationPublic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Activity response for admin dashboard
export interface OrganizationActivityResponse {
  organization: {
    id: string;
    name: string;
    email: string;
    contactPerson?: string | null;
  };
  lastLogin?: Date | null;
  accountCreated: Date;
  lastUpdated: Date;
}
