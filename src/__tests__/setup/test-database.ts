import mysql from 'mysql2/promise';
import { config } from '../../config';
import fs from 'fs';
import path from 'path';

export class TestDatabase {
  private static connection: mysql.Connection;
  private static readonly TEST_DB_NAME = 'hms_test';

  static async setup(): Promise<void> {
    // Create connection without database
    this.connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      multipleStatements: true
    });

    // Create test database
    await this.connection.query(`DROP DATABASE IF EXISTS ${this.TEST_DB_NAME}`);
    await this.connection.query(`CREATE DATABASE ${this.TEST_DB_NAME}`);
    await this.connection.query(`USE ${this.TEST_DB_NAME}`);

    // Load and execute schema
    const schemaPath = path.join(process.cwd(), 'scripts', 'schema-structure-only.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove database creation/selection statements from schema
    const cleanSchema = schema
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/USE.*?;/gi, '');

    // Split schema into individual statements and execute them
    const statements = cleanSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await this.connection.query(statement);
        } catch (error: any) {
          console.error('Failed to execute statement:', statement.substring(0, 200), '...');
          throw error;
        }
      }
    }

    // Update config to use test database
    config.database.name = this.TEST_DB_NAME;
  }

  static async seedTestData(): Promise<void> {
    const systemUuid = 'SYSTEM-0000-0000-0000-000000000000';
    
    // Insert test company
    await this.connection.query(`
      INSERT INTO companies (uuid, company_name, company_email, company_phone, address_line1, city, state, country, pincode, gstin, pan, cin, is_active, created_by, updated_by)
      VALUES (UUID(), 'Test Hospital', 'test@hospital.com', '1234567890', '123 Test St', 'Test City', 'Test State', 'India', '123456', 'GST123456', 'PAN123456', 'CIN123456', 1, ?, ?)
    `, [systemUuid, systemUuid]);

    // Insert test roles
    const roles = [
      ['Administrator', 'System Administrator'],
      ['Admin', 'System Administrator'],
      ['Doctor', 'Medical Doctor'],
      ['Nurse', 'Nursing Staff'],
      ['Receptionist', 'Front Desk Staff']
    ];
    
    for (const [name, description] of roles) {
      await this.connection.query(
        'INSERT INTO roles (uuid, role_name, role_description, is_active, created_by, updated_by) VALUES (UUID(), ?, ?, 1, ?, ?)',
        [name, description, systemUuid, systemUuid]
      );
    }

    // Insert test menus
    const menus = [
      ['Dashboard', 'Main Dashboard', null, 1],
      ['Patients', 'Patient Management', null, 2],
      ['Appointments', 'Appointment Management', null, 3],
      ['Reports', 'Reports Module', null, 4]
    ];
    
    for (const [name, description, parentId, order] of menus) {
      await this.connection.query(
        'INSERT INTO menus (uuid, menu_name, menu_description, parent_menu_id, menu_order, is_active, created_by, updated_by) VALUES (UUID(), ?, ?, ?, ?, 1, ?, ?)',
        [name, description, parentId, order, systemUuid, systemUuid]
      );
    }

    // Get menu IDs for features
    const [menuRows] = await this.connection.query('SELECT menu_id, menu_name FROM menus');
    const menuMap: Record<string, number> = {};
    for (const menu of menuRows as any[]) {
      menuMap[menu.menu_name] = menu.menu_id;
    }

    // Insert test features
    const features = [
      ['Dashboard', 'User Management', 'USER_MGMT', 'Manage system users'],
      ['Patients', 'Patient Management', 'PATIENT_MGMT', 'Manage patient records'],
      ['Appointments', 'Appointment Management', 'APPT_MGMT', 'Manage appointments'],
      ['Reports', 'Report Generation', 'REPORT_GEN', 'Generate reports']
    ];
    
    for (const [menuName, featureName, featureCode, description] of features) {
      if (menuMap[menuName]) {
        await this.connection.query(
          'INSERT INTO features (uuid, menu_id, feature_name, feature_code, feature_description, is_active, created_by, updated_by) VALUES (UUID(), ?, ?, ?, ?, 1, ?, ?)',
          [menuMap[menuName], featureName, featureCode, description, systemUuid, systemUuid]
        );
      }
    }
  }

  static async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.query(`DROP DATABASE IF EXISTS ${this.TEST_DB_NAME}`);
      await this.connection.end();
    }
  }

  static async clearTables(): Promise<void> {
    await this.connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tables = [
      'appointments', 'patients', 'hms_settings', 'subscriptions', 
      'plans', 'employee_branches', 'role_features', 'role_menus',
      'users', 'employees', 'features', 'menus', 'roles', 
      'branches', 'companies'
    ];

    for (const table of tables) {
      await this.connection.query(`TRUNCATE TABLE ${table}`);
    }

    await this.connection.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  static getConnection(): mysql.Connection {
    return this.connection;
  }
}