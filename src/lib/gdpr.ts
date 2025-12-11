import { secrets } from './secret-manager';

// Encryption key for sensitive data (now using secure secret manager)
const ENCRYPTION_KEY = secrets.getGdprEncryptionKey();
const ALGORITHM = 'aes-256-gcm';

// Consent cookie name
const CONSENT_COOKIE_NAME = 'gdpr_consent';
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Check if a given IP address is from the EU/EEA
 * Uses geo-IP database or external service
 */
export async function isEUUpload(ipAddress: string): Promise<boolean> {
  // In a real implementation, you would:
  // 1. Use a geo-IP database (like MaxMind GeoIP2)
  // 2. Call an external API service
  // 3. Use Cloudflare/Netlify edge geo information
  
  // For development/testing, you might want to mock EU detection
  if (process.env.NODE_ENV === 'development') {
    // Check for a test header or default to false
    return false; // or true for testing
  }
  
  try {
    // Example implementation using a free geo-IP service
    // Note: In production, use a reliable geo-IP service
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
    const data = await response.json();
    
    // EU countries list (as of 2024)
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    
    return euCountries.includes(data.countryCode);
  } catch (error) {
    console.error('Error checking EU location:', error);
    // Default to false if we can't determine location
    return false;
  }
}

/**
 * Check if user is in EU (wrapper for consistency)
 */
export async function isUserInEU(ipAddress: string): Promise<boolean> {
  return isEUUpload(ipAddress);
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptData(data: string): string {
  // Use Node.js crypto module
  const crypto = require('crypto');
  
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
  const iv = crypto.randomBytes(12);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Combine IV and encrypted data
  const combined = iv.toString('hex') + ':' + encrypted;
  return combined;
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decryptData(encryptedData: string): string {
  // Use Node.js crypto module
  const crypto = require('crypto');
  
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
  
  // Split IV and encrypted data
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Anonymize IP address by removing last octet
 */
export function anonymizeIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip;
}

/**
 * Create consent cookie with encrypted consent data
 */
export function createConsentCookie(consentData: any, isSecure: boolean = false): string {
  const consentString = JSON.stringify({
    ...consentData,
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
  
  const encrypted = encryptData(consentString);
  return encrypted;
}

/**
 * Get consent data from cookie
 */
export function getConsentData(encryptedConsent: string): any {
  try {
    const decrypted = decryptData(encryptedConsent);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error parsing consent data:', error);
    return null;
  }
}

/**
 * Get consent status for analytics
 */
export function getConsentStatus(consentData: any): boolean {
  return consentData?.analytics === true;
}

/**
 * Check if consent is valid and not expired
 */
export function isConsentValid(consentData: any): boolean {
  if (!consentData || !consentData.timestamp) {
    return false;
  }
  
  const consentDate = new Date(consentData.timestamp);
  const now = new Date();
  const daysDiff = (now.getTime() - consentDate.getTime()) / (1000 * 3600 * 24);
  
  // Consent is valid for 1 year
  return daysDiff < 365;
}

/**
 * Check if user has given consent
 */
export function hasConsent(consentData: any, type: 'analytics' | 'marketing' | 'necessary'): boolean {
  if (!consentData) return false;
  if (type === 'necessary') return true; // Necessary cookies don't require consent
  
  return consentData[type] === true;
}

/**
 * Validate cookie integrity
 */
export function validateCookieIntegrity(encryptedData: string): boolean {
  try {
    const decrypted = decryptData(encryptedData);
    const parsed = JSON.parse(decrypted);
    
    // Check if required fields exist
    return parsed && 
           typeof parsed === 'object' && 
           'timestamp' in parsed && 
           'version' in parsed;
  } catch (error) {
    return false;
  }
}

/**
 * Check if data should be deleted based on retention policy
 */
export function shouldDeleteData(createdAt: string, retentionDays: number = 730): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const daysDiff = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
  
  return daysDiff > retentionDays;
}

/**
 * Generate secure consent cookie options
 */
export function getCookieOptions(isProduction: boolean = false) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: CONSENT_COOKIE_MAX_AGE,
    path: '/'
  };
}