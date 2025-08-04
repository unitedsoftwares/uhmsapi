-- Seed test data for HMS API development

-- Insert test company
INSERT INTO companies (uuid, company_name, company_email, company_phone, is_active, created_at) 
VALUES (UUID(), 'Test Hospital', 'admin@testhospital.com', '1234567890', TRUE, NOW())
ON DUPLICATE KEY UPDATE company_name = company_name;

-- Get the company_id
SET @company_id = LAST_INSERT_ID();

-- Insert test roles
INSERT INTO roles (uuid, role_name, role_description, is_active, created_at)
VALUES 
    (UUID(), 'Admin', 'Administrator with full access', TRUE, NOW()),
    (UUID(), 'Doctor', 'Medical practitioner', TRUE, NOW()),
    (UUID(), 'Nurse', 'Nursing staff', TRUE, NOW()),
    (UUID(), 'Receptionist', 'Front desk staff', TRUE, NOW())
ON DUPLICATE KEY UPDATE role_name = role_name;

-- Display inserted data
SELECT 'Test data inserted successfully!' as message;
SELECT company_id, company_name, company_email FROM companies WHERE company_name = 'Test Hospital';
SELECT role_id, role_name FROM roles WHERE is_active = TRUE;