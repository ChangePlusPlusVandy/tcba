import { mockDeep, mockReset } from 'jest-mock-extended';
import { OrganizationRole, PrismaClient } from '@prisma/client';

const prismaMock = mockDeep<PrismaClient>();
const mockClerkClient = { users: { createUser: jest.fn(), updateUser: jest.fn() } };

jest.mock('@prisma/client', () => ({ __esModule: true, PrismaClient: jest.fn(() => prismaMock) }));
jest.mock('../../config/clerk', () => ({ clerkClient: mockClerkClient }));
jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));

import {
  updateSurvey,
  createSurvey,
  getSurveyById,
  getAllSurveys,
  deleteSurvey,
  getActiveSurveys,
  publishSurvey,
  closeSurvey,
} from '../../controllers/surveyController.js';

const mockReq = (overrides: any = {}): any => ({
  params: {},
  query: {},
  body: {},
  user: undefined,
  ...overrides,
});

const mockRes = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockSurvey = {
  title: 'Minimal Survey',
  isActive: true,
  isPublished: false,
};

const mockAdmin = { id: 'admin1', role: 'ADMIN' as OrganizationRole };
