/**
 * Cross-Device Synchronization System
 * Provides seamless device continuity through:
 * - Session synchronization across devices
 * - Recipe progress synchronization
 * - Calculator state persistence
 * - User preferences sync
 * - Real-time collaboration
 * - Conflict resolution
 */

import { logger } from '../logger';

interface SyncData {
  id: string;
  type: 'session' | 'calculator' | 'recipe' | 'preferences' | 'progress' | 'collaboration';
  data: any;
  timestamp: number;
  deviceId: string;
  userId?: string;
  version: number;
  metadata?: Record<string, any>;
}

interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  userAgent: string;
  lastSeen: number;
  isActive: boolean;
  capabilities: {
    touch: boolean;
    camera: boolean;
    microphone: boolean;
    storage: number;
  };
}

interface SyncConflict {
  id: string;
  dataId: string;
  localData: SyncData;
  remoteData: SyncData;
  timestamp: number;
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
}

interface CollaborationSession {
  id: string;
  participants: string[];
  type: 'recipe-editing' | 'calculator-sharing' | 'tutorial';
  data: any;
  createdAt: number;
  expiresAt: number;
}

class CrossDeviceSync {
  private deviceId: string;
  private userId: string | null = null;
  private syncQueue: SyncData[] = [];
  private devices: Map<string, DeviceInfo> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private lastSyncTime: number = 0;
  private storageKey: string = 'voltage-sync-data';
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.initializeSync();
    this.setupNetworkMonitoring();
    this.loadPersistedData();
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    const stored = localStorage.getItem('voltage-device-id');
    if (stored) return stored;

    const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('voltage-device-id', deviceId);
    return deviceId;
  }

  /**
   * Initialize synchronization system
   */
  private initializeSync(): void {
    // Register this device
    this.registerDevice();
    
    // Setup storage event listener for cross-tab sync
    this.setupStorageSync();
    
    // Setup service worker sync if available
    this.setupServiceWorkerSync();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    logger.info('Cross-device sync initialized', { deviceId: this.deviceId });
  }

  /**
   * Register current device in the system
   */
  private registerDevice(): void {
    const deviceInfo: DeviceInfo = {
      id: this.deviceId,
      name: this.getDeviceName(),
      type: this.getDeviceType(),
      platform: this.getPlatform(),
      userAgent: navigator.userAgent,
      lastSeen: Date.now(),
      isActive: true,
      capabilities: {
        touch: 'ontouchstart' in window,
        camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        storage: this.estimateStorage()
      }
    };

    this.devices.set(this.deviceId, deviceInfo);
    this.persistDeviceInfo();
  }

  /**
   * Get device name based on platform
   */
  private getDeviceName(): string {
    const ua = navigator.userAgent;
    
    if (/iPad|Android.*tablet|Tablet/i.test(ua)) return 'Tablet';
    if (/iPhone|Android.*mobile/i.test(ua)) return 'Mobile';
    if (/Windows|Macintosh|Linux/i.test(ua)) return 'Desktop';
    
    return 'Unknown Device';
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent;
    
    if (/iPad|Android.*tablet|Tablet/i.test(ua)) return 'tablet';
    if (/iPhone|Android.*mobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    const ua = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Macintosh/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    
    return 'Unknown';
  }

  /**
   * Estimate available storage
   */
  private estimateStorage(): number {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        const quota = estimate.quota || 0;
        const deviceInfo = this.devices.get(this.deviceId);
        if (deviceInfo) {
          deviceInfo.capabilities.storage = Math.floor(quota / (1024 * 1024 * 1024)); // Convert to GB
          this.devices.set(this.deviceId, deviceInfo);
        }
      }).catch(() => {
        // Fallback estimate
        const deviceInfo = this.devices.get(this.deviceId);
        if (deviceInfo) {
          deviceInfo.capabilities.storage = 16; // Default 16GB
          this.devices.set(this.deviceId, deviceInfo);
        }
      });
    }
    
    return 16; // Default estimate
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
      logger.info('Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('Network connection lost');
    });

    this.isOnline = navigator.onLine;
  }

  /**
   * Setup storage event listener for cross-tab synchronization
   */
  private setupStorageSync(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          this.handleRemoteSyncData(syncData);
        } catch (error) {
          logger.error('Failed to parse sync data from storage', error);
        }
      }
    });
  }

  /**
   * Setup service worker synchronization
   */
  private setupServiceWorkerSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, data } = event.data;
          
          switch (type) {
            case 'SYNC_DATA':
              this.handleRemoteSyncData(data);
              break;
            case 'DEVICE_REGISTER':
              this.handleDeviceRegistration(data);
              break;
          }
        });
      });
    }
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performSync();
      }
    }, 30000);

    // Update device last seen every 5 minutes
    setInterval(() => {
      this.updateDeviceLastSeen();
    }, 300000);
  }

  /**
   * Update device last seen timestamp
   */
  private updateDeviceLastSeen(): void {
    const deviceInfo = this.devices.get(this.deviceId);
    if (deviceInfo) {
      deviceInfo.lastSeen = Date.now();
      deviceInfo.isActive = true;
      this.devices.set(this.deviceId, deviceInfo);
      this.persistDeviceInfo();
    }
  }

  /**
   * Sync data across devices
   */
  async syncData(data: any, type: SyncData['type'], metadata?: Record<string, any>): Promise<void> {
    const syncItem: SyncData = {
      id: this.generateSyncId(),
      type,
      data,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      userId: this.userId,
      version: 1,
      metadata
    };

    // Add to queue
    this.syncQueue.push(syncItem);
    
    // Persist locally
    this.persistSyncData(syncItem);
    
    // Attempt immediate sync if online
    if (this.isOnline) {
      await this.performSync();
    }

    logger.debug('Data queued for sync', { type, id: syncItem.id });
  }

  /**
   * Perform synchronization
   */
  private async performSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    
    try {
      // Get unsynced data
      const unsyncedData = this.getUnsyncedData();
      
      if (unsyncedData.length === 0) {
        this.lastSyncTime = Date.now();
        return;
      }

      // Send to server or other devices
      await this.transmitSyncData(unsyncedData);
      
      // Mark as synced
      this.markAsSynced(unsyncedData.map(d => d.id));
      
      this.lastSyncTime = Date.now();
      logger.info('Sync completed', { items: unsyncedData.length });
      
    } catch (error) {
      logger.error('Sync failed', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Transmit sync data to other devices/servers
   */
  private async transmitSyncData(data: SyncData[]): Promise<void> {
    // Try service worker first
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_DATA',
        data: data
      });
    }

    // Also use localStorage for cross-tab sync
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    
    // In a real implementation, you would also send to a backend API
    // await this.sendToBackend(data);
  }

  /**
   * Handle remote sync data
   */
  private handleRemoteSyncData(data: SyncData[]): void {
    data.forEach(syncItem => {
      if (syncItem.deviceId === this.deviceId) {
        return; // Ignore our own data
      }

      // Check for conflicts
      const existingData = this.getLocalData(syncItem.id);
      if (existingData && existingData.timestamp > syncItem.timestamp) {
        this.handleConflict(existingData, syncItem);
      } else {
        // Accept remote data
        this.acceptRemoteData(syncItem);
      }
    });
  }

  /**
   * Handle sync conflicts
   */
  private handleConflict(localData: SyncData, remoteData: SyncData): void {
    const conflict: SyncConflict = {
      id: this.generateConflictId(),
      dataId: localData.id,
      localData,
      remoteData,
      timestamp: Date.now()
    };

    this.conflicts.set(conflict.id, conflict);
    
    // Notify user of conflict
    this.notifyConflict(conflict);
    
    logger.warn('Sync conflict detected', { 
      conflictId: conflict.id, 
      dataId: localData.id 
    });
  }

  /**
   * Notify user of sync conflict
   */
  private notifyConflict(conflict: SyncConflict): void {
    // Create conflict notification
    const notification = document.createElement('div');
    notification.className = 'sync-conflict-notification';
    notification.innerHTML = `
      <div class="conflict-content">
        <h3>Sync Conflict</h3>
        <p>Changes were made to this data on another device.</p>
        <div class="conflict-actions">
          <button onclick="window.resolveSyncConflict('${conflict.id}', 'local')">Keep My Version</button>
          <button onclick="window.resolveSyncConflict('${conflict.id}', 'remote')">Use Other Version</button>
          <button onclick="window.resolveSyncConflict('${conflict.id}', 'merge')">Merge</button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 30000);
  }

  /**
   * Resolve sync conflict
   */
  resolveConflict(conflictId: string, resolution: SyncConflict['resolution']): void {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    conflict.resolution = resolution;

    switch (resolution) {
      case 'local':
        // Keep local data, discard remote
        this.markConflictResolved(conflictId);
        break;
        
      case 'remote':
        // Accept remote data
        this.acceptRemoteData(conflict.remoteData);
        this.markConflictResolved(conflictId);
        break;
        
      case 'merge':
        // Attempt to merge data
        const mergedData = this.mergeData(conflict.localData, conflict.remoteData);
        this.acceptRemoteData(mergedData);
        this.markConflictResolved(conflictId);
        break;
        
      case 'manual':
        // Let user handle manually
        this.showManualMergeUI(conflict);
        break;
    }

    this.conflicts.delete(conflictId);
    logger.info('Sync conflict resolved', { conflictId, resolution });
  }

  /**
   * Merge two data objects
   */
  private mergeData(local: SyncData, remote: SyncData): SyncData {
    // Simple merge strategy - in practice this would be more sophisticated
    const merged = { ...local.data };
    
    Object.keys(remote.data).forEach(key => {
      if (!(key in merged) || remote.timestamp > local.timestamp) {
        merged[key] = remote.data[key];
      }
    });

    return {
      ...remote,
      data: merged,
      version: Math.max(local.version, remote.version) + 1
    };
  }

  /**
   * Accept remote data
   */
  private acceptRemoteData(syncItem: SyncData): void {
    this.persistSyncData(syncItem);
    
    // Dispatch custom event for app components to handle
    window.dispatchEvent(new CustomEvent('syncDataReceived', {
      detail: syncItem
    }));
  }

  /**
   * Mark conflict as resolved
   */
  private markConflictResolved(conflictId: string): void {
    // Update conflict record
    const conflict = this.conflicts.get(conflictId);
    if (conflict) {
      conflict.resolution = 'local'; // Default to local
    }
  }

  /**
   * Show manual merge UI
   */
  private showManualMergeUI(conflict: SyncConflict): void {
    // Create modal for manual merge
    const modal = document.createElement('div');
    modal.className = 'sync-conflict-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Manual Merge Required</h2>
        <div class="data-comparison">
          <div class="local-data">
            <h3>Local Version</h3>
            <pre>${JSON.stringify(conflict.localData.data, null, 2)}</pre>
          </div>
          <div class="remote-data">
            <h3>Remote Version</h3>
            <pre>${JSON.stringify(conflict.remoteData.data, null, 2)}</pre>
          </div>
        </div>
        <textarea class="merge-result" placeholder="Enter merged data..."></textarea>
        <div class="modal-actions">
          <button onclick="window.applyManualMerge('${conflict.id}')">Apply Merge</button>
          <button onclick="window.closeSyncModal()">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Apply manual merge result
   */
  applyManualMerge(conflictId: string): void {
    const conflict = this.conflicts.get(conflictId);
    const modal = document.querySelector('.sync-conflict-modal') as HTMLElement;
    const textarea = modal?.querySelector('.merge-result') as HTMLTextAreaElement;
    
    if (conflict && textarea) {
      try {
        const mergedData = JSON.parse(textarea.value);
        const mergedSyncItem: SyncData = {
          ...conflict.localData,
          data: mergedData,
          version: Math.max(conflict.localData.version, conflict.remoteData.version) + 1,
          timestamp: Date.now()
        };
        
        this.acceptRemoteData(mergedSyncItem);
        this.markConflictResolved(conflictId);
        this.conflicts.delete(conflictId);
        
        modal?.remove();
      } catch (error) {
        alert('Invalid JSON in merge result');
      }
    }
  }

  /**
   * Start collaboration session
   */
  async startCollaboration(type: CollaborationSession['type'], data: any): Promise<string> {
    const session: CollaborationSession = {
      id: this.generateSessionId(),
      participants: [this.deviceId],
      type,
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    this.activeSessions.set(session.id, session);
    
    // Sync collaboration start
    await this.syncData(session, 'collaboration');
    
    logger.info('Collaboration session started', { sessionId: session.id, type });
    return session.id;
  }

  /**
   * Join collaboration session
   */
  async joinCollaboration(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    if (!session.participants.includes(this.deviceId)) {
      session.participants.push(this.deviceId);
      this.activeSessions.set(sessionId, session);
      
      // Sync participant update
      await this.syncData(session, 'collaboration');
    }

    return true;
  }

  /**
   * Leave collaboration session
   */
  async leaveCollaboration(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.participants = session.participants.filter(id => id !== this.deviceId);
    
    if (session.participants.length === 0) {
      // Last participant leaving - end session
      this.activeSessions.delete(sessionId);
    } else {
      // Update session with remaining participants
      this.activeSessions.set(sessionId, session);
    }

    // Sync participant update
    await this.syncData(session, 'collaboration');
    
    logger.info('Left collaboration session', { sessionId });
  }

  /**
   * Get sync status
   */
  getSyncStatus(): any {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      unsyncedItems: this.syncQueue.length,
      activeDevices: Array.from(this.devices.values()).filter(d => d.isActive),
      conflicts: Array.from(this.conflicts.values()),
      activeSessions: Array.from(this.activeSessions.values())
    };
  }

  /**
   * Force sync now
   */
  async forceSyncNow(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.performSync();
  }

  /**
   * Clear all sync data
   */
  clearSyncData(): void {
    this.syncQueue.length = 0;
    this.conflicts.clear();
    this.activeSessions.clear();
    localStorage.removeItem(this.storageKey);
    
    logger.info('Sync data cleared');
  }

  // Utility methods
  private generateSyncId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUnsyncedData(): SyncData[] {
    // In a real implementation, this would query the database
    return this.syncQueue.splice(0);
  }

  private getLocalData(id: string): SyncData | null {
    // In a real implementation, this would query local storage/database
    return null;
  }

  private markAsSynced(ids: string[]): void {
    // Mark items as synced
    logger.debug('Marked items as synced', { ids });
  }

  private persistSyncData(syncItem: SyncData): void {
    // Store in localStorage for persistence
    const existing = localStorage.getItem(`${this.storageKey}-${syncItem.id}`);
    if (!existing) {
      localStorage.setItem(`${this.storageKey}-${syncItem.id}`, JSON.stringify(syncItem));
    }
  }

  private persistDeviceInfo(): void {
    localStorage.setItem('voltage-devices', JSON.stringify(Array.from(this.devices.entries())));
  }

  private loadPersistedData(): void {
    // Load persisted device info
    const devicesData = localStorage.getItem('voltage-devices');
    if (devicesData) {
      try {
        const devicesArray = JSON.parse(devicesData);
        this.devices = new Map(devicesArray);
      } catch (error) {
        logger.error('Failed to load persisted device info', error);
      }
    }
  }

  private async syncPendingData(): Promise<void> {
    if (this.syncQueue.length > 0) {
      await this.performSync();
    }
  }

  private handleDeviceRegistration(deviceInfo: DeviceInfo): void {
    this.devices.set(deviceInfo.id, deviceInfo);
    this.persistDeviceInfo();
  }

  // Cleanup
  destroy(): void {
    this.syncQueue.length = 0;
    this.conflicts.clear();
    this.activeSessions.clear();
    this.observerCallbacks?.forEach(observer => observer.disconnect());
    
    logger.info('Cross-device sync destroyed');
  }
}

// Global conflict resolution functions
declare global {
  interface Window {
    resolveSyncConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge') => void;
    applyManualMerge: (conflictId: string) => void;
    closeSyncModal: () => void;
  }
}

// Setup global functions
if (typeof window !== 'undefined') {
  window.resolveSyncConflict = (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    crossDeviceSync.resolveConflict(conflictId, resolution);
  };

  window.applyManualMerge = (conflictId: string) => {
    crossDeviceSync.applyManualMerge(conflictId);
  };

  window.closeSyncModal = () => {
    const modal = document.querySelector('.sync-conflict-modal');
    modal?.remove();
  };
}

// Export singleton instance
export const crossDeviceSync = new CrossDeviceSync();

export default CrossDeviceSync;
export type { SyncData, DeviceInfo, SyncConflict, CollaborationSession };