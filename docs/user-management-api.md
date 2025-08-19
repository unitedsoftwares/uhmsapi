# User Management API Documentation

This document describes the user management API endpoints that have been added to the HMS system.

## Overview

The user management system provides comprehensive functionality for creating, managing, and administering users within the HMS platform. It includes both basic registration and enhanced user management features.

## API Endpoints

### Authentication Required
All user management endpoints require authentication via Bearer token in the Authorization header.

### User Management Endpoints

#### 1. Create User
**POST** `/api/v1/users`

Creates a new user in the system.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass123!",
  "username": "johndoe",
  "company_name": "Acme Corporation",
  "role_id": 1,
  "company_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user_id": 123,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "9876543210",
    "role_id": 1,
    "company_id": 1,
    "status": "active"
  }
}
```

#### 2. Get All Users
**GET** `/api/v1/users`

Retrieves all users in the system.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 123,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "9876543210",
      "role_name": "Administrator",
      "company_name": "Acme Corporation",
      "branch_name": "Main Branch",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "last_login": "2024-01-20T14:22:00Z"
    }
  ]
}
```

#### 3. Get User by ID
**GET** `/api/v1/users/:id`

Retrieves a specific user by their ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "username": "johndoe",
    "email": "john@example.com",
    "employee": {
      "first_name": "John",
      "last_name": "Doe",
      "phone": "9876543210",
      "designation": "Administrator"
    },
    "role": {
      "role_name": "Administrator",
      "role_description": "System Administrator"
    },
    "company": {
      "company_name": "Acme Corporation"
    }
  }
}
```

#### 4. Update User
**PATCH** `/api/v1/users/:id`

Updates user information.

**Request Body:**
```json
{
  "first_name": "John Updated",
  "last_name": "Doe Updated",
  "phone": "9876543299",
  "email": "john.updated@example.com"
}
```

#### 5. Update User Status
**PATCH** `/api/v1/users/:id/status`

Updates user status (active, inactive, suspended).

**Request Body:**
```json
{
  "status": "inactive"
}
```

#### 6. Delete User
**DELETE** `/api/v1/users/:id`

Soft deletes a user (sets status to inactive).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### 7. Get User Statistics
**GET** `/api/v1/users/stats`

Retrieves user statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "active_users": 140,
    "inactive_users": 8,
    "suspended_users": 2
  }
}
```

### Role Management Endpoints

#### 1. Get All Roles
**GET** `/api/v1/roles`

Retrieves all available roles.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "role_id": 1,
      "role_name": "Administrator",
      "role_description": "System Administrator"
    },
    {
      "role_id": 2,
      "role_name": "Doctor",
      "role_description": "Medical Doctor"
    }
  ]
}
```

#### 2. Get Role by ID
**GET** `/api/v1/roles/:id`

Retrieves a specific role by ID.

## Frontend Components

### User Management Page
- **Location**: `uhms/src/pages/admin/Users.tsx`
- **Features**:
  - List all users with search functionality
  - Create new users via modal form
  - Edit user information
  - Update user status
  - Delete users
  - View user details

### Create User Form
- **Location**: `uhms/src/components/forms/CreateUserForm.tsx`
- **Features**:
  - Form validation using Joi
  - Role and company selection
  - Password requirements
  - Error handling and success feedback

### User Service
- **Location**: `uhms/src/services/userService.ts`
- **Features**:
  - API communication layer
  - Token management
  - Error handling
  - TypeScript interfaces

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input data
- `CONFLICT_ERROR`: Duplicate email/username
- `NOT_FOUND_ERROR`: User not found
- `UNAUTHORIZED_ERROR`: Authentication required
- `FORBIDDEN_ERROR`: Insufficient permissions

## Testing

Integration tests are available at:
- `uhmsapi/src/__tests__/integration/user-management.test.ts`

Run tests with:
```bash
npm test -- user-management.test.ts
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Role-based access control
3. **Password Security**: Passwords are hashed using bcrypt
4. **Input Validation**: All inputs are validated using Joi schemas
5. **Rate Limiting**: API endpoints are rate-limited
6. **SQL Injection Prevention**: Parameterized queries used throughout

## Database Schema

The user management system uses the following main tables:
- `users`: User account information
- `employees`: Employee details
- `roles`: User roles and permissions
- `companies`: Company information
- `branches`: Branch information
- `role_menus`: Role-based menu permissions
- `role_features`: Role-based feature permissions