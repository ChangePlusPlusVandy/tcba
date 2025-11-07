import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { createNotification } from './inAppNotificationController.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

export const getAllBlogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { published, startDate, endDate, tags, search, sortBy, sortOrder, limit, offset } =
      req.query;

    const where: any = {};
    if (!req.user || !isAdmin(req.user.role)) {
      where.isPublished = true;
    } else if (published !== undefined) {
      where.isPublished = published === 'true';
    }
    if (startDate || endDate) {
      where.publishedDate = {};
      if (startDate) where.publishedDate.gte = new Date(startDate as string);
      if (endDate) where.publishedDate.lte = new Date(endDate as string);
    }
    if (tags) {
      where.tags = { hasSome: (tags as string).split(',').map(t => t.trim()) };
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
        { author: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { [(sortBy as string) || 'publishedDate']: (sortOrder as string) || 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined,
    });

    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

export const getBlogById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog by ID:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

export const getBlogTags = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      select: { tags: true },
    });
    const allTags = blogs.flatMap(b => b.tags);
    const uniqueTags = [...new Set(allTags)].sort();

    res.json(uniqueTags);
  } catch (error) {
    console.error('Error fetching blog tags:', error);
    res.status(500).json({ error: 'Failed to fetch blog tags' });
  }
};

export const createBlog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const { title, content, author, tags, featuredImageUrl } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'title, content, and author are required' });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        author,
        tags: tags || [],
        featuredImageUrl: featuredImageUrl || null,
        isPublished: false,
        publishedDate: null,
      },
    });

    res.status(201).json(blog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

export const updateBlog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const blogToUpdate = await prisma.blog.findUnique({ where: { id } });
    if (!blogToUpdate) return res.status(404).json({ error: 'Blog not found' });

    const { title, content, author, tags, featuredImageUrl } = req.body;

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(author && { author }),
        ...(tags && { tags }),
        ...(featuredImageUrl !== undefined && { featuredImageUrl }),
      },
    });

    res.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

export const deleteBlog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const blogToDelete = await prisma.blog.findUnique({ where: { id } });
    if (!blogToDelete) return res.status(404).json({ error: 'Blog not found' });

    await prisma.blog.delete({ where: { id } });
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

export const publishBlog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const publishedBlog = await prisma.blog.update({
      where: { id },
      data: {
        isPublished: true,
        publishedDate: new Date(),
      },
    });
    
    try {
      await createNotification('BLOG', publishedBlog.title, publishedBlog.id);
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.json(publishedBlog);
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
};

export const unpublishBlog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const unpublishedBlog = await prisma.blog.update({
      where: { id },
      data: {
        isPublished: false,
      },
    });

    res.json(unpublishedBlog);
  } catch (error) {
    console.error('Error unpublishing blog:', error);
    res.status(500).json({ error: 'Failed to unpublish blog' });
  }
};
