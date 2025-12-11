import { createCSRFToken, validateCSRFToken } from 'next-csrf';
import { secrets } from './secret-manager';

const csrf = createCSRFToken({
  secret: secrets.getCsrfSecret(),
  salt: 'csrf-salt',
});

export { csrf, validateCSRFToken };