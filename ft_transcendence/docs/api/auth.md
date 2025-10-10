# Auth Service API Documentation

## Overview
This service provides endpoints for user registration, login, logout, two-factor authentication (2FA), and internal token refresh.<br>
Protected endpoints require a valid JWT access token in the `Authorization` header.

---

## Base URL
All endpoints are prefixed with `/api/auth` unless otherwise specified.

## Health Check
- **GET** `/health`
- Description: Check if service is up and running.
- Response:

{ "status": "Health is Ok!" }


---

## Authentication Endpoints

### Register
- **POST** `/register`
- Request body:

{
"email": "user@example.com",
"username": "user123",
"password": "Pass@word123"
}

- Response: Success or error message.

### Login
- **POST** `/login`
- Request body:

{
"email": "user@example.com",
"password": "Pass@word123"
}

- Response:

{
"accessToken": "jwt.token.here",
"refreshToken": "jwt.refresh.token"
}


### Logout
- **POST** `/logout`
- Requires Authorization header: `Bearer <accessToken>`
- Logs out the user and invalidates their session.

---

## Two-Factor Authentication (2FA)

> All 2FA endpoints require a valid JWT token in the Authorization header.

### Setup 2FA
- **POST** `/2fa/setup`
- Initiate 2FA setup and receive secret/QR code.

### Verify 2FA
- **POST** `/2fa/verify`
- Request body:

{
"code": "123456"
}

- Verify the 2FA code.

### Disable 2FA
- **POST** `/2fa/disable`
- Disable 2FA for the authenticated user.

---

## Internal Endpoints

### Refresh Token
- **POST** `/internal/refreshToken`
- Request body:

{
"refreshToken": "jwt.refresh.token"
}

- Response: New access token.
- This endpoint is for internal use only; it has no authentication middleware.

---

## Authentication Middleware
Routes protected with `authenticateToken` middleware require the JWT in the Authorization header.

Example header:

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


---

## Error Handling
- `401 Unauthorized`: Missing or invalid token.
- `400 Bad Request`: Malformed or missing request parameters.

---
