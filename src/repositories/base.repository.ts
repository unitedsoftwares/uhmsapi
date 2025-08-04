import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { database } from '../config/database';
import { BaseEntity, PaginationQuery, PaginatedResponse } from '../models';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseRepository<T extends BaseEntity> {
  protected tableName: string;
  protected primaryKey: string;
  protected hasIsActive: boolean;
  
  protected get pool(): Pool {
    return database.getPool();
  }

  constructor(tableName: string, primaryKey: string = 'uuid', hasIsActive: boolean = true) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.hasIsActive = hasIsActive;
  }

  async findByUuid(uuid: string, connection?: PoolConnection): Promise<T | null> {
    const conn = connection || this.pool;
    const whereCondition = this.hasIsActive ? 'WHERE uuid = ? AND is_active = 1' : 'WHERE uuid = ?';
    const params = this.hasIsActive ? [uuid] : [uuid];
    
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.tableName} ${whereCondition}`,
      params
    );
    return rows.length > 0 ? (rows[0] as T) : null;
  }

  async findByPrimaryKey(id: number | string, connection?: PoolConnection): Promise<T | null> {
    const conn = connection || this.pool;
    const whereCondition = this.hasIsActive 
      ? `WHERE ${this.primaryKey} = ? AND is_active = 1` 
      : `WHERE ${this.primaryKey} = ?`;
    const params = [id];
    
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.tableName} ${whereCondition}`,
      params
    );
    
    return rows.length > 0 ? (rows[0] as T) : null;
  }

  async findAll(
    filters: Partial<T> = {},
    pagination?: PaginationQuery,
    connection?: PoolConnection
  ): Promise<PaginatedResponse<T>> {
    const conn = connection || this.pool;
    const page = pagination?.page || config.pagination.defaultPage;
    const limit = Math.min(
      pagination?.limit || config.pagination.defaultLimit,
      config.pagination.maxLimit
    );
    const offset = (page - 1) * limit;
    const sortBy = pagination?.sort_by || 'created_at';
    const sortOrder = pagination?.sort_order || 'DESC';

    // Build WHERE clause
    const whereConditions: string[] = [];
    const whereValues: any[] = [];

    if (this.hasIsActive) {
      whereConditions.push('is_active = 1');
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`${key} = ?`);
        whereValues.push(value);
      }
    });

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const [countResult] = await conn.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
      whereValues
    );
    const total = countResult[0].total;

    // Get paginated data
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.tableName} ${whereClause} 
       ORDER BY ${sortBy} ${sortOrder} 
       LIMIT ? OFFSET ?`,
      [...whereValues, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    return {
      items: rows as T[],
      pagination: {
        page,
        limit,
        total_items: total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1,
      },
    };
  }

  async create(
    data: any,
    createdBy: string,
    connection?: PoolConnection
  ): Promise<T> {
    const conn = connection || this.pool;
    const uuid = uuidv4();
    const now = new Date();
    
    const entity = {
      ...data,
      uuid,
      created_at: now,
      created_by: createdBy,
      updated_at: now,
      updated_by: createdBy,
      ...(this.hasIsActive && { is_active: true }),
    };

    const columns = Object.keys(entity).filter(key => (entity as any)[key] !== undefined);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => (entity as any)[col]);

    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    // For auto-increment primary keys, add the insertId
    if (typeof this.primaryKey === 'string' && this.primaryKey.includes('_id')) {
      (entity as any)[this.primaryKey] = result.insertId;
    }

    return entity as T;
  }

  async update(
    identifier: string | number,
    data: Partial<Omit<T, keyof BaseEntity>>,
    updatedBy: string,
    connection?: PoolConnection
  ): Promise<boolean> {
    const conn = connection || this.pool;
    const updates = {
      ...data,
      updated_at: new Date(),
      updated_by: updatedBy,
    };

    const setClause = Object.keys(updates)
      .filter(key => (updates as any)[key] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(updates)
      .filter(key => (updates as any)[key] !== undefined)
      .map(key => (updates as any)[key]);
    
    values.push(identifier);

    const whereCondition = this.hasIsActive 
      ? `WHERE ${this.primaryKey} = ? AND is_active = 1`
      : `WHERE ${this.primaryKey} = ?`;

    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE ${this.tableName} SET ${setClause} ${whereCondition}`,
      values
    );

    return result.affectedRows > 0;
  }

  async softDelete(
    identifier: string | number,
    updatedBy: string,
    connection?: PoolConnection
  ): Promise<boolean> {
    if (!this.hasIsActive) {
      throw new Error(`Table ${this.tableName} does not support soft delete`);
    }

    const conn = connection || this.pool;
    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE ${this.tableName} 
       SET is_active = 0, updated_at = NOW(), updated_by = ? 
       WHERE ${this.primaryKey} = ? AND is_active = 1`,
      [updatedBy, identifier]
    );

    return result.affectedRows > 0;
  }

  async hardDelete(
    identifier: string | number,
    connection?: PoolConnection
  ): Promise<boolean> {
    const conn = connection || this.pool;
    const [result] = await conn.execute<ResultSetHeader>(
      `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
      [identifier]
    );

    return result.affectedRows > 0;
  }

  async exists(
    filters: Partial<T>,
    excludeIdentifier?: string | number,
    connection?: PoolConnection
  ): Promise<boolean> {
    const conn = connection || this.pool;
    const whereConditions: string[] = [];
    const whereValues: any[] = [];

    if (this.hasIsActive) {
      whereConditions.push('is_active = 1');
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`${key} = ?`);
        whereValues.push(value);
      }
    });

    if (excludeIdentifier !== undefined) {
      whereConditions.push(`${this.primaryKey} != ?`);
      whereValues.push(excludeIdentifier);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 1 FROM ${this.tableName} ${whereClause} LIMIT 1`,
      whereValues
    );

    return rows.length > 0;
  }
}