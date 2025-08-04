import { BaseEntity } from './base.model';

export interface Permission extends BaseEntity {
  name: string;
  label: string;
  component: string | null;
  hide: boolean;
  hidetab: boolean;
  route: string | null;
  parentId: string | null;
  sortOrder: number;
}

export interface CreatePermissionDto {
  name: string;
  label: string;
  component?: string;
  hide?: boolean;
  hidetab?: boolean;
  route?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdatePermissionDto {
  name?: string;
  label?: string;
  component?: string;
  hide?: boolean;
  hidetab?: boolean;
  route?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface PermissionTree extends Permission {
  children?: PermissionTree[];
}