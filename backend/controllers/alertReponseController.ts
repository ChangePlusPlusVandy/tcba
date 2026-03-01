import { Response } from 'express';
import { OrganizationRole, Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

export const getAllAlertResponses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const { alertId, organizationId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(alertId && { alertId: alertId as string }),
      ...(organizationId && { organizationId: organizationId as string }),
    };

    const [alertResponses, total] = await Promise.all([
      prisma.alertResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          alert: { select: { title: true } },
          organization: { select: { name: true } },
        },
      }),
      prisma.alertResponse.count({ where }),
    ]);

    res.json({
      data: alertResponses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching alert responses:', error);
    res.status(500).json({ error: 'Failed fetching alert responses' });
  }
};

export const getAlertReponseById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const { id } = req.params;
    const alertResponse = await prisma.alertResponse.findUnique({
      where: { id },
      include: {
        alert: { select: { title: true, content: true } },
        organization: { select: { name: true } },
      },
    });

    if (!alertResponse) return res.status(404).json({ error: 'Alert response not found' });

    res.json(alertResponse);
  } catch (error) {
    console.error('Error fetching alert response by ID:', error);
    res.status(500).json({ error: 'Failed fetching alert response by ID' });
  }
};

export const createAlertResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    let { responses, alertId, organizationId } = req.body;

    // if (!alertId || !organizationId) {
    //   return res.status(400).json({ error: 'alertid and organizationId are required' });
    // }
    if (responses == null) {
      return res.status(400).json({ error: 'responses is required' });
    }
    if (!isAdmin(req.user.role) && organizationId !== req.user.id) {
      return res.status(403).json({ error: 'Can only submit responses for your own organization' });
    }

    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    const questions = alert.questions as Prisma.JsonArray;
    if (!alert.isPublished || !questions || questions.length == 0)
      return res.status(403).json({ error: 'Alert is not available for responses' });

    const existingResponse = await prisma.alertResponse.findFirst({
      where: { alertId, organizationId },
    });
    if (existingResponse) {
      return res
        .status(400)
        .json({ error: 'Organization has already submitted a response to this survey' });
    }

    const alertResponse = await prisma.alertResponse.create({
      data: {
        alertId,
        organizationId,
        responses,
        submittedDate: new Date(),
      },
      include: {
        alert: { select: { title: true } },
        organization: { select: { name: true } },
      },
    });
    res.status(201).json(alertResponse);
  } catch (error) {
    console.error('Error creating alert response:', error);
    res.status(500).json({ error: 'Failed creating alert response' });
  }
};

export const updateAlertResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const responseToUpdate = await prisma.alertResponse.findUnique({ where: { id } });
    if (!responseToUpdate) return res.status(404).json({ error: 'Reponse not found' });
    if (!isAdmin(req.user.role) && responseToUpdate.organizationId !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    let { responses } = req.body;
    if (responses && typeof responses == 'string') {
      try {
        responses = JSON.parse(responses);
      } catch {
        return res.status(400).json({ error: 'responses are not valid JSON ' });
      }
    }

    const updatedResponse = await prisma.alertResponse.update({
      where: { id },
      data: {
        ...(responses && { responses }),
        submittedDate: new Date(),
      },
      include: {
        alert: {
          select: {
            title: true,
            content: true,
          },
        },
        organization: { select: { name: true } },
      },
    });
    res.status(200).json(updatedResponse);
  } catch (error) {
    console.error('Error updating alert response:', error);
    res.status(500).json({ error: 'Failed to update alert response' });
  }
};

export const deleteAlertResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const responseToDelete = await prisma.alertResponse.findUnique({ where: { id } });
    if (!responseToDelete) return res.status(404).json({ error: 'Survey response not found' });

    await prisma.surveyResponse.delete({ where: { id } });
    res.json({ message: 'Alert response deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey response:', error);
    res.status(500).json({ error: 'Failed to delete survey response' });
  }
};

export const getResponsesByAlertId = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const responses = await prisma.alertResponse.findMany({
      where: { alertId },
      orderBy: { submittedDate: 'desc' },
      include: {
        organization: { select: { name: true, email: true } },
      },
    });

    res.json(responses);
  } catch (error) {
    console.error('Error fetching alert response by alert ID:', error);
    res.status(500).json({ error: 'Failed fetching alert response by alert ID' });
  }
};

export const getResponsesByOrgId = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [responses, total] = await Promise.all([
      prisma.alertResponse.findMany({
        where: { organizationId: id },
        orderBy: { submittedDate: 'desc' },
        include: {
          alert: { select: { title: true, content: true } },
        },
      }),
      prisma.alertResponse.count({ where: { organizationId: id } }),
    ]);

    res.json({
      data: responses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching alert responses by organization ID:', error);
    res.status(500).json({ error: 'Failed fetching alert responses by organization ID' });
  }
};
