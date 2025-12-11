/**
 * Attribution system for tracking click-to-conversion journeys
 * Generates unique IDs for linking affiliate clicks to conversions
 */

interface AttributionData {
  id: string;
  timestamp: number;
  affiliate: string;
  productId?: string;
  flavorId?: string;
  expiresAt: number;
}

// In-memory storage for attribution data (in production, use Redis or database)
const attributionStore = new Map<string, AttributionData>();

/**
 * Generate a unique attribution ID for tracking click-to-conversion
 */
export function generateAttributionId(): string {
  // Generate a unique ID combining timestamp, random data, and hash
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const randomString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const attributionId = `attr_${timestamp}_${randomString}`;
  
  // Store the attribution data with 30-day expiration
  const expirationDays = 30;
  const expiresAt = timestamp + (expirationDays * 24 * 60 * 60 * 1000);
  
  const attributionData: AttributionData = {
    id: attributionId,
    timestamp,
    expiresAt,
    affiliate: '', // Will be filled when click is tracked
    productId: undefined,
    flavorId: undefined
  };
  
  attributionStore.set(attributionId, attributionData);
  
  // Clean up expired entries periodically
  cleanupExpiredAttributions();
  
  return attributionId;
}

/**
 * Store click data for attribution tracking
 */
export function storeClickAttribution(
  attributionId: string,
  data: {
    affiliate: string;
    productId?: string;
    flavorId?: string;
  }
): void {
  const existing = attributionStore.get(attributionId);
  if (existing) {
    attributionStore.set(attributionId, {
      ...existing,
      affiliate: data.affiliate,
      productId: data.productId,
      flavorId: data.flavorId
    });
  }
}

/**
 * Validate an attribution ID and check if it exists and is not expired
 */
export function validateAttributionId(attributionId: string): boolean {
  const data = attributionStore.get(attributionId);
  if (!data) {
    return false;
  }
  
  // Check if expired
  if (Date.now() > data.expiresAt) {
    attributionStore.delete(attributionId);
    return false;
  }
  
  return true;
}

/**
 * Get attribution data for an ID
 */
export function getAttributionData(attributionId: string): AttributionData | null {
  const data = attributionStore.get(attributionId);
  if (!data || Date.now() > data.expiresAt) {
    if (data) {
      attributionStore.delete(attributionId);
    }
    return null;
  }
  
  return data;
}

/**
 * Mark a conversion as completed and remove from active tracking
 */
export function markConversionComplete(attributionId: string): boolean {
  const data = attributionStore.get(attributionId);
  if (data) {
    attributionStore.delete(attributionId);
    return true;
  }
  return false;
}

/**
 * Clean up expired attribution IDs from the store
 */
function cleanupExpiredAttributions(): void {
  const now = Date.now();
  const expiredIds: string[] = [];
  
  for (const [id, data] of attributionStore.entries()) {
    if (now > data.expiresAt) {
      expiredIds.push(id);
    }
  }
  
  // Remove expired entries
  for (const id of expiredIds) {
    attributionStore.delete(id);
  }
  
  if (expiredIds.length > 0) {
    console.log(`Cleaned up ${expiredIds.length} expired attribution IDs`);
  }
}

/**
 * Get statistics about the attribution store (for monitoring)
 */
export function getAttributionStats(): {
  totalActive: number;
  totalExpired: number;
  recentActivity: number;
} {
  const now = Date.now();
  let totalExpired = 0;
  let recentActivity = 0;
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  for (const data of attributionStore.values()) {
    if (data.expiresAt < now) {
      totalExpired++;
    }
    if (data.timestamp > oneDayAgo) {
      recentActivity++;
    }
  }
  
  return {
    totalActive: attributionStore.size - totalExpired,
    totalExpired,
    recentActivity
  };
}

/**
 * Generate attribution ID with click data stored immediately
 */
export function generateAttributionIdWithClick(
  clickData: {
    affiliate: string;
    productId?: string;
    flavorId?: string;
  }
): string {
  const attributionId = generateAttributionId();
  storeClickAttribution(attributionId, clickData);
  return attributionId;
}