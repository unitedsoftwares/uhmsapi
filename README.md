# HMS API - Hospital Management System API

A comprehensive, enterprise-grade REST API for Hospital Management System built with Node.js, Express, TypeScript, and MySQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Multi-tenancy**: Organization-based isolation with role management
- **Security**: Helmet, CORS, rate limiting, input validation
- **Error Handling**: Centralized error handling with custom error types
- **Logging**: Winston-based logging with file rotation
- **Database**: MySQL with connection pooling and transaction support
- **TypeScript**: Full type safety with strict mode
- **Clean Architecture**: Repository pattern, service layer, dependency injection

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, bcrypt

## Project Structure

```
hms_api/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Data access layer
│   ├── models/         # TypeScript interfaces
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── validators/     # Input validation schemas
│   ├── utils/          # Utility functions
│   ├── errors/         # Custom error classes
│   ├── types/          # Type definitions
│   ├── app.ts          # Express app setup
│   └── index.ts        # Server entry point
├── logs/               # Application logs
├── scripts/            # Database scripts
└── package.json
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hms_api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   mysql -u root -p < src/db/dbscript.sql
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3500

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hms

# JWT
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## API Documentation

### Base URL
```
http://localhost:3500/api/v1
```

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <access_token>
```

#### Update Profile
```http
PATCH /auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "firstName": "John",
  "lastName": "Smith"
}
```

#### Change Password
```http
POST /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

### Organizations

#### Create Organization
```http
POST /organizations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "General Hospital"
}
```

#### Get User's Organizations
```http
GET /organizations/my-organizations
Authorization: Bearer <access_token>
```

#### Get Organization Details
```http
GET /organizations/:organizationId
Authorization: Bearer <access_token>
```

#### Update Organization
```http
PATCH /organizations/:organizationId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "New Hospital Name"
}
```

#### Get Organization Members
```http
GET /organizations/:organizationId/members?page=1&limit=20
Authorization: Bearer <access_token>
```

#### Add Member
```http
POST /organizations/:organizationId/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userEmail": "newmember@example.com",
  "roleId": "role-uuid"
}
```

#### Update Member Role
```http
PATCH /organizations/:organizationId/members/:userId/role
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "roleId": "new-role-uuid"
}
```

### Roles

#### Create Role
```http
POST /roles
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Doctor",
  "organizationId": "org-uuid",
  "permissions": ["permission-uuid-1", "permission-uuid-2"]
}
```

#### Get Organization Roles
```http
GET /roles/organization/:organizationId
Authorization: Bearer <access_token>
```

#### Update Role
```http
PATCH /roles/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Senior Doctor",
  "permissions": ["permission-uuid-1", "permission-uuid-2", "permission-uuid-3"]
}
```

### Permissions

#### Get All Permissions
```http
GET /permissions
Authorization: Bearer <access_token>
```

#### Get Permission Tree
```http
GET /permissions/tree
Authorization: Bearer <access_token>
```

#### Get User Permissions
```http
GET /permissions/organization/:organizationId/user
Authorization: Bearer <access_token>
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": {} // Optional, only in development
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `INTERNAL_ERROR`: Server error

## Security Features

1. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **JWT Token Management**
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Refresh tokens stored as HTTP-only cookies

3. **Rate Limiting**
   - 100 requests per 15 minutes per IP

4. **Input Validation**
   - All inputs validated using Joi schemas
   - SQL injection prevention through parameterized queries

5. **Security Headers**
   - Helmet.js for security headers
   - CORS configured for specific origins

## Database Schema

The database includes the following tables:

- **user_info**: User accounts
- **organization**: Organizations/Tenants
- **role**: Roles within organizations
- **permission**: System permissions
- **role_permission**: Role-permission mapping
- **user_organization**: User-organization-role mapping

## Development

### Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Database utilities
npm run db:export        # Export schema to JSON/MD
npm run db:export-sql    # Export to SQL
npm run db:auth-tables   # List auth tables
```

### Testing

```bash
# Run tests (to be implemented)
npm test
```

## Production Deployment

1. Build the application
   ```bash
   npm run build
   ```

2. Set production environment variables
   ```bash
   NODE_ENV=production
   ```

3. Use a process manager (PM2 recommended)
   ```bash
   pm2 start build/index.js --name hms-api
   ```

4. Set up reverse proxy (Nginx/Apache)

5. Enable HTTPS with SSL certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.