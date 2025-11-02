import express from 'express';
import cors from 'cors';
import organizationRoutes from './routes/organizationRoutes';
import announcementRoutes from './routes/announcementRoutes';
import emailSubscriptionRoutes from './routes/emailSubscriptionRoutes';
import adminRoutes from './routes/adminRoutes';
import surveyRoutes from './routes/surveyRoutes';
import surveyResponseRoutes from './routes/surveyResponseRoutes';
import blogRoutes from './routes/blogRoutes';
import homeRoutes from './routes/homeRoutes';
import alertRoutes from './routes/alertRoutes';
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
app.use('/api/subscriptions', emailSubscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/survey-responses', surveyResponseRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/blogs', blogRoutes);

export default app;
