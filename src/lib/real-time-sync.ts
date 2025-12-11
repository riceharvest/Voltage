/**
 * Real-time Data Synchronization System
 * 
 * Provides WebSocket connections, Server-Sent Events (SSE), real-time
 * collaboration features, live data streaming, and conflict resolution.
 */

import { NextRequest, NextResponse } from 'next/server';

// Real-time Event Types
export enum RealtimeEventType {
  // Recipe Events
  RECIPE_CREATED = 'recipe.created',
  RECIPE_UPDATED = 'recipe.updated',
  RECIPE_DELETED = 'recipe.deleted',
  
  // User Collaboration
  USER_JOINED = 'user.joined',
  USER_LEFT = 'user.left',
  USER_EDITING = 'user.editing',
  USER_CURSOR = 'user.cursor',
  
  // Data Sync
  INVENTORY_UPDATED = 'inventory.updated',
  PRICE_CHANGED = 'price.changed',
  AVAILABILITY_CHANGED = 'availability.changed',
  
  // System Events
  SYSTEM_STATUS = 'system.status',
  NOTIFICATION = 'notification',
  ERROR = 'error'
}

// Connection Types
export enum ConnectionType {
  WEBSOCKET = 'websocket',
  SSE = 'sse',
  POLLING = 'polling'
}

// Real-time Message
export interface RealtimeMessage {
  id: string;
  type: RealtimeEventType;
  timestamp: number;
  source: string;
  target?: string;
  room?: string;
  userId?: string;
  data: any;
  metadata?: Record<string, any>;
}

// WebSocket Connection Manager
export class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private eventEmitter: EventEmitter;
  private heartbeatInterval: NodeJS.Timeout;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.startHeartbeat();
    this.setupEventHandlers();
  }

  // Connection Management
  async createConnection(
    socketId: string, 
    request: NextRequest, 
    connectionType: ConnectionType = ConnectionType.WEBSOCKET
  ): Promise<WebSocketConnection> {
    const connection: WebSocketConnection = {
      id: socketId,
      type: connectionType,
      userId: this.extractUserId(request),
      rooms: new Set(),
      lastPing: Date.now(),
      status: 'connecting',
      metadata: {}
    };

    this.connections.set(socketId, connection);
    
    // Add to default room
    await this.joinRoom(socketId, 'global');
    
    return connection;
  }

  async closeConnection(socketId: string): Promise<void> {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    // Remove from all rooms
    for (const roomId of connection.rooms) {
      await this.leaveRoom(socketId, roomId);
    }

    // Close connection
    this.connections.delete(socketId);
    
    // Notify other users
    this.broadcastUserLeft(socketId);
  }

  // Room Management
  async joinRoom(socketId: string, roomId: string): Promise<void> {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    // Add to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId)!.add(socketId);
    connection.rooms.add(roomId);

    // Notify room members
    this.broadcastToRoom(roomId, {
      type: 'user.joined',
      data: { userId: connection.userId, socketId },
      room: roomId
    }, socketId); // Exclude the joining user
  }

  async leaveRoom(socketId: string, roomId: string): Promise<void> {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    // Remove from room
    this.rooms.get(roomId)?.delete(socketId);
    connection.rooms.delete(roomId);

    // Clean up empty rooms
    if (this.rooms.get(roomId)?.size === 0) {
      this.rooms.delete(roomId);
    }

    // Notify room members
    this.broadcastToRoom(roomId, {
      type: 'user.left',
      data: { userId: connection.userId, socketId },
      room: roomId
    });
  }

  // Message Broadcasting
  async broadcast(message: Omit<RealtimeMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: RealtimeMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now()
    };

    // Emit event for handlers
    this.eventEmitter.emit('message', fullMessage);

    // Broadcast to appropriate connections
    if (message.room) {
      await this.broadcastToRoom(message.room, fullMessage);
    } else if (message.target) {
      await this.broadcastToUser(message.target, fullMessage);
    } else {
      await this.broadcastToAll(fullMessage);
    }
  }

  private async broadcastToRoom(roomId: string, message: any, excludeSocketId?: string): Promise<void> {
    const roomConnections = this.rooms.get(roomId);
    if (!roomConnections) return;

    const messageStr = JSON.stringify(message);
    
    for (const socketId of roomConnections) {
      if (socketId === excludeSocketId) continue;
      
      const connection = this.connections.get(socketId);
      if (connection && connection.status === 'connected') {
        await this.sendToConnection(connection, messageStr);
      }
    }
  }

  private async broadcastToUser(userId: string, message: any): Promise<void> {
    for (const connection of this.connections.values()) {
      if (connection.userId === userId && connection.status === 'connected') {
        await this.sendToConnection(connection, JSON.stringify(message));
      }
    }
  }

  private async broadcastToAll(message: any): Promise<void> {
    const messageStr = JSON.stringify(message);
    
    for (const connection of this.connections.values()) {
      if (connection.status === 'connected') {
        await this.sendToConnection(connection, messageStr);
      }
    }
  }

  // Data Synchronization
  async syncData(dataType: string, payload: any, roomId?: string): Promise<void> {
    const message: Omit<RealtimeMessage, 'id' | 'timestamp'> = {
      type: 'data.sync',
      source: 'server',
      data: {
        type: dataType,
        payload,
        version: Date.now()
      },
      room: roomId
    };

    await this.broadcast(message);
  }

  // Conflict Resolution
  async handleConflict(
    resourceType: string, 
    resourceId: string, 
    conflictingChanges: ConflictChange[]
  ): Promise<ConflictResolution> {
    const resolution = await this.resolveConflicts(conflictingChanges);
    
    // Broadcast resolution to all relevant users
    await this.broadcast({
      type: 'conflict.resolved',
      source: 'server',
      data: {
        resourceType,
        resourceId,
        resolution
      },
      room: 'collaboration'
    });

    return resolution;
  }

  private async resolveConflicts(changes: ConflictChange[]): Promise<ConflictResolution> {
    // Implement conflict resolution strategy
    // This could be last-write-wins, merge-based, or user-interactive
    
    const sortedChanges = changes.sort((a, b) => a.timestamp - b.timestamp);
    const latestChange = sortedChanges[sortedChanges.length - 1];
    
    return {
      strategy: 'last-write-wins',
      winner: latestChange.userId,
      mergedData: latestChange.data,
      conflicts: changes.map(change => ({
        field: change.field,
        values: changes.map(c => c.data[change.field])
      }))
    };
  }

  // Real-time Collaboration Features
  async startCollaborativeEditing(
    resourceType: string,
    resourceId: string,
    userId: string
  ): Promise<void> {
    await this.broadcast({
      type: 'collaboration.started',
      source: 'server',
      data: {
        resourceType,
        resourceId,
        userId
      },
      room: `resource:${resourceType}:${resourceId}`
    });
  }

  async updateUserCursor(
    userId: string,
    position: CursorPosition,
    resourceId?: string
  ): Promise<void> {
    await this.broadcast({
      type: 'user.cursor',
      source: 'server',
      data: {
        userId,
        position
      },
      room: resourceId ? `resource:${resourceId}` : 'global'
    });
  }

  // System Management
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, 30000); // 30 seconds
  }

  private async performHeartbeat(): Promise<void> {
    const now = Date.now();
    const staleConnections: string[] = [];

    for (const [socketId, connection] of this.connections.entries()) {
      if (now - connection.lastPing > 60000) { // 1 minute timeout
        staleConnections.push(socketId);
      } else {
        // Send ping
        await this.sendToConnection(connection, JSON.stringify({
          type: 'ping',
          timestamp: now
        }));
      }
    }

    // Clean up stale connections
    for (const socketId of staleConnections) {
      await this.closeConnection(socketId);
    }
  }

  private setupEventHandlers(): void {
    this.eventEmitter.on('message', async (message: RealtimeMessage) => {
      // Handle special message types
      switch (message.type) {
        case 'ping':
          await this.handlePing(message);
          break;
        case 'pong':
          await this.handlePong(message);
          break;
        case 'subscribe':
          await this.handleSubscribe(message);
          break;
        case 'unsubscribe':
          await this.handleUnsubscribe(message);
          break;
      }
    });
  }

  // Message Handlers
  private async handlePing(message: RealtimeMessage): Promise<void> {
    // Respond with pong
    const connection = this.connections.get(message.target || '');
    if (connection) {
      await this.sendToConnection(connection, JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }));
    }
  }

  private async handlePong(message: RealtimeMessage): Promise<void> {
    // Update last ping time
    const connection = this.connections.get(message.target || '');
    if (connection) {
      connection.lastPing = Date.now();
    }
  }

  private async handleSubscribe(message: RealtimeMessage): Promise<void> {
    const socketId = message.target || '';
    const roomId = message.data.roomId;
    
    if (roomId) {
      await this.joinRoom(socketId, roomId);
    }
  }

  private async handleUnsubscribe(message: RealtimeMessage): Promise<void> {
    const socketId = message.target || '';
    const roomId = message.data.roomId;
    
    if (roomId) {
      await this.leaveRoom(socketId, roomId);
    }
  }

  // Utility Methods
  private extractUserId(request: NextRequest): string {
    // Extract user ID from JWT token or API key
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // Extract user ID from JWT token
      return 'user-' + Math.random().toString(36).substr(2, 9);
    }
    return 'anonymous-' + Math.random().toString(36).substr(2, 9);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToConnection(connection: WebSocketConnection, message: string): Promise<void> {
    try {
      // In a real implementation, this would send via WebSocket
      // For now, we'll just log
      console.log(`Sending to ${connection.id}: ${message}`);
    } catch (error) {
      console.error(`Failed to send to ${connection.id}:`, error);
      connection.status = 'error';
    }
  }

  private broadcastUserLeft(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      this.broadcast({
        type: 'user.left',
        source: 'server',
        data: {
          userId: connection.userId,
          socketId
        }
      });
    }
  }

  // Public API
  getConnectionStats(): ConnectionStats {
    const total = this.connections.size;
    const connected = Array.from(this.connections.values())
      .filter(c => c.status === 'connected').length;
    const rooms = this.rooms.size;

    return {
      totalConnections: total,
      activeConnections: connected,
      totalRooms: rooms,
      connectionsByRoom: Object.fromEntries(
        Array.from(this.rooms.entries()).map(([roomId, connections]) => [
          roomId, 
          connections.size
        ])
      )
    };
  }

  getActiveUsers(): ActiveUser[] {
    const users = new Map<string, ActiveUser>();

    for (const connection of this.connections.values()) {
      if (connection.status === 'connected' && connection.userId) {
        const user = users.get(connection.userId) || {
          userId: connection.userId,
          connections: 0,
          rooms: new Set(),
          lastSeen: Date.now()
        };

        user.connections++;
        user.rooms.add(...connection.rooms);
        user.lastSeen = Math.max(user.lastSeen, connection.lastPing);

        users.set(connection.userId, user);
      }
    }

    return Array.from(users.values()).map(user => ({
      ...user,
      rooms: Array.from(user.rooms)
    }));
  }
}

// Server-Sent Events Manager
export class SSEManager {
  private connections: Map<string, SSEConnection> = new Map();
  private eventQueue: EventQueue;

  constructor() {
    this.eventQueue = new EventQueue();
  }

  async createConnection(
    connectionId: string,
    request: NextRequest,
    options: SSEOptions = {}
  ): Promise<SSEConnection> {
    const connection: SSEConnection = {
      id: connectionId,
      lastEventId: request.headers.get('last-event-id') || '0',
      userId: this.extractUserId(request),
      rooms: new Set(),
      keepAlive: options.keepAlive !== false,
      heartbeatInterval: null
    };

    this.connections.set(connectionId, connection);

    if (connection.keepAlive) {
      this.startHeartbeat(connection);
    }

    return connection;
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (connection.heartbeatInterval) {
      clearInterval(connection.heartbeatInterval);
    }

    this.connections.delete(connectionId);
  }

  async sendEvent(
    connectionId: string,
    event: SSEEvent
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const eventData = this.formatSSEEvent(event);
    
    try {
      // In a real implementation, this would send via SSE
      console.log(`SSE to ${connectionId}:`, eventData);
    } catch (error) {
      console.error(`Failed to send SSE to ${connectionId}:`, error);
      await this.closeConnection(connectionId);
    }
  }

  async broadcastEvent(
    event: SSEEvent,
    roomId?: string
  ): Promise<void> {
    const connections = this.getConnectionsForRoom(roomId);
    const eventData = this.formatSSEEvent(event);

    for (const connection of connections) {
      await this.sendEvent(connection.id, event);
    }
  }

  private startHeartbeat(connection: SSEConnection): void {
    connection.heartbeatInterval = setInterval(() => {
      this.sendEvent(connection.id, {
        type: 'heartbeat',
        data: { timestamp: Date.now() }
      });
    }, 25000); // 25 seconds (less than 30s timeout)
  }

  private getConnectionsForRoom(roomId?: string): SSEConnection[] {
    if (!roomId) {
      return Array.from(this.connections.values());
    }

    return Array.from(this.connections.values())
      .filter(conn => conn.rooms.has(roomId));
  }

  private formatSSEEvent(event: SSEEvent): string {
    let formatted = '';
    
    if (event.id) {
      formatted += `id: ${event.id}\n`;
    }
    
    if (event.event) {
      formatted += `event: ${event.event}\n`;
    }
    
    formatted += `data: ${JSON.stringify(event.data)}\n\n`;
    
    return formatted;
  }

  private extractUserId(request: NextRequest): string {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return 'user-' + Math.random().toString(36).substr(2, 9);
    }
    return 'anonymous-' + Math.random().toString(36).substr(2, 9);
  }
}

// Real-time Data Sync Manager
export class RealtimeSyncManager {
  private websocketManager: WebSocketManager;
  private sseManager: SSEManager;
  private conflictResolver: ConflictResolver;
  private syncStrategies: Map<string, SyncStrategy> = new Map();

  constructor() {
    this.websocketManager = new WebSocketManager();
    this.sseManager = new SSEManager();
    this.conflictResolver = new ConflictResolver();
    this.initializeSyncStrategies();
  }

  // Data Synchronization
  async syncResource(
    resourceType: string,
    resourceId: string,
    data: any,
    version: number,
    userId: string
  ): Promise<SyncResult> {
    // Check for conflicts
    const currentVersion = await this.getCurrentVersion(resourceType, resourceId);
    
    if (version < currentVersion) {
      // Conflict detected
      const conflicts = await this.detectConflicts(resourceType, resourceId, data, version);
      const resolution = await this.conflictResolver.resolve(conflicts);
      
      return {
        success: false,
        conflict: true,
        resolution,
        serverVersion: currentVersion
      };
    }

    // Update resource
    await this.updateResource(resourceType, resourceId, data, version, userId);
    
    // Broadcast update
    await this.broadcastUpdate(resourceType, resourceId, data, version, userId);
    
    return {
      success: true,
      version: version,
      conflict: false
    };
  }

  async subscribeToResource(
    resourceType: string,
    resourceId: string,
    connectionId: string,
    connectionType: ConnectionType
  ): Promise<void> {
    const roomId = `resource:${resourceType}:${resourceId}`;
    
    if (connectionType === ConnectionType.WEBSOCKET) {
      await this.websocketManager.joinRoom(connectionId, roomId);
    } else if (connectionType === ConnectionType.SSE) {
      // Add to SSE room
      // Implementation would depend on SSE setup
    }

    // Send current state
    const currentData = await this.getResourceData(resourceType, resourceId);
    const currentVersion = await this.getCurrentVersion(resourceType, resourceId);
    
    await this.sendInitialState(connectionId, {
      type: resourceType,
      id: resourceId,
      data: currentData,
      version: currentVersion
    });
  }

  // Conflict Detection and Resolution
  private async detectConflicts(
    resourceType: string,
    resourceId: string,
    clientData: any,
    clientVersion: number
  ): Promise<ConflictDetection> {
    const serverData = await this.getResourceData(resourceType, resourceId);
    const serverVersion = await this.getCurrentVersion(resourceType, resourceId);
    
    const conflicts: FieldConflict[] = [];
    
    // Compare each field
    for (const [field, clientValue] of Object.entries(clientData)) {
      const serverValue = (serverData as any)[field];
      
      if (clientValue !== serverValue) {
        conflicts.push({
          field,
          clientValue,
          serverValue,
          lastModified: Date.now()
        });
      }
    }

    return {
      resourceType,
      resourceId,
      conflicts,
      clientVersion,
      serverVersion
    };
  }

  // Broadcast Updates
  private async broadcastUpdate(
    resourceType: string,
    resourceId: string,
    data: any,
    version: number,
    userId: string
  ): Promise<void> {
    const roomId = `resource:${resourceType}:${resourceId}`;
    
    // Broadcast via WebSocket
    await this.websocketManager.broadcast({
      type: 'resource.updated',
      source: 'server',
      data: {
        type: resourceType,
        id: resourceId,
        data,
        version,
        updatedBy: userId
      },
      room: roomId
    });

    // Broadcast via SSE
    await this.sseManager.broadcastEvent({
      type: 'resource.updated',
      data: {
        type: resourceType,
        id: resourceId,
        data,
        version,
        updatedBy: userId
      }
    }, roomId);
  }

  // Data Operations
  private async getResourceData(resourceType: string, resourceId: string): Promise<any> {
    // In a real implementation, this would fetch from database
    return { id: resourceId, type: resourceType, data: {} };
  }

  private async getCurrentVersion(resourceType: string, resourceId: string): Promise<number> {
    // In a real implementation, this would fetch version from database
    return Date.now();
  }

  private async updateResource(
    resourceType: string,
    resourceId: string,
    data: any,
    version: number,
    userId: string
  ): Promise<void> {
    // In a real implementation, this would update the database
    console.log(`Updating ${resourceType}:${resourceId} to version ${version}`);
  }

  private async sendInitialState(connectionId: string, state: any): Promise<void> {
    // Send initial state to connection
    await this.websocketManager.broadcast({
      type: 'resource.state',
      source: 'server',
      data: state,
      target: connectionId
    });
  }

  private initializeSyncStrategies(): void {
    // Register sync strategies for different resource types
    this.syncStrategies.set('recipe', {
      strategy: 'optimistic-concurrency',
      conflictResolution: 'last-write-wins',
      retryOnConflict: true
    });

    this.syncStrategies.set('ingredient', {
      strategy: 'pessimistic-locking',
      conflictResolution: 'manual-merge',
      retryOnConflict: false
    });

    this.syncStrategies.set('price', {
      strategy: 'event-sourcing',
      conflictResolution: 'event-ordering',
      retryOnConflict: true
    });
  }

  // Public API
  getStats(): RealtimeStats {
    const wsStats = this.websocketManager.getConnectionStats();
    const activeUsers = this.websocketManager.getActiveUsers();

    return {
      websocket: wsStats,
      sse: {
        totalConnections: this.sseManager['connections'].size
      },
      activeUsers,
      syncOperations: {
        total: 0,
        conflicts: 0,
        resolved: 0
      }
    };
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

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(...args);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      }
    }
  }
}

export class EventQueue {
  private events: any[] = [];
  private processing = false;

  async add(event: any): Promise<void> {
    this.events.push(event);
    
    if (!this.processing) {
      await this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;
    
    while (this.events.length > 0) {
      const event = this.events.shift();
      try {
        await this.handleEvent(event);
      } catch (error) {
        console.error('Event processing error:', error);
      }
    }
    
    this.processing = false;
  }

  private async handleEvent(event: any): Promise<void> {
    // Handle event
    console.log('Processing event:', event);
  }
}

export class ConflictResolver {
  async resolve(conflicts: ConflictDetection): Promise<ConflictResolution> {
    const strategy = this.getStrategy(conflicts.resourceType);
    
    switch (strategy.conflictResolution) {
      case 'last-write-wins':
        return this.lastWriteWins(conflicts);
      case 'manual-merge':
        return this.manualMerge(conflicts);
      case 'event-ordering':
        return this.eventOrdering(conflicts);
      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy.conflictResolution}`);
    }
  }

  private lastWriteWins(conflicts: ConflictDetection): ConflictResolution {
    const mergedData: any = {};
    const resolvedConflicts: ResolvedConflict[] = [];

    for (const conflict of conflicts.conflicts) {
      // Use server value as winner
      mergedData[conflict.field] = conflict.serverValue;
      resolvedConflicts.push({
        field: conflict.field,
        resolution: 'server-wins',
        value: conflict.serverValue
      });
    }

    return {
      strategy: 'last-write-wins',
      winner: 'server',
      mergedData,
      resolvedConflicts
    };
  }

  private manualMerge(conflicts: ConflictDetection): ConflictResolution {
    return {
      strategy: 'manual-merge',
      winner: null,
      mergedData: {},
      resolvedConflicts: []
    };
  }

  private eventOrdering(conflicts: ConflictDetection): ConflictResolution {
    return {
      strategy: 'event-ordering',
      winner: 'latest-event',
      mergedData: {},
      resolvedConflicts: []
    };
  }

  private getStrategy(resourceType: string): SyncStrategy {
    return {
      strategy: 'optimistic-concurrency',
      conflictResolution: 'last-write-wins',
      retryOnConflict: true
    };
  }
}

// Type Definitions
export interface WebSocketConnection {
  id: string;
  type: ConnectionType;
  userId?: string;
  rooms: Set<string>;
  lastPing: number;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  metadata: Record<string, any>;
}

export interface SSEConnection {
  id: string;
  lastEventId: string;
  userId?: string;
  rooms: Set<string>;
  keepAlive: boolean;
  heartbeatInterval: NodeJS.Timeout | null;
}

export interface SSEEvent {
  id?: string;
  event?: string;
  data: any;
}

export interface SSEOptions {
  keepAlive?: boolean;
  retryInterval?: number;
}

export interface ConflictChange {
  userId: string;
  timestamp: number;
  data: any;
  field?: string;
}

export interface ConflictResolution {
  strategy: string;
  winner: string | null;
  mergedData: any;
  resolvedConflicts: ResolvedConflict[];
}

export interface ResolvedConflict {
  field: string;
  resolution: string;
  value: any;
}

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface ActiveUser {
  userId: string;
  connections: number;
  rooms: string[];
  lastSeen: number;
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  totalRooms: number;
  connectionsByRoom: Record<string, number>;
}

export interface SyncStrategy {
  strategy: string;
  conflictResolution: string;
  retryOnConflict: boolean;
}

export interface FieldConflict {
  field: string;
  clientValue: any;
  serverValue: any;
  lastModified: number;
}

export interface ConflictDetection {
  resourceType: string;
  resourceId: string;
  conflicts: FieldConflict[];
  clientVersion: number;
  serverVersion: number;
}

export interface SyncResult {
  success: boolean;
  version?: number;
  conflict: boolean;
  resolution?: ConflictResolution;
  serverVersion?: number;
}

export interface RealtimeStats {
  websocket: ConnectionStats;
  sse: {
    totalConnections: number;
  };
  activeUsers: ActiveUser[];
  syncOperations: {
    total: number;
    conflicts: number;
    resolved: number;
  };
}