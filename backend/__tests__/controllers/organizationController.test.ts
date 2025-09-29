// Test suite for organizationController - covers all endpoints with Firebase Auth integration
// Tests the CRUD operations for the 45+ nonprofit organizations in the coalition
import { OrganizationRole, OrganizationStatus, PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Create mock Prisma client for testing
const prismaMock = mockDeep<PrismaClient>();

// Mock Prisma client and enums for testing
jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
  OrganizationRole: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER'
  },
  OrganizationStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
    SUSPENDED: 'SUSPENDED'
  }
}));

import {
  getAllOrganizations,
  getOrganizationById,
  getCurrentOrganizationProfile,
  updateOrganizationProfile,
  updateOrganization,
  deleteOrganization,
  inviteOrganization,
  getOrganizationActivity
} from '../../controllers/organizationController';

// Mock Firebase Admin SDK for organization creation and updates
jest.mock('firebase-admin', () => ({
  auth: jest.fn().mockReturnValue({
    createUser: jest.fn().mockResolvedValue({
      uid: 'firebase-uid-123',
      email: 'test@nonprofit.org'
    }),
    updateUser: jest.fn().mockResolvedValue({
      uid: 'firebase-uid-123'
    }),
    verifyIdToken: jest.fn()
  })
}));

import admin from 'firebase-admin';

// Mock crypto for generating invitation tokens
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mockToken123')
  })
}));

// Helper to create mock Express request object
const createMockRequest = (overrides: any = {}): any => ({
  params: {},
  query: {},
  body: {},
  user: undefined, // Will be set by auth middleware in real app
  ...overrides
});

// Helper to create mock Express response object
const createMockResponse = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Sample organization data for testing - represents a nonprofit member of the coalition
const mockOrganization = {
  id: 'org123',
  firebaseUid: 'firebase-uid-123', // Links to Firebase Auth
  email: 'contact@nonprofitorg.org',
  name: 'Community Senior Services',
  description: 'Providing services to seniors in the Nashville area',
  website: 'https://nonprofitorg.org',
  address: '123 Main St',
  city: 'Nashville',
  state: 'TN',
  zipCode: '37201',
  phoneNumber: '615-555-0123',
  contactPerson: 'Jane Smith',
  contactTitle: 'Executive Director',
  role: 'MEMBER' as OrganizationRole,
  status: 'ACTIVE' as OrganizationStatus,
  isActive: true,
  tags: ['Nashville', 'Senior Services', 'Healthcare'],
  lastLoginAt: new Date(),
  emailVerified: true,
  joinedAt: new Date(),
  updatedAt: new Date(),
  inviteToken: null,
  inviteTokenExp: null
};

// Sample admin organization for testing permissions
const mockAdminOrg = {
  id: 'admin123',
  role: 'ADMIN' as OrganizationRole,
  name: 'Tennessee Coalition for Better Aging',
  email: 'admin@tcba.org',
  firebaseUid: 'firebase-admin-123'
};

describe('OrganizationController', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mock call history
    mockReset(prismaMock); // Reset Prisma mock state

    // Reset Firebase Auth mocks to default successful responses
    const mockAuth = admin.auth() as jest.Mocked<any>;
    mockAuth.updateUser.mockResolvedValue({ uid: 'firebase-uid-123' });
    mockAuth.createUser.mockResolvedValue({
      uid: 'firebase-uid-123',
      email: 'test@nonprofit.org'
    });
  });

  describe('getAllOrganizations', () => {
    it('should return paginated organizations for admin', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        query: { page: '1', limit: '10' }
      });
      const res = createMockResponse();

      const mockOrgs = [mockOrganization];
      prismaMock.organization.findMany.mockResolvedValue(mockOrgs);
      prismaMock.organization.count.mockResolvedValue(1);

      await getAllOrganizations(req, res);

      expect(prismaMock.organization.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { joinedAt: 'desc' }
      });

      expect(res.json).toHaveBeenCalledWith({
        organizations: expect.arrayContaining([
          expect.not.objectContaining({
            inviteToken: expect.anything(),
            inviteTokenExp: expect.anything()
          })
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      });
    });

    it('should filter organizations by search term', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        query: { search: 'senior' }
      });
      const res = createMockResponse();

      prismaMock.organization.findMany.mockResolvedValue([mockOrganization]);
      prismaMock.organization.count.mockResolvedValue(1);

      await getAllOrganizations(req, res);

      expect(prismaMock.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'senior', mode: 'insensitive' } },
              { contactPerson: { contains: 'senior', mode: 'insensitive' } },
              { email: { contains: 'senior', mode: 'insensitive' } }
            ]
          }
        })
      );
    });

    it('should handle database errors', async () => {
      const req = createMockRequest({ user: mockAdminOrg });
      const res = createMockResponse();

      prismaMock.organization.findMany.mockRejectedValue(new Error('Database error'));

      await getAllOrganizations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch organizations' });
    });
  });

  describe('getOrganizationById', () => {
    it('should return organization by ID for admin', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' }
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      await getOrganizationById(req, res);

      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org123' }
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          inviteToken: expect.anything(),
          inviteTokenExp: expect.anything()
        })
      );
    });

    it('should allow organization to access their own profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123', role: 'MEMBER' as OrganizationRole },
        params: { id: 'org123' }
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      await getOrganizationById(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should deny access to other organizations profile for non-admin', async () => {
      const req = createMockRequest({
        user: { id: 'org456', role: 'MEMBER' as OrganizationRole },
        params: { id: 'org123' }
      });
      const res = createMockResponse();

      await getOrganizationById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should return 404 for non-existent organization', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'nonexistent' }
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(null);

      await getOrganizationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization not found' });
    });
  });

  describe('getCurrentOrganizationProfile', () => {
    it('should return current organization profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' }
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      await getCurrentOrganizationProfile(req, res);

      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org123' }
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          inviteToken: expect.anything()
        })
      );
    });

    it('should return 401 for unauthenticated organization', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await getCurrentOrganizationProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization not authenticated' });
    });
  });

  describe('updateOrganizationProfile', () => {
    it('should update organization profile successfully', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        body: {
          name: 'Updated Senior Services',
          description: 'Updated description',
          contactPerson: 'John Doe',
          contactTitle: 'New Director'
        }
      });
      const res = createMockResponse();

      const updatedOrg = { ...mockOrganization, name: 'Updated Senior Services', contactPerson: 'John Doe' };
      prismaMock.organization.update.mockResolvedValue(updatedOrg);

      await updateOrganizationProfile(req, res);

      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org123' },
        data: expect.objectContaining({
          name: 'Updated Senior Services',
          description: 'Updated description',
          contactPerson: 'John Doe',
          contactTitle: 'New Director',
          updatedAt: expect.any(Date)
        })
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Senior Services',
          contactPerson: 'John Doe'
        })
      );
    });

    it('should update organization email and reset email verification', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        body: {
          email: 'newemail@nonprofit.org',
          name: 'Updated Senior Services'
        }
      });
      const res = createMockResponse();

      // Mock existing organization check (no conflicts)
      prismaMock.organization.findFirst.mockResolvedValue(null);

      // Mock current organization lookup
      prismaMock.organization.findUnique.mockResolvedValueOnce({
        firebaseUid: 'firebase-uid-123',
        email: 'oldemail@nonprofit.org'
      } as any);

      const updatedOrg = {
        ...mockOrganization,
        email: 'newemail@nonprofit.org',
        emailVerified: false
      };
      prismaMock.organization.update.mockResolvedValue(updatedOrg);

      await updateOrganizationProfile(req, res);

      // Should check for email conflicts
      expect(prismaMock.organization.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'newemail@nonprofit.org',
          NOT: { id: 'org123' }
        }
      });

      // Should update Firebase Auth
      expect(admin.auth().updateUser).toHaveBeenCalledWith('firebase-uid-123', {
        email: 'newemail@nonprofit.org'
      });

      // Should update database with email and reset verification
      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org123' },
        data: expect.objectContaining({
          email: 'newemail@nonprofit.org',
          emailVerified: false,
          updatedAt: expect.any(Date)
        })
      });

      expect(res.json).toHaveBeenCalled();
    });

    it('should reject email update if email already exists', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        body: {
          email: 'existing@nonprofit.org'
        }
      });
      const res = createMockResponse();

      // Mock existing organization with same email
      prismaMock.organization.findFirst.mockResolvedValue({
        id: 'org456',
        email: 'existing@nonprofit.org'
      } as any);

      await updateOrganizationProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email is already in use by another organization'
      });

      // Should not call Firebase or update database
      expect(admin.auth().updateUser).not.toHaveBeenCalled();
      expect(prismaMock.organization.update).not.toHaveBeenCalled();
    });

    it('should handle Firebase Auth email update failure', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        body: {
          email: 'newemail@nonprofit.org'
        }
      });
      const res = createMockResponse();

      prismaMock.organization.findFirst.mockResolvedValue(null);
      prismaMock.organization.findUnique.mockResolvedValueOnce({
        firebaseUid: 'firebase-uid-123',
        email: 'oldemail@nonprofit.org'
      } as any);

      // Mock Firebase Auth failure
      const mockUpdateUser = admin.auth().updateUser as jest.Mock;
      mockUpdateUser.mockRejectedValue(new Error('Firebase error'));

      await updateOrganizationProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to update email in authentication system',
        details: 'Firebase error'
      });

      // Should not update database if Firebase fails
      expect(prismaMock.organization.update).not.toHaveBeenCalled();
    });
  });

  describe('updateOrganization', () => {
    it('should allow admin to update organization', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' },
        body: {
          name: 'Updated Organization',
          status: 'INACTIVE' as OrganizationStatus
        }
      });
      const res = createMockResponse();

      const updatedOrg = { ...mockOrganization, name: 'Updated Organization' };
      prismaMock.organization.update.mockResolvedValue(updatedOrg);

      await updateOrganization(req, res);

      expect(prismaMock.organization.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should deny role changes for non-super-admin', async () => {
      const req = createMockRequest({
        user: mockAdminOrg, // Regular admin, not super admin
        params: { id: 'org123' },
        body: { role: 'ADMIN' as OrganizationRole }
      });
      const res = createMockResponse();

      await updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Only super admins can change organization roles' });
    });

    it('should deny access for non-admin organizations', async () => {
      const req = createMockRequest({
        user: { id: 'org123', role: 'MEMBER' as OrganizationRole },
        params: { id: 'org456' }
      });
      const res = createMockResponse();

      await updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should allow admin to update organization email', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' },
        body: {
          email: 'admin-changed@nonprofit.org',
          name: 'Admin Updated Organization'
        }
      });
      const res = createMockResponse();

      // Mock existing organization check (no conflicts)
      prismaMock.organization.findFirst.mockResolvedValue(null);

      // Mock current organization lookup
      prismaMock.organization.findUnique.mockResolvedValueOnce({
        firebaseUid: 'firebase-uid-123',
        email: 'oldemail@nonprofit.org'
      } as any);

      const updatedOrg = {
        ...mockOrganization,
        email: 'admin-changed@nonprofit.org',
        emailVerified: false
      };
      prismaMock.organization.update.mockResolvedValue(updatedOrg);

      await updateOrganization(req, res);

      // Should check for email conflicts
      expect(prismaMock.organization.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'admin-changed@nonprofit.org',
          NOT: { id: 'org123' }
        }
      });

      // Should update Firebase Auth
      expect(admin.auth().updateUser).toHaveBeenCalledWith('firebase-uid-123', {
        email: 'admin-changed@nonprofit.org'
      });

      // Should update database with email and reset verification
      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org123' },
        data: expect.objectContaining({
          email: 'admin-changed@nonprofit.org',
          emailVerified: false,
          updatedAt: expect.any(Date)
        })
      });

      expect(res.json).toHaveBeenCalled();
    });

    it('should reject admin email update if email already exists', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' },
        body: {
          email: 'existing@nonprofit.org'
        }
      });
      const res = createMockResponse();

      // Mock existing organization with same email
      prismaMock.organization.findFirst.mockResolvedValue({
        id: 'org456',
        email: 'existing@nonprofit.org'
      } as any);

      await updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email is already in use by another organization'
      });

      // Should not call Firebase or update database
      expect(admin.auth().updateUser).not.toHaveBeenCalled();
      expect(prismaMock.organization.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteOrganization', () => {
    it('should allow admin to delete organization', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' }
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);
      prismaMock.organization.delete.mockResolvedValue(mockOrganization);

      await deleteOrganization(req, res);

      expect(prismaMock.organization.delete).toHaveBeenCalledWith({
        where: { id: 'org123' }
      });

      expect(res.json).toHaveBeenCalledWith({ message: 'Organization deleted successfully' });
    });

    it('should prevent self-deletion', async () => {
      const req = createMockRequest({
        user: { id: 'admin123', role: 'ADMIN' as OrganizationRole },
        params: { id: 'admin123' }
      });
      const res = createMockResponse();

      await deleteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot delete your own organization' });
    });

    it('should return 404 for non-existent organization', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'nonexistent' }
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(null);

      await deleteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization not found' });
    });
  });

  describe('inviteOrganization', () => {
    it('should create and invite new organization', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        body: {
          email: 'neworg@nonprofit.org',
          name: 'New Nonprofit Organization',
          contactPerson: 'Mary Johnson',
          contactTitle: 'Director',
          city: 'Memphis',
          state: 'TN'
        }
      });
      const res = createMockResponse();

      prismaMock.organization.findFirst.mockResolvedValue(null); // No existing org
      prismaMock.organization.create.mockResolvedValue({
        ...mockOrganization,
        email: 'neworg@nonprofit.org',
        name: 'New Nonprofit Organization',
        contactPerson: 'Mary Johnson'
      });

      await inviteOrganization(req, res);

      expect(prismaMock.organization.create).toHaveBeenCalledWith({
        data: {
          email: 'neworg@nonprofit.org',
          name: 'New Nonprofit Organization',
          contactPerson: 'Mary Johnson',
          contactTitle: 'Director',
          description: undefined,
          website: undefined,
          address: undefined,
          city: 'Memphis',
          state: 'TN',
          zipCode: undefined,
          phoneNumber: undefined,
          tags: [],
          firebaseUid: 'firebase-uid-123',
          role: 'MEMBER' as OrganizationRole,
          status: 'PENDING' as OrganizationStatus,
          inviteToken: 'mockToken123',
          inviteTokenExp: expect.any(Date)
        }
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Organization invited successfully. They will receive setup instructions via email.'
        })
      );
    });

    it('should prevent duplicate organization invitations', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        body: {
          email: 'existing@nonprofit.org',
          name: 'Existing Organization'
        }
      });
      const res = createMockResponse();

      prismaMock.organization.findFirst.mockResolvedValue(mockOrganization); // Org exists

      await inviteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization with this email or name already exists' });
    });

    it('should prevent non-super-admin from inviting admin organizations', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        body: {
          email: 'admin@nonprofit.org',
          name: 'Admin Organization',
          role: 'ADMIN' as OrganizationRole
        }
      });
      const res = createMockResponse();

      await inviteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Only super admins can invite admin organizations' });
    });
  });

  describe('getOrganizationActivity', () => {
    it('should return organization activity for admin', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' }
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org123',
        firebaseUid: 'firebase-uid-123',
        name: 'Community Senior Services',
        email: 'contact@nonprofitorg.org',
        description: 'Providing services to seniors in the Nashville area',
        website: 'https://nonprofitorg.org',
        address: '123 Main St',
        city: 'Nashville',
        state: 'TN',
        zipCode: '37201',
        phoneNumber: '615-555-0123',
        contactPerson: 'Jane Smith',
        contactTitle: 'Executive Director',
        role: 'MEMBER' as OrganizationRole,
        status: 'ACTIVE' as OrganizationStatus,
        isActive: true,
        tags: ['Nashville', 'Senior Services', 'Healthcare'],
        lastLoginAt: new Date(),
        emailVerified: true,
        joinedAt: new Date(),
        updatedAt: new Date(),
        inviteToken: null,
        inviteTokenExp: null
      });

      await getOrganizationActivity(req, res);

      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org123' },
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

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: expect.any(Object),
          lastLogin: expect.any(Date),
          accountCreated: expect.any(Date),
          lastUpdated: expect.any(Date)
        })
      );
    });

    it('should deny access for non-admin organizations', async () => {
      const req = createMockRequest({
        user: { id: 'org123', role: 'MEMBER' as OrganizationRole },
        params: { id: 'org456' }
      });
      const res = createMockResponse();

      await getOrganizationActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });
});