import { BaseEntity } from './base.model';

export interface UserOrganization extends BaseEntity {
  userId: string;
  organizationId: string;
  roleId: string;
}

export interface CreateUserOrganizationDto {
  userId: string;
  organizationId: string;
  roleId: string;
}

export interface UpdateUserOrganizationDto {
  roleId?: string;
  isActive?: boolean;
}

export interface UserOrganizationDetails extends UserOrganization {
  userName?: string;
  userEmail?: string;
  organizationName?: string;
  roleName?: string;
}