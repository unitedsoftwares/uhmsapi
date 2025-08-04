-- HMS Database Schema (Structure Only)
-- Version: 1.0
-- Description: Complete database schema for Hospital Management System

-- Create database
CREATE DATABASE IF NOT EXISTS hms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hms_db;

-- =============================================
-- Table: companies
-- Description: Stores company/hospital information
-- Note: Consider encrypting sensitive fields (gstin, pan, cin) at application level
-- =============================================
CREATE TABLE companies (
    company_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the company',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    company_name VARCHAR(255) NOT NULL COMMENT 'Name of the company',
    company_email VARCHAR(255) UNIQUE COMMENT 'Email address of the company',
    company_phone VARCHAR(25) DEFAULT NULL COMMENT 'Phone number of the company (international format)',
    company_fax VARCHAR(20) DEFAULT NULL COMMENT 'Fax number of the company',
    company_website VARCHAR(255) DEFAULT NULL COMMENT 'Website of the company',
    address_line1 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 1',
    address_line2 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 2',
    address_line3 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 3',
    city VARCHAR(100) DEFAULT NULL COMMENT 'City where the company is located',
    state VARCHAR(100) DEFAULT NULL COMMENT 'State or province',
    state_code VARCHAR(10) DEFAULT NULL COMMENT 'Code representing the state (e.g., "CA" for California)',
    country VARCHAR(100) DEFAULT NULL COMMENT 'Country',
    pincode VARCHAR(20) DEFAULT NULL COMMENT 'Postal or ZIP code',
    gstin VARCHAR(15) DEFAULT NULL COMMENT 'GST Identification Number',
    pan VARCHAR(10) DEFAULT NULL COMMENT 'Permanent Account Number',
    cin VARCHAR(21) DEFAULT NULL COMMENT 'Corporate Identification Number',
    contact_person_name VARCHAR(255) DEFAULT NULL COMMENT 'Name of the primary contact person',
    contact_person_email VARCHAR(255) DEFAULT NULL COMMENT 'Email of the primary contact person',
    contact_person_phone VARCHAR(25) DEFAULT NULL COMMENT 'Phone number of the primary contact person (international format)',
    is_taxpayer BOOLEAN DEFAULT 1 COMMENT 'Indicates if the company is a taxpayer',
    logo VARCHAR(255) DEFAULT NULL COMMENT 'URL to the company logo',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Status of the company (active/inactive)',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    INDEX idx_company_name (company_name),
    INDEX idx_company_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: branches
-- Description: Stores branch/location information
-- =============================================
CREATE TABLE branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the branch',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    company_id INT NOT NULL COMMENT 'Foreign key linking to the company table',
    branch_name VARCHAR(255) NOT NULL COMMENT 'Name of the branch',
    branch_phone VARCHAR(25) DEFAULT NULL COMMENT 'Phone number of the branch (international format)',
    branch_fax VARCHAR(20) DEFAULT NULL COMMENT 'Fax number of the branch',
    address_line1 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 1',
    address_line2 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 2',
    address_line3 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 3',
    city VARCHAR(100) DEFAULT NULL COMMENT 'City where the branch is located',
    state VARCHAR(100) DEFAULT NULL COMMENT 'State or province',
    state_code VARCHAR(10) DEFAULT NULL COMMENT 'Code representing the state (e.g., "CA" for California)',
    country VARCHAR(100) DEFAULT NULL COMMENT 'Country',
    pincode VARCHAR(20) DEFAULT NULL COMMENT 'Postal or ZIP code',
    contact_person_name VARCHAR(255) DEFAULT NULL COMMENT 'Name of the primary contact person',
    contact_person_email VARCHAR(255) DEFAULT NULL COMMENT 'Email of the primary contact person',
    contact_person_phone VARCHAR(25) DEFAULT NULL COMMENT 'Phone number of the primary contact person (international format)',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Status of the branch (active/inactive)',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_branch_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    INDEX idx_branch_company (company_id),
    INDEX idx_branch_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: roles
-- Description: Stores user roles
-- =============================================
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the role',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    role_name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Name of the role (e.g., Admin, Manager)',
    role_description TEXT DEFAULT NULL COMMENT 'Description of the role',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Indicates if the role is active',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    INDEX idx_role_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: menus
-- Description: Stores menu items for navigation
-- =============================================
CREATE TABLE menus (
    menu_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the menu',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    menu_name VARCHAR(255) NOT NULL COMMENT 'Name of the menu (e.g., Dashboard, Reports)',
    menu_description TEXT DEFAULT NULL COMMENT 'Description of the menu',
    parent_menu_id INT DEFAULT NULL COMMENT 'Foreign key for parent menus (for nested menus)',
    menu_order INT DEFAULT 0 COMMENT 'Order of the menu in the navigation',
    menu_path VARCHAR(255) DEFAULT NULL COMMENT 'URL path for the menu',
    menu_icon VARCHAR(100) DEFAULT NULL COMMENT 'Icon class or name for the menu',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Indicates if the menu is active',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_menus_parent_menu FOREIGN KEY (parent_menu_id) REFERENCES menus(menu_id) ON DELETE SET NULL,
    INDEX idx_menu_parent (parent_menu_id),
    INDEX idx_menu_active (is_active),
    INDEX idx_menu_order (menu_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: features
-- Description: Stores features/actions within menus
-- =============================================
CREATE TABLE features (
    feature_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the feature',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    menu_id INT NOT NULL COMMENT 'Foreign key linking to the menus table',
    feature_name VARCHAR(255) NOT NULL COMMENT 'Name of the feature',
    feature_code VARCHAR(100) NOT NULL COMMENT 'Unique code for the feature',
    feature_description TEXT DEFAULT NULL COMMENT 'Description of the feature',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Indicates if the feature is active',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_feature_menu FOREIGN KEY (menu_id) REFERENCES menus(menu_id) ON DELETE CASCADE,
    UNIQUE KEY uk_feature_code (feature_code),
    INDEX idx_feature_menu (menu_id),
    INDEX idx_feature_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: employees
-- Description: Stores employee information
-- =============================================
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the employee',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    company_id INT NOT NULL COMMENT 'Foreign key linking to the company table',
    branch_id INT DEFAULT NULL COMMENT 'Foreign key linking to the branch table',
    employee_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique employee code',
    employee_name VARCHAR(255) NOT NULL COMMENT 'Full name of the employee',
    first_name VARCHAR(255) NOT NULL COMMENT 'First name of the employee',
    last_name VARCHAR(255) DEFAULT NULL COMMENT 'Last name of the employee',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Employee email address',
    phone VARCHAR(25) DEFAULT NULL COMMENT 'Employee phone number (international format)',
    designation VARCHAR(255) DEFAULT NULL COMMENT 'Job title or designation',
    department VARCHAR(255) DEFAULT NULL COMMENT 'Department the employee belongs to',
    address_line1 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 1',
    address_line2 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 2',
    address_line3 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 3',
    city VARCHAR(100) DEFAULT NULL COMMENT 'City where the employee resides',
    state VARCHAR(100) DEFAULT NULL COMMENT 'State or province',
    country VARCHAR(100) DEFAULT NULL COMMENT 'Country',
    pincode VARCHAR(20) DEFAULT NULL COMMENT 'Postal or ZIP code',
    date_of_birth DATE DEFAULT NULL COMMENT 'Employee date of birth',
    date_of_joining DATE NOT NULL COMMENT 'Date the employee joined the organization',
    date_of_leaving DATE DEFAULT NULL COMMENT 'Date the employee left (if applicable)',
    salary DECIMAL(10, 2) DEFAULT NULL COMMENT 'Employee salary',
    registration_no VARCHAR(100) UNIQUE COMMENT 'Registration number for licensed professionals',
    specialization VARCHAR(255) DEFAULT NULL COMMENT 'Specialization area, applicable for professionals like doctors',
    is_doctor BOOLEAN DEFAULT 0 COMMENT 'Indicates if the employee is a doctor',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Indicates if the employee is currently active',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_employees_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL,
    INDEX idx_employee_company (company_id),
    INDEX idx_employee_branch (branch_id),
    INDEX idx_employee_active (is_active),
    INDEX idx_employee_doctor (is_doctor),
    INDEX idx_employee_company_active (company_id, is_active),
    INDEX idx_employee_designation (designation),
    INDEX idx_employee_joining_date (date_of_joining)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: users
-- Description: Stores user authentication information
-- =============================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the user',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Username for login',
    employee_id INT NOT NULL COMMENT 'Foreign key linking to the employees table',
    role_id INT NOT NULL COMMENT 'Foreign key linking to the roles table',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'User email address for login',
    password_hash VARCHAR(512) NOT NULL COMMENT 'Hashed password for authentication (supports bcrypt with salt)',
    expiry_minutes INT DEFAULT NULL COMMENT 'Session expiry time in minutes',
    last_login DATETIME DEFAULT NULL COMMENT 'Last login timestamp',
    failed_login_attempts INT DEFAULT 0 COMMENT 'Number of failed login attempts',
    locked_until DATETIME DEFAULT NULL COMMENT 'Account locked until this timestamp',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT 'Account status',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT,
    INDEX idx_user_employee (employee_id),
    INDEX idx_user_role (role_id),
    INDEX idx_user_status (status),
    INDEX idx_user_employee_status (employee_id, status),
    INDEX idx_user_last_login (last_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: role_menus
-- Description: Maps roles to menus with permissions
-- =============================================
CREATE TABLE role_menus (
    role_menu_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for role-menu link',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    role_id INT NOT NULL COMMENT 'Foreign key linking to the roles table',
    menu_id INT NOT NULL COMMENT 'Foreign key linking to the menus table',
    can_view BOOLEAN DEFAULT 1 COMMENT 'Indicates if the role can view the menu',
    can_create BOOLEAN DEFAULT 0 COMMENT 'Indicates if the role can create items in the menu',
    can_edit BOOLEAN DEFAULT 0 COMMENT 'Indicates if the role can edit items in the menu',
    can_delete BOOLEAN DEFAULT 0 COMMENT 'Indicates if the role can delete items in the menu',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_role_menus_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_role_menus_menu FOREIGN KEY (menu_id) REFERENCES menus(menu_id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_menu (role_id, menu_id),
    INDEX idx_role_menu_role (role_id),
    INDEX idx_role_menu_menu (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: role_features
-- Description: Maps roles to features with permissions
-- =============================================
CREATE TABLE role_features (
    role_feature_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for role-feature link',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    role_id INT NOT NULL COMMENT 'Foreign key linking to the roles table',
    feature_id INT NOT NULL COMMENT 'Foreign key linking to the features table',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Indicates if the access rule is active',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_role_features_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_role_features_feature FOREIGN KEY (feature_id) REFERENCES features(feature_id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_feature (role_id, feature_id),
    INDEX idx_role_feature_role (role_id),
    INDEX idx_role_feature_feature (feature_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: employee_branches
-- Description: Maps employees to multiple branches
-- Note: Business rule - only one primary branch per employee should be enforced at application level
-- =============================================
CREATE TABLE employee_branches (
    employee_branch_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the employee-branch link',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    employee_id INT NOT NULL COMMENT 'Foreign key linking to the employees table',
    branch_id INT NOT NULL COMMENT 'Foreign key linking to the branch table',
    is_primary BOOLEAN DEFAULT 0 COMMENT 'Indicates if this is the primary branch for the employee',
    assigned_date DATE DEFAULT NULL COMMENT 'Date when employee was assigned to this branch',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Indicates if the employee has active access to the branch',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_employee_branches_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_branches_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    UNIQUE KEY uk_employee_branch (employee_id, branch_id),
    INDEX idx_employee_branch_employee (employee_id),
    INDEX idx_employee_branch_branch (branch_id),
    INDEX idx_employee_branch_primary (is_primary),
    INDEX idx_employee_branch_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: plans (for subscription management)
-- Description: Stores subscription plans
-- =============================================
CREATE TABLE plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the plan',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    plan_name VARCHAR(255) NOT NULL COMMENT 'Name of the subscription plan',
    plan_description TEXT COMMENT 'Description of the plan',
    plan_type ENUM('monthly','yearly','one-time') DEFAULT 'monthly' COMMENT 'Type of plan billing cycle',
    price DECIMAL(10,2) NOT NULL COMMENT 'Price of the plan',
    currency VARCHAR(3) DEFAULT 'INR' COMMENT 'Currency code',
    features JSON DEFAULT NULL COMMENT 'JSON array of plan features',
    max_users INT DEFAULT NULL COMMENT 'Maximum number of users allowed',
    max_branches INT DEFAULT NULL COMMENT 'Maximum number of branches allowed',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Indicates if the plan is active',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    INDEX idx_plan_active (is_active),
    INDEX idx_plan_type (plan_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: subscriptions
-- Description: Stores company subscriptions
-- =============================================
CREATE TABLE subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the subscription',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    company_id INT NOT NULL COMMENT 'Foreign key linking to the companies table',
    plan_id INT NOT NULL COMMENT 'Foreign key linking to the plans table',
    start_date DATE NOT NULL COMMENT 'Subscription start date',
    end_date DATE DEFAULT NULL COMMENT 'Subscription end date',
    status ENUM('active','expired','cancelled','suspended') DEFAULT 'active' COMMENT 'Subscription status',
    auto_renew BOOLEAN DEFAULT 1 COMMENT 'Indicates if subscription auto-renews',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_subscriptions_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(plan_id) ON DELETE RESTRICT,
    INDEX idx_subscription_company (company_id),
    INDEX idx_subscription_status (status),
    INDEX idx_subscription_dates (start_date, end_date),
    INDEX idx_subscription_company_status (company_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: hms_settings
-- Description: Stores system and company-specific settings
-- =============================================
CREATE TABLE hms_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for settings',
    company_id INT DEFAULT NULL COMMENT 'Foreign key linking to the companies table (NULL for system settings)',
    setting_key VARCHAR(100) NOT NULL COMMENT 'Setting key',
    setting_value TEXT COMMENT 'Setting value',
    setting_type ENUM('system','company','branch') DEFAULT 'company' COMMENT 'Type of setting',
    description TEXT COMMENT 'Description of the setting',
    is_encrypted BOOLEAN DEFAULT 0 COMMENT 'Indicates if the value is encrypted',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_settings_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    UNIQUE KEY uk_company_setting (company_id, setting_key),
    INDEX idx_setting_type (setting_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: patients
-- Description: Stores patient information
-- =============================================
CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the patient',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    company_id INT NOT NULL COMMENT 'Foreign key linking to the company',
    branch_id INT NOT NULL COMMENT 'Foreign key linking to the branch',
    patient_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique patient code/MRN',
    first_name VARCHAR(255) NOT NULL COMMENT 'Patient first name',
    last_name VARCHAR(255) DEFAULT NULL COMMENT 'Patient last name',
    date_of_birth DATE NOT NULL COMMENT 'Patient date of birth',
    gender ENUM('male', 'female', 'other') NOT NULL COMMENT 'Patient gender',
    blood_group VARCHAR(5) DEFAULT NULL COMMENT 'Blood group (A+, B-, etc.)',
    email VARCHAR(255) DEFAULT NULL COMMENT 'Patient email address',
    phone VARCHAR(25) NOT NULL COMMENT 'Patient phone number',
    emergency_contact_name VARCHAR(255) DEFAULT NULL COMMENT 'Emergency contact name',
    emergency_contact_phone VARCHAR(25) DEFAULT NULL COMMENT 'Emergency contact phone',
    address_line1 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 1',
    address_line2 VARCHAR(255) DEFAULT NULL COMMENT 'Address line 2',
    city VARCHAR(100) DEFAULT NULL COMMENT 'City',
    state VARCHAR(100) DEFAULT NULL COMMENT 'State',
    country VARCHAR(100) DEFAULT NULL COMMENT 'Country',
    pincode VARCHAR(20) DEFAULT NULL COMMENT 'Postal code',
    allergies TEXT DEFAULT NULL COMMENT 'Known allergies',
    medical_history TEXT DEFAULT NULL COMMENT 'Medical history notes',
    is_active BOOLEAN DEFAULT 1 COMMENT 'Patient status',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_patients_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_patients_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    INDEX idx_patient_company (company_id),
    INDEX idx_patient_branch (branch_id),
    INDEX idx_patient_name (first_name, last_name),
    INDEX idx_patient_phone (phone),
    INDEX idx_patient_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: appointments
-- Description: Stores appointment information
-- =============================================
CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incremented primary key for the appointment',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT 'UUID as logical identifier for external references',
    company_id INT NOT NULL COMMENT 'Foreign key linking to the company',
    branch_id INT NOT NULL COMMENT 'Foreign key linking to the branch',
    patient_id INT NOT NULL COMMENT 'Foreign key linking to the patient',
    doctor_id INT NOT NULL COMMENT 'Foreign key linking to the doctor (employee)',
    appointment_date DATE NOT NULL COMMENT 'Date of appointment',
    appointment_time TIME NOT NULL COMMENT 'Time of appointment',
    duration_minutes INT DEFAULT 30 COMMENT 'Duration in minutes',
    appointment_type VARCHAR(50) DEFAULT 'consultation' COMMENT 'Type of appointment',
    status ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled' COMMENT 'Appointment status',
    chief_complaint TEXT DEFAULT NULL COMMENT 'Chief complaint/reason for visit',
    notes TEXT DEFAULT NULL COMMENT 'Appointment notes',
    created_by CHAR(36) NOT NULL COMMENT 'User ID who created the record',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_by CHAR(36) DEFAULT NULL COMMENT 'User ID who last updated the record',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_appointments_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    INDEX idx_appointment_date (appointment_date, appointment_time),
    INDEX idx_appointment_patient (patient_id),
    INDEX idx_appointment_doctor (doctor_id),
    INDEX idx_appointment_status (status),
    INDEX idx_appointment_company_date (company_id, appointment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;