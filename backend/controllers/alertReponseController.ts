import { OrganizationRole } from '@prisma/client';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

export const getAllAlertResponses = async (req: any, res: any) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!isAdmin(req.user.role))
      return res.status(403).json({ error: 'Access denied - Admin only' });

    const { alertId, organizationId } = req.query;
  } catch (error) {
    console.error('Error fetching alert responses:', error);
    res.status(500).json({ error: 'Failed fetching alert responses' });
  }
};

export const getAlertReponseById = async (req: any, res: any) => {
  try {
  } catch (error) {
    console.error('Error fetching alert response by ID:', error);
    res.status(500).json({ error: 'Failed fetching alert response by ID' });
  }
};

export const createAlertResponse = async (req: any, res: any) => {
  try {
  } catch (error) {
    console.error('Error creating alert response:', error);
    res.status(500).json({ error: 'Failed creating alert response' });
  }
};

export const updateAlertResponse = async (req: any, res: any) => {
  try {
  } catch (error) {
    console.error('Error updating alert response:', error);
    res.status(500).json({ error: 'Failed updating alert response' });
  }
};

export const deleteAlertResponse = async (req: any, res: any) => {
  try {
  } catch (error) {
    console.error('Error deleting alert response:', error);
    res.status(500).json({ error: 'Failed deleting alert response' });
  }
};

export const getResponseByAlertId = async (req: any, res: any) => {
  try {
  } catch (error) {
    console.error('Error fetching alert response by alert ID:', error);
    res.status(500).json({ error: 'Failed fetching alert response by alert ID' });
  }
};

export const getResponsesByOrgId = async (req: any, res: any) => {
  try {
  } catch (error) {
    console.error('Error fetching alert responses by organization ID:', error);
    res.status(500).json({ error: 'Failed fetching alert responses by organization ID' });
  }
};
