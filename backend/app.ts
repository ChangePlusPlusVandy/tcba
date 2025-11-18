import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import organizationRoutes from './routes/organizationRoutes';
import announcementRoutes from './routes/announcementRoutes';
import tagRoutes from './routes/tagRoutes';
import emailSubscriptionRoutes from './routes/emailSubscriptionRoutes';
import adminRoutes from './routes/adminRoutes';
import surveyRoutes from './routes/surveyRoutes';
import surveyResponseRoutes from './routes/surveyResponseRoutes';
import blogRoutes from './routes/blogRoutes';
import homeRoutes from './routes/homeRoutes';
import alertRoutes from './routes/alertRoutes';
import inAppNotificationRoutes from './routes/inAppNotificationRoutes';
import notificationRoutes from './routes/notificationRoutes';
import contactRoutes from './routes/contactRoutes';
import fileUploadRoutes from './routes/fileUploadRoutes';
import pageContentRoutes from './routes/pageContentRoutes';
import mapRoutes from './routes/mapRoutes';
import { prisma } from './config/prisma';
import { clerkClient, clerkMiddleware } from '@clerk/express';

const app = express();
app.use(cors());
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
app.use('/api/uploads', fileUploadRoutes);
app.use('/api/page-content', pageContentRoutes);
app.use('/api/map', mapRoutes);

export default app;
