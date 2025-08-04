import mysql from 'mysql2/promise';

async function listAuthTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'your_host',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'your_user',
        password: process.env.DB_PASSWORD || 'your_password',
        database: 'hms'
    });

    try {
        // Common auth-related table name patterns
        const authPatterns = [
            'user%',
            'auth%',
            'role%',
            'permission%',
            'access%',
            'session%',
            'token%',
            'login%',
            'account%',
            'privilege%'
        ];

        const whereClause = authPatterns
            .map(pattern => `TABLE_NAME LIKE '${pattern}'`)
            .join(' OR ');

        const [tables] = await connection.execute(
            `SELECT TABLE_NAME, TABLE_COMMENT 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = 'hms' 
             AND (${whereClause})
             ORDER BY TABLE_NAME`
        );

        console.log('Authentication-related tables in HMS:');
        console.log('====================================\n');
        
        if ((tables as any[]).length === 0) {
            console.log('No auth-related tables found with common naming patterns.');
            console.log('\nAll tables in database:');
            
            const [allTables] = await connection.execute(
                `SELECT TABLE_NAME FROM information_schema.TABLES 
                 WHERE TABLE_SCHEMA = 'hms' ORDER BY TABLE_NAME`
            );
            
            (allTables as any[]).forEach(table => {
                console.log(`- ${table.TABLE_NAME}`);
            });
        } else {
            (tables as any[]).forEach((table, index) => {
                console.log(`${index + 1}. ${table.TABLE_NAME}`);
                if (table.TABLE_COMMENT) {
                    console.log(`   Comment: ${table.TABLE_COMMENT}`);
                }
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

listAuthTables().catch(console.error);