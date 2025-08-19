import { Request, Response, NextFunction } from "express";
import { RoleRepository } from "../repositories/user.repository";
import { NotFoundError } from "../errors/AppError";


export class RoleController {
   private roleRepository: RoleRepository;

   constructor() {
      this.roleRepository = new RoleRepository();
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
}
