import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userStore } from '../services/userStore';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/emailService';
import { generateVerificationCode } from '../utils/random';
import { UserRecord } from '../types/user';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

/**
 * POST /auth/signup
 * Create a new user account
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, walletAddress } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    if (userStore.has(normalizedEmail)) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create user record
    const user: UserRecord = {
      email: normalizedEmail,
      passwordHash,
      isVerified: false,
      verificationCode,
      walletAddress: walletAddress || undefined,
    };

    // Store user
    userStore.set(normalizedEmail, user);

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationCode);

    res.status(201).json({
      message: 'User created successfully. Please check your email for verification code.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/verify-email
 * Verify email with code
 */
router.post('/verify-email', (req: Request, res: Response): void => {
  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      res.status(400).json({ error: 'Email and code are required' });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get user
    const user = userStore.get(normalizedEmail);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already verified
    if (user.isVerified) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    // Verify code
    if (user.verificationCode !== code) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    // Mark as verified and clear code
    user.isVerified = true;
    user.verificationCode = undefined;
    userStore.set(normalizedEmail, user);

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get user
    const user = userStore.get(normalizedEmail);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if verified
    if (!user.isVerified) {
      res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token (2 hours expiry)
    const token = jwt.sign(
      {
        sub: user.email,
        walletAddress: user.walletAddress,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      accessToken: token,
      email: user.email,
      walletAddress: user.walletAddress,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/request-reset
 * Request password reset
 */
router.post('/request-reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get user (but don't reveal if it exists or not)
    const user = userStore.get(normalizedEmail);
    
    if (user) {
      // Generate reset code
      const resetCode = generateVerificationCode();
      
      // Store reset code
      user.resetCode = resetCode;
      userStore.set(normalizedEmail, user);
      
      // Send reset email
      await sendResetPasswordEmail(normalizedEmail, resetCode);
    }

    // Always return success (don't leak user existence)
    res.status(200).json({
      message: 'If the email exists, a password reset code has been sent.',
    });
  } catch (error) {
    console.error('Request reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/confirm-reset
 * Confirm password reset with code
 */
router.post('/confirm-reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    // Validate input
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, code, and new password are required' });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get user
    const user = userStore.get(normalizedEmail);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify reset code
    if (user.resetCode !== code) {
      res.status(400).json({ error: 'Invalid reset code' });
      return;
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    user.passwordHash = newPasswordHash;
    user.resetCode = undefined;
    userStore.set(normalizedEmail, user);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Confirm reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
