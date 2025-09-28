import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: 'Database connected with Prisma!' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// API Routes

export default app;
