import express from 'express';
import cors from 'cors';
import organizationRoutes from './routes/organizationRoutes';
import announcementRoutes from './routes/announcementRoutes';
import { prisma } from './config/prisma';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.use('/api/organizations', organizationRoutes);

app.use('/api/announcements', announcementRoutes);

export default app;
