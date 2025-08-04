import { BaseEntity } from './base.model';

export interface Role extends BaseEntity {
  name: string;
  organizationId: string;
}

export interface CreateRoleDto {
  name: string;
  organizationId: string;
  permissions?: string[]; // Array of permission IDs
}

export interface UpdateRoleDto {
  name?: string;
  isActive?: boolean;
  permissions?: string[]; // Array of permission IDs
}

export interface RoleWithPermissions extends Role {
  permissions: string[]; // Array of permission IDs
}