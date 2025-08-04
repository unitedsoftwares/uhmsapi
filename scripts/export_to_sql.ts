import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function exportToSQL() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hms'
    });

    try {
        console.log('Connected to database. Exporting to SQL...\n');
        
        const dbName = process.env.DB_NAME || 'hms';
        let sqlContent = `-- Database Schema Export for: ${dbName}\n`;
        sqlContent += `-- Generated on: ${new Date().toISOString()}\n\n`;
        sqlContent += `-- Create database if not exists\n`;
        sqlContent += `CREATE DATABASE IF NOT EXISTS \`${dbName}\`;\n`;
        sqlContent += `USE \`${dbName}\`;\n\n`;

        // Get all tables
        const [tables] = await connection.execute(
            `SELECT TABLE_NAME FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
            [dbName]
        ) as any;

        console.log(`Found ${tables.length} tables to export\n`);

        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            console.log(`Exporting table: ${tableName}`);

            // Get CREATE TABLE statement
            const [createTable] = await connection.execute(
                `SHOW CREATE TABLE \`${tableName}\``
            ) as any;

            sqlContent += `-- Table: ${tableName}\n`;
            sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            sqlContent += createTable[0]['Create Table'] + ';\n\n';

            // Get table data (optional - comment out if you only want structure)
            const [rows] = await connection.execute(
                `SELECT * FROM \`${tableName}\``
            ) as any;

            if (rows.length > 0) {
                sqlContent += `-- Data for table: ${tableName}\n`;
                const columns = Object.keys(rows[0]);
                
                // Build INSERT statements
                for (let i = 0; i < rows.length; i += 100) { // Batch inserts
                    const batch = rows.slice(i, i + 100);
                    sqlContent += `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES\n`;
                    
                    const values = batch.map((row: any, index: number) => {
                        const vals = columns.map(col => {
                            const val = row[col];
                            if (val === null) return 'NULL';
                            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                            return val;
                        });
                        return `(${vals.join(', ')})`;
                    });
                    
                    sqlContent += values.join(',\n') + ';\n\n';
                }
            }
        }

        // Add indexes and foreign keys
        sqlContent += `-- Indexes and Foreign Keys\n`;
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            
            // Get foreign keys
            const [foreignKeys] = await connection.execute(
                `SELECT 
                    CONSTRAINT_NAME,
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                 FROM information_schema.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = ? 
                   AND TABLE_NAME = ?
                   AND REFERENCED_TABLE_NAME IS NOT NULL`,
                [dbName, tableName]
            ) as any;

            if (foreignKeys.length > 0) {
                sqlContent += `\n-- Foreign keys for ${tableName}\n`;
                for (const fk of foreignKeys) {
                    sqlContent += `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${fk.CONSTRAINT_NAME}\` `;
                    sqlContent += `FOREIGN KEY (\`${fk.COLUMN_NAME}\`) `;
                    sqlContent += `REFERENCES \`${fk.REFERENCED_TABLE_NAME}\` (\`${fk.REFERENCED_COLUMN_NAME}\`);\n`;
                }
            }
        }

        // Create exports directory
        const exportsDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir);
        }

        // Write SQL file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const sqlPath = path.join(exportsDir, `${dbName}_export_${timestamp}.sql`);
        fs.writeFileSync(sqlPath, sqlContent);
        
        console.log(`\nSQL export completed successfully!`);
        console.log(`File saved to: ${sqlPath}`);
        console.log(`Total size: ${(sqlContent.length / 1024).toFixed(2)} KB`);

        // Also create a structure-only version
        const structureOnly = sqlContent.split('\n')
            .filter(line => !line.startsWith('INSERT INTO'))
            .join('\n');
        
        const structurePath = path.join(exportsDir, `${dbName}_structure_${timestamp}.sql`);
        fs.writeFileSync(structurePath, structureOnly);
        console.log(`Structure-only file: ${structurePath}`);

    } catch (error) {
        console.error('Error exporting database:', error);
    } finally {
        await connection.end();
    }
}

// Run the export
exportToSQL().catch(console.error);