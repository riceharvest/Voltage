import { createCSRFToken, validateCSRFToken } from 'next-csrf';

const csrf = createCSRFToken({
  secret: process.env.CSRF_SECRET || 'fallback-secret-change-in-production',
  salt: 'csrf-salt',
});

export { csrf, validateCSRFToken };