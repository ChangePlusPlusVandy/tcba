import { OrganizationRole, PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();

jest.mock('@prisma/client', () => ({ __esModule: true, PrismaClient: jest.fn(() => prismaMock) }));
jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));

import {
  getAllSubscriptions,
  registerSubscription,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from '../../controllers/emailSubscriptionController.js';

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

const mockSubscription = {
  id: 'sub1',
  email: 'test@subscription.com',
  name: 'Test Subscriber',
  subscriptionTypes: ['newsletter', 'updates'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdmin = { id: 'admin1', role: 'ADMIN' as OrganizationRole };
const mockMember = { id: 'member1', role: 'MEMBER' as OrganizationRole };

describe('EmailSubscriptionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  describe('getAllSubscriptions', () => {
    it('should return all subscriptions for admin', async () => {
      prismaMock.emailSubscription.findMany.mockResolvedValue([mockSubscription] as any);
      const res = mockRes();
      await getAllSubscriptions(mockReq({ user: mockAdmin }), res);
      expect(res.json).toHaveBeenCalledWith([mockSubscription]);
    });

    it('should deny access for non-admin', async () => {
      const res = mockRes();
      await getAllSubscriptions(mockReq({ user: mockMember }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should filter by search query', async () => {
      prismaMock.emailSubscription.findMany.mockResolvedValue([mockSubscription] as any);
      const res = mockRes();
      await getAllSubscriptions(mockReq({ user: mockAdmin, query: { search: 'test' } }), res);
      expect(prismaMock.emailSubscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by isActive status', async () => {
      prismaMock.emailSubscription.findMany.mockResolvedValue([mockSubscription] as any);
      const res = mockRes();
      await getAllSubscriptions(mockReq({ user: mockAdmin, query: { isActive: 'true' } }), res);
      expect(prismaMock.emailSubscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });
  });

  describe('registerSubscription', () => {
    const validBody = {
      email: 'new@subscription.com',
      name: 'New Subscriber',
      subscriptionTypes: ['newsletter'],
    };

    it('should register new subscription', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue(null);
      prismaMock.emailSubscription.create.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await registerSubscription(mockReq({ body: validBody }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSubscription);
    });

    it('should reject invalid input - missing email', async () => {
      const res = mockRes();
      await registerSubscription(mockReq({ body: { name: 'Test' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and name are required' });
    });

    it('should reject invalid input - missing name', async () => {
      const res = mockRes();
      await registerSubscription(mockReq({ body: { email: 'test@test.com' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and name are required' });
    });

    it('should prevent duplicate email', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await registerSubscription(mockReq({ body: validBody }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Subscription with this email already exists',
      });
    });

    it('should create subscription with default empty subscriptionTypes array', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue(null);
      prismaMock.emailSubscription.create.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await registerSubscription(mockReq({ body: { email: 'test@test.com', name: 'Test' } }), res);
      expect(prismaMock.emailSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionTypes: [],
          }),
        })
      );
    });

    it('should allow setting isActive when provided', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue(null);
      prismaMock.emailSubscription.create.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await registerSubscription(
        mockReq({ body: { email: 'test@test.com', name: 'Test', isActive: false } }),
        res
      );
      expect(prismaMock.emailSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
          }),
        })
      );
    });
  });

  describe('getSubscriptionById', () => {
    it('should return subscription for admin', async () => {
      prismaMock.emailSubscription.findUnique.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await getSubscriptionById(mockReq({ user: mockAdmin, params: { id: 'sub1' } }), res);
      expect(res.json).toHaveBeenCalledWith(mockSubscription);
    });

    it('should deny access for non-admin', async () => {
      const res = mockRes();
      await getSubscriptionById(mockReq({ user: mockMember, params: { id: 'sub1' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should return 404 for non-existent subscription', async () => {
      prismaMock.emailSubscription.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await getSubscriptionById(mockReq({ user: mockAdmin, params: { id: 'invalid' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Subscription not found' });
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription without authentication', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue(null);
      prismaMock.emailSubscription.update.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await updateSubscription(
        mockReq({
          params: { id: 'sub1' },
          body: { name: 'Updated Name' },
        }),
        res
      );
      expect(res.json).toHaveBeenCalledWith(mockSubscription);
    });

    it('should allow non-admin to update subscription', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue(null);
      prismaMock.emailSubscription.update.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await updateSubscription(
        mockReq({
          user: mockMember,
          params: { id: 'sub1' },
          body: { name: 'Updated Name' },
        }),
        res
      );
      expect(res.json).toHaveBeenCalledWith(mockSubscription);
    });

    it('should prevent duplicate email', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        id: 'sub2',
      } as any);
      const res = mockRes();
      await updateSubscription(
        mockReq({
          params: { id: 'sub1' },
          body: { email: 'duplicate@test.com' },
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email is already in use by another subscription',
      });
    });

    it('should update subscription fields correctly', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue(null);
      prismaMock.emailSubscription.update.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      const updateData = {
        email: 'updated@test.com',
        name: 'Updated Name',
        subscriptionTypes: ['newsletter', 'promotions'],
        isActive: false,
      };
      await updateSubscription(
        mockReq({
          params: { id: 'sub1' },
          body: updateData,
        }),
        res
      );
      expect(prismaMock.emailSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub1' },
          data: expect.objectContaining(updateData),
        })
      );
    });

    it('should allow updating isActive status', async () => {
      prismaMock.emailSubscription.findFirst.mockResolvedValue(null);
      prismaMock.emailSubscription.update.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await updateSubscription(
        mockReq({
          params: { id: 'sub1' },
          body: { isActive: false },
        }),
        res
      );
      expect(prismaMock.emailSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub1' },
          data: expect.objectContaining({
            isActive: false,
          }),
        })
      );
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription for admin', async () => {
      prismaMock.emailSubscription.findUnique.mockResolvedValue(mockSubscription as any);
      prismaMock.emailSubscription.delete.mockResolvedValue(mockSubscription as any);
      const res = mockRes();
      await deleteSubscription(mockReq({ user: mockAdmin, params: { id: 'sub1' } }), res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Subscription deleted successfully' });
    });

    it('should deny access for non-admin', async () => {
      const res = mockRes();
      await deleteSubscription(mockReq({ user: mockMember, params: { id: 'sub1' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should return 404 for non-existent subscription', async () => {
      prismaMock.emailSubscription.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await deleteSubscription(mockReq({ user: mockAdmin, params: { id: 'invalid' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Subscription not found' });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in getAllSubscriptions', async () => {
      prismaMock.emailSubscription.findMany.mockRejectedValue(new Error('DB Error'));
      const res = mockRes();
      await getAllSubscriptions(mockReq({ user: mockAdmin }), res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch subscriptions' });
    });

    it('should handle database errors in registerSubscription', async () => {
      prismaMock.emailSubscription.findFirst.mockRejectedValue(new Error('DB Error'));
      const res = mockRes();
      await registerSubscription(mockReq({ body: { email: 'test@test.com', name: 'Test' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to register subscription' });
    });

    it('should handle database errors in updateSubscription', async () => {
      prismaMock.emailSubscription.findFirst.mockRejectedValue(new Error('DB Error'));
      const res = mockRes();
      await updateSubscription(
        mockReq({
          params: { id: 'sub1' },
          body: { email: 'updated@test.com' },
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update subscription' });
    });

    it('should handle database errors in deleteSubscription', async () => {
      prismaMock.emailSubscription.findUnique.mockRejectedValue(new Error('DB Error'));
      const res = mockRes();
      await deleteSubscription(mockReq({ user: mockAdmin, params: { id: 'sub1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete subscription' });
    });
  });
});
