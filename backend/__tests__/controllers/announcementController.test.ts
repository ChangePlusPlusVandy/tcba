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
        slug: 'test',
        title: 'Test',
        content: 'Hello world',
        publishedDate: new Date(),
        isPublished: true,
        attachmentUrls: [],
        createdByAdminId: 'admin123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);

    const res = await request(app).get('/api/announcements');

    expect(res.statusCode).toBe(200);
    expect(res.body[0].title).toBe('Test');
  });

  it('POST /api/announcements creates an announcement', async () => {
    prismaMock.announcements.create.mockResolvedValue({
      id: '2',
      slug: 'new-announcement',
      title: 'New Announcement',
      content: 'This is a test',
      publishedDate: new Date(),
      isPublished: false,
      attachmentUrls: [],
      createdByAdminId: 'admin456',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await request(app).post('/api/announcements').send({
      title: 'New Announcement',
      content: 'This is a test',
      createdByAdminId: 'admin456',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('New Announcement');
  });

  it('GET /api/announcements/published-date/:publishedDate returns announcements for that date', async () => {
    const publishedDate = '2025-05-01';
    const mockAnnouncements = [
      {
        id: '3',
        slug: 'published-announcement',
        title: 'Published Announcement',
        content: 'Announcement content',
        publishedDate: new Date('2025-05-01T12:00:00.000Z'),
        isPublished: true,
        attachmentUrls: [],
        createdByAdminId: 'admin789',
        createdAt: new Date('2025-04-30T18:00:00.000Z'),
        updatedAt: new Date('2025-05-01T12:00:00.000Z'),
      },
    ];

    prismaMock.announcements.findMany.mockResolvedValue(mockAnnouncements);

    const res = await request(app).get(`/api/announcements/published-date/${publishedDate}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(JSON.parse(JSON.stringify(mockAnnouncements)));
    expect(prismaMock.announcements.findMany).toHaveBeenCalledWith({
      where: {
        publishedDate: {
          gte: new Date('2025-05-01T00:00:00.000Z'),
          lte: new Date('2025-05-01T23:59:59.999Z'),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('GET /api/announcements/published-date/:publishedDate returns 400 for invalid date', async () => {
    const res = await request(app).get('/api/announcements/published-date/not-a-date');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid publishedDate');
    expect(prismaMock.announcements.findMany).not.toHaveBeenCalled();
  });
});
