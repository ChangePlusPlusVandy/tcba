import { OrganizationRole, OrganizationStatus, PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';
import admin from 'firebase-admin';

const prismaMock = mockDeep<PrismaClient>();

jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
  OrganizationRole: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
  },
  OrganizationStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
    SUSPENDED: 'SUSPENDED',
  },
}));

jest.mock('firebase-admin', () => ({
  auth: jest.fn().mockReturnValue({
    createUser: jest.fn().mockResolvedValue({
      uid: 'firebase-uid-123',
      email: 'test@nonprofit.org',
    }),
    updateUser: jest.fn().mockResolvedValue({
      uid: 'firebase-uid-123',
    }),
    verifyIdToken: jest.fn(),
  }),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mockToken123'),
  }),
}));

import {
  getAllOrganizations,
  getOrganizationById,
  getCurrentOrganizationProfile,
  updateOrganizationProfile,
  updateOrganization,
  deleteOrganization,
  inviteOrganization,
} from '../../controllers/organizationController';

const createMockRequest = (overrides: any = {}): any => ({
  params: {},
  query: {},
  body: {},
  user: undefined,
  ...overrides,
});

const createMockResponse = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockOrganization = {
  id: 'org123',
  firebaseUid: 'firebase-uid-123',
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
  emailVerified: true,
  inviteToken: null,
  inviteTokenExp: null,
};

const mockAdminOrg = {
  id: 'admin123',
  role: 'ADMIN' as OrganizationRole,
  name: 'Tennessee Coalition for Better Aging',
  email: 'admin@tcba.org',
  firebaseUid: 'firebase-admin-123',
};

describe('OrganizationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);

    const mockAuth = admin.auth() as jest.Mocked<any>;
    mockAuth.updateUser.mockResolvedValue({ uid: 'firebase-uid-123' });
    mockAuth.createUser.mockResolvedValue({
      uid: 'firebase-uid-123',
      email: 'test@nonprofit.org',
    });
  });

  describe('getAllOrganizations', () => {
    it('should return all organizations - GET /api/organizations', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
      });
      const res = createMockResponse();

      const mockOrgs = [mockOrganization];
      prismaMock.organization.findMany.mockResolvedValue(mockOrgs);

      await getAllOrganizations(req, res);

      expect(prismaMock.organization.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
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
          phoneNumber: true,
          contactPerson: true,
          contactTitle: true,
          role: true,
          status: true,
          tags: true,
        },
      });

      expect(res.json).toHaveBeenCalledWith(mockOrgs);
    });

    it('should handle database errors - GET /api/organizations', async () => {
      const req = createMockRequest({ user: mockAdminOrg });
      const res = createMockResponse();

      prismaMock.organization.findMany.mockRejectedValue(new Error('Database error'));

      await getAllOrganizations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch organizations' });
    });
  });

  describe('getOrganizationById', () => {
    it('should return organization by ID - GET /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' },
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      await getOrganizationById(req, res);

      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org123' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      });

      expect(res.json).toHaveBeenCalledWith(mockOrganization);
    });

    it('should allow org access to own profile - GET /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: { id: 'org123', role: 'MEMBER' as OrganizationRole },
        params: { id: 'org123' },
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      await getOrganizationById(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should deny access to other org profile - GET /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: { id: 'org456', role: 'MEMBER' as OrganizationRole },
        params: { id: 'org123' },
      });
      const res = createMockResponse();

      await getOrganizationById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should return 404 for non-existent org - GET /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'nonexistent' },
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(null);

      await getOrganizationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization not found' });
    });
  });

  describe('getCurrentOrganizationProfile', () => {
    it('should return current org profile - GET /api/organizations/profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      await getCurrentOrganizationProfile(req, res);

      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org123' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      });

      expect(res.json).toHaveBeenCalledWith(mockOrganization);
    });

    it('should return 401 for unauthenticated - GET /api/organizations/profile', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await getCurrentOrganizationProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization not authenticated' });
    });
  });

  describe('updateOrganizationProfile', () => {
    it('should update org profile - PUT /api/organizations/profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        body: {
          name: 'Updated Senior Services',
          description: 'Updated description',
          contactPerson: 'John Doe',
          contactTitle: 'New Director',
        },
      });
      const res = createMockResponse();

      const updatedOrg = {
        ...mockOrganization,
        name: 'Updated Senior Services',
        contactPerson: 'John Doe',
      };
      prismaMock.organization.update.mockResolvedValue(updatedOrg);

      await updateOrganizationProfile(req, res);

      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org123' },
        data: expect.objectContaining({
          name: 'Updated Senior Services',
          description: 'Updated description',
          contactPerson: 'John Doe',
          contactTitle: 'New Director',
        }),
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      });

      expect(res.json).toHaveBeenCalledWith(updatedOrg);
    });

    it('should update org email and reset verification - PUT /api/organizations/profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        body: {
          email: 'newemail@nonprofit.org',
          name: 'Updated Senior Services',
        },
      });
      const res = createMockResponse();

      prismaMock.organization.findFirst.mockResolvedValue(null);

      prismaMock.organization.findUnique.mockResolvedValueOnce({
        firebaseUid: 'firebase-uid-123',
      } as any);

      const updatedOrg = {
        ...mockOrganization,
        email: 'newemail@nonprofit.org',
        emailVerified: false,
      };
      prismaMock.organization.update.mockResolvedValue(updatedOrg);

      await updateOrganizationProfile(req, res);

      expect(prismaMock.organization.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'newemail@nonprofit.org',
          NOT: { id: 'org123' },
        },
      });

      expect(admin.auth().updateUser).toHaveBeenCalledWith('firebase-uid-123', {
        email: 'newemail@nonprofit.org',
      });

      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org123' },
        data: expect.objectContaining({
          email: 'newemail@nonprofit.org',
          emailVerified: false,
        }),
        select: expect.any(Object),
      });

      expect(res.json).toHaveBeenCalled();
    });

    it('should reject duplicate email - PUT /api/organizations/profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        body: {
          email: 'existing@nonprofit.org',
        },
      });
      const res = createMockResponse();

      prismaMock.organization.findFirst.mockResolvedValue({
        id: 'org456',
        email: 'existing@nonprofit.org',
      } as any);

      await updateOrganizationProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email is already in use by another organization',
      });

      expect(admin.auth().updateUser).not.toHaveBeenCalled();
      expect(prismaMock.organization.update).not.toHaveBeenCalled();
    });

    it('should handle Firebase email update failure - PUT /api/organizations/profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        body: {
          email: 'newemail@nonprofit.org',
        },
      });
      const res = createMockResponse();

      prismaMock.organization.findFirst.mockResolvedValue(null);
      prismaMock.organization.findUnique.mockResolvedValueOnce({
        firebaseUid: 'firebase-uid-123',
      } as any);

      const mockUpdateUser = admin.auth().updateUser as jest.Mock;
      mockUpdateUser.mockRejectedValue(new Error('Firebase error'));

      await updateOrganizationProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to update email in authentication system',
        details: 'Firebase error',
      });

      expect(prismaMock.organization.update).not.toHaveBeenCalled();
    });
  });

  describe('updateOrganization', () => {
    it('should allow admin to update org - PUT /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' },
        body: {
          name: 'Updated Organization',
          status: 'INACTIVE' as OrganizationStatus,
        },
      });
      const res = createMockResponse();

      const updatedOrg = { ...mockOrganization, name: 'Updated Organization' };
      prismaMock.organization.update.mockResolvedValue(updatedOrg);

      await updateOrganization(req, res);

      expect(prismaMock.organization.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should deny role changes for non-super-admin - PUT /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' },
        body: { role: 'ADMIN' as OrganizationRole },
      });
      const res = createMockResponse();

      await updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Only super admins can change organization roles',
      });
    });

    it('should deny access for non-admin - PUT /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: { id: 'org123', role: 'MEMBER' as OrganizationRole },
        params: { id: 'org456' },
      });
      const res = createMockResponse();

      await updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });

  describe('deleteOrganization', () => {
    it('should allow admin to delete org - DELETE /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'org123' },
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);
      prismaMock.organization.delete.mockResolvedValue(mockOrganization);

      await deleteOrganization(req, res);

      expect(prismaMock.organization.delete).toHaveBeenCalledWith({
        where: { id: 'org123' },
      });

      expect(res.json).toHaveBeenCalledWith({ message: 'Organization deleted successfully' });
    });

    it('should prevent self-deletion - DELETE /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: { id: 'admin123', role: 'ADMIN' as OrganizationRole },
        params: { id: 'admin123' },
      });
      const res = createMockResponse();

      await deleteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot delete your own organization' });
    });

    it('should return 404 for non-existent org - DELETE /api/organizations/:id', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        params: { id: 'nonexistent' },
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(null);

      await deleteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization not found' });
    });
  });


  describe('inviteOrganization', () => {
    it('should create and invite new org - POST /api/organizations/invite', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        body: {
          email: 'neworg@nonprofit.org',
          name: 'New Nonprofit Organization',
          contactPerson: 'Mary Johnson',
          contactTitle: 'Director',
          city: 'Memphis',
          state: 'TN',
        },
      });
      const res = createMockResponse();

      prismaMock.organization.findFirst.mockResolvedValue(null);
      prismaMock.organization.create.mockResolvedValue({
        ...mockOrganization,
        email: 'neworg@nonprofit.org',
        name: 'New Nonprofit Organization',
        contactPerson: 'Mary Johnson',
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
          inviteTokenExp: expect.any(Date),
        },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should prevent duplicate invitations - POST /api/organizations/invite', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        body: {
          email: 'existing@nonprofit.org',
          name: 'Existing Organization',
        },
      });
      const res = createMockResponse();

      prismaMock.organization.findFirst.mockResolvedValue(mockOrganization);

      await inviteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Organization with this email or name already exists',
      });
    });

    it('should prevent non-super-admin inviting admins - POST /api/organizations/invite', async () => {
      const req = createMockRequest({
        user: mockAdminOrg,
        body: {
          email: 'admin@nonprofit.org',
          name: 'Admin Organization',
          role: 'ADMIN' as OrganizationRole,
        },
      });
      const res = createMockResponse();

      await inviteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Only super admins can invite admin organizations',
      });
    });
  });
});