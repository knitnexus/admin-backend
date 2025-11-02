import { sign, verify } from 'hono/jwt';
import { AUTH_CONSTANTS } from '../constants';

export async function createToken(email: string): Promise<string> {
  return sign(
    {
      email,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.COOKIE_MAX_AGE,
    },
    AUTH_CONSTANTS.JWT_SECRET
  );
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const isPasswordValid = password === AUTH_CONSTANTS.ADMIN_PASSWORD;
  return email === AUTH_CONSTANTS.ADMIN_EMAIL && isPasswordValid;
}

export async function verifyToken(token: string): Promise<any> {
  return await verify(token, AUTH_CONSTANTS.JWT_SECRET);
}

export function getAuthConfig() {
  return {
    JWT_SECRET: AUTH_CONSTANTS.JWT_SECRET,
    COOKIE_MAX_AGE: AUTH_CONSTANTS.COOKIE_MAX_AGE,
    COOKIE_NAME: AUTH_CONSTANTS.COOKIE_NAME,
  };
}
