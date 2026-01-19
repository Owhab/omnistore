# Authentication

This document describes the authentication system used in the API.

## Overview

The API uses JWT (JSON Web Token) authentication with an additional encryption layer for enhanced security. Tokens are encrypted using the `cryptr` library before being sent to clients.

## Authentication Flow

```
┌─────────┐          ┌─────────┐          ┌─────────┐
│  Client │          │   API   │          │   DB    │
└────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │
     │  POST /auth/login  │                    │
     │───────────────────>│                    │
     │                    │  Verify User       │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │                    │  Sign JWT          │
     │                    │  Encrypt Token     │
     │                    │                    │
     │  { token, user }   │                    │
     │<───────────────────│                    │
     │                    │                    │
     │  GET /profile      │                    │
     │  Authorization:    │                    │
     │  Bearer <token>    │                    │
     │───────────────────>│                    │
     │                    │  Decrypt Token     │
     │                    │  Verify JWT        │
     │                    │  Load User         │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │  { profile }       │                    │
     │<───────────────────│                    │
```

## Endpoints

### Register

Create a new user account.

```http
POST /v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "user"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": true
    },
    "token": "encrypted_jwt_token"
  }
}
```

**Validation Rules:**

| Field | Rules |
|-------|-------|
| `name` | Optional, string |
| `email` | Required, must be unique |
| `password` | Required, 4-64 characters |
| `role` | Required, must be `user` (admin registration not allowed) |

### Login

Authenticate an existing user.

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": true
    },
    "token": "encrypted_jwt_token"
  }
}
```

### Load User

Verify token and load current user.

```http
GET /v1/auth/load
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Loaded user",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": true
    }
  }
}
```

## Token Structure

### JWT Payload

```typescript
{
  id: number;      // User ID
  iat: number;     // Issued at timestamp
  exp: number;     // Expiration timestamp (7 days)
}
```

### Token Encryption

Tokens are encrypted before sending to clients:

1. JWT is signed with `JWT_SECRET`
2. Signed JWT is encrypted with `ENCRYPTION_SECRET` using Cryptr
3. Encrypted token is sent to client

On verification:

1. Token is decrypted using `ENCRYPTION_SECRET`
2. Decrypted JWT is verified with `JWT_SECRET`
3. User is loaded from database

## Using Authentication

### Making Authenticated Requests

Include the token in the `Authorization` header:

```http
GET /v1/profile
Authorization: Bearer <encrypted_token>
```

### Access Decorators

#### @Public()

Allows access without authentication. Token is optional but will be processed if provided.

```typescript
@Get('public-data')
@Public()
getData() {
  return this.service.getPublicData();
}
```

#### @Unauth() / @UseUnauthGuard()

Only allows unauthenticated users (e.g., login/register pages).

```typescript
@Post('login')
@UseUnauthGuard()
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

#### @Roles()

Restricts access to specific roles.

```typescript
@Get('admin-dashboard')
@Roles(RolesEnum.ADMIN)
getDashboard() {
  return this.adminService.getDashboard();
}
```

### Accessing User Data

#### @AuthUser()

Get the authenticated user in controllers:

```typescript
@Get('profile')
getProfile(@AuthUser() user: User) {
  return this.profileService.getProfile(user.id);
}
```

#### @AccessToken()

Get the raw (decrypted) JWT token:

```typescript
@Get('load')
@Public()
loadUser(@AccessToken() token: string) {
  return this.authService.authAccount(token);
}
```

## Roles

The API supports role-based access control:

| Role | Value | Description |
|------|-------|-------------|
| Admin | `admin` | Full access to all resources |
| User | `user` | Standard user access |

Roles are defined in `src/constants/role.enum.ts`:

```typescript
export enum RolesEnum {
  ADMIN = 'admin',
  USER = 'user',
}
```

## Password Security

Passwords are hashed using bcrypt with a salt factor of 12:

```typescript
@BeforeInsert()
@BeforeUpdate()
private async beforeActionsPassword() {
  if (this.tempPassword !== this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
}
```

## Rate Limiting

Authentication endpoints are protected by rate limiting:

- **Limit**: 5 requests per 10 seconds
- **Block Duration**: 1 hour after exceeding limit

## Error Responses

### Invalid Credentials (400/404)

```json
{
  "success": false,
  "message": {
    "email": "Email and password does not match",
    "password": "Email and password does not match"
  },
  "code": "BadRequest"
}
```

### Unauthenticated (401)

```json
{
  "success": false,
  "message": "You need to sign in first.",
  "code": "Unauthenticated"
}
```

### Unverified Account (401)

```json
{
  "success": false,
  "message": "Your account is not verified",
  "code": "Unauthenticated"
}
```

### Unauthorized (403)

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "Unauthorized"
}
```
