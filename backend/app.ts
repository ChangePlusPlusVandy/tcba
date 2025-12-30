import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import organizationRoutes from './routes/organizationRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import emailSubscriptionRoutes from './routes/emailSubscriptionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import surveyRoutes from './routes/surveyRoutes.js';
import surveyResponseRoutes from './routes/surveyResponseRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import inAppNotificationRoutes from './routes/inAppNotificationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import fileUploadRoutes from './routes/fileUploadRoutes.js';
import pageContentRoutes from './routes/pageContentRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import { prisma } from './config/prisma.js';
import { clerkClient, clerkMiddleware } from '@clerk/express';
import { connectRedis } from './config/redis.js';
import { warmCache } from './utils/cacheWarmer.js';

const app = express();

connectRedis()
  .then(() => warmCache())
  .catch(err => {
    console.error('Failed to connect to Redis on startup:', err);
  });

const allowedOrigins = [
  'http://localhost:5173',
  'https://tcba-frontend.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(clerkMiddleware());

app.get('/api/health', (req, res) => {
  res.json({ message: 'runnin' });
});

app.use('/', homeRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/subscriptions', emailSubscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/survey-responses', surveyResponseRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/notifications', inAppNotificationRoutes);
app.use('/api/email-notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/files', fileUploadRoutes);
app.use('/api/page-content', pageContentRoutes);
app.use('/api/map', mapRoutes);

export default app;
