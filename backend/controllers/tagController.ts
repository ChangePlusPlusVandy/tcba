import { prisma } from '../config/prisma.js';
import { Request, Response } from 'express';

/**
 * @desc    Get all tags with announcement count
 * @route   GET /api/tags
 * @access  Public
 */
export const getTags = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        announcements: true,
        _count: {
          select: { announcements: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

/**
 * @desc    Create a new tag
 * @route   POST /api/tags
 * @access  Admin/Super Admin
 */
export const createTag = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await prisma.tag.create({
      data: { name: name.trim() },
    });

    res.status(201).json(tag);
  } catch (err: any) {
    console.error('Error creating tag:', err);

    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }

    res.status(500).json({ error: 'Failed to create tag' });
  }
};

/**
 * @desc    Attach a tag to an announcement
 * @route   POST /api/tags/attach
 * @access  Admin/Super Admin
 */
export const addTagToAnnouncement = async (req: Request, res: Response) => {
  try {
    const { announcementId, tagId } = req.body;

    if (!announcementId || !tagId) {
      return res.status(400).json({ error: 'announcementId and tagId are required' });
    }

    const updated = await prisma.announcements.update({
      where: { id: announcementId },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
      include: { tags: true },
    });

    res.status(200).json(updated);
  } catch (err: any) {
    console.error('Error attaching tag:', err);

    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Announcement or tag not found' });
    }

    res.status(500).json({ error: 'Failed to attach tag' });
  }
};

/**
 * @desc    Remove a tag from an announcement
 * @route   POST /api/tags/detach
 * @access  Admin/Super Admin
 */
export const removeTagFromAnnouncement = async (req: Request, res: Response) => {
  try {
    const { announcementId, tagId } = req.body;

    if (!announcementId || !tagId) {
      return res.status(400).json({ error: 'announcementId and tagId are required' });
    }

    const updated = await prisma.announcements.update({
      where: { id: announcementId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
      include: { tags: true },
    });

    res.status(200).json(updated);
  } catch (err: any) {
    console.error('Error removing tag:', err);

    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Announcement or tag not found' });
    }

    res.status(500).json({ error: 'Failed to remove tag' });
  }
};

/**
 * @desc    Delete a tag
 * @route   DELETE /api/tags/:id
 * @access  Admin/Super Admin
 */
export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Tag id is required' });
    }

    await prisma.tag.delete({ where: { id } });
    res.status(204).end();
  } catch (err: any) {
    console.error('Error deleting tag:', err);

    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.status(500).json({ error: 'Failed to delete tag' });
  }
};
