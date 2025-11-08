import { OrganizationRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';

//keep track the emails that would send out
const isAdmin = (role?: OrganizationRole) => role === 'ADMIN';

export const createSubEmail = async () => {
  try {
  } catch (error) {
    console.error('Error creating sub email:', error);
  }
};
