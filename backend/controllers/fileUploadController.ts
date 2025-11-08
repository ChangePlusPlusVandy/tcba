import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';

const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

// Get presigned URL for uploading file to S3
// Validate fileName, generate unique key, create PutObjectCommand, use getSignedUrl for upload
// client uploads file then saves key to DB (like Announcements.attachmentUrls)
export const getPresignedUploadUrl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { fileName, fileType } = req.query;
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    res.status(500).json({ error: 'Failed to generate presigned upload URL' });
  }
};

// Get presigned URL for downloading/viewing file from private S3 bucket
// create GetObjectCommand with fileKey, use getSignedUrl for download
export const getPresignedDownloadUrl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { fileKey } = req.params;
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    res.status(500).json({ error: 'Failed to generate presigned download URL' });
  }
};

// Delete file from S3
// Delete from S3 using DeleteObjectCommand, also remove from DB (remove from attachmentUrls array)
export const deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { fileKey } = req.params;
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
