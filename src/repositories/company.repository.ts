import { BaseRepository } from './base.repository';
import { Company } from '../models';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export class CompanyRepository extends BaseRepository<Company> {
  constructor() {
    super('companies', 'company_id', true);
  }

  async findByName(companyName: string, connection?: PoolConnection): Promise<Company | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        company_id,
        uuid,
        company_name,
        company_email,
        company_phone,
        company_fax,
        company_website,
        address_line1,
        address_line2,
        address_line3,
        city,
        state,
        state_code,
        country,
        pincode,
        gstin,
        pan,
        cin,
        contact_person_name,
        contact_person_email,
        contact_person_phone,
        is_taxpayer,
        logo,
        is_active,
        created_by,
        created_at,
        updated_by,
        updated_at
      FROM companies 
      WHERE company_name = ? AND is_active = 1`,
      [companyName]
    );
    return rows.length > 0 ? (rows[0] as Company) : null;
  }

}