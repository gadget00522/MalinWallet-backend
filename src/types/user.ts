/**
 * User record stored in memory
 * TODO: Replace with a proper database implementation
 */
export interface UserRecord {
  email: string;
  passwordHash: string;
  isVerified: boolean;
  verificationCode?: string;
  resetCode?: string;
  walletAddress?: string;
}
