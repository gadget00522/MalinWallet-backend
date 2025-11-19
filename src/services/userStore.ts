import { UserRecord } from '../types/user';

/**
 * In-memory user storage
 * TODO: Replace with a proper database (SQLite, PostgreSQL, MongoDB, etc.)
 * This is a temporary solution for MVP purposes only.
 */
export const userStore = new Map<string, UserRecord>();
