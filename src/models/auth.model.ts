// Auth-specific DTOs
export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  company_id?: number; // Optional - if not provided, create new company
  role_id?: number; // Optional - default to admin role
  company_name?: string; // For new company creation
  company_email?: string; // For new company creation
  company_phone?: string; // For new company creation
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequestDTO {
  first_name?: string;
  last_name?: string;
  phone?: string;
}