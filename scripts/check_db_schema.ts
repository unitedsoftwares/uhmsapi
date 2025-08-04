import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkDatabaseSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Connected to database successfully\n');

        // Get all tables
        const [tables] = await connection.execute(
            'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
            [process.env.DB_NAME]
        );

        console.log('Database Tables:');
        console.log('================');
        
        for (const table of tables as any[]) {
            console.log(`\nTable: ${table.TABLE_NAME}`);
            console.log('-'.repeat(40));
            
            // Get column details for each table
            const [columns] = await connection.execute(
                `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA 
                 FROM information_schema.COLUMNS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
                [process.env.DB_NAME, table.TABLE_NAME]
            );
            
            for (const column of columns as any[]) {
                console.log(`  ${column.COLUMN_NAME}: ${column.DATA_TYPE} ${column.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${column.COLUMN_KEY === 'PRI' ? 'PRIMARY KEY' : ''} ${column.EXTRA}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkDatabaseSchema().catch(console.error);