import { UserRole, UserStatus, PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();

jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
  UserRole: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER'
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
    SUSPENDED: 'SUSPENDED'
  }
}));

import {
  getAllUsers,
  getUserById,
  getCurrentUserProfile,
  updateUserProfile,
  updateUser,
  deleteUser,
  inviteUser,
  assignUserToOrganization,
  getUserActivity
} from '../../controllers/userController';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  auth: jest.fn().mockReturnValue({
    createUser: jest.fn().mockResolvedValue({
      uid: 'firebase-uid-123',
      email: 'test@example.com'
    }),
    verifyIdToken: jest.fn()
  })
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mockToken123')
  })
}));

// Helper function to create mock request
const createMockRequest = (overrides: any = {}): any => ({
  params: {},
  query: {},
  body: {},
  user: undefined,
  ...overrides
});

// Helper function to create mock response
const createMockResponse = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Sample test data
const mockUser = {
  id: 'user123',
  firebaseUid: 'firebase-uid-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'MEMBER' as UserRole,
  status: 'ACTIVE' as UserStatus,
  title: 'Director',
  phoneNumber: '555-0123',
  profilePicture: null,
  lastLoginAt: new Date(),
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  organizationId: 'org123',
  inviteToken: null,
  inviteTokenExp: null,
  organization: {
    id: 'org123',
    name: 'Test Organization',
    tags: ['Nashville', 'Healthcare']
  }
};

const mockAdmin = {
  id: 'admin123',
  role: 'ADMIN' as UserRole,
  firstName: 'Admin',
  lastName: 'User',
  organizationId: 'org123'
};

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  describe('getAllUsers', () => {
    it('should return paginated users for admin', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        query: { page: '1', limit: '10' }
      });
      const res = createMockResponse();

      const mockUsers = [mockUser];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);
      prismaMock.user.count.mockResolvedValue(1);

      await getAllUsers(req, res);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              tags: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      expect(res.json).toHaveBeenCalledWith({
        users: expect.arrayContaining([
          expect.not.objectContaining({
            password: expect.anything(),
            resetToken: expect.anything(),
            verifyToken: expect.anything()
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

    it('should filter users by search term', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        query: { search: 'john' }
      });
      const res = createMockResponse();

      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      await getAllUsers(req, res);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } }
            ]
          }
        })
      );
    });

    it('should handle database errors', async () => {
      const req = createMockRequest({ user: mockAdmin });
      const res = createMockResponse();

      prismaMock.user.findMany.mockRejectedValue(new Error('Database error'));

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch users' });
    });
  });

  describe('getUserById', () => {
    it('should return user by ID for admin', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        params: { id: 'user123' }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await getUserById(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              tags: true,
              city: true,
              state: true
            }
          }
        }
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: expect.anything(),
          resetToken: expect.anything()
        })
      );
    });

    it('should allow user to access their own profile', async () => {
      const req = createMockRequest({
        user: { id: 'user123', role: 'MEMBER' as UserRole },
        params: { id: 'user123' }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await getUserById(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should deny access to other users profile for non-admin', async () => {
      const req = createMockRequest({
        user: { id: 'user456', role: UserRole.MEMBER },
        params: { id: 'user123' }
      });
      const res = createMockResponse();

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should return 404 for non-existent user', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        params: { id: 'nonexistent' }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue(null);

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should return current user profile', async () => {
      const req = createMockRequest({
        user: { id: 'user123' }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await getCurrentUserProfile(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              tags: true,
              city: true,
              state: true
            }
          }
        }
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: expect.anything()
        })
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await getCurrentUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const req = createMockRequest({
        user: { id: 'user123' },
        body: {
          firstName: 'Jane',
          lastName: 'Smith',
          title: 'Manager',
          phoneNumber: '555-9999'
        }
      });
      const res = createMockResponse();

      const updatedUser = { ...mockUser, firstName: 'Jane', lastName: 'Smith' };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      await updateUserProfile(req, res);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          title: 'Manager',
          phoneNumber: '555-9999',
          profilePicture: undefined,
          updatedAt: expect.any(Date)
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              tags: true
            }
          }
        }
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith'
        })
      );
    });
  });

  describe('updateUser', () => {
    it('should allow admin to update user', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        params: { id: 'user123' },
        body: {
          firstName: 'Updated',
          status: 'INACTIVE' as UserStatus
        }
      });
      const res = createMockResponse();

      const updatedUser = { ...mockUser, firstName: 'Updated' };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      await updateUser(req, res);

      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should deny role changes for non-super-admin', async () => {
      const req = createMockRequest({
        user: mockAdmin, // Regular admin, not super admin
        params: { id: 'user123' },
        body: { role: UserRole.ADMIN }
      });
      const res = createMockResponse();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Only super admins can change user roles' });
    });

    it('should deny access for non-admin users', async () => {
      const req = createMockRequest({
        user: { id: 'user123', role: 'MEMBER' as UserRole },
        params: { id: 'user456' }
      });
      const res = createMockResponse();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });

  describe('deleteUser', () => {
    it('should allow admin to delete user', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        params: { id: 'user123' }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.delete.mockResolvedValue(mockUser);

      await deleteUser(req, res);

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: 'user123' }
      });

      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should prevent self-deletion', async () => {
      const req = createMockRequest({
        user: { id: 'admin123', role: UserRole.ADMIN },
        params: { id: 'admin123' }
      });
      const res = createMockResponse();

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot delete your own account' });
    });

    it('should return 404 for non-existent user', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        params: { id: 'nonexistent' }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue(null);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('inviteUser', () => {
    it('should create and invite new user', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        body: {
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          organizationId: 'org123'
        }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User'
      });

      await inviteUser(req, res);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          firebaseUid: 'firebase-uid-123',
          role: 'MEMBER' as UserRole,
          status: 'PENDING' as UserStatus,
          organizationId: 'org123',
          inviteToken: 'mockToken123',
          inviteTokenExp: expect.any(Date)
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User invited successfully. They will receive setup instructions via email.'
        })
      );
    });

    it('should prevent duplicate email invitations', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        body: {
          email: 'existing@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue(mockUser); // User exists

      await inviteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User with this email already exists' });
    });

    it('should prevent non-super-admin from inviting admins', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        body: {
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN' as UserRole
        }
      });
      const res = createMockResponse();

      await inviteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Only super admins can invite admin users' });
    });
  });

  describe('assignUserToOrganization', () => {
    it('should assign user to organization', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        params: { id: 'user123' },
        body: { organizationId: 'org456' }
      });
      const res = createMockResponse();

      const mockOrganization = {
        id: 'org456',
        name: 'New Organization',
        description: null,
        website: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        phoneNumber: null,
        email: null,
        isActive: true,
        tags: [],
        joinedAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        organizationId: 'org456'
      });

      await assignUserToOrganization(req, res);

      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org456' }
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          organizationId: 'org456',
          updatedAt: expect.any(Date)
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              tags: true
            }
          }
        }
      });

      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 for non-existent organization', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        params: { id: 'user123' },
        body: { organizationId: 'nonexistent' }
      });
      const res = createMockResponse();

      prismaMock.organization.findUnique.mockResolvedValue(null);

      await assignUserToOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Organization not found' });
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity for admin', async () => {
      const req = createMockRequest({
        user: mockAdmin,
        params: { id: 'user123' }
      });
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user123',
        firebaseUid: 'firebase-uid-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        role: 'MEMBER' as UserRole,
        status: 'ACTIVE' as UserStatus,
        title: 'Director',
        phoneNumber: '555-0123',
        profilePicture: null,
        lastLoginAt: new Date(),
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: null,
        inviteToken: null,
        inviteTokenExp: null
      });

      await getUserActivity(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.any(Object),
          lastLogin: expect.any(Date),
          accountCreated: expect.any(Date),
          lastUpdated: expect.any(Date)
        })
      );
    });

    it('should deny access for non-admin users', async () => {
      const req = createMockRequest({
        user: { id: 'user123', role: 'MEMBER' as UserRole },
        params: { id: 'user456' }
      });
      const res = createMockResponse();

      await getUserActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });
});