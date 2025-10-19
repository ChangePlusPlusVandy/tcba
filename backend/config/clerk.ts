import { createClerkClient } from '@clerk/express';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY environment variable is required');
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
