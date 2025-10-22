import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';

const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);
// get itemById
// delete
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
    const { title, isActive, isPublished } = req.body;
    if (!title || isActive === undefined || isPublished === undefined) {
      return res.status(400).json({
        error: 'Title, isActive, and isPublished are required',
      });
    }
    const survey = await prisma.survey.create({
      data: {
        ...req.body,
        isActive: isActive || false,
        isPublished: isPublished || false,
      },
    });
    res.status(201).json(survey);
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
};

export const deleteSurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
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
