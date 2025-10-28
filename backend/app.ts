import express from 'express';
import cors from 'cors';
import organizationRoutes from './routes/organizationRoutes';
import { prisma } from './config/prisma';
import { clerkClient, clerkMiddleware } from '@clerk/express';

const app = express();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.use('/api/organizations', organizationRoutes);

export default app;
