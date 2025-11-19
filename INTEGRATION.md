# Frontend Integration Guide

This guide explains how to integrate the Malin Wallet Backend (gadget00522/MalinWallet-backend) with the Malin Wallet Frontend (gadget00522/Nn).

## Quick Start

The backend provides authentication endpoints that the frontend can use immediately.

### Base URL

```
Development: http://localhost:3000
Production: <your-deployed-backend-url>
```

## API Integration Examples

### 1. Sign Up Flow

**Frontend Flow:**
1. User enters email, password, and optionally wallet address
2. Call signup endpoint
3. Show "Check your email" message
4. Redirect to verification page

**Code Example:**

```javascript
// src/services/auth.js (or similar)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export async function signUp(email, password, walletAddress) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        walletAddress, // Optional, can be null/undefined
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}
```

### 2. Email Verification Flow

**Frontend Flow:**
1. User enters 6-digit code from email
2. Call verify-email endpoint
3. Show success message
4. Redirect to login

**Code Example:**

```javascript
export async function verifyEmail(email, code) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Verification failed');
    }

    return data;
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}
```

### 3. Login Flow

**Frontend Flow:**
1. User enters email and password
2. Call login endpoint
3. Store the JWT token
4. Redirect to dashboard

**Code Example:**

```javascript
export async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token in localStorage or state management
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('email', data.email);
    localStorage.setItem('walletAddress', data.walletAddress);

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

### 4. Password Reset Flow

**Frontend Flow:**
1. User enters email on "Forgot Password" page
2. Call request-reset endpoint
3. Show "Check your email" message
4. User enters reset code and new password
5. Call confirm-reset endpoint
6. Redirect to login

**Code Example:**

```javascript
export async function requestPasswordReset(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Reset request failed');
    }

    return data;
  } catch (error) {
    console.error('Reset request error:', error);
    throw error;
  }
}

export async function confirmPasswordReset(email, code, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/confirm-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Reset confirmation failed');
    }

    return data;
  } catch (error) {
    console.error('Reset confirmation error:', error);
    throw error;
  }
}
```

### 5. Using JWT Token for Authenticated Requests

Once the user is logged in, include the JWT token in the Authorization header for all authenticated requests:

```javascript
export async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('No access token found. Please login.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle token expiry
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('email');
      localStorage.removeItem('walletAddress');
      throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('Authenticated request error:', error);
    throw error;
  }
}
```

## JWT Token Details

The JWT token returned from the login endpoint contains:

```json
{
  "sub": "user@example.com",
  "walletAddress": "0x1234...",
  "iat": 1234567890,
  "exp": 1234575090
}
```

- **sub**: User's email (subject)
- **walletAddress**: User's wallet address (if provided during signup)
- **iat**: Issued at timestamp
- **exp**: Expiry timestamp (2 hours from issued)

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

**Common Error Codes:**

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 400 | Bad Request | Invalid input, missing fields |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Email not verified |
| 404 | Not Found | User doesn't exist |
| 409 | Conflict | User already exists |
| 500 | Internal Server Error | Server error |

**Frontend Error Handling Example:**

```javascript
try {
  await login(email, password);
} catch (error) {
  if (error.message.includes('Invalid credentials')) {
    // Show error: "Invalid email or password"
  } else if (error.message.includes('Email not verified')) {
    // Redirect to verification page
  } else {
    // Show generic error message
  }
}
```

## State Management

### Recommended Auth State

```javascript
// Example using React Context or Redux
const authState = {
  isAuthenticated: false,
  user: {
    email: null,
    walletAddress: null,
  },
  accessToken: null,
  loading: false,
  error: null,
};
```

### Auth Actions

```javascript
// Login
dispatch({ type: 'LOGIN_START' });
try {
  const data = await login(email, password);
  dispatch({ 
    type: 'LOGIN_SUCCESS', 
    payload: {
      email: data.email,
      walletAddress: data.walletAddress,
      accessToken: data.accessToken,
    }
  });
} catch (error) {
  dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
}

// Logout
localStorage.removeItem('accessToken');
localStorage.removeItem('email');
localStorage.removeItem('walletAddress');
dispatch({ type: 'LOGOUT' });
```

## React Component Examples

### SignUp Component

```jsx
import React, { useState } from 'react';
import { signUp } from '../services/auth';

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, walletAddress);
      // Redirect to verification page
      window.location.href = `/verify?email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <input
        type="text"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder="Wallet Address (optional)"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

### Verification Component

```jsx
import React, { useState } from 'react';
import { verifyEmail } from '../services/auth';
import { useSearchParams } from 'react-router-dom';

function VerificationForm() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await verifyEmail(email, code);
      // Redirect to login
      window.location.href = '/login';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p>Enter the 6-digit code sent to {email}</p>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="000000"
        maxLength={6}
        pattern="[0-9]{6}"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>
    </form>
  );
}
```

## Environment Variables

Add to your frontend `.env` file:

```bash
REACT_APP_API_URL=http://localhost:3000
```

For production:

```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

## CORS

The backend has CORS enabled for all origins. In production, you may want to restrict this to your frontend domain.

## Testing

### Local Testing

1. Start the backend: `npm run dev` (in backend repo)
2. Start the frontend: `npm start` (in frontend repo)
3. The frontend should be able to call the backend at `http://localhost:3000`

### Manual API Testing

You can use the provided test script in the backend repo:

```bash
./test-api.sh
```

Or use curl directly:

```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Verify (check server logs for code)
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Next Steps

1. **Implement authentication UI** in the frontend
2. **Wire up the API calls** using the examples above
3. **Add protected routes** that require authentication
4. **Handle token expiry** and refresh logic
5. **Add wallet integration** (wallet creation is still client-side, backend just stores the mapping)

## Support

For issues or questions, please open an issue in the backend repository or contact the development team.
