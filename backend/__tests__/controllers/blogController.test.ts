import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types/index.js';
import { prisma } from '../../config/prisma.js';
import {
  getAllBlogs,
  getBlogById,
  getBlogTags,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
} from '../../controllers/blogController.js';

jest.mock('../../config/prisma.js', () => ({
  prisma: {
    blog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Blog Controller', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = {
      user: {
        id: 'admin123',
        clerkId: 'clerk_admin123',
        role: 'ADMIN',
        email: 'admin@tcba.org',
        name: 'Admin User',
      },
      query: {},
      params: {},
      body: {},
    };
    res = {
      json: jsonMock,
      status: statusMock,
    };
    jest.clearAllMocks();
  });

  describe('getAllBlogs', () => {
    it('should return published blogs for public users', async () => {
      const mockBlogs = [
        {
          id: '1',
          title: 'Test Blog',
          content: '<p>Test content</p>',
          author: 'John Doe',
          tags: ['test'],
          isPublished: true,
          publishedDate: new Date(),
        },
      ];

      (prisma.blog.findMany as jest.Mock).mockResolvedValue(mockBlogs);
      req.user = undefined;

      await getAllBlogs(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublished: true }),
        })
      );
      expect(jsonMock).toHaveBeenCalledWith(mockBlogs);
    });

    it('should filter blogs by date range', async () => {
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
      (prisma.blog.findMany as jest.Mock).mockResolvedValue([]);

      await getAllBlogs(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            publishedDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          }),
        })
      );
    });

    it('should filter blogs by tags', async () => {
      req.query = { tags: 'Healthcare,Policy' };
      (prisma.blog.findMany as jest.Mock).mockResolvedValue([]);

      await getAllBlogs(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ['Healthcare', 'Policy'] },
          }),
        })
      );
    });

    it('should handle errors', async () => {
      (prisma.blog.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getAllBlogs(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch blogs' });
    });
  });

  describe('getBlogById', () => {
    it('should return blog by ID for admin', async () => {
      const mockBlog = {
        id: '1',
        title: 'Test Blog',
        content: '<p>Test</p>',
        author: 'John',
      };
      req.params = { id: '1' };
      (prisma.blog.findUnique as jest.Mock).mockResolvedValue(mockBlog);

      await getBlogById(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(jsonMock).toHaveBeenCalledWith(mockBlog);
    });

    it('should return 401 if not authenticated', async () => {
      req.user = undefined;
      req.params = { id: '1' };

      await getBlogById(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });

    it('should return 403 if not admin', async () => {
      req.user = {
        id: 'org123',
        clerkId: 'clerk_org123',
        role: 'MEMBER',
        email: 'org@example.com',
        name: 'Org User',
      };
      req.params = { id: '1' };

      await getBlogById(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Admin only' });
    });

    it('should return 404 if blog not found', async () => {
      req.params = { id: 'nonexistent' };
      (prisma.blog.findUnique as jest.Mock).mockResolvedValue(null);

      await getBlogById(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Blog not found' });
    });
  });

  describe('getBlogTags', () => {
    it('should return unique tags from published blogs', async () => {
      const mockBlogs = [
        { tags: ['Healthcare', 'Policy'] },
        { tags: ['Healthcare', 'Advocacy'] },
        { tags: ['Policy'] },
      ];
      (prisma.blog.findMany as jest.Mock).mockResolvedValue(mockBlogs);

      await getBlogTags(req as AuthenticatedRequest, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(['Advocacy', 'Healthcare', 'Policy']);
    });
  });

  describe('createBlog', () => {
    it('should create a new blog', async () => {
      const mockBlog = {
        id: '1',
        title: 'New Blog',
        content: '<p>Content</p>',
        author: 'John Doe',
        tags: ['test'],
        isPublished: false,
      };
      req.body = {
        title: 'New Blog',
        content: '<p>Content</p>',
        author: 'John Doe',
        tags: ['test'],
      };
      (prisma.blog.create as jest.Mock).mockResolvedValue(mockBlog);

      await createBlog(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.create).toHaveBeenCalledWith({
        data: {
          title: 'New Blog',
          content: '<p>Content</p>',
          author: 'John Doe',
          tags: ['test'],
          featuredImageUrl: null,
          isPublished: false,
          publishedDate: null,
        },
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockBlog);
    });

    it('should return 400 if required fields missing', async () => {
      req.body = { title: 'Test' }; // Missing content and author

      await createBlog(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'title, content, and author are required',
      });
    });
  });

  describe('updateBlog', () => {
    it('should update existing blog', async () => {
      const mockBlog = { id: '1', title: 'Old Title' };
      const updatedBlog = { id: '1', title: 'New Title' };
      req.params = { id: '1' };
      req.body = { title: 'New Title' };
      (prisma.blog.findUnique as jest.Mock).mockResolvedValue(mockBlog);
      (prisma.blog.update as jest.Mock).mockResolvedValue(updatedBlog);

      await updateBlog(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'New Title' },
      });
      expect(jsonMock).toHaveBeenCalledWith(updatedBlog);
    });

    it('should return 404 if blog not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { title: 'New Title' };
      (prisma.blog.findUnique as jest.Mock).mockResolvedValue(null);

      await updateBlog(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Blog not found' });
    });
  });

  describe('deleteBlog', () => {
    it('should delete blog', async () => {
      const mockBlog = { id: '1', title: 'Test' };
      req.params = { id: '1' };
      (prisma.blog.findUnique as jest.Mock).mockResolvedValue(mockBlog);
      (prisma.blog.delete as jest.Mock).mockResolvedValue(mockBlog);

      await deleteBlog(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Blog deleted successfully' });
    });
  });

  describe('publishBlog', () => {
    it('should publish blog', async () => {
      const mockBlog = { id: '1', isPublished: false };
      const publishedBlog = { id: '1', isPublished: true, publishedDate: expect.any(Date) };
      req.params = { id: '1' };
      (prisma.blog.findUnique as jest.Mock).mockResolvedValue(mockBlog);
      (prisma.blog.update as jest.Mock).mockResolvedValue(publishedBlog);

      await publishBlog(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isPublished: true, publishedDate: expect.any(Date) },
      });
      expect(jsonMock).toHaveBeenCalledWith(publishedBlog);
    });
  });

  describe('unpublishBlog', () => {
    it('should unpublish blog', async () => {
      const mockBlog = { id: '1', isPublished: true };
      const unpublishedBlog = { id: '1', isPublished: false };
      req.params = { id: '1' };
      (prisma.blog.findUnique as jest.Mock).mockResolvedValue(mockBlog);
      (prisma.blog.update as jest.Mock).mockResolvedValue(unpublishedBlog);

      await unpublishBlog(req as AuthenticatedRequest, res as Response);

      expect(prisma.blog.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isPublished: false },
      });
      expect(jsonMock).toHaveBeenCalledWith(unpublishedBlog);
    });
  });
});
