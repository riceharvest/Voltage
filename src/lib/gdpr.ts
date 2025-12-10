import crypto from 'crypto';

// EU country codes for IP-based detection (simplified list)
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

// Encryption key for sensitive data (should be in env vars in production)
const ENCRYPTION_KEY = process.env.GDPR_ENCRYPTION_KEY || 'fallback-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

export interface ConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export interface UserData {
  ageVerified: boolean;
  verificationTimestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Detect if user is likely in EU based on IP geolocation
 * In production, use a proper geolocation service
 */
export async function isUserInEU(request: Request): Promise<boolean> {
  try {
    // Get client IP from headers (works with Vercel, Cloudflare, etc.)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0]?.trim() || realIP || '127.0.0.1';

    // For development/testing, you might want to mock EU detection
    if (process.env.NODE_ENV === 'development') {
      // Check for a test header or default to false
      return request.headers.get('x-test-eu-user') === 'true';
    }

    // In production, use a geolocation service
    // This is a simplified implementation - in real app use MaxMind or similar
    const response = await fetch(`http://ip-api.com/json/${clientIP}`);
    const data = await response.json();

    return EU_COUNTRIES.includes(data.countryCode);
  } catch (error) {
    console.error('Error detecting EU user:', error);
    // Default to requiring consent if detection fails
    return true;
  }
}

/**
 * Encrypt sensitive user data
 */
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  });
}

/**
 * Decrypt sensitive user data
 */
export function decryptData(encryptedData: string): string {
  try {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if user has given consent for data processing
 */
export function hasConsent(cookies: Record<string, string>): boolean {
  const consentCookie = cookies['gdpr-consent'];
  if (!consentCookie) return false;

  try {
    const consent: ConsentData = JSON.parse(consentCookie);
    return consent.necessary === true;
  } catch {
    return false;
  }
}

/**
 * Get user's consent preferences
 */
export function getConsentData(cookies: Record<string, string>): ConsentData | null {
  const consentCookie = cookies['gdpr-consent'];
  if (!consentCookie) return null;

  try {
    return JSON.parse(consentCookie);
  } catch {
    return null;
  }
}

/**
 * Create consent cookie value
 */
export function createConsentCookie(consent: Partial<ConsentData>): string {
  const consentData: ConsentData = {
    necessary: true, // Always required
    analytics: consent.analytics ?? false,
    marketing: consent.marketing ?? false,
    timestamp: new Date().toISOString(),
    version: '1.0',
    ...consent
  };

  return JSON.stringify(consentData);
}

/**
 * Validate consent is current (not older than 1 year)
 */
export function isConsentValid(consent: ConsentData): boolean {
  const consentDate = new Date(consent.timestamp);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return consentDate > oneYearAgo && consent.version === '1.0';
}

/**
 * Data retention policy: delete data older than specified days
 */
export function shouldDeleteData(timestamp: string, retentionDays: number = 2555): boolean {
  // GDPR: 2555 days (7 years) for general data, but we can be more restrictive
  const dataDate = new Date(timestamp);
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - retentionDays);

  return dataDate < retentionDate;
}

/**
 * Anonymize IP address for privacy
 */
export function anonymizeIP(ip: string): string {
  // Remove last octet for IPv4, or mask for IPv6
  if (ip.includes('.')) {
    // IPv4
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  } else if (ip.includes(':')) {
    // IPv6 - mask last 64 bits
    const parts = ip.split(':');
    return `${parts.slice(0, 4).join(':')}::`;
  }
  return ip;
}

/**
 * Validate consent cookie integrity using HMAC
 */
export function validateCookieIntegrity(cookies: Record<string, string>): boolean {
  const consentCookie = cookies['gdpr-consent'];
  const signatureCookie = cookies['gdpr-consent-signature'];
  
  if (!consentCookie || !signatureCookie) {
    return false;
  }

  try {
    // Create HMAC signature for the consent data
    const expectedSignature = crypto
      .createHmac('sha256', ENCRYPTION_KEY)
      .update(consentCookie)
      .digest('hex');
    
    // Compare signatures
    return expectedSignature === signatureCookie;
  } catch (error) {
    console.error('Error validating cookie integrity:', error);
    return false;
  }
}

/**
 * Get consent status for analytics tracking
 */
export function getConsentStatus(): { analytics: boolean } {
  if (typeof window === 'undefined') {
    return { analytics: false };
  }

  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const consentData = getConsentData(cookies);
  return {
    analytics: consentData?.analytics === true
  };
}