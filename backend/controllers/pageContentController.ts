import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CacheService, CacheKeys, CacheTTL } from '../utils/cache.js';

const prisma = new PrismaClient();

export const getAllPageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await prisma.pageContent.findMany({
      orderBy: [{ page: 'asc' }, { section: 'asc' }, { contentKey: 'asc' }],
    });

    res.status(200).json(content);
  } catch (error) {
    console.error('Error fetching all page content:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
};

export const getPageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page } = req.params;
    const cacheKey = CacheKeys.pageContent(page);

    const cachedContent = await CacheService.get<Record<string, any>>(cacheKey);
    if (cachedContent) {
      res.set('Cache-Control', 'public, max-age=0, must-revalidate');
      res.status(200).json(cachedContent);
      return;
    }

    const content = await prisma.pageContent.findMany({
      where: { page },
      orderBy: [{ section: 'asc' }, { contentKey: 'asc' }],
    });

    const structuredContent: Record<string, any> = {};

    content.forEach(item => {
      const key = `${item.section}_${item.contentKey}`;
      structuredContent[key] = {
        id: item.id,
        value: item.contentValue,
        type: item.contentType,
      };
    });

    await CacheService.set(cacheKey, structuredContent, 365 * 24 * 60 * 60);

    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    res.status(200).json(structuredContent);
  } catch (error) {
    console.error('Error fetching page content:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
};

export const updatePageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contentValue } = req.body;

    if (!contentValue && contentValue !== '') {
      res.status(400).json({ error: 'Content value is required' });
      return;
    }

    const updatedContent = await prisma.pageContent.update({
      where: { id },
      data: { contentValue },
    });

    const cacheKey = CacheKeys.pageContent(updatedContent.page);
    await CacheService.delete(cacheKey);

    res.status(200).json(updatedContent);
  } catch (error) {
    console.error('Error updating page content:', error);
    res.status(500).json({ error: 'Failed to update page content' });
  }
};

export const bulkUpdatePageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      res.status(400).json({ error: 'Updates array is required' });
      return;
    }

    const validUpdates = updates.filter(
      update => update.id && (update.contentValue || update.contentValue === '')
    );

    if (validUpdates.length === 0) {
      res.status(200).json({
        message: 'No valid updates to process',
        updatedCount: 0,
        updates: [],
      });
      return;
    }

    const updatePromises = validUpdates.map(update =>
      prisma.pageContent.update({
        where: { id: update.id },
        data: { contentValue: update.contentValue },
      })
    );

    const results = await prisma.$transaction(updatePromises);

    await CacheService.deletePattern(CacheKeys.pageContentAll());

    res.status(200).json({
      message: 'Content updated successfully',
      updatedCount: results.length,
      updates: results,
    });
  } catch (error) {
    console.error('Error bulk updating page content:', error);
    res.status(500).json({ error: 'Failed to bulk update page content' });
  }
};

export const createPageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, section, contentKey, contentValue, contentType } = req.body;

    if (!page || !section || !contentKey || !contentType) {
      res.status(400).json({ error: 'page, section, contentKey, and contentType are required' });
      return;
    }

    if (!['text', 'richtext', 'image'].includes(contentType)) {
      res.status(400).json({ error: 'contentType must be text, richtext, or image' });
      return;
    }

    const newContent = await prisma.pageContent.create({
      data: {
        page,
        section,
        contentKey,
        contentValue: contentValue || '',
        contentType,
      },
    });

    const cacheKey = CacheKeys.pageContent(page);
    await CacheService.delete(cacheKey);

    res.status(201).json(newContent);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Content with this page, section, and key already exists' });
      return;
    }

    console.error('Error creating page content:', error);
    res.status(500).json({ error: 'Failed to create page content' });
  }
};

export const deletePageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedContent = await prisma.pageContent.delete({
      where: { id },
    });

    const cacheKey = CacheKeys.pageContent(deletedContent.page);
    await CacheService.delete(cacheKey);

    res.status(200).json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting page content:', error);
    res.status(500).json({ error: 'Failed to delete page content' });
  }
};
