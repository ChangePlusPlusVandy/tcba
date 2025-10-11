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

app.get('/api/db-test', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: 'Database connected with Prisma' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api/organizations', organizationRoutes);

export default app;
