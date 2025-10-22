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

import prisma from '../../config/prisma';
import announcementRoutes from '../../routes/announcementRoutes';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
// setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/announcements', announcementRoutes);

beforeEach(() => {
  mockReset(prismaMock);
});

describe('Announcement Routes', () => {
  it('GET /api/announcements returns all announcements', async () => {
    prismaMock.announcements.findMany.mockResolvedValue([
      {
        id: '1',
        title: 'Test',
        content: 'Hello world',
        publishedDate: new Date(),
        isPublished: true,
        attachmentUrls: [],
        tags: [],
        createdByAdminId: 'admin123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app).get('/api/announcements');

    expect(res.statusCode).toBe(200);
    expect(res.body[0].title).toBe('Test');
  });

  it('POST /api/announcements creates a new announcement', async () => {
    prismaMock.announcements.create.mockResolvedValue({
      id: '2',
      title: 'New Announcement',
      content: 'This is a test',
      publishedDate: new Date(),
      isPublished: false,
      attachmentUrls: [],
      tags: [],
      createdByAdminId: 'admin456',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post('/api/announcements').send({
      title: 'New Announcement',
      content: 'This is a test',
      createdByAdminId: 'admin456',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('New Announcement');
  });
});
