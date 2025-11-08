import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { createNotification } from './inAppNotificationController.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';
const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);

export const getAllSurveys = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, isActive, isPublished } = req.body;
    const where: any = {
      ...(title ? { title } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
    };
    const surveys = await prisma.survey.findMany({ where, orderBy: { title: 'asc' } });
    res.json(surveys);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
};

export const getSurveyById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetId = resolveTargetId(req.params.id, req.user?.id);
    if (!targetId) return res.status(401).json({ error: 'Organization not authenticated' });
    const survey = await prisma.survey.findUnique({ where: { id: targetId } });
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
};

export const createSurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const { title, isActive, isPublished } = req.body;
    if (!title || isActive === undefined || isPublished === undefined) {
      return res.status(400).json({
        error: 'Title, isActive, and isPublished are required',
      });
    }
    const survey = await prisma.survey.create({
      data: {
        ...req.body,
      },
    });

    if (survey.isPublished) {
      try {
        await createNotification('SURVEY', survey.title, survey.id);
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    }

    res.status(201).json(survey);
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
};

export const updateSurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;

    const { title, description, questions, dueDate, isActive, isPublished, status } = req.body as {
      title?: string;
      description?: string | null;
      questions?: JSON;
      dueDate?: string | Date | null;
      isActive?: boolean;
      isPublished?: boolean;
      status?: string;
    };

    const existingSurvey = await prisma.survey.findUnique({
      where: { id },
    });

    if (!existingSurvey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const jsonEqual = (a: any, b: any) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

    const dateEqual = (a: any, b: any) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      const da = a instanceof Date ? a : new Date(a);
      const db = b instanceof Date ? b : new Date(b);
      return da.getTime() === db.getTime();
    };

    const dataToUpdate: Record<string, any> = {};

    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (questions !== undefined) dataToUpdate.questions = questions;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;
    if (isPublished !== undefined) dataToUpdate.isPublished = isPublished;
    if (status !== undefined) dataToUpdate.status = status;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    const nothingActuallyChanged =
      (dataToUpdate.title === undefined || dataToUpdate.title === existingSurvey.title) &&
      (dataToUpdate.description === undefined ||
        dataToUpdate.description === existingSurvey.description) &&
      (dataToUpdate.questions === undefined ||
        jsonEqual(dataToUpdate.questions, existingSurvey.questions)) &&
      (dataToUpdate.dueDate === undefined ||
        dateEqual(dataToUpdate.dueDate, existingSurvey.dueDate)) &&
      (dataToUpdate.isActive === undefined || dataToUpdate.isActive === existingSurvey.isActive) &&
      (dataToUpdate.isPublished === undefined ||
        dataToUpdate.isPublished === existingSurvey.isPublished) &&
      (dataToUpdate.status === undefined || dataToUpdate.status === existingSurvey.status);

    if (nothingActuallyChanged) {
      return res.status(400).json({ error: 'No changes to update' });
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json(updatedSurvey);
  } catch (error) {
    console.error('Error updating survey:', error);
    return res.status(500).json({ error: 'Failed to update survey' });
  }
};

export const getActiveSurveys = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const surveys = await prisma.survey.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
    res.json(surveys);
  } catch (error) {
    console.error('Error fetching active surveys:', error);
    res.status(500).json({ error: 'Failed to fetch active surveys' });
  }
};

export const publishSurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const survey = await prisma.survey.update({
      where: { id },
      data: { status: 'ACTIVE', isPublished: true, isActive: true },
    });
    res.json(survey);
  } catch (error) {
    console.error('Error publishing survey:', error);
    res.status(500).json({ error: 'Failed to publish survey' });
  }
};

export const closeSurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const survey = await prisma.survey.update({
      where: { id },
      data: { status: 'CLOSED', isActive: false },
    });
    res.json(survey);
  } catch (error) {
    console.error('Error closing survey:', error);
    res.status(500).json({ error: 'Failed to close survey' });
  }
};

export const deleteSurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role)) return res.status(403).json({ error: 'Admin only' });

    const targetId = resolveTargetId(req.params.id, req.user?.id);
    if (!targetId) return res.status(401).json({ error: 'Survey not authenticated' });
    const survey = await prisma.survey.findUnique({ where: { id: targetId } });
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    await prisma.survey.delete({ where: { id: targetId } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
};
