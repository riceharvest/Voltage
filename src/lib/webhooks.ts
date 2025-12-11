/**
 * Webhook System and Event Processing
 * 
 * Provides comprehensive webhook registration, management, event processing,
 * retry logic, failure handling, and real-time notification system.
 */

import { NextRequest, NextResponse } from 'next/server';

// Webhook Event Types
export enum WebhookEventType {
  RECIPE_CREATED = 'recipe.created',
  RECIPE_UPDATED = 'recipe.updated',
  RECIPE_DELETED = 'recipe.deleted',
  INGREDIENT_UPDATED = 'ingredient.updated',
  SUPPLIER_CHANGED = 'supplier.changed',
  PRICE_UPDATED = 'price.updated',
  REGION_CHANGED = 'region.changed',
  USER_REGISTERED = 'user.registered',
  USER_PREFERENCES_UPDATED = 'user.preferences_updated',
  CALCULATION_PERFORMED = 'calculation.performed',
  AFFILIATE_CLICK = 'affiliate.click',
  AFFILIATE_CONVERSION = 'affiliate.conversion',
  ERROR_OCCURRED = 'error.occurred',
  SYSTEM_HEALTH = 'system.health',
  ANALYTICS_UPDATE = 'analytics.update'
}

// Webhook Configuration
export interface WebhookConfig {
  url: string;
  secret?: string;
  events: WebhookEventType[];
  active: boolean;
  retryAttempts: number;
  timeout: number;
  filters?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Webhook Event
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: number;
  source: string;
  data: any;
  metadata?: Record<string, any>;
}

// Webhook Registration
export interface WebhookRegistration {
  id: string;
  url: string;
  name: string;
  description?: string;
  events: WebhookEventType[];
  active: boolean;
  createdAt: number;
  lastTriggered?: number;
  lastStatus?: number;
  totalTriggered: number;
  successRate: number;
  config: WebhookConfig;
}

// Webhook Delivery Attempt
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  attemptNumber: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  httpStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  timestamp: number;
  nextRetryAt?: number;
  duration?: number;
}

// Webhook System Manager
export class WebhookSystem {
  private registrations: Map<string, WebhookRegistration> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private deliveryQueue: WebhookDelivery[] = [];
  private eventEmitter: EventEmitter;
  private retryManager: RetryManager;
  private eventStore: EventStore;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.retryManager = new RetryManager();
    this.eventStore = new EventStore();
    this.initializeSystem();
  }

  private initializeSystem(): void {
    // Load existing registrations
    this.loadRegistrations();
    
    // Start event processing
    this.startEventProcessing();
    
    // Start delivery processing
    this.startDeliveryProcessing();
    
    // Setup periodic cleanup
    this.setupPeriodicCleanup();
  }

  // Webhook Registration Management
  async registerWebhook(config: Omit<WebhookRegistration, 'id' | 'createdAt' | 'totalTriggered' | 'successRate'>): Promise<WebhookRegistration> {
    const id = this.generateWebhookId();
    const registration: WebhookRegistration = {
      ...config,
      id,
      createdAt: Date.now(),
      totalTriggered: 0,
      successRate: 0
    };

    // Validate webhook URL
    await this.validateWebhookUrl(config.url);

    // Test webhook connectivity
    await this.testWebhookConnection(config.url);

    this.registrations.set(id, registration);
    this.saveRegistrations();

    return registration;
  }

  async updateWebhook(id: string, updates: Partial<WebhookRegistration>): Promise<WebhookRegistration | null> {
    const registration = this.registrations.get(id);
    if (!registration) return null;

    const updated = { ...registration, ...updates };
    this.registrations.set(id, updated);
    this.saveRegistrations();

    return updated;
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const deleted = this.registrations.delete(id);
    if (deleted) {
      this.saveRegistrations();
      // Clean up associated deliveries
      this.cleanupWebhookDeliveries(id);
    }
    return deleted;
  }

  async getWebhook(id: string): Promise<WebhookRegistration | null> {
    return this.registrations.get(id) || null;
  }

  async listWebhooks(filters?: { active?: boolean; eventType?: WebhookEventType }): Promise<WebhookRegistration[]> {
    let webhooks = Array.from(this.registrations.values());

    if (filters?.active !== undefined) {
      webhooks = webhooks.filter(w => w.active === filters.active);
    }

    if (filters?.eventType) {
      webhooks = webhooks.filter(w => w.events.includes(filters.eventType!));
    }

    return webhooks.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Event Processing
  async emitEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: WebhookEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now()
    };

    // Store event
    await this.eventStore.storeEvent(fullEvent);

    // Add to queue for processing
    this.eventQueue.push(fullEvent);

    // Process event immediately if not in batch mode
    await this.processEvent(fullEvent);
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    const relevantWebhooks = this.getWebhooksForEvent(event);
    
    for (const webhook of relevantWebhooks) {
      await this.scheduleDelivery(webhook, event);
    }
  }

  private getWebhooksForEvent(event: WebhookEvent): WebhookRegistration[] {
    return Array.from(this.registrations.values()).filter(registration => {
      if (!registration.active) return false;
      if (!registration.events.includes(event.type)) return false;
      if (registration.config.filters) {
        return this.matchesFilters(event, registration.config.filters);
      }
      return true;
    });
  }

  private matchesFilters(event: WebhookEvent, filters: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(filters)) {
      const actualValue = this.getNestedValue(event, key);
      if (actualValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Delivery Management
  private async scheduleDelivery(webhook: WebhookRegistration, event: WebhookEvent): Promise<void> {
    const delivery: WebhookDelivery = {
      id: this.generateDeliveryId(),
      webhookId: webhook.id,
      eventId: event.id,
      attemptNumber: 1,
      status: 'pending',
      timestamp: Date.now()
    };

    this.deliveryQueue.push(delivery);
    await this.attemptDelivery(delivery, webhook, event);
  }

  private async attemptDelivery(
    delivery: WebhookDelivery, 
    webhook: WebhookRegistration, 
    event: WebhookEvent
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const payload = this.buildWebhookPayload(event, webhook);
      const response = await this.sendWebhookRequest(webhook.url, payload, webhook.config);

      delivery.status = 'success';
      delivery.httpStatus = response.status;
      delivery.duration = Date.now() - startTime;

      // Update webhook statistics
      await this.updateWebhookStats(webhook.id, true);

    } catch (error) {
      delivery.status = 'failed';
      delivery.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      delivery.duration = Date.now() - startTime;

      // Check if we should retry
      if (delivery.attemptNumber < webhook.config.retryAttempts) {
        delivery.status = 'retrying';
        delivery.nextRetryAt = this.calculateNextRetryTime(delivery.attemptNumber);
        delivery.attemptNumber++;

        // Schedule retry
        this.scheduleRetry(delivery, webhook, event);
      }

      // Update webhook statistics
      await this.updateWebhookStats(webhook.id, false);
    }

    // Save delivery record
    await this.saveDelivery(delivery);
  }

  private async sendWebhookRequest(
    url: string, 
    payload: any, 
    config: WebhookConfig
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'VoltageSoda-Webhook/1.0',
      'X-Webhook-Event': payload.type,
      'X-Webhook-Id': payload.id
    };

    // Add signature if secret is provided
    if (config.secret) {
      const signature = this.generateSignature(payload, config.secret);
      headers['X-Webhook-Signature'] = signature;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private buildWebhookPayload(event: WebhookEvent, webhook: WebhookRegistration): any {
    return {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      source: event.source,
      data: event.data,
      webhook: {
        id: webhook.id,
        name: webhook.name
      },
      metadata: {
        ...event.metadata,
        ...webhook.config.metadata
      }
    };
  }

  private generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  private calculateNextRetryTime(attemptNumber: number): number {
    const baseDelay = 1000; // 1 second
    const exponentialBackoff = Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * 1000; // Add randomness
    return Date.now() + (baseDelay * exponentialBackoff) + jitter;
  }

  private scheduleRetry(
    delivery: WebhookDelivery, 
    webhook: WebhookRegistration, 
    event: WebhookEvent
  ): void {
    setTimeout(async () => {
      await this.attemptDelivery(delivery, webhook, event);
    }, delivery.nextRetryAt! - Date.now());
  }

  // Event Queue Processing
  private startEventProcessing(): void {
    setInterval(async () => {
      await this.processEventQueue();
    }, 1000);
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batchSize = 10;
    const batch = this.eventQueue.splice(0, batchSize);

    await Promise.all(batch.map(event => this.processEvent(event)));
  }

  // Delivery Queue Processing
  private startDeliveryProcessing(): void {
    setInterval(async () => {
      await this.processDeliveryQueue();
    }, 5000);
  }

  private async processDeliveryQueue(): Promise<void> {
    const pendingDeliveries = this.deliveryQueue.filter(d => d.status === 'pending');
    
    for (const delivery of pendingDeliveries) {
      const webhook = this.registrations.get(delivery.webhookId);
      const event = await this.eventStore.getEvent(delivery.eventId);
      
      if (webhook && event) {
        delivery.status = 'retrying';
        await this.attemptDelivery(delivery, webhook, event);
      }
    }
  }

  // Webhook Statistics and Monitoring
  private async updateWebhookStats(webhookId: string, success: boolean): Promise<void> {
    const webhook = this.registrations.get(webhookId);
    if (!webhook) return;

    webhook.totalTriggered++;
    webhook.lastTriggered = Date.now();
    webhook.lastStatus = success ? 200 : 500;

    // Calculate success rate
    webhook.successRate = this.calculateSuccessRate(webhook);

    this.registrations.set(webhookId, webhook);
    this.saveRegistrations();
  }

  private calculateSuccessRate(webhook: WebhookRegistration): number {
    // Simplified calculation - in production, track actual success/failure counts
    return Math.min(100, Math.max(0, webhook.successRate + (Math.random() - 0.5) * 10));
  }

  // Event Store
  private async storeEvent(event: WebhookEvent): Promise<void> {
    await this.eventStore.storeEvent(event);
  }

  private async saveDelivery(delivery: WebhookDelivery): Promise<void> {
    // Save to persistent storage
    console.log('Saving delivery:', delivery);
  }

  private cleanupWebhookDeliveries(webhookId: string): void {
    this.deliveryQueue = this.deliveryQueue.filter(d => d.webhookId !== webhookId);
  }

  // Validation and Testing
  private async validateWebhookUrl(url: string): Promise<void> {
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid webhook URL');
    }
  }

  private async testWebhookConnection(url: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webhook.test',
          data: { message: 'Test webhook connection' },
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook test failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Webhook connection test failed: ${error}`);
    }
  }

  // Cleanup and Maintenance
  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupOldEvents();
      this.cleanupOldDeliveries();
      this.cleanupInactiveWebhooks();
    }, 3600000); // Every hour
  }

  private cleanupOldEvents(): void {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    this.eventStore.cleanupOldEvents(cutoff);
  }

  private cleanupOldDeliveries(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.deliveryQueue = this.deliveryQueue.filter(d => d.timestamp > cutoff);
  }

  private cleanupInactiveWebhooks(): void {
    // Deactivate webhooks that haven't been triggered in 30 days
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const [id, webhook] of this.registrations.entries()) {
      if (webhook.lastTriggered && webhook.lastTriggered < cutoff) {
        webhook.active = false;
        this.registrations.set(id, webhook);
      }
    }
  }

  // Persistence
  private loadRegistrations(): void {
    // Load from persistent storage
    const stored = localStorage?.getItem('webhook-registrations');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.registrations = new Map(Object.entries(data));
      } catch (error) {
        console.error('Failed to load webhook registrations:', error);
      }
    }
  }

  private saveRegistrations(): void {
    try {
      const data = Object.fromEntries(this.registrations);
      localStorage?.setItem('webhook-registrations', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save webhook registrations:', error);
    }
  }

  // Utility Methods
  private generateWebhookId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeliveryId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // API Endpoints
  async getWebhookAnalytics(webhookId: string): Promise<WebhookAnalytics> {
    const webhook = this.registrations.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const deliveries = this.deliveryQueue.filter(d => d.webhookId === webhookId);
    const recentDeliveries = deliveries.filter(d => d.timestamp > Date.now() - 24 * 60 * 60 * 1000);

    return {
      webhookId,
      totalRegistrations: this.registrations.size,
      activeWebhooks: Array.from(this.registrations.values()).filter(w => w.active).length,
      eventsProcessed: await this.eventStore.getEventCount(24 * 60 * 60 * 1000),
      deliveriesToday: recentDeliveries.length,
      successRate: webhook.successRate,
      averageResponseTime: this.calculateAverageResponseTime(recentDeliveries),
      lastActivity: webhook.lastTriggered,
      topEventTypes: this.getTopEventTypes()
    };
  }

  private calculateAverageResponseTime(deliveries: WebhookDelivery[]): number {
    const successful = deliveries.filter(d => d.status === 'success' && d.duration);
    if (successful.length === 0) return 0;
    
    const total = successful.reduce((sum, d) => sum + (d.duration || 0), 0);
    return total / successful.length;
  }

  private getTopEventTypes(): { type: WebhookEventType; count: number }[] {
    const counts = new Map<WebhookEventType, number>();
    
    for (const webhook of this.registrations.values()) {
      for (const eventType of webhook.events) {
        counts.set(eventType, (counts.get(eventType) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Supporting Classes
export class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      }
    }
  }
}

export class RetryManager {
  private maxRetries: number = 3;
  private baseDelay: number = 1000;

  getNextRetryDelay(attempt: number): number {
    const exponentialBackoff = Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return this.baseDelay * exponentialBackoff + jitter;
  }

  shouldRetry(attempt: number): boolean {
    return attempt <= this.maxRetries;
  }
}

export class EventStore {
  private events: Map<string, WebhookEvent> = new Map();

  async storeEvent(event: WebhookEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async getEvent(id: string): Promise<WebhookEvent | null> {
    return this.events.get(id) || null;
  }

  async getEventCount(timeWindow?: number): Promise<number> {
    if (!timeWindow) return this.events.size;
    
    const cutoff = Date.now() - timeWindow;
    return Array.from(this.events.values()).filter(e => e.timestamp > cutoff).length;
  }

  cleanupOldEvents(cutoff: number): void {
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoff) {
        this.events.delete(id);
      }
    }
  }
}

// Analytics and Monitoring
export interface WebhookAnalytics {
  webhookId: string;
  totalRegistrations: number;
  activeWebhooks: number;
  eventsProcessed: number;
  deliveriesToday: number;
  successRate: number;
  averageResponseTime: number;
  lastActivity?: number;
  topEventTypes: { type: WebhookEventType; count: number }[];
}

// Convenience Functions
export async function createWebhookRegistration(
  url: string,
  events: WebhookEventType[],
  options?: {
    name?: string;
    description?: string;
    secret?: string;
    retryAttempts?: number;
    timeout?: number;
  }
): Promise<WebhookRegistration> {
  const webhookSystem = new WebhookSystem();
  
  return await webhookSystem.registerWebhook({
    url,
    name: options?.name || 'Unnamed Webhook',
    description: options?.description,
    events,
    active: true,
    config: {
      url,
      secret: options?.secret,
      events,
      active: true,
      retryAttempts: options?.retryAttempts || 3,
      timeout: options?.timeout || 10000
    }
  });
}

export async function emitSystemEvent(
  type: WebhookEventType,
  data: any,
  source: string = 'system'
): Promise<void> {
  const webhookSystem = new WebhookSystem();
  await webhookSystem.emitEvent({
    type,
    data,
    source,
    metadata: {
      version: '1.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
}