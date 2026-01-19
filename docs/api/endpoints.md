# API Endpoints

This document lists all available API endpoints.

## Base URL

```
http://localhost:4000
```

## API Versioning

All endpoints are versioned using URI prefixes: `/v1/...`

## Swagger Documentation

In development mode, interactive API documentation is available at:

```
http://localhost:4000/api-doc
```

## Authentication Endpoints

### Register User

Creates a new user account.

| Property | Value |
|----------|-------|
| **URL** | `/v1/auth/register` |
| **Method** | `POST` |
| **Auth Required** | No (Unauthenticated only) |
| **Rate Limited** | Yes |

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "user"
}
```

**Success Response (201):**

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

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Invalid input or role not allowed |
| 401 | Already authenticated |
| 422 | Validation errors |

---

### Login

Authenticates a user and returns a token.

| Property | Value |
|----------|-------|
| **URL** | `/v1/auth/login` |
| **Method** | `POST` |
| **Auth Required** | No (Unauthenticated only) |
| **Rate Limited** | Yes |

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Success Response (200):**

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

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Invalid credentials |
| 404 | User not found |
| 401 | Already authenticated |

---

### Load User

Verifies token and returns current user data.

| Property | Value |
|----------|-------|
| **URL** | `/v1/auth/load` |
| **Method** | `GET` |
| **Auth Required** | Optional (Public) |
| **Rate Limited** | Yes |

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

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

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Invalid request (no token) |
| 401 | Invalid or expired token |
| 404 | User not found |

---

## Profile Endpoints

### Get Profile

Retrieves the authenticated user's profile.

| Property | Value |
|----------|-------|
| **URL** | `/v1/profile` |
| **Method** | `GET` |
| **Auth Required** | Yes |
| **Rate Limited** | No |

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 401 | Not authenticated |
| 404 | User not found |

---

## Response Format

### Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Error Response

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description" | { "field": "Error message" },
  "code": "ErrorCode"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BadRequest` | 400 | Invalid request data |
| `Unauthenticated` | 401 | Authentication required |
| `Unauthorized` | 403 | Insufficient permissions |
| `NotFound` | 404 | Resource not found |
| `NotAcceptable` | 406 | Request not acceptable |
| `Unprocessable` | 422 | Validation failed |
| `TooManyRequests` | 429 | Rate limit exceeded |
| `InternalServerError` | 500 | Server error |

## Rate Limiting

Some endpoints are protected by rate limiting:

- **Limit**: 5 requests per 10 seconds
- **Block Duration**: 1 hour after exceeding limit
- **Applies To**: Authentication endpoints

When rate limited, you'll receive:

```json
{
  "success": false,
  "message": "Too many requests",
  "code": "TooManyRequests"
}
```

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <encrypted_jwt_token>
```

### Token Expiration

Tokens expire after **7 days**. After expiration, users must log in again to obtain a new token.
