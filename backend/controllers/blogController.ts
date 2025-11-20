import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { createNotification } from './inAppNotificationController.js';
import { sendBlogEmails } from '../services/emailNotificationService.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

const generateSlug = async (title: string, id: string): Promise<string> => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseSlug}-${id.substring(0, 8)}`;
};

export const getAllBlogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let isAuthenticatedAdmin = false;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { verifyToken } = await import('@clerk/express');
        const verifiedToken = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
          clockSkewInMs: 5000,
        });

        const adminUser = await prisma.adminUser.findUnique({
          where: { clerkId: verifiedToken.sub },
        });

        if (adminUser) {
          isAuthenticatedAdmin = true;
          console.log('Admin authenticated in getAllBlogs');
        }
      } catch (error) {
        console.log('Auth failed in getAllBlogs, treating as public');
      }
    }

    const { published, startDate, endDate, tags, search, sortBy, sortOrder, limit, offset } =
      req.query;

    const where: any = {};
    if (!isAuthenticatedAdmin) {
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
      const tagNames = (tags as string).split(',').map(t => t.trim());
      where.tags = {
        some: {
          name: { in: tagNames },
        },
      };
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
      include: { tags: true },
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

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog by ID:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

export const getBlogBySlug = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: { tags: true },
    });

    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

export const getBlogTags = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        blogs: {
          some: {
            isPublished: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(tags);
  } catch (error) {
    console.error('Error fetching blog tags:', error);
    res.status(500).json({ error: 'Failed to fetch blog tags' });
  }
};

export const createBlog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const { title, content, author, tags, tagIds, featuredImageUrl, isPublished, publishedDate, attachmentUrls } =
      req.body;

    console.log('createBlog - Received data:', { title, author, tags, tagIds, isPublished, attachmentUrls });

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'title, content, and author are required' });
    }

    const tempBlog = await prisma.blog.create({
      data: {
        title,
        content,
        author,
        slug: 'temp',
        featuredImageUrl: featuredImageUrl || null,
        isPublished: isPublished || false,
        publishedDate: isPublished ? publishedDate || new Date() : null,
        attachmentUrls: attachmentUrls || [],
      },
    });

    const slug = await generateSlug(title, tempBlog.id);

    const tagIdsToUse = tagIds || tags || [];
    console.log('createBlog - Tag IDs to use:', tagIdsToUse);
    const tagConnections = tagIdsToUse.map((id: string) => ({ id }));
    console.log('createBlog - Tag connections:', tagConnections);

    const blog = await prisma.blog.update({
      where: { id: tempBlog.id },
      data: {
        slug,
        tags: { connect: tagConnections },
      },
      include: { tags: true },
    });

    if (blog.isPublished) {
      try {
        await createNotification('BLOG', blog.title, blog.slug || blog.id);
        await sendBlogEmails(blog.id);
        console.log('Blog notifications sent successfully');
      } catch (notifError) {
        console.error('Failed to create notification or send emails:', notifError);
      }
    }

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

    const blogToUpdate = await prisma.blog.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!blogToUpdate) return res.status(404).json({ error: 'Blog not found' });

    const { title, content, author, tags, tagIds, featuredImageUrl, attachmentUrls } = req.body;

    const updateData: any = {
      ...(title && { title }),
      ...(content && { content }),
      ...(author && { author }),
      ...(featuredImageUrl !== undefined && { featuredImageUrl }),
      ...(attachmentUrls !== undefined && { attachmentUrls }),
    };

    // Handle tags update if provided (accept both 'tags' and 'tagIds')
    const tagIdsToUse = tagIds || tags;
    if (tagIdsToUse) {
      const currentTagIds = blogToUpdate.tags.map(t => t.id);
      const newTagIds = tagIdsToUse;
      const toDisconnect = currentTagIds.filter((id: string) => !newTagIds.includes(id));
      const toConnect = newTagIds.filter((id: string) => !currentTagIds.includes(id));

      updateData.tags = {
        disconnect: toDisconnect.map((id: string) => ({ id })),
        connect: toConnect.map((id: string) => ({ id })),
      };
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: updateData,
      include: { tags: true },
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
      await createNotification('BLOG', publishedBlog.title, publishedBlog.slug || publishedBlog.id);
      await sendBlogEmails(publishedBlog.id);
      console.log('Blog notifications sent successfully');
    } catch (notifError) {
      console.error('Failed to create notification or send emails:', notifError);
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
