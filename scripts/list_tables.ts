import mysql from 'mysql2/promise';

async function listTables() {
    // Create a .env file with your credentials - DO NOT commit this file
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'your_host',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'your_user',
        password: process.env.DB_PASSWORD || 'your_password',
        database: 'hms' // The schema you want to check
    });

    try {
        const [tables] = await connection.execute(
            `SELECT TABLE_NAME, TABLE_ROWS, ENGINE, CREATE_TIME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = 'hms'
             ORDER BY TABLE_NAME`
        );

        console.log('Tables in HMS schema:');
        console.log('====================\n');
        
        (tables as any[]).forEach((table, index) => {
            console.log(`${index + 1}. ${table.TABLE_NAME}`);
            console.log(`   Rows: ${table.TABLE_ROWS || 'N/A'}`);
            console.log(`   Engine: ${table.ENGINE}`);
            console.log(`   Created: ${table.CREATE_TIME || 'N/A'}\n`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

// Run this script with: ts-node scripts/list_tables.ts
listTables().catch(console.error);