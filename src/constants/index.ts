export const AUTH_CONSTANTS = {
  JWT_SECRET: process.env.JWT_SECRET || 'superAdmin',
  COOKIE_NAME: 'token',
  COOKIE_MAX_AGE: 60 * 60 * 12,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
} as const;

export const S3_CONSTANTS = {
  REGION: process.env.AWS_REGION,
  ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || '',
} as const;

export const APP_CONSTANTS = {
  FRONTEND_URL: process.env.FRONTEND_SERVICE_URL || '',
} as const;
