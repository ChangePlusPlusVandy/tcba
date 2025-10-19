import { OrganizationRole, PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();
const mockClerkClient = { users: { createUser: jest.fn(), updateUser: jest.fn() } };

jest.mock('@prisma/client', () => ({ __esModule: true, PrismaClient: jest.fn(() => prismaMock) }));
jest.mock('../../config/clerk', () => ({ clerkClient: mockClerkClient }));
jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));

import {
  getAllOrganizations,
  registerOrganization,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from '../../controllers/organizationController.js';

const mockReq = (overrides: any = {}): any => ({
  params: {},
  query: {},
  body: {},
  user: undefined,
  ...overrides,
});
const mockRes = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockOrg = {
  id: 'org1',
  clerkId: 'clerk1',
  email: 'test@org.com',
  name: 'Test Org',
  role: 'MEMBER' as OrganizationRole,
};
const mockAdmin = { id: 'admin1', role: 'ADMIN' as OrganizationRole };

describe('OrganizationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
    mockClerkClient.users.createUser.mockResolvedValue({ id: 'clerk1' } as any);
    mockClerkClient.users.updateUser.mockResolvedValue({ id: 'clerk1' } as any);
  });
  it('getAllOrganizations - should return all organizations', async () => {
    prismaMock.organization.findMany.mockResolvedValue([mockOrg] as any);
    const res = mockRes();
    await getAllOrganizations(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith([mockOrg]);
  });

  describe('registerOrganization', () => {
    const validBody = {
      email: 'new@org.com',
      password: 'pass123',
      name: 'New Org',
      primaryContactName: 'John',
      primaryContactEmail: 'john@org.com',
      primaryContactPhone: '123-456-7890',
    };
    it('should register new organization', async () => {
      prismaMock.organization.findFirst.mockResolvedValue(null);
      prismaMock.organization.create.mockResolvedValue(mockOrg as any);
      const res = mockRes();
      await registerOrganization(mockReq({ body: validBody }), res);
      expect(mockClerkClient.users.createUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it('should reject invalid input', async () => {
      const res = mockRes();
      await registerOrganization(mockReq({ body: { email: 'test@org.com' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should prevent duplicates', async () => {
      prismaMock.organization.findFirst.mockResolvedValue(mockOrg as any);
      const res = mockRes();
      await registerOrganization(mockReq({ body: validBody }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOrganizationById', () => {
    it('should return org for admin or owner', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      const res = mockRes();
      await getOrganizationById(mockReq({ user: mockAdmin, params: { id: 'org1' } }), res);
      expect(res.json).toHaveBeenCalledWith(mockOrg);
    });
    it('should deny unauthorized access', async () => {
      const res = mockRes();
      await getOrganizationById(
        mockReq({
          user: { id: 'org2', role: 'MEMBER' as OrganizationRole },
          params: { id: 'org1' },
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('should return 404 for non-existent org', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await getOrganizationById(mockReq({ user: mockAdmin, params: { id: 'invalid' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization', async () => {
      prismaMock.organization.update.mockResolvedValue(mockOrg as any);
      const res = mockRes();
      await updateOrganization(
        mockReq({ user: { id: 'org1' }, params: { id: 'profile' }, body: { name: 'Updated' } }),
        res
      );
      expect(res.json).toHaveBeenCalled();
    });
    it('should sync email updates with Clerk', async () => {
      prismaMock.organization.findFirst.mockResolvedValue(null);
      prismaMock.organization.findUnique.mockResolvedValue({ clerkId: 'clerk1' } as any);
      prismaMock.organization.update.mockResolvedValue(mockOrg as any);
      const res = mockRes();
      await updateOrganization(
        mockReq({
          user: { id: 'org1' },
          params: { id: 'profile' },
          body: { email: 'new@org.com' },
        }),
        res
      );
      expect(mockClerkClient.users.updateUser).toHaveBeenCalled();
    });
  });
  it('deleteOrganization - should delete organization', async () => {
    prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
    prismaMock.organization.delete.mockResolvedValue(mockOrg as any);
    const res = mockRes();
    await deleteOrganization(mockReq({ user: mockAdmin, params: { id: 'org1' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Organization deleted successfully' });
  });
});
