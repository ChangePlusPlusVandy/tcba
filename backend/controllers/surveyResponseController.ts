import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN' || role === 'SUPER_ADMIN';

const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);

/**
 * @desc    Get all survey responses (admin only)
 * @route   GET /api/survey-responses
 * @access  Admin/Super Admin only
 */
export const getAllResponses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const { surveyId, organizationId } = req.query;
    const where: any = {
      ...(surveyId && { surveyId: surveyId as string }),
      ...(organizationId && { organizationId: organizationId as string }),
    };

    const surveyResponses = await prisma.surveyResponse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        survey: { select: { title: true } },
        organization: { select: { name: true } },
      },
    });
    res.json(surveyResponses);
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    res.status(500).json({ error: 'Failed to fetch survey responses' });
  }
};

/**
 * @desc    Get single survey response by ID
 * @route   GET /api/survey-responses/:id
 * @access  Admin or own organization
 */
export const getResponseById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const surveyResponse = await prisma.surveyResponse.findUnique({
      where: { id },
      include: {
        survey: { select: { title: true, description: true } },
        organization: { select: { name: true } },
      },
    });
    if (!surveyResponse) return res.status(404).json({ error: 'Survey response not found' });
    if (!isAdmin(req.user.role) && surveyResponse.organizationId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(surveyResponse);
  } catch (error) {
    console.error('Error fetching survey response by ID:', error);
    res.status(500).json({ error: 'Failed to fetch survey response' });
  }
};

/**
 * @desc    Submit survey response (organization submits)
 * @route   POST /api/survey-responses
 * @access  Authenticated organization
 */
export const createResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    let { responses, surveyId, organizationId } = req.body;

    if (!surveyId || !organizationId) {
      return res.status(400).json({ error: 'surveyId and organizationId are required' });
    }
    if (responses == null) {
      return res.status(400).json({ error: 'responses is required' });
    }
    if (!isAdmin(req.user.role) && organizationId !== req.user.id) {
      return res.status(403).json({ error: 'Can only submit responses for your own organization' });
    }
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    if (!survey.isActive || !survey.isPublished) {
      return res.status(400).json({ error: 'Survey is not available for responses' });
    }
    const existingResponse = await prisma.surveyResponse.findFirst({
      where: { surveyId, organizationId },
    });
    if (existingResponse) {
      return res
        .status(400)
        .json({ error: 'Organization has already submitted a response to this survey' });
    }

    if (typeof responses === 'string') {
      try {
        responses = JSON.parse(responses);
      } catch {
        return res.status(400).json({ error: 'responses must be valid JSON' });
      }
    }

    const surveyResponse = await prisma.surveyResponse.create({
      data: {
        surveyId,
        organizationId,
        responses,
        submittedDate: new Date(),
      },
      include: {
        survey: { select: { title: true } },
        organization: { select: { name: true } },
      },
    });
    res.status(201).json(surveyResponse);
  } catch (error) {
    console.error('Error creating survey response:', error);
    res.status(500).json({ error: 'Failed to create survey response' });
  }
};

/**
 * @desc    Update survey response
 * @route   PUT /api/survey-responses/:id
 * @access  Admin or own organization
 */
export const updateResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const surveyResponseToUpdate = await prisma.surveyResponse.findUnique({ where: { id } });
    if (!surveyResponseToUpdate)
      return res.status(404).json({ error: 'Survey response not found' });
    if (!isAdmin(req.user.role) && surveyResponseToUpdate.organizationId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let { responses } = req.body;
    if (responses && typeof responses === 'string') {
      try {
        responses = JSON.parse(responses);
      } catch {
        return res.status(400).json({ error: 'responses must be valid JSON' });
      }
    }

    const updatedSurveyResponse = await prisma.surveyResponse.update({
      where: { id },
      data: {
        ...(responses && { responses }),
        submittedDate: new Date(),
      },
      include: {
        survey: { select: { title: true } },
        organization: { select: { name: true } },
      },
    });
    res.status(200).json(updatedSurveyResponse);
  } catch (error) {
    console.error('Error updating survey response:', error);
    res.status(500).json({ error: 'Failed to update survey response' });
  }
};

/**
 * @desc    Delete survey response
 * @route   DELETE /api/survey-responses/:id
 * @access  Admin only
 */
export const deleteResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const surveyResponseToDelete = await prisma.surveyResponse.findUnique({ where: { id } });
    if (!surveyResponseToDelete)
      return res.status(404).json({ error: 'Survey response not found' });

    await prisma.surveyResponse.delete({ where: { id } });
    res.json({ message: 'Survey response deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey response:', error);
    res.status(500).json({ error: 'Failed to delete survey response' });
  }
};

/**
 * @desc    Get all responses for a survey (admin analytics)
 * @route   GET /api/survey-responses/survey/:surveyId
 * @access  Admin only
 */
export const getResponsesBySurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const surveyResponses = await prisma.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { submittedDate: 'desc' },
      include: {
        organization: { select: { name: true, email: true, tags: true } },
      },
    });

    res.json(surveyResponses);
  } catch (error) {
    console.error('Error fetching responses by survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey responses' });
  }
};

/**
 * @desc    Get all responses from an organization
 * @route   GET /api/survey-responses/organization/:orgId
 * @access  Admin or own organization
 */
export const getResponsesByOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orgId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role) && orgId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const surveyResponses = await prisma.surveyResponse.findMany({
      where: { organizationId: orgId },
      orderBy: { submittedDate: 'desc' },
      include: {
        survey: { select: { title: true, description: true, dueDate: true } },
      },
    });

    res.json(surveyResponses);
  } catch (error) {
    console.error('Error fetching responses by organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization responses' });
  }
};
