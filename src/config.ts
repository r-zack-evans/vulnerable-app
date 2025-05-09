import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'temporary_secret_key_replace_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h' as const
  },
  session: {
    secret: process.env.SESSION_SECRET || 'temporary_session_secret_replace_in_prod'
  },
  security: {
    passwordMinLength: 8,
    bcryptSaltRounds: 10
  }
};