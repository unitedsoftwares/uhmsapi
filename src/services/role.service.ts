import { 
  RoleRepository, 
  MenuRepository, 
  FeatureRepository,
  RoleMenuRepository,
  RoleFeatureRepository
} from '../repositories/user.repository';
import { 
  Role, 
  Menu, 
  Feature, 
  RoleMenu, 
  RoleFeature
} from '../models/user.model';
import { PaginationQuery, PaginatedResponse } from '../models/base.model';
import { 
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../errors/AppError';
import logger from '../utils/logger';

export class RoleService {
  private roleRepository: RoleRepository;
  private menuRepository: MenuRepository;
  private featureRepository: FeatureRepository;
  private roleMenuRepository: RoleMenuRepository;
  private roleFeatureRepository: RoleFeatureRepository;

  constructor() {
    this.roleRepository = new RoleRepository();
    this.menuRepository = new MenuRepository();
    this.featureRepository = new FeatureRepository();
    this.roleMenuRepository = new RoleMenuRepository();
    this.roleFeatureRepository = new RoleFeatureRepository();
  }

  // Role Management
  async createRole(data: Partial<Role>, createdBy: string): Promise<Role> {
    if (!data.role_name) {
      throw new ValidationError('Role name is required');
    }

    // Check if role with same name already exists
    const existingRole = await this.roleRepository.findByName(data.role_name);
    if (existingRole) {
      throw new ConflictError('Role with this name already exists');
    }

    const role = await this.roleRepository.create(data, createdBy);

    logger.info('Role created successfully', { 
      roleId: role.role_id, 
      roleName: role.role_name 
    });

    return role;
  }

  async getRoleById(roleId: number): Promise<Role | null> {
    return await this.roleRepository.findByPrimaryKey(roleId);
  }

  async getRoleByName(roleName: string): Promise<Role | null> {
    return await this.roleRepository.findByName(roleName);
  }

  async getRoles(
    filters: Partial<Role> = {},
    pagination?: PaginationQuery
  ): Promise<PaginatedResponse<Role>> {
    return await this.roleRepository.findAll(filters, pagination);
  }

  async updateRole(
    roleId: number,
    data: Partial<Role>,
    updatedBy: string
  ): Promise<boolean> {
    const role = await this.roleRepository.findByPrimaryKey(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check for name conflicts if updating name
    if (data.role_name && data.role_name !== role.role_name) {
      const existingByName = await this.roleRepository.findByName(data.role_name);
      if (existingByName && existingByName.role_id !== roleId) {
        throw new ConflictError('Role with this name already exists');
      }
    }

    const updated = await this.roleRepository.update(roleId, data, updatedBy);

    if (updated) {
      logger.info('Role updated successfully', { roleId });
    }

    return updated;
  }

  async deleteRole(roleId: number, deletedBy: string): Promise<boolean> {
    const role = await this.roleRepository.findByPrimaryKey(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const deleted = await this.roleRepository.softDelete(roleId, deletedBy);

    if (deleted) {
      logger.info('Role deleted successfully', { roleId });
    }

    return deleted;
  }

  // Menu Management
  async createMenu(data: Partial<Menu>, createdBy: string): Promise<Menu> {
    if (!data.menu_name) {
      throw new ValidationError('Menu name is required');
    }

    // Validate parent menu exists if provided
    if (data.parent_menu_id) {
      const parentMenu = await this.menuRepository.findByPrimaryKey(data.parent_menu_id);
      if (!parentMenu) {
        throw new NotFoundError('Parent menu not found');
      }
    }

    const menu = await this.menuRepository.create({
      ...data,
      menu_order: data.menu_order || 0,
      hide: data.hide || false,
      hidetab: data.hidetab || false,
    }, createdBy);

    logger.info('Menu created successfully', { 
      menuId: menu.menu_id, 
      menuName: menu.menu_name 
    });

    return menu;
  }

  async getMenuById(menuId: number): Promise<Menu | null> {
    return await this.menuRepository.findByPrimaryKey(menuId);
  }

  async getMenus(
    filters: Partial<Menu> = {},
    pagination?: PaginationQuery
  ): Promise<PaginatedResponse<Menu>> {
    return await this.menuRepository.findAll(filters, pagination);
  }

  async getMenusByParentId(parentId: number | null): Promise<Menu[]> {
    return await this.menuRepository.findByParentId(parentId);
  }

  async getMenuHierarchy(): Promise<Menu[]> {
    // Get root menus (no parent)
    const rootMenus = await this.menuRepository.findByParentId(null);
    
    // For each root menu, get its children recursively
    const buildHierarchy = async (menus: Menu[]): Promise<any[]> => {
      const result = [];
      for (const menu of menus) {
        const children = await this.menuRepository.findByParentId(menu.menu_id);
        const menuWithChildren = {
          ...menu,
          children: children.length > 0 ? await buildHierarchy(children) : []
        };
        result.push(menuWithChildren);
      }
      return result;
    };

    return await buildHierarchy(rootMenus);
  }

  async updateMenu(
    menuId: number,
    data: Partial<Menu>,
    updatedBy: string
  ): Promise<boolean> {
    const menu = await this.menuRepository.findByPrimaryKey(menuId);
    if (!menu) {
      throw new NotFoundError('Menu not found');
    }

    // Validate parent menu exists if provided
    if (data.parent_menu_id && data.parent_menu_id !== menu.parent_menu_id) {
      const parentMenu = await this.menuRepository.findByPrimaryKey(data.parent_menu_id);
      if (!parentMenu) {
        throw new NotFoundError('Parent menu not found');
      }
      
      // Prevent circular reference
      if (data.parent_menu_id === menuId) {
        throw new ValidationError('Menu cannot be its own parent');
      }
    }

    const updated = await this.menuRepository.update(menuId, data, updatedBy);

    if (updated) {
      logger.info('Menu updated successfully', { menuId });
    }

    return updated;
  }

  async deleteMenu(menuId: number, deletedBy: string): Promise<boolean> {
    const menu = await this.menuRepository.findByPrimaryKey(menuId);
    if (!menu) {
      throw new NotFoundError('Menu not found');
    }

    const deleted = await this.menuRepository.softDelete(menuId, deletedBy);

    if (deleted) {
      logger.info('Menu deleted successfully', { menuId });
    }

    return deleted;
  }

  // Feature Management
  async createFeature(data: Partial<Feature>, createdBy: string): Promise<Feature> {
    if (!data.feature_name || !data.menu_id) {
      throw new ValidationError('Feature name and menu ID are required');
    }

    // Verify menu exists
    const menu = await this.menuRepository.findByPrimaryKey(data.menu_id);
    if (!menu) {
      throw new NotFoundError('Menu not found');
    }

    const feature = await this.featureRepository.create(data, createdBy);

    logger.info('Feature created successfully', { 
      featureId: feature.feature_id, 
      featureName: feature.feature_name,
      menuId: feature.menu_id
    });

    return feature;
  }

  async getFeatureById(featureId: number): Promise<Feature | null> {
    return await this.featureRepository.findByPrimaryKey(featureId);
  }

  async getFeatures(
    filters: Partial<Feature> = {},
    pagination?: PaginationQuery
  ): Promise<PaginatedResponse<Feature>> {
    return await this.featureRepository.findAll(filters, pagination);
  }

  async getFeaturesByMenuId(menuId: number): Promise<Feature[]> {
    return await this.featureRepository.findByMenuId(menuId);
  }

  async updateFeature(
    featureId: number,
    data: Partial<Feature>,
    updatedBy: string
  ): Promise<boolean> {
    const feature = await this.featureRepository.findByPrimaryKey(featureId);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Verify menu exists if updating menu_id
    if (data.menu_id && data.menu_id !== feature.menu_id) {
      const menu = await this.menuRepository.findByPrimaryKey(data.menu_id);
      if (!menu) {
        throw new NotFoundError('Menu not found');
      }
    }

    const updated = await this.featureRepository.update(featureId, data, updatedBy);

    if (updated) {
      logger.info('Feature updated successfully', { featureId });
    }

    return updated;
  }

  async deleteFeature(featureId: number, deletedBy: string): Promise<boolean> {
    const feature = await this.featureRepository.findByPrimaryKey(featureId);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    const deleted = await this.featureRepository.softDelete(featureId, deletedBy);

    if (deleted) {
      logger.info('Feature deleted successfully', { featureId });
    }

    return deleted;
  }

  // Role Permission Management
  async assignMenuToRole(
    roleId: number,
    menuId: number,
    permissions: { can_view?: boolean; can_create?: boolean; can_edit?: boolean; can_delete?: boolean },
    createdBy: string
  ): Promise<RoleMenu> {
    // Verify role and menu exist
    const role = await this.roleRepository.findByPrimaryKey(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const menu = await this.menuRepository.findByPrimaryKey(menuId);
    if (!menu) {
      throw new NotFoundError('Menu not found');
    }

    const roleMenuData = {
      role_id: roleId,
      menu_id: menuId,
      can_view: permissions.can_view || true,
      can_create: permissions.can_create || false,
      can_edit: permissions.can_edit || false,
      can_delete: permissions.can_delete || false,
    };

    const roleMenu = await this.roleMenuRepository.create(roleMenuData, createdBy);

    logger.info('Menu assigned to role successfully', { roleId, menuId });

    return roleMenu;
  }

  async assignFeatureToRole(
    roleId: number,
    featureId: number,
    createdBy: string
  ): Promise<RoleFeature> {
    // Verify role and feature exist
    const role = await this.roleRepository.findByPrimaryKey(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const feature = await this.featureRepository.findByPrimaryKey(featureId);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    const roleFeatureData = {
      role_id: roleId,
      feature_id: featureId,
      is_active: true,
    };

    const roleFeature = await this.roleFeatureRepository.create(roleFeatureData, createdBy);

    logger.info('Feature assigned to role successfully', { roleId, featureId });

    return roleFeature;
  }

  async getRoleMenus(roleId: number): Promise<RoleMenu[]> {
    return await this.roleMenuRepository.findByRoleId(roleId);
  }

  async getRoleFeatures(roleId: number): Promise<RoleFeature[]> {
    return await this.roleFeatureRepository.findByRoleId(roleId);
  }

  async getRolePermissions(roleId: number) {
    const role = await this.roleRepository.findByPrimaryKey(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const roleMenus = await this.roleMenuRepository.findByRoleId(roleId);
    const roleFeatures = await this.roleFeatureRepository.findByRoleId(roleId);

    // Get menu details for each role menu
    const menusWithPermissions = await Promise.all(
      roleMenus.map(async (roleMenu) => {
        const menu = await this.menuRepository.findByPrimaryKey(roleMenu.menu_id);
        return {
          ...menu,
          permissions: {
            can_view: roleMenu.can_view,
            can_create: roleMenu.can_create,
            can_edit: roleMenu.can_edit,
            can_delete: roleMenu.can_delete,
          }
        };
      })
    );

    // Get feature details for each role feature
    const featuresWithAccess = await Promise.all(
      roleFeatures.map(async (roleFeature) => {
        const feature = await this.featureRepository.findByPrimaryKey(roleFeature.feature_id);
        return {
          ...feature,
          is_active: roleFeature.is_active,
        };
      })
    );

    return {
      role,
      menus: menusWithPermissions,
      features: featuresWithAccess,
    };
  }
}