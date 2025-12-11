/**
 * API Performance Optimization with Compression, Caching, and Rate Limiting
 * Provides advanced API performance enhancements for global scale
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '../cache';
import { logger } from '../logger';
import { rateLimit } from '../rate-limit';

interface CompressionConfig {
  enabled: boolean;
  algorithms: ('gzip' | 'brotli' | 'deflate')[];
  level: number;
  threshold: number;
  strategy: 'balanced' | 'speed' | 'size';
}

interface CachingConfig {
  etag: boolean;
  cacheControl: boolean;
  maxAge: number;
  sMaxAge: number;
  staleWhileRevalidate: number;
}

interface BatchRequest {
  id: string;
  endpoint: string;
  params: Record<string, any>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface APIOptimizationStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  compressionSavings: number;
  batchOperations: number;
  rateLimitHits: number;
  averageResponseTime: number;
}

class APIPerformanceOptimizer {
  private compressionConfig: CompressionConfig;
  private cachingConfig: CachingConfig;
  private batchQueue: Map<string, BatchRequest[]> = new Map();
  private optimizationStats: APIOptimizationStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    compressionSavings: 0,
    batchOperations: 0,
    rateLimitHits: 0,
    averageResponseTime: 0
  };

  constructor() {
    this.compressionConfig = {
      enabled: true,
      algorithms: ['brotli', 'gzip'],
      level: 6,
      threshold: 1024,
      strategy: 'balanced'
    };

    this.cachingConfig = {
      etag: true,
      cacheControl: true,
      maxAge: 3600,
      sMaxAge: 86400,
      staleWhileRevalidate: 300
    };

    this.initializeBatchProcessing();
    this.startPerformanceMonitoring();
  }

  // Response compression and optimization
  async optimizeResponse(
    request: NextRequest,
    response: NextResponse,
    data: any,
    cacheKey?: string
  ): Promise<NextResponse> {
    this.optimizationStats.totalRequests++;

    const startTime = performance.now();

    try {
      // Check cache first if cache key provided
      if (cacheKey) {
        const cachedResponse = await cache.get(cacheKey);
        if (cachedResponse) {
          this.optimizationStats.cacheHits++;
          const cachedNextResponse = NextResponse.json(cachedResponse.data);
          this.applyCacheHeaders(cachedNextResponse, cachedResponse.headers);
          return cachedNextResponse;
        }
        this.optimizationStats.cacheMisses++;
      }

      // Apply compression if enabled and data is large enough
      let optimizedData = data;
      if (this.shouldCompress(data)) {
        optimizedData = await this.compressData(data);
        response.headers.set('Content-Encoding', this.getBestCompressionAlgorithm());
      }

      // Set response headers
      this.applyOptimizationHeaders(response, optimizedData);

      // Cache the response if cache key provided
      if (cacheKey) {
        await this.cacheResponse(cacheKey, data, response.headers);
      }

      const responseTime = performance.now() - startTime;
      this.updateAverageResponseTime(responseTime);

      return NextResponse.json(optimizedData, {
        headers: response.headers
      });
    } catch (error) {
      logger.error('API optimization failed', error);
      return response;
    }
  }

  // Rate limiting with intelligent throttling
  async applyIntelligentRateLimit(
    request: NextRequest,
    identifier?: string
  ): Promise<{ allowed: boolean; retryAfter?: number; currentCount: number }> {
    const ip = identifier || request.ip || 'anonymous';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const endpoint = request.nextUrl.pathname;

    // Create composite key for rate limiting
    const rateLimitKey = `rate_limit:${ip}:${endpoint}`;
    
    // Dynamic limits based on endpoint and user agent
    const limits = this.getDynamicRateLimits(endpoint, userAgent);
    
    try {
      const result = await rateLimit.check(rateLimitKey, limits.max, limits.window);
      
      if (!result.success) {
        this.optimizationStats.rateLimitHits++;
        return {
          allowed: false,
          retryAfter: result.resetTime,
          currentCount: result.count
        };
      }

      return {
        allowed: true,
        currentCount: result.count
      };
    } catch (error) {
      logger.error('Rate limit check failed', error);
      return { allowed: true, currentCount: 0 };
    }
  }

  // API response caching with ETags
  async cacheResponse(
    cacheKey: string,
    data: any,
    headers: Headers
  ): Promise<void> {
    const cacheableData = {
      data,
      headers: Object.fromEntries(headers.entries()),
      timestamp: Date.now(),
      etag: this.generateETag(data)
    };

    // Cache with TTL based on data type
    const ttl = this.getCacheTTL(cacheKey);
    await cache.set(cacheKey, cacheableData, ttl);
  }

  // Batch API endpoints for multiple data requests
  async processBatchRequest(batchRequests: BatchRequest[]): Promise<any> {
    this.optimizationStats.batchOperations++;

    // Group requests by endpoint for optimization
    const groupedRequests = this.groupRequestsByEndpoint(batchRequests);
    const results: any = {};

    // Process each group
    for (const [endpoint, requests] of Object.entries(groupedRequests)) {
      try {
        // Prioritize requests
        const sortedRequests = requests.sort((a, b) => {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        // Process requests in parallel where possible
        const batchResults = await Promise.allSettled(
          sortedRequests.map(req => this.processSingleRequest(req))
        );

        // Map results back to request IDs
        batchResults.forEach((result, index) => {
          const requestId = sortedRequests[index].id;
          if (result.status === 'fulfilled') {
            results[requestId] = result.value;
          } else {
            results[requestId] = { error: result.reason };
          }
        });
      } catch (error) {
        logger.error(`Batch processing failed for endpoint: ${endpoint}`, error);
      }
    }

    return results;
  }

  // GraphQL integration for complex queries
  async optimizeGraphQLQuery(query: string, variables?: any): Promise<any> {
    const queryHash = this.hashQuery(query, variables);
    const cacheKey = `graphql:${queryHash}`;

    // Check cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      this.optimizationStats.cacheHits++;
      return cachedResult;
    }

    // Analyze query complexity
    const complexity = this.analyzeQueryComplexity(query);
    
    // Apply complexity-based optimization
    if (complexity.score > 100) {
      // High complexity query - apply aggressive caching
      const result = await this.executeGraphQLQuery(query, variables);
      await cache.set(cacheKey, result, 1800); // 30 minutes
      return result;
    } else if (complexity.score > 50) {
      // Medium complexity - moderate caching
      const result = await this.executeGraphQLQuery(query, variables);
      await cache.set(cacheKey, result, 900); // 15 minutes
      return result;
    } else {
      // Low complexity - minimal caching
      return await this.executeGraphQLQuery(query, variables);
    }
  }

  // Private helper methods
  private shouldCompress(data: any): boolean {
    const size = JSON.stringify(data).length;
    return this.compressionConfig.enabled && 
           size >= this.compressionConfig.threshold &&
           this.supportsCompression();
  }

  private supportsCompression(): boolean {
    // Check if client supports compression
    const acceptEncoding = typeof window !== 'undefined' 
      ? window.navigator.userAgent 
      : '';
    
    return acceptEncoding.includes('gzip') || acceptEncoding.includes('deflate') || acceptEncoding.includes('br');
  }

  private async compressData(data: any): Promise<any> {
    const originalSize = JSON.stringify(data).length;
    
    // In production, this would use actual compression algorithms
    // For now, we'll simulate compression by minifying JSON
    const compressed = JSON.stringify(data);
    
    const compressedSize = compressed.length;
    const savings = ((originalSize - compressedSize) / originalSize) * 100;
    this.optimizationStats.compressionSavings += savings;

    return compressed;
  }

  private getBestCompressionAlgorithm(): string {
    // Return best supported compression algorithm
    if (this.compressionConfig.algorithms.includes('brotli')) {
      return 'br';
    } else if (this.compressionConfig.algorithms.includes('gzip')) {
      return 'gzip';
    }
    return 'deflate';
  }

  private applyOptimizationHeaders(response: NextResponse, data: any): void {
    // Cache control headers
    if (this.cachingConfig.cacheControl) {
      const cacheControl = `public, max-age=${this.cachingConfig.maxAge}, s-maxage=${this.cachingConfig.sMaxAge}, stale-while-revalidate=${this.cachingConfig.staleWhileRevalidate}`;
      response.headers.set('Cache-Control', cacheControl);
    }

    // ETag headers
    if (this.cachingConfig.etag) {
      const etag = this.generateETag(data);
      response.headers.set('ETag', etag);
    }

    // Performance headers
    response.headers.set('X-Response-Time', Date.now().toString());
    response.headers.set('X-API-Version', '2.0');
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
  }

  private applyCacheHeaders(response: NextResponse, originalHeaders: any): void {
    // Apply original cache headers
    Object.entries(originalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value as string);
    });

    // Add cache hit indicator
    response.headers.set('X-Cache', 'HIT');
  }

  private generateETag(data: any): string {
    const content = JSON.stringify(data);
    // Simple hash function for ETag generation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${hash.toString(16)}"`;
  }

  private getDynamicRateLimits(endpoint: string, userAgent: string): { max: number; window: number } {
    // API endpoints get higher limits
    if (endpoint.startsWith('/api/')) {
      return { max: 1000, window: 60000 }; // 1000 requests per minute
    }

    // Static content gets higher limits
    if (endpoint.match(/\.(js|css|jpg|png|svg)$/)) {
      return { max: 5000, window: 60000 }; // 5000 requests per minute
    }

    // Default limits
    return { max: 100, window: 60000 }; // 100 requests per minute
  }

  private getCacheTTL(cacheKey: string): number {
    // Dynamic TTL based on cache key pattern
    if (cacheKey.includes('amazon:product')) {
      return 3600; // 1 hour
    } else if (cacheKey.includes('recipes:')) {
      return 7200; // 2 hours
    } else if (cacheKey.includes('analytics:')) {
      return 1800; // 30 minutes
    }
    return 3600; // Default 1 hour
  }

  private groupRequestsByEndpoint(requests: BatchRequest[]): Record<string, BatchRequest[]> {
    return requests.reduce((groups, request) => {
      const endpoint = request.endpoint;
      if (!groups[endpoint]) {
        groups[endpoint] = [];
      }
      groups[endpoint].push(request);
      return groups;
    }, {} as Record<string, BatchRequest[]>);
  }

  private async processSingleRequest(request: BatchRequest): Promise<any> {
    // Simulate processing a single request
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    return { id: request.id, data: `Processed ${request.endpoint}` };
  }

  private hashQuery(query: string, variables?: any): string {
    const content = query + JSON.stringify(variables || {});
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private analyzeQueryComplexity(query: string): { score: number; depth: number; fields: number } {
    // Simple complexity analysis
    const depth = (query.match(/{/g) || []).length;
    const fields = (query.match(/\w+:/g) || []).length;
    const score = depth * 10 + fields * 2;
    
    return { score, depth, fields };
  }

  private async executeGraphQLQuery(query: string, variables?: any): Promise<any> {
    // Simulate GraphQL execution
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: { result: 'GraphQL query executed' } };
  }

  private initializeBatchProcessing(): void {
    // Process batch queue every 100ms
    setInterval(() => {
      this.processBatchQueue();
    }, 100);
  }

  private async processBatchQueue(): Promise<void> {
    for (const [batchId, requests] of this.batchQueue.entries()) {
      if (requests.length > 0) {
        try {
          const results = await this.processBatchRequest(requests);
          // Send results to clients
          this.batchQueue.delete(batchId);
        } catch (error) {
          logger.error(`Batch processing failed for ${batchId}`, error);
        }
      }
    }
  }

  private updateAverageResponseTime(responseTime: number): void {
    const total = this.optimizationStats.totalRequests;
    const current = this.optimizationStats.averageResponseTime;
    
    // Running average
    this.optimizationStats.averageResponseTime = 
      (current * (total - 1) + responseTime) / total;
  }

  private startPerformanceMonitoring(): void {
    // Log performance stats every 5 minutes
    setInterval(() => {
      this.logPerformanceStats();
    }, 300000);
  }

  private logPerformanceStats(): void {
    logger.info('API Performance Stats', {
      stats: this.optimizationStats,
      timestamp: new Date().toISOString()
    });
  }

  // Public methods for monitoring and configuration
  getOptimizationStats(): APIOptimizationStats {
    return { ...this.optimizationStats };
  }

  updateCompressionConfig(config: Partial<CompressionConfig>): void {
    this.compressionConfig = { ...this.compressionConfig, ...config };
  }

  updateCachingConfig(config: Partial<CachingConfig>): void {
    this.cachingConfig = { ...this.cachingConfig, ...config };
  }

  async clearCache(): Promise<void> {
    await cache.delPattern('api:*');
    logger.info('API cache cleared');
  }
}

// Export singleton instance
export const apiOptimizer = new APIPerformanceOptimizer();

// Utility functions for middleware
export function createOptimizedResponse(data: any, options?: {
  cacheKey?: string;
  compress?: boolean;
  cache?: boolean;
}) {
  return apiOptimizer.optimizeResponse(
    {} as NextRequest, // This would be provided by middleware
    NextResponse.json(data),
    data,
    options?.cacheKey
  );
}

export default APIPerformanceOptimizer;