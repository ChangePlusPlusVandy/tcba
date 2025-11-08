// Types for the TCBA application

import type { Request } from 'express';
import { OrganizationRole } from '@prisma/client';

interface ClerkAuth {
  userId: string | null;
  sessionId?: string | null;
  orgId?: string | null;
  orgRole?: string;
  has?: (params: any) => boolean;
  getToken?: (options?: any) => Promise<string | null>;
}

export interface AuthenticatedRequest extends Request {
  auth?: (() => Promise<ClerkAuth>) | ClerkAuth;
  user?: {
    id: string;
    clerkId: string;
    role: OrganizationRole;
    email: string;
    name: string;
  };
}
