# Malin Wallet Backend

Backend API for Malin Wallet with email/password authentication.

## Tech Stack

- Node.js + TypeScript
- Express.js
- JWT for authentication
- bcrypt for password hashing
- Nodemailer for emails
- In-memory storage (to be replaced with database)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Required environment variables:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM` - From email address

### 3. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

Base URL: `http://localhost:3000`

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Authentication Endpoints

All auth endpoints are under `/auth` prefix.

#### 1. Sign Up

```
POST /auth/signup
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "walletAddress": "0x1234..." // optional
}
```

Response (201):
```json
{
  "message": "User created successfully. Please check your email for verification code."
}
```

**Example curl:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "mypassword123",
    "walletAddress": "0x1234567890abcdef"
  }'
```

#### 2. Verify Email

```
POST /auth/verify-email
```

Request body:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Response (200):
```json
{
  "message": "Email verified successfully"
}
```

**Example curl:**
```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

#### 3. Login

```
POST /auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "walletAddress": "0x1234..."
}
```

Notes:
- Token expires in 2 hours
- Email must be verified before login
- Token payload includes `sub` (email) and `walletAddress`

**Example curl:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "mypassword123"
  }'
```

#### 4. Request Password Reset

```
POST /auth/request-reset
```

Request body:
```json
{
  "email": "user@example.com"
}
```

Response (200):
```json
{
  "message": "If the email exists, a password reset code has been sent."
}
```

Note: Response is generic to avoid leaking user existence.

**Example curl:**
```bash
curl -X POST http://localhost:3000/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### 5. Confirm Password Reset

```
POST /auth/confirm-reset
```

Request body:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newsecurepassword"
}
```

Response (200):
```json
{
  "message": "Password reset successfully"
}
```

**Example curl:**
```bash
curl -X POST http://localhost:3000/auth/confirm-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "newPassword": "mynewpassword123"
  }'
```

## Complete Workflow Examples

### Sign Up + Verify + Login Flow

```bash
# 1. Sign up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "walletAddress": "0xabcdef"
  }'

# 2. Check server logs for verification code (in development)
# Or check email inbox

# 3. Verify email
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "code": "123456"
  }'

# 4. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

### Password Reset Flow

```bash
# 1. Request reset
curl -X POST http://localhost:3000/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# 2. Check server logs for reset code (in development)
# Or check email inbox

# 3. Confirm reset
curl -X POST http://localhost:3000/auth/confirm-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "654321",
    "newPassword": "newpassword456"
  }'

# 4. Login with new password
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "newpassword456"
  }'
```

## Frontend Integration

### Endpoint URLs for Frontend (gadget00522/Nn)

Base URL: `http://localhost:3000` (or your deployed URL)

#### JavaScript/Fetch Examples

```javascript
// Sign up
const signUp = async (email, password, walletAddress) => {
  const response = await fetch('http://localhost:3000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, walletAddress })
  });
  return await response.json();
};

// Verify email
const verifyEmail = async (email, code) => {
  const response = await fetch('http://localhost:3000/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  return await response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  // Store the accessToken in localStorage or state
  localStorage.setItem('accessToken', data.accessToken);
  return data;
};

// Request password reset
const requestReset = async (email) => {
  const response = await fetch('http://localhost:3000/auth/request-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return await response.json();
};

// Confirm password reset
const confirmReset = async (email, code, newPassword) => {
  const response = await fetch('http://localhost:3000/auth/confirm-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword })
  });
  return await response.json();
};

// Use JWT token for authenticated requests
const makeAuthenticatedRequest = async (url) => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

## Development Notes

### Email in Development

In development mode, if SMTP credentials are not configured or email sending fails:
- Verification codes and reset codes are logged to the console
- Check the server logs to find codes for testing
- Look for log entries like: `🔑 Verification code for testing: 123456`

### User Storage

⚠️ **Important**: Currently using in-memory storage with `Map<string, UserRecord>`.
- Data is lost when server restarts
- NOT suitable for production
- Must be replaced with a proper database (PostgreSQL, MongoDB, SQLite, etc.)

See `src/services/userStore.ts` for the current implementation.

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad request (invalid input)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (email not verified)
- `404` - Not found (user doesn't exist)
- `409` - Conflict (user already exists)
- `500` - Internal server error

## Security Notes

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens expire after 2 hours
- Email addresses are normalized to lowercase
- CORS is enabled for all origins (configure in production)
- Helmet middleware adds security headers

## Testing

A test script is provided to test all endpoints:

```bash
./test-api.sh
```

This will guide you through testing signup, verification, login, and password reset flows.

## Deployment

### Environment Variables for Production

Make sure to set these environment variables in production:

```bash
PORT=3000
JWT_SECRET=<strong-random-secret-key>
SMTP_HOST=<your-smtp-host>
SMTP_PORT=<your-smtp-port>
SMTP_USER=<your-smtp-username>
SMTP_PASS=<your-smtp-password>
SMTP_FROM=<your-from-email>
```

### Production Build

```bash
npm install
npm run build
npm start
```

## TODO

- [ ] Replace in-memory storage with a proper database
- [ ] Add rate limiting for auth endpoints
- [ ] Add email verification expiry (currently codes don't expire)
- [ ] Add refresh token support
- [ ] Add password strength validation
- [ ] Add protected route middleware for authenticated endpoints
- [ ] Add wallet-related endpoints
- [ ] Add user profile management
- [ ] Add proper logging system
- [ ] Add tests

## License

ISC
