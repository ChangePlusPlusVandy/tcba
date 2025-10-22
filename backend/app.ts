import express from 'express';
import cors from 'cors';
import organizationRoutes from './routes/organizationRoutes';
import { prisma } from './config/prisma';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.use('/api/organizations', organizationRoutes);

app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await prisma.announcements.findMany();
    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

export default app;
