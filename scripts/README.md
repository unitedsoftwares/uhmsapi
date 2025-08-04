# HMS Database Scripts

This folder contains database scripts for the Hospital Management System.

## Files

### schema.sql
The complete database schema for HMS including:

- **Core Tables**
  - `companies` - Hospital/clinic information
  - `branches` - Multiple locations per company
  - `employees` - Employee records (includes personal info like first_name, last_name, phone)
  - `users` - Authentication info (references employee for personal details)
  - `roles` - User roles (Admin, Doctor, Nurse, etc.)

- **Permission Tables**
  - `menus` - Navigation menu items
  - `features` - Features within menus
  - `role_menus` - Role-based menu permissions (CRUD)
  - `roles_features` - Role-based feature access

- **Association Tables**
  - `employee_branches` - Maps employees to multiple branches

- **Subscription Tables**
  - `plans` - Subscription plans
  - `subscriptions` - Company subscriptions

- **Configuration**
  - `hms_settings` - System and company settings

## Key Design Decisions

1. **User vs Employee Separation**: 
   - `employees` table contains all personal information (name, phone, email, etc.)
   - `users` table only contains authentication info (username, password_hash) and references employee

2. **Foreign Key Constraints**:
   - All foreign keys properly defined with appropriate CASCADE/RESTRICT rules
   - Tables ordered to respect dependencies

3. **UUID Support**:
   - All tables have UUID fields for external API references
   - Primary keys remain integers for performance

4. **Audit Fields**:
   - All tables include created_by, created_at, updated_by, updated_at

5. **Indexes**:
   - Strategic indexes on foreign keys, status fields, and commonly queried columns

## Usage

To create the database:
```bash
mysql -u root -p < scripts/schema.sql
```

To reset the database:
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS hms_db"
mysql -u root -p < scripts/schema.sql
```

## Initial Data

The schema includes initial data for:
- Default roles (Super Admin, Admin, Doctor, Nurse, Receptionist, Accountant)
- Default menus (Dashboard, Patients, Appointments, Billing, Reports, Settings, Users)
- Default plans (Basic, Professional, Enterprise)
- System settings (version, password policies, session settings)