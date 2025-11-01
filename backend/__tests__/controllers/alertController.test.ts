import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

jest.mock('../../config/prisma', () => {
  const prismaMock = mockDeep<PrismaClient>();
  return {
    __esModule: true,
    default: prismaMock,
    prisma: prismaMock,
  };
});

jest.mock('../../services/EmailService', () => ({
  EmailService: {
    sendAlertEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

import prisma from '../../config/prisma';
import alertRoutes from '../../routes/alertRoutes';
import { EmailService } from '../../services/EmailService';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware with flexible user
let mockUser: any = {
  id: 'test-user-id',
  clerkId: 'test-clerk-id',
  role: 'SUPER_ADMIN',
  email: 'admin@test.com',
  name: 'Test Admin',
};

app.use((req: any, res, next) => {
  req.user = mockUser;
  next();
});

app.use('/api/alerts', alertRoutes);

// Helper to set mock user
const setMockUser = (user: any) => {
  mockUser = user;
};

beforeEach(() => {
  mockReset(prismaMock);
  jest.clearAllMocks();
  // Reset to admin by default
  setMockUser({
    id: 'test-user-id',
    clerkId: 'test-clerk-id',
    role: 'SUPER_ADMIN',
    email: 'admin@test.com',
    name: 'Test Admin',
  });
});

describe('Alert Routes', () => {
  const mockAlert = {
    id: '1',
    title: 'Test Alert',
    content: 'This is a test alert',
    priority: 'MEDIUM' as const,
    publishedDate: new Date(),
    isPublished: true,
    attachmentUrls: [],
    tags: ['healthcare'],
    createdByAdminId: 'admin123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization = {
    id: 'org-1',
    clerkId: 'clerk-org-1',
    name: 'Test Healthcare Org',
    email: 'org@test.com',
    tags: ['healthcare', 'education'],
    role: 'MEMBER' as const,
    membershipActive: true,
    status: 'ACTIVE' as const,
  };

  describe('GET /api/alerts', () => {
    it('returns all published alerts for admins', async () => {
      prismaMock.alert.findMany.mockResolvedValue([mockAlert]);

      const res = await request(app).get('/api/alerts');

      expect(res.statusCode).toBe(200);
      expect(res.body[0].title).toBe('Test Alert');
    });

    it('filters alerts by matching tags for non-admin organizations', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.alert.findMany.mockResolvedValue([
        mockAlert, // has 'healthcare' tag - should be included
        { ...mockAlert, id: '2', tags: ['finance'] }, // no matching tag - should be filtered out
      ]);

      const res = await request(app).get('/api/alerts');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe('1');
    });

    it('shows broadcast alerts (no tags) to all organizations', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.alert.findMany.mockResolvedValue([
        { ...mockAlert, tags: [] }, // broadcast alert - should be visible
      ]);

      const res = await request(app).get('/api/alerts');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('returns alerts filtered by priority', async () => {
      const urgentAlert = { ...mockAlert, priority: 'URGENT' as const };
      prismaMock.alert.findMany.mockResolvedValue([urgentAlert]);

      const res = await request(app).get('/api/alerts?priority=URGENT');

      expect(res.statusCode).toBe(200);
      expect(res.body[0].priority).toBe('URGENT');
    });

    it('returns 401 if user is not authenticated', async () => {
      setMockUser(null);

      const res = await request(app).get('/api/alerts');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('GET /api/alerts/:id', () => {
    it('returns a specific alert by ID for admins', async () => {
      prismaMock.alert.findUnique.mockResolvedValue(mockAlert);

      const res = await request(app).get('/api/alerts/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe('1');
    });

    it('returns alert if organization has matching tags', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      prismaMock.alert.findUnique.mockResolvedValue(mockAlert);
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);

      const res = await request(app).get('/api/alerts/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe('1');
    });

    it('returns 403 if organization does not have matching tags', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      prismaMock.alert.findUnique.mockResolvedValue({
        ...mockAlert,
        tags: ['finance'], // org doesn't have this tag
      });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);

      const res = await request(app).get('/api/alerts/1');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Access denied');
    });

    it('returns broadcast alert (no tags) to any organization', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      prismaMock.alert.findUnique.mockResolvedValue({ ...mockAlert, tags: [] });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);

      const res = await request(app).get('/api/alerts/1');

      expect(res.statusCode).toBe(200);
    });

    it('returns 404 if alert not found', async () => {
      prismaMock.alert.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/alerts/nonexistent');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Alert not found');
    });

    it('returns 403 if non-admin tries to view unpublished alert', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      prismaMock.alert.findUnique.mockResolvedValue({ ...mockAlert, isPublished: false });

      const res = await request(app).get('/api/alerts/1');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Access denied');
    });
  });

  describe('GET /api/alerts/priority/:priority', () => {
    it('returns alerts by priority level for admins', async () => {
      const urgentAlerts = [{ ...mockAlert, priority: 'URGENT' as const }];
      prismaMock.alert.findMany.mockResolvedValue(urgentAlerts);

      const res = await request(app).get('/api/alerts/priority/URGENT');

      expect(res.statusCode).toBe(200);
      expect(res.body[0].priority).toBe('URGENT');
    });

    it('filters alerts by tags for non-admin organizations', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.alert.findMany.mockResolvedValue([
        { ...mockAlert, priority: 'URGENT' as const, tags: ['healthcare'] },
        { ...mockAlert, id: '2', priority: 'URGENT' as const, tags: ['finance'] },
      ]);

      const res = await request(app).get('/api/alerts/priority/URGENT');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].tags).toContain('healthcare');
    });

    it('returns 400 for invalid priority', async () => {
      const res = await request(app).get('/api/alerts/priority/INVALID');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid priority');
    });
  });

  describe('POST /api/alerts', () => {
    it('creates a new alert as admin', async () => {
      const newAlert = {
        ...mockAlert,
        id: '2',
        title: 'New Alert',
        isPublished: false,
      };
      prismaMock.alert.create.mockResolvedValue(newAlert);

      const res = await request(app).post('/api/alerts').send({
        title: 'New Alert',
        content: 'This is a new test alert',
        priority: 'MEDIUM',
        tags: ['healthcare'],
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('New Alert');
    });

    it('returns 403 if non-admin tries to create alert', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      const res = await request(app).post('/api/alerts').send({
        title: 'New Alert',
        content: 'This is a new test alert',
        priority: 'MEDIUM',
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Admin access required');
    });

    it('returns 400 if title or content missing', async () => {
      const res = await request(app).post('/api/alerts').send({
        priority: 'MEDIUM',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Title and content are required');
    });

    it('sends emails only to organizations with matching tags', async () => {
      const publishedAlert = { ...mockAlert, isPublished: true, tags: ['healthcare'] };
      prismaMock.alert.create.mockResolvedValue(publishedAlert);
      prismaMock.organization.findMany.mockResolvedValue([
        {
          ...mockOrganization,
          id: 'org1',
          tags: ['healthcare'], // has matching tag
          primaryContactEmail: 'healthcare@test.com',
          primaryContactName: 'Healthcare Contact',
          primaryContactPhone: '123-456-7890',
        } as any,
        {
          ...mockOrganization,
          id: 'org2',
          tags: ['finance'], // no matching tag
          primaryContactEmail: 'finance@test.com',
          primaryContactName: 'Finance Contact',
          primaryContactPhone: '123-456-7891',
        } as any,
      ]);

      const res = await request(app).post('/api/alerts').send({
        title: 'Healthcare Alert',
        content: 'Healthcare specific alert',
        tags: ['healthcare'],
        isPublished: true,
      });

      expect(res.statusCode).toBe(201);
      expect(EmailService.sendAlertEmail).toHaveBeenCalledTimes(1);
      expect(EmailService.sendAlertEmail).toHaveBeenCalledWith({
        to: 'healthcare@test.com',
        organizationName: 'Test Healthcare Org',
        alertTitle: 'Test Alert',
        alertContent: 'This is a test alert',
        alertPriority: 'MEDIUM',
        attachmentUrls: [],
      });
    });

    it('sends broadcast alert (no tags) to all organizations', async () => {
      const broadcastAlert = { ...mockAlert, isPublished: true, tags: [] };
      prismaMock.alert.create.mockResolvedValue(broadcastAlert);
      prismaMock.organization.findMany.mockResolvedValue([
        {
          ...mockOrganization,
          id: 'org1',
          tags: ['healthcare'],
          primaryContactEmail: 'org1@test.com',
          primaryContactName: 'Org 1',
          primaryContactPhone: '123-456-7890',
        } as any,
        {
          ...mockOrganization,
          id: 'org2',
          tags: ['finance'],
          primaryContactEmail: 'org2@test.com',
          primaryContactName: 'Org 2',
          primaryContactPhone: '123-456-7891',
        } as any,
      ]);

      const res = await request(app).post('/api/alerts').send({
        title: 'Broadcast Alert',
        content: 'This goes to everyone',
        tags: [],
        isPublished: true,
      });

      expect(res.statusCode).toBe(201);
      expect(EmailService.sendAlertEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('PUT /api/alerts/:id', () => {
    it('updates an existing alert as admin', async () => {
      const updatedAlert = { ...mockAlert, title: 'Updated Alert' };
      prismaMock.alert.findUnique.mockResolvedValue(mockAlert);
      prismaMock.alert.update.mockResolvedValue(updatedAlert);

      const res = await request(app).put('/api/alerts/1').send({
        title: 'Updated Alert',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Alert');
    });

    it('returns 403 if non-admin tries to update alert', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      const res = await request(app).put('/api/alerts/1').send({
        title: 'Updated Alert',
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Admin access required');
    });

    it('returns 404 if alert to update not found', async () => {
      prismaMock.alert.findUnique.mockResolvedValue(null);

      const res = await request(app).put('/api/alerts/nonexistent').send({
        title: 'Updated Alert',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Alert not found');
    });

    it('sends emails when alert is published for the first time', async () => {
      const unpublishedAlert = { ...mockAlert, isPublished: false };
      const publishedAlert = { ...mockAlert, isPublished: true };

      prismaMock.alert.findUnique.mockResolvedValue(unpublishedAlert);
      prismaMock.alert.update.mockResolvedValue(publishedAlert);
      prismaMock.organization.findMany.mockResolvedValue([]);

      const res = await request(app).put('/api/alerts/1').send({
        isPublished: true,
      });

      expect(res.statusCode).toBe(200);
      expect(prismaMock.organization.findMany).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    it('deletes an alert as admin', async () => {
      prismaMock.alert.findUnique.mockResolvedValue(mockAlert);
      prismaMock.alert.delete.mockResolvedValue(mockAlert);

      const res = await request(app).delete('/api/alerts/1');

      expect(res.statusCode).toBe(204);
    });

    it('returns 403 if non-admin tries to delete alert', async () => {
      setMockUser({
        id: 'org-1',
        clerkId: 'clerk-org-1',
        role: 'MEMBER',
        email: 'org@test.com',
        name: 'Test Org',
      });

      const res = await request(app).delete('/api/alerts/1');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Admin access required');
    });

    it('returns 404 if alert to delete not found', async () => {
      prismaMock.alert.findUnique.mockResolvedValue(null);

      const res = await request(app).delete('/api/alerts/nonexistent');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Alert not found');
    });
  });

  describe('POST /api/alerts/:id/publish', () => {
    it('publishes an alert and sends notifications', async () => {
      const unpublishedAlert = { ...mockAlert, isPublished: false };
      const publishedAlert = { ...mockAlert, isPublished: true };

      prismaMock.alert.findUnique.mockResolvedValue(unpublishedAlert);
      prismaMock.alert.update.mockResolvedValue(publishedAlert);
      prismaMock.organization.findMany.mockResolvedValue([]);

      const res = await request(app).post('/api/alerts/1/publish');

      expect(res.statusCode).toBe(200);
      expect(res.body.isPublished).toBe(true);
      expect(prismaMock.organization.findMany).toHaveBeenCalled();
    });

    it('returns 400 if alert is already published', async () => {
      prismaMock.alert.findUnique.mockResolvedValue(mockAlert);

      const res = await request(app).post('/api/alerts/1/publish');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Alert is already published');
    });

    it('returns 404 if alert not found', async () => {
      prismaMock.alert.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/alerts/nonexistent/publish');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Alert not found');
    });
  });
});

