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

import {
  getAllOrganizations,
  registerOrganization,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from '../../controllers/OrganizationController';

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
  tags: ['Nashville', 'Senior Services', 'Healthcare'],
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
        where: {},
        orderBy: { name: 'asc' },
      });
      expect(res.json).toHaveBeenCalledWith(mockOrgs);
    });
  });

  describe('registerOrganization', () => {
    it('should register new organization - POST /api/organizations/register', async () => {
      const req = createMockRequest({
        body: {
          email: 'neworg@nonprofit.org',
          password: 'securePassword123',
          name: 'New Community Services',
          contactPerson: 'John Smith',
          contactTitle: 'Executive Director',
          city: 'Memphis',
          state: 'TN',
          tags: ['Community', 'Services'],
        },
      });
      const res = createMockResponse();
      prismaMock.organization.findFirst.mockResolvedValue(null);
      prismaMock.organization.create.mockResolvedValue({
        ...mockOrganization,
        email: 'neworg@nonprofit.org',
        name: 'New Community Services',
        contactPerson: 'John Smith',
        status: 'PENDING',
      });
      await registerOrganization(req, res);
      expect(prismaMock.organization.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'neworg@nonprofit.org' }, { name: 'New Community Services' }],
        },
      });
      expect(admin.auth().createUser).toHaveBeenCalledWith({
        email: 'neworg@nonprofit.org',
        password: 'securePassword123',
        emailVerified: false,
        displayName: 'New Community Services',
      });
      expect(prismaMock.organization.create).toHaveBeenCalledWith({
        data: {
          email: 'neworg@nonprofit.org',
          name: 'New Community Services',
          contactPerson: 'John Smith',
          contactTitle: 'Executive Director',
          description: undefined,
          website: undefined,
          address: undefined,
          city: 'Memphis',
          state: 'TN',
          zipCode: undefined,
          phoneNumber: undefined,
          tags: ['Community', 'Services'],
          firebaseUid: 'firebase-uid-123',
          role: 'MEMBER',
          status: 'PENDING',
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'neworg@nonprofit.org',
          name: 'New Community Services',
          status: 'PENDING',
        })
      );
    });
    it('should reject registration with missing required fields - POST /api/organizations/register', async () => {
      const req = createMockRequest({
        body: {
          email: 'incomplete@nonprofit.org',
        },
      });
      const res = createMockResponse();
      await registerOrganization(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email, password, name, and contact person are required',
      });
    });
    it('should prevent duplicate registration - POST /api/organizations/register', async () => {
      const req = createMockRequest({
        body: {
          email: 'existing@nonprofit.org',
          password: 'password123',
          name: 'Existing Organization',
          contactPerson: 'Jane Doe',
        },
      });
      const res = createMockResponse();
      prismaMock.organization.findFirst.mockResolvedValue(mockOrganization);
      await registerOrganization(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Organization with this email or name already exists',
      });
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

  describe('getOrganizationById (/profile route)', () => {
    it('should return current org profile - GET /api/organizations/profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        params: { id: 'profile' },
      });
      const res = createMockResponse();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);
      await getOrganizationById(req, res);
      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org123' },
      });
      expect(res.json).toHaveBeenCalledWith(mockOrganization);
    });
    it('should return 401 for unauthenticated - GET /api/organizations/profile', async () => {
      const req = createMockRequest({ params: { id: 'profile' } });
      const res = createMockResponse();
      await getOrganizationById(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization not authenticated' });
    });
  });

  describe('updateOrganization (/profile route)', () => {
    it('should update org profile - PUT /api/organizations/profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        params: { id: 'profile' },
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
      await updateOrganization(req, res);
      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org123' },
        data: expect.objectContaining({
          name: 'Updated Senior Services',
          description: 'Updated description',
          contactPerson: 'John Doe',
          contactTitle: 'New Director',
        }),
      });
      expect(res.json).toHaveBeenCalledWith(updatedOrg);
    });
    it('should update org email and reset verification - PUT /api/organizations/profile', async () => {
      const req = createMockRequest({
        user: { id: 'org123' },
        params: { id: 'profile' },
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
      };
      prismaMock.organization.update.mockResolvedValue(updatedOrg);
      await updateOrganization(req, res);
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
        }),
      });
      expect(res.json).toHaveBeenCalled();
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
  });
});
