import { Request, Response, NextFunction } from "express";
import { RoleRepository } from "../repositories/user.repository";
import { RoleService } from "../services/role.service";
import { NotFoundError } from "../errors/AppError";

export class RoleController {
   private roleRepository: RoleRepository;
   private roleService: RoleService;

   constructor() {
      this.roleRepository = new RoleRepository();
      this.roleService = new RoleService();
   }

   // Get all roles
   getAllRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
         const roles = await this.roleRepository.findAll();
         res.json({
            success: true,
            data: roles,
         });
      } catch (error) {
         next(error);
      }
   };

   // Get role by ID
   getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
         const roleId = parseInt(req.params.id);
         if (isNaN(roleId)) {
            throw new NotFoundError("Invalid role ID");
         }

         const role = await this.roleRepository.findByPrimaryKey(roleId);
         if (!role) {
            throw new NotFoundError("Role not found");
         }

         res.json({
            success: true,
            data: role,
         });
      } catch (error) {
         next(error);
      }
   };

   // Create new role
   createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
         const { role_name, role_description, menuPermissions } = req.body;
         const createdBy = req.user?.email || "system";
         const newRole = await this.roleService.createRole(
            { role_name, role_description, menuPermissions },
            createdBy
         );

         res.status(201).json({
            success: true,
            data: newRole,
            message: "Role created successfully",
         });
      } catch (error) {
         next(error);
      }
   };

   // Get menus by role ID
   getRoleMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
         const roleId = parseInt(req.params.id);
         if (isNaN(roleId)) {
            throw new NotFoundError("Invalid role ID");
         }

         const roleMenus = await this.roleService.getRoleMenusWithDetails(roleId);

         res.json({
            success: true,
            data: roleMenus,
         });
      } catch (error) {
         next(error);
      }
   };

   // Update role menu permissions
   updateRoleMenuPermissions = async (
      req: Request,
      res: Response,
      next: NextFunction
   ): Promise<void> => {
      try {
         const roleId = parseInt(req.params.id);
         const menuId = parseInt(req.params.menuId);

         if (isNaN(roleId) || isNaN(menuId)) {
            throw new NotFoundError("Invalid role ID or menu ID");
         }

         const { can_view, can_create, can_edit, can_delete } = req.body;
         const updatedBy = req.user?.email || "system";

         const updated = await this.roleService.updateRoleMenuPermissions(
            roleId,
            menuId,
            { can_view, can_create, can_edit, can_delete },
            updatedBy
         );

         if (!updated) {
            throw new NotFoundError("Role menu permission not found");
         }

         res.json({
            success: true,
            message: "Role menu permissions updated successfully",
         });
      } catch (error) {
         next(error);
      }
   };

   // Delete role
   deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
         const roleId = parseInt(req.params.id);
         if (isNaN(roleId)) {
            throw new NotFoundError("Invalid role ID");
         }

         const deletedBy = req.user?.email || "system";
         const deleted = await this.roleService.deleteRole(roleId, deletedBy);

         if (!deleted) {
            throw new NotFoundError("Role not found");
         }

         res.json({
            success: true,
            message: "Role deleted successfully",
         });
      } catch (error) {
         next(error);
      }
   };
}
