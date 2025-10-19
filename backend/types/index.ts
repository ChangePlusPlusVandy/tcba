// Types for the TCBA application

import type { Request } from 'express';
import { OrganizationRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  auth?: (options?: any) => {
    userId: string | null;
    sessionId?: string | null;
    orgId?: string | null;
    orgRole?: string;
    orgSlug?: string;
    has?: (params: any) => boolean;
  };
  user?: {
    id: string;
    clerkId: string;
    role: OrganizationRole;
    email: string;
    name: string;
  };
}
