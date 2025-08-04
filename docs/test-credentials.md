# Test Credentials for Auth API Tester

## Database Setup

Before testing the authentication endpoints, make sure you have test data in your database:

```bash
# Run the seed script to create test company and roles
mysql -u root -p carpusdb < scripts/seed-test-data.sql
```

## Test Values for Registration

Use these values when testing the `/auth/register` endpoint:

### Required Fields:
- **Username**: testuser1 (alphanumeric, 3-30 characters)
- **Email**: testuser1@example.com
- **Password**: Test@123 (min 8 chars, includes uppercase, lowercase, number, and special character)
- **First Name**: John
- **Last Name**: Doe
- **Phone**: 1234567890 (10 digits)
- **Company ID**: 1 (or check your database for actual company_id)
- **Role ID**: 1 (Admin) or 2 (Doctor) or 3 (Nurse) or 4 (Receptionist)

### To find actual IDs in your database:

```sql
-- Find company IDs
SELECT company_id, company_name FROM companies WHERE is_active = TRUE;

-- Find role IDs
SELECT role_id, role_name FROM roles WHERE is_active = TRUE;
```

## Test Values for Login

After successful registration, use:
- **Email**: testuser1@example.com (or the username)
- **Password**: Test@123

## Complete Registration (Alternative Flow)

For `/auth/register-complete` endpoint:
- **Email**: newadmin@example.com
- **Password**: Admin@123
- **First Name**: Admin
- **Last Name**: User
- **Phone**: 9876543210
- **Company Name**: New Hospital
- **Is Admin**: true (checked)

## Common Password Patterns That Pass Validation:
- Test@123
- Password@1
- Admin@2024
- Doctor@123
- Nurse@456

## Troubleshooting

1. **"Company not found" error**: Make sure to run the seed script or manually insert a company
2. **"Role not found" error**: Check that roles exist in your database
3. **Password validation error**: Password must contain at least one uppercase, lowercase, number, and special character
4. **Phone validation error**: Phone must be exactly 10 digits