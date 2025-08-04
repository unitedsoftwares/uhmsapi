import { BaseEntity } from './base.model';

export interface Organization extends BaseEntity {
  name: string;
  ownerUserId: string;
}

export interface CreateOrganizationDto {
  name: string;
  ownerUserId?: string; // If not provided, use the creating user
}

export interface UpdateOrganizationDto {
  name?: string;
  ownerUserId?: string;
  isActive?: boolean;
}

export interface OrganizationWithRole extends Organization {
  userRole?: string;
  userRoleId?: string;
}