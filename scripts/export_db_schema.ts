import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface TableInfo {
    tableName: string;
    columns: ColumnInfo[];
    indexes: IndexInfo[];
    foreignKeys: ForeignKeyInfo[];
}

interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    key: string;
    default: string | null;
    extra: string;
}

interface IndexInfo {
    name: string;
    columns: string[];
    unique: boolean;
}

interface ForeignKeyInfo {
    name: string;
    column: string;
    referencedTable: string;
    referencedColumn: string;
}

async function exportDatabaseSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hms'
    });

    try {
        console.log('Connected to database. Exporting schema...\n');

        // Get all tables
        const [tables] = await connection.execute(
            `SELECT TABLE_NAME, TABLE_COMMENT, ENGINE, TABLE_ROWS 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? 
             ORDER BY TABLE_NAME`,
            [process.env.DB_NAME || 'hms']
        ) as any;

        const schemaData: any = {
            database: process.env.DB_NAME || 'hms',
            exportDate: new Date().toISOString(),
            tables: []
        };

        for (const table of tables) {
            console.log(`Processing table: ${table.TABLE_NAME}`);
            
            const tableInfo: any = {
                name: table.TABLE_NAME,
                comment: table.TABLE_COMMENT,
                engine: table.ENGINE,
                estimatedRows: table.TABLE_ROWS,
                columns: [],
                indexes: [],
                foreignKeys: []
            };

            // Get columns
            const [columns] = await connection.execute(
                `SELECT 
                    COLUMN_NAME,
                    COLUMN_TYPE,
                    IS_NULLABLE,
                    COLUMN_KEY,
                    COLUMN_DEFAULT,
                    EXTRA,
                    COLUMN_COMMENT
                 FROM information_schema.COLUMNS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                 ORDER BY ORDINAL_POSITION`,
                [process.env.DB_NAME || 'hms', table.TABLE_NAME]
            ) as any;

            tableInfo.columns = columns.map((col: any) => ({
                name: col.COLUMN_NAME,
                type: col.COLUMN_TYPE,
                nullable: col.IS_NULLABLE === 'YES',
                key: col.COLUMN_KEY,
                default: col.COLUMN_DEFAULT,
                extra: col.EXTRA,
                comment: col.COLUMN_COMMENT
            }));

            // Get indexes
            const [indexes] = await connection.execute(
                `SELECT 
                    INDEX_NAME,
                    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMNS,
                    NON_UNIQUE
                 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                 GROUP BY INDEX_NAME, NON_UNIQUE`,
                [process.env.DB_NAME || 'hms', table.TABLE_NAME]
            ) as any;

            tableInfo.indexes = indexes.map((idx: any) => ({
                name: idx.INDEX_NAME,
                columns: idx.COLUMNS.split(','),
                unique: idx.NON_UNIQUE === 0
            }));

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
                [process.env.DB_NAME || 'hms', table.TABLE_NAME]
            ) as any;

            tableInfo.foreignKeys = foreignKeys.map((fk: any) => ({
                name: fk.CONSTRAINT_NAME,
                column: fk.COLUMN_NAME,
                referencedTable: fk.REFERENCED_TABLE_NAME,
                referencedColumn: fk.REFERENCED_COLUMN_NAME
            }));

            schemaData.tables.push(tableInfo);
        }

        // Create exports directory if it doesn't exist
        const exportsDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir);
        }

        // Write JSON schema
        const jsonPath = path.join(exportsDir, `schema_${Date.now()}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(schemaData, null, 2));
        console.log(`\nSchema exported to: ${jsonPath}`);

        // Generate markdown documentation
        const mdPath = path.join(exportsDir, `schema_${Date.now()}.md`);
        const markdown = generateMarkdown(schemaData);
        fs.writeFileSync(mdPath, markdown);
        console.log(`Documentation exported to: ${mdPath}`);

        // Generate TypeScript interfaces
        const tsPath = path.join(exportsDir, `schema_interfaces_${Date.now()}.ts`);
        const interfaces = generateTypeScriptInterfaces(schemaData);
        fs.writeFileSync(tsPath, interfaces);
        console.log(`TypeScript interfaces exported to: ${tsPath}`);

        console.log('\nExport completed successfully!');
        console.log(`Total tables exported: ${schemaData.tables.length}`);

    } catch (error) {
        console.error('Error exporting schema:', error);
    } finally {
        await connection.end();
    }
}

function generateMarkdown(schema: any): string {
    let md = `# Database Schema: ${schema.database}\n\n`;
    md += `**Export Date:** ${schema.exportDate}\n\n`;
    md += `**Total Tables:** ${schema.tables.length}\n\n`;
    md += `## Tables\n\n`;

    for (const table of schema.tables) {
        md += `### ${table.name}\n\n`;
        if (table.comment) md += `${table.comment}\n\n`;
        md += `**Engine:** ${table.engine} | **Estimated Rows:** ${table.estimatedRows || 'N/A'}\n\n`;
        
        // Columns table
        md += `#### Columns\n\n`;
        md += `| Column | Type | Nullable | Key | Default | Extra |\n`;
        md += `|--------|------|----------|-----|---------|-------|\n`;
        
        for (const col of table.columns) {
            md += `| ${col.name} | ${col.type} | ${col.nullable ? 'YES' : 'NO'} | ${col.key || '-'} | ${col.default || 'NULL'} | ${col.extra || '-'} |\n`;
        }
        
        // Indexes
        if (table.indexes.length > 0) {
            md += `\n#### Indexes\n\n`;
            for (const idx of table.indexes) {
                md += `- **${idx.name}** (${idx.unique ? 'UNIQUE' : 'INDEX'}): ${idx.columns.join(', ')}\n`;
            }
        }
        
        // Foreign Keys
        if (table.foreignKeys.length > 0) {
            md += `\n#### Foreign Keys\n\n`;
            for (const fk of table.foreignKeys) {
                md += `- **${fk.name}**: ${fk.column} → ${fk.referencedTable}.${fk.referencedColumn}\n`;
            }
        }
        
        md += '\n---\n\n';
    }
    
    return md;
}

function generateTypeScriptInterfaces(schema: any): string {
    let ts = `// Generated Database Interfaces for ${schema.database}\n`;
    ts += `// Export Date: ${schema.exportDate}\n\n`;

    for (const table of schema.tables) {
        const interfaceName = toPascalCase(table.name);
        ts += `export interface ${interfaceName} {\n`;
        
        for (const col of table.columns) {
            const tsType = mysqlToTypeScript(col.type);
            const optional = col.nullable ? '?' : '';
            ts += `  ${toCamelCase(col.name)}${optional}: ${tsType};\n`;
        }
        
        ts += `}\n\n`;
    }
    
    return ts;
}

function toPascalCase(str: string): string {
    return str.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

function toCamelCase(str: string): string {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function mysqlToTypeScript(mysqlType: string): string {
    const type = mysqlType.toLowerCase();
    if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
        return 'number';
    }
    if (type.includes('varchar') || type.includes('text') || type.includes('char')) {
        return 'string';
    }
    if (type.includes('date') || type.includes('time')) {
        return 'Date';
    }
    if (type.includes('boolean') || type.includes('bit')) {
        return 'boolean';
    }
    if (type.includes('json')) {
        return 'any';
    }
    return 'any';
}

// Run the export
exportDatabaseSchema().catch(console.error);