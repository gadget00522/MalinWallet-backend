import nodemailer from 'nodemailer';

// Create a transporter using environment variables or defaults for development
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'dev@example.com',
    pass: process.env.SMTP_PASS || 'dev-password',
  },
});

/**
 * Sends a verification email with a 6-digit code
 */
export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const fromAddress = process.env.SMTP_FROM || 'noreply@malinwallet.com';
  
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'Verify your Malin Wallet account',
    text: `Welcome to Malin Wallet!\n\nYour verification code is: ${code}\n\nThis code will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
    html: `
      <h1>Welcome to Malin Wallet!</h1>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
  };

  console.log('📧 Sending verification email:', {
    to: email,
    subject: mailOptions.subject,
    code: code,
  });

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully');
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    // In development, we still log the code even if email fails
    console.log('🔑 Verification code for testing:', code);
  }
}

/**
 * Sends a password reset email with a 6-digit code
 */
export async function sendResetPasswordEmail(email: string, code: string): Promise<void> {
  const fromAddress = process.env.SMTP_FROM || 'noreply@malinwallet.com';
  
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'Reset your Malin Wallet password',
    text: `You requested a password reset for your Malin Wallet account.\n\nYour reset code is: ${code}\n\nThis code will expire in 1 hour.\n\nIf you didn't request this reset, please ignore this email.`,
    html: `
      <h1>Reset your Malin Wallet password</h1>
      <p>You requested a password reset for your account.</p>
      <p>Your reset code is: <strong>${code}</strong></p>
      <p>This code will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
    `,
  };

  console.log('📧 Sending password reset email:', {
    to: email,
    subject: mailOptions.subject,
    code: code,
  });

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully');
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    // In development, we still log the code even if email fails
    console.log('🔑 Reset code for testing:', code);
  }
}
