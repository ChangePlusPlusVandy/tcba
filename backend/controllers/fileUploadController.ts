import { Request, Response } from 'express';
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
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required to upload files' });
    }
    const { fileName, fileType, folder, resourceId } = req.query;
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'Valid file name is required' });
    }
    if (!fileType || typeof fileType !== 'string') {
      return res.status(400).json({ error: 'Valid file type is required' });
    }
    const allowedExtensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.txt',
      '.webp',
    ];
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
      'image/webp',
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

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    let key: string;
    if (folder && typeof folder === 'string') {
      const validFolders = [
        'announcements',
        'blogs',
        'alerts',
        'pages/homepage',
        'pages/about',
        'pages/getinvolved',
        'pages/directory',
        'emails',
      ];
      const isValidFolder = validFolders.some(f => folder === f || folder.startsWith(f + '/'));

      if (!isValidFolder && !folder.startsWith('pages/')) {
        return res.status(400).json({ error: 'Invalid folder specified' });
      }
      if (resourceId && typeof resourceId === 'string') {
        key = `${folder}/${resourceId}/${Date.now()}-${sanitizedFileName}`;
      } else {
        key = `${folder}/${Date.now()}-${sanitizedFileName}`;
      }
    } else {
      key = `uploads/${Date.now()}-${sanitizedFileName}`;
    }

    const params = {
      Bucket: bucketName,
      Key: key,
      ContentType: fileType as string,
      Expires: 600,
    };
    const uploadUrl = s3.getSignedUrl('putObject', params);

    return res.status(200).json({ uploadUrl, key });
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    res.status(500).json({ error: 'Failed to generate presigned upload URL' });
  }
};

export const getPresignedDownloadUrl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    // extracts fileKey from the URL path
    const { fileKey } = req.params;
    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey parameter is required' });
    }

    // gets bucket name from environment variables
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    // defines parameters for presigned URL generation
    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Expires: 600,
    };

    // generates presigned URL for 'getObject' operation
    const url = s3.getSignedUrl('getObject', params);

    return res.status(200).json({ downloadUrl: url });
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    res.status(500).json({ error: 'Failed to generate presigned download URL' });
  }
};

export const getPublicImageUrl = async (req: Request, res: Response) => {
  try {
    const { fileKey } = req.params;
    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey parameter is required' });
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasImageExtension = imageExtensions.some(ext => fileKey.toLowerCase().endsWith(ext));

    if (!hasImageExtension) {
      return res.status(403).json({ error: 'Only image files can be accessed publicly' });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const normalizedKey = fileKey.startsWith('/') ? fileKey.slice(1) : fileKey;

    const params = {
      Bucket: bucketName,
      Key: normalizedKey,
      Expires: 86400, // 24 hours (longer for public images)
      ResponseCacheControl: 'public, max-age=31536000, immutable', // Tell browser to cache for 1 year
    };

    const url = s3.getSignedUrl('getObject', params);

    res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');

    return res.status(200).json({ url });
  } catch (error) {
    console.error('Error generating public image URL:', error);
    res.status(500).json({ error: 'Failed to generate image URL' });
  }
};

export const getAuthenticatedDownloadUrl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { fileKey } = req.params;
    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey parameter is required' });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Expires: 600,
    };

    const url = s3.getSignedUrl('getObject', params);

    return res.status(200).json({ downloadUrl: url });
  } catch (error) {
    console.error('Error generating authenticated download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
};

export const getPublicDownloadUrl = async (req: Request, res: Response) => {
  try {
    const { fileKey } = req.params;
    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey parameter is required' });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Expires: 600,
    };

    const url = s3.getSignedUrl('getObject', params);

    return res.status(200).json({ downloadUrl: url });
  } catch (error) {
    console.error('Error generating public download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
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
    if (resourceType !== 'alert' && resourceType !== 'announcement' && resourceType !== 'blog') {
      return res
        .status(400)
        .json({ error: 'Invalid resourceType. Must be "alert", "announcement", or "blog"' });
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
    } else if (resourceType === 'blog') {
      const blog = await prisma.blog.findUnique({
        where: { id: resourceId },
        select: { attachmentUrls: true },
      });
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
      if (!blog.attachmentUrls || !blog.attachmentUrls.includes(fileKey)) {
        return res.status(404).json({ error: 'File not found in blog attachments' });
      }
      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: fileKey,
        })
        .promise();
      await prisma.blog.update({
        where: { id: resourceId },
        data: {
          attachmentUrls: blog.attachmentUrls.filter(url => url !== fileKey),
        },
      });
    }
    res.status(200).json({ message: 'File deleted successfully from S3 and database' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
