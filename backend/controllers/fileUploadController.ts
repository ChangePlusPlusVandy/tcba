import { Response } from 'express';
import { OrganizationRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { s3 } from '../config/aws-s3.js';
import { prisma } from '../config/prisma.js';

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
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'Valid file name is required' });
    }
    if (!fileType || typeof fileType !== 'string') {
      return res.status(400).json({ error: 'Valid file type is required' });
    }
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
    const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
    ];
    if (!allowedMimeTypes.includes(fileType as string)) {
      return res.status(400).json({ error: 'MIME type not allowed' });
    }
    if (fileName.length > 255) {
      return res.status(400).json({ error: 'File name too long' });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({ error: 'S3 bucket not configured' });
    }

    // Create a unique key (path + filename) - sanitize fileName
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${Date.now()}-${sanitizedFileName}`;

    // Define parameters for S3 upload
    const params = {
      Bucket: bucketName,
      Key: key,
      ContentType: fileType as string,
      Expires: 600,
    };
    const uploadUrl = await s3.getSignedUrl('putObject', params);

    return res.status(200).json({ uploadUrl, key });
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

export const deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required to delete files' });
    }
    const { fileKey } = req.params;
    const { resourceType, resourceId } = req.body;
    if (!fileKey) {
      return res.status(400).json({ error: 'File key is required' });
    }
    if (!resourceType || !resourceId) {
      return res.status(400).json({ error: 'resourceType and resourceId are required' });
    }
    if (resourceType !== 'alert' && resourceType !== 'announcement') {
      return res
        .status(400)
        .json({ error: 'Invalid resourceType. Must be "alert" or "announcement"' });
    }
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      return res.status(500).json({ error: 'S3 bucket not configured' });
    }
    if (resourceType === 'alert') {
      const alert = await prisma.alert.findUnique({
        where: { id: resourceId },
        select: { attachmentUrls: true },
      });
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      if (!alert.attachmentUrls.includes(fileKey)) {
        return res.status(404).json({ error: 'File not found in alert attachments' });
      }
      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: fileKey,
        })
        .promise();
      await prisma.alert.update({
        where: { id: resourceId },
        data: {
          attachmentUrls: alert.attachmentUrls.filter(url => url !== fileKey),
        },
      });
    } else if (resourceType === 'announcement') {
      const announcement = await prisma.announcements.findUnique({
        where: { id: resourceId },
        select: { attachmentUrls: true },
      });
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      if (!announcement.attachmentUrls.includes(fileKey)) {
        return res.status(404).json({ error: 'File not found in announcement attachments' });
      }
      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: fileKey,
        })
        .promise();
      await prisma.announcements.update({
        where: { id: resourceId },
        data: {
          attachmentUrls: announcement.attachmentUrls.filter(url => url !== fileKey),
        },
      });
    }
    res.status(200).json({ message: 'File deleted successfully from S3 and database' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
