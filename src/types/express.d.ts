import { TokenPayload } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: TokenPayload;
      organizationId?: string;
      companyId?: number;
      branchId?: number;
    }
  }
}

export {};