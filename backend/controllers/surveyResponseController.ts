import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN' || role === 'SUPER_ADMIN';

const resolveTargetId = (id: string, userId?: string) => (id === 'profile' ? userId : id);

export const getAllSurveyResponses = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {surveyId, organizationId} = req.query;
            const where: any = {
                ...(surveyId && { surveyId: { contains: surveyId as string, mode: 'insensitive' } }),
                ...(organizationId && { organizationId: { contains: organizationId as string, mode: 'insensitive' } }),
            };
            
            const surveyResponses = await prisma.surveyResponse.findMany({ where, orderBy: { createdAt: 'desc' } });
            res.json(surveyResponses);
    } catch (error) {
        console.error('Error fetching survey responses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSurveyResponseById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = resolveTargetId(req.params.id, req.user?.id);
        if (!id) { return res.status(401).json({ error: 'Not authenticated' }); }
        const surveyResponse = await prisma.surveyResponse.findUnique({ where: { id } });
        if (!surveyResponse) {return res.status(404).json({ error: 'Survey responses not found' });}

        res.json(surveyResponse);
    } catch (error) {
        console.error('Error fetching survey by ID:', error);
        res.status(500).json({ error: 'Failed to fetch survey by ID' });
    }
};

export const createSurveyResponse = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
        const admin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
        let { responses, surveyId, organizationId } = req.body;

        if (!surveyId || !organizationId) {
            return res.status(400).json({ error: 'surveyId and organizationId are required' });
        }
        if (responses == null) {
            return res.status(400).json({ error: 'responses is required' });
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
                ...req.body,
            }
        });
        res.status(201).json(surveyResponse);
    } catch (error) {
        console.error('Error creating survey response:', error);
        res.status(500).json({ error: 'Failed to create survey response' });
    }
};

export const updateSurveyResponse = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // if (!req.user) {return res.status(401).json({ error: 'Not authenticated' });}
        // if (!isAdmin(req.user.role)) {return res.status(403).json({ error: 'Access denied' });}
        const surveyResponseToUpdate = await prisma.surveyResponse.findUnique({ where: { id } });
        if (!surveyResponseToUpdate) return res.status(404).json({ error: 'Survey response not found' });
        const updatedSurveyResponse = await prisma.surveyResponse.update({
            where: { id },
            data: req.body,
        });
        res.status(200).json(updatedSurveyResponse);
    } catch (error) {
        console.error('Error updating survey response:', error);
        res.status(500).json({ error: 'Failed to update survey response' });
    }
};


export const deleteSurveyResponse = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // if (!req.user) {return res.status(401).json({ error: 'Not authenticated' });}
        // if (!isAdmin(req.user.role)) {return res.status(403).json({ error: 'Access denied' });}
        const surveyResponseToDelete = await prisma.surveyResponse.findUnique({ where: { id } });
        if (!surveyResponseToDelete) return res.status(404).json({ error: 'Survey response not found' });

        await prisma.surveyResponse.delete({ where: { id } });
        res.json({ message: 'Survey response deleted successfully' });
    } catch (error) {
        console.error('Error deleting survey response:', error);
        res.status(500).json({ error: 'Failed to delete survey response' });
    }
};