import { BaseEntity } from './base.model';

// Core Entities
export interface Company extends BaseEntity {
  company_id: number;
  company_name: string;
  company_email?: string;
  company_phone?: string;
  company_fax?: string;
  company_website?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  city?: string;
  state?: string;
  state_code?: string;
  country?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  is_taxpayer?: boolean;
  logo?: string;
  is_active: boolean;
}

export interface Branch extends BaseEntity {
  branch_id: number;
  company_id: number;
  branch_name: string;
  branch_phone?: string;
  branch_fax?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  city?: string;
  state?: string;
  state_code?: string;
  country?: string;
  pincode?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  is_active: boolean;
}

export interface Employee extends BaseEntity {
  employee_id: number;
  company_id: number;
  branch_id?: number;
  employee_name: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  date_of_birth?: Date;
  date_of_joining: Date;
  date_of_leaving?: Date;
  salary?: number;
  registration_no?: string;
  specialization?: string;
  is_active: boolean;
  is_doctor: boolean;
  defualtip_templateid?: number;
  defualtop_templateid?: number;
  defualtop_pres?: string;
}

export interface User extends BaseEntity {
  user_id: number;
  username: string;
  employee_id: number;
  role_id: number;
  email: string;
  password_hash: string;
  expiry_minutes?: number;
  last_login?: Date;
  failed_login_attempts?: number;
  locked_until?: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Role extends BaseEntity {
  role_id: number;
  role_name: string;
  role_description?: string;
  is_active: boolean;
}

export interface Menu extends BaseEntity {
  menu_id: number;
  menu_name: string;
  component?: string;
  hide: boolean;
  hidetab: boolean;
  route?: string;
  menu_description?: string;
  parent_menu_id?: number;
  menu_order: number;
  is_active: boolean;
}

export interface Feature extends BaseEntity {
  feature_id: number;
  menu_id: number;
  feature_name: string;
  feature_description?: string;
  is_active: boolean;
}

export interface RoleMenu extends BaseEntity {
  role_menu_id: number;
  role_id: number;
  menu_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface RoleFeature extends BaseEntity {
  role_feature_id: number;
  role_id: number;
  feature_id: number;
  is_active: boolean;
}

export interface DoctorBranchMapping extends BaseEntity {
  doctor_branch_id: number;
  employee_id: number;
  branch_id: number;
  consultation_fee?: number;
  consultation_fee_item_id?: number;
  visit_consultation_fee?: number;
  visit_consultation_fee_item_id?: number;
  bill_item_id?: number;
  consulting_minutes?: number;
  days: string;
  morning_start_time?: string;
  morning_end_time?: string;
  morning_active: boolean;
  afternoon_start_time?: string;
  afternoon_end_time?: string;
  afternoon_active: boolean;
  evening_start_time?: string;
  evening_end_time?: string;
  evening_active: boolean;
  is_active: boolean;
}

export interface EmployeeFile extends BaseEntity {
  id: number;
  employee_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  content_category: 'identification' | 'certificate' | 'resume' | 'photo' | 'other';
  uploaded_by: string;
  uploaded_at: Date;
}

export interface EmployeeBranch extends BaseEntity {
  employee_branch_id: number;
  employee_id: number;
  branch_id: number;
  is_active: boolean;
}

export interface HMSSettings extends BaseEntity {
  settings_id: number;
  company_id: number;
  settings_json: Record<string, any>;
}

export interface Plan extends BaseEntity {
  plan_id: number;
  plan_name: string;
  plan_description?: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'custom';
  billing_period?: number;
  max_users: number;
  max_branches: number;
  storage_limit?: number;
  api_access: boolean;
  support_level: 'basic' | 'priority' | 'dedicated';
  is_active: boolean;
}

export interface Subscription extends BaseEntity {
  subscription_id: number;
  company_id: number;
  plan_id: number;
  price: number;
  max_users?: number;
  start_date: Date;
  end_date?: Date;
  auto_renew: boolean;
  remarks?: string;
  is_active: boolean;
}

export interface Invoice extends BaseEntity {
  invoice_id: number;
  invoice_number: string;
  subscription_id: number;
  company_id: number;
  invoice_date: Date;
  due_date: Date;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: 'credit_card' | 'bank_transfer' | 'cash' | 'other';
  remarks?: string;
}

export interface Payment extends BaseEntity {
  payment_id: number;
  invoice_id: number;
  company_id: number;
  payment_date: Date;
  amount_paid: number;
  payment_method?: 'credit_card' | 'bank_transfer' | 'cash' | 'other';
  transaction_id?: string;
  remarks?: string;
}

export interface ReferralDoctor extends BaseEntity {
  id: number;
  name: string;
  registration_no?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  hospital_name?: string;
  address?: string;
  remarks?: string;
  is_active: boolean;
}

// DTOs for API requests
export interface CreateCompanyDTO {
  company_name: string;
  company_email?: string;
  company_phone?: string;
  company_fax?: string;
  company_website?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  city?: string;
  state?: string;
  state_code?: string;
  country?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  is_taxpayer?: boolean;
  logo?: string;
}

export interface CreateEmployeeDTO {
  company_id: number;
  branch_id?: number;
  employee_name: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  date_of_birth?: Date;
  date_of_joining: Date;
  salary?: number;
  registration_no?: string;
  specialization?: string;
  is_doctor?: boolean;
}

export interface CreateUserDTO {
  username: string;
  employee_id: number;
  role_id: number;
  email: string;
  password: string;
  expiry_minutes?: number;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateProfileDTO {
  employee_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  designation?: string;
  department?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  roleId: number;
  companyId: number;
  user_id?: number;
  user_uuid?: string;
  employee_id?: number;
  employee_uuid?: string;
  role_id?: number;
  role_name?: string;
  company_id?: number;
  company_name?: string;
  branch_id?: number;
  branch_name?: string;
  employee_name?: string;
  is_doctor?: boolean;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface UserWithDetails extends User {
  employee: Employee;
  role: Role;
  company: Company;
  branch?: Branch;
}

export interface AuthResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}