import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();
const mockClerkClient = { users: { createUser: jest.fn(), updateUser: jest.fn() } };

jest.mock('@prisma/client', () => ({ __esModule: true, PrismaClient: jest.fn(() => prismaMock) }));
jest.mock('../../config/clerk', () => ({ clerkClient: mockClerkClient }));
jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));

import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from '../../controllers/adminController';

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
const mockAdmin = {
  id: 'admin1',
  clerkId: 'clerk_user_123',
  email: 'admin1@example.com',
  name: 'Admin 1',
  isSuperAdmin: true,
  isActive: true,
};
const mockSuperAdmin = {
  id: 'super_admin1',
  clerkId: 'clerk_super_admin',
  email: 'super@example.com',
  name: 'Super Admin',
  isSuperAdmin: true,
  isActive: true,
};
describe('AdminController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
    mockClerkClient.users.createUser.mockResolvedValue({ id: 'clerk1' } as any);
    mockClerkClient.users.updateUser.mockResolvedValue({ id: 'clerk1' } as any);
  });
  it('getAllAdmins - should return all admins', async () => {
    // Mock authentication check (first call)
    (prismaMock as any).adminUser.findUnique.mockResolvedValueOnce(mockSuperAdmin as any);
    // Mock the actual query (second call)
    (prismaMock as any).adminUser.findMany.mockResolvedValue([mockAdmin] as any);

    const res = mockRes();
    await getAllAdmins(mockReq({ user: { clerkId: 'clerk_super_admin' } }), res);
    expect(res.json).toHaveBeenCalledWith([mockAdmin]);
  });
  describe('createAdmin', () => {
    it('should create a new admin', async () => {
      // Mock authentication check (first call)
      (prismaMock as any).adminUser.findUnique.mockResolvedValueOnce(mockSuperAdmin as any);
      // Mock the create operation
      (prismaMock as any).adminUser.create.mockResolvedValue(mockAdmin as any);

      const res = mockRes();
      await createAdmin(mockReq({ body: mockAdmin, user: { clerkId: 'clerk_super_admin' } }), res);
      expect(res.json).toHaveBeenCalledWith(mockAdmin);
    });
  });
});
