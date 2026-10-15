import Pusher, { Channel } from 'pusher-js';
import {
  LocationUpdatePayload,
  PresenceUpdatePayload,
  PusherConnectionState,
  RealtimeTransportState
} from '../types/tracking';

const DEFAULT_CHANNEL_NAME = 'my-channel';
const DEFAULT_LOCATION_EVENT = 'location.updated';
const DEFAULT_PRESENCE_EVENT = 'presence.updated';
const LOCAL_BROADCAST_CHANNEL = 'solarpulse_pusher_location_broadcast';

function cleanConfigVal(val?: string | null): string {
  if (!val) return '';
  let str = String(val).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  if (str.startsWith('${') && str.endsWith('}')) {
    str = str.slice(2, -1).trim();
  }
  if (str === 'undefined' || str === 'null') return '';
  return str;
}

class PusherService {
  private pusher: Pusher | null = null;
  private channel: Channel | null = null;
  private connectionState: RealtimeTransportState = 'pusher-connecting';
  private connectionListeners: Set<(state: RealtimeTransportState) => void> = new Set();
  private locationListeners: Set<(payload: LocationUpdatePayload) => void> = new Set();
  private presenceListeners: Set<(payload: PresenceUpdatePayload) => void> = new Set();
  private localBroadcast: BroadcastChannel | null = null;
  private sseSource: EventSource | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Local broadcast fallback for immediate multi-tab sync on same machine
      try {
        if ('BroadcastChannel' in window) {
          this.localBroadcast = new BroadcastChannel(LOCAL_BROADCAST_CHANNEL);
          this.localBroadcast.onmessage = (event) => {
            if (event.data?.type === 'location.updated' && event.data.payload) {
              this.dispatchLocationUpdate(event.data.payload, false);
            } else if (event.data?.type === 'presence.updated' && event.data.payload) {
              this.dispatchPresenceUpdate(event.data.payload, false);
            }
          };
        }
      } catch (e) {
        console.warn('[Pusher] Local broadcast fallback not initialized:', e);
      }

      this.init();
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.isInitialized = true;

      // 1. Read Vite environment variables (build-time candidate)
      let appKey = cleanConfigVal(
        (import.meta.env.VITE_PUSHER_APP_KEY as string | undefined) ||
        (import.meta.env.VITE_PUSHER_KEY as string | undefined)
      );
      let cluster = cleanConfigVal(
        (import.meta.env.VITE_PUSHER_APP_CLUSTER as string | undefined) ||
        (import.meta.env.VITE_PUSHER_CLUSTER as string | undefined)
      ) || 'ap2';
      let configSource = 'Vite Environment';

      // 2. Fetch live runtime config from backend /api/pusher/config
      // This guarantees production connects even if frontend was built before .env was configured
      try {
        const res = await fetch('/api/pusher/config');
        if (res.ok) {
          const config = await res.json();
          const serverKey = cleanConfigVal(config.key);
          const serverCluster = cleanConfigVal(config.cluster);
          if (config.configured && serverKey) {
            appKey = serverKey;
            cluster = serverCluster || cluster;
            configSource = 'Backend (/api/pusher/config)';
          }
        }
      } catch (fetchErr) {
        console.warn('[Pusher] Could not query /api/pusher/config, using local env fallback:', fetchErr);
      }

      console.log(`[Pusher] Configuration source: ${configSource}`);
      console.log(`[Pusher] Public key configured: ${Boolean(appKey)}`);
      console.log(`[Pusher] Cluster: ${cluster}`);

      if (!appKey) {
        console.warn('[Pusher] Public key configured: false');
        console.warn('[Pusher] No public key found in Vite env or /api/pusher/config. Activating SSE fallback...');
        this.updateConnectionState('sse-fallback');
        this.initSseFallback();
        return;
      }

      try {
        this.updateConnectionState('pusher-connecting');
        console.log('[Pusher] Connecting...');

        this.pusher = new Pusher(appKey, {
          cluster,
          forceTLS: true
        });

        // Bind connection state handlers
        this.pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
          console.log(`[Pusher] Connection state: ${states.current}`);
          if (states.current === 'connected') {
            this.updateConnectionState('pusher-connected');
            // If SSE fallback was active, close it since Pusher is now connected
            if (this.sseSource) {
              this.sseSource.close();
              this.sseSource = null;
            }
          } else if (states.current === 'connecting') {
            this.updateConnectionState('pusher-connecting');
          } else if (states.current === 'unavailable' || states.current === 'failed') {
            console.warn(`[Pusher] Connection state: ${states.current}. Activating SSE fallback...`);
            this.updateConnectionState('sse-fallback');
            this.initSseFallback();
          } else if (states.current === 'disconnected') {
            if (this.sseSource && this.sseSource.readyState === EventSource.OPEN) {
              this.updateConnectionState('sse-fallback');
            } else {
              this.updateConnectionState('disconnected');
            }
          }
        });

        this.pusher.connection.bind('error', (err: any) => {
          console.warn('[Pusher] WebSocket connection error:', err?.error?.data?.message || err?.message || err);
          this.initSseFallback();
        });

        // Subscribe to central location & presence channel
        console.log(`[Pusher] Channel subscription: ${DEFAULT_CHANNEL_NAME}`);
        this.channel = this.pusher.subscribe(DEFAULT_CHANNEL_NAME);

        this.channel.bind('pusher:subscription_succeeded', () => {
          console.log(`[Pusher] Subscription succeeded: ${DEFAULT_CHANNEL_NAME}`);
        });

        this.channel.bind('pusher:subscription_error', (status: any) => {
          console.error(`[Pusher] Subscription failed: ${DEFAULT_CHANNEL_NAME}`, status);
          this.initSseFallback();
        });

        console.log(`[Pusher] Event binding: ${DEFAULT_LOCATION_EVENT}`);
        this.channel.bind(DEFAULT_LOCATION_EVENT, (data: LocationUpdatePayload) => {
          if (data && data.userId && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            this.dispatchLocationUpdate(data, false);
          }
        });

        console.log(`[Pusher] Event binding: ${DEFAULT_PRESENCE_EVENT}`);
        this.channel.bind(DEFAULT_PRESENCE_EVENT, (data: PresenceUpdatePayload) => {
          if (data && data.userId) {
            this.dispatchPresenceUpdate(data, false);
          }
        });
      } catch (err) {
        console.warn('[Pusher] Error initializing Pusher client:', err);
        this.updateConnectionState('sse-fallback');
        this.initSseFallback();
      }
    })();

    return this.initPromise;
  }

  // Backup Server-Sent Events stream when Pusher is absent or unavailable
  private initSseFallback() {
    if (this.sseSource || typeof window === 'undefined') return;

    try {
      console.info('[Pusher] Starting SSE fallback (/api/workforce/stream)...');
      this.sseSource = new EventSource('/api/workforce/stream');

      this.sseSource.onopen = () => {
        console.log('[Pusher] SSE fallback connected successfully');
        // Only mark sse-fallback if Pusher is not already connected
        if (!this.pusher || this.connectionState !== 'pusher-connected') {
          this.updateConnectionState('sse-fallback');
        }
      };

      this.sseSource.addEventListener('location.updated', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as LocationUpdatePayload;
          if (payload && payload.userId && typeof payload.latitude === 'number') {
            this.dispatchLocationUpdate(payload, false);
          }
        } catch {
          // Parse error ignored
        }
      });

      this.sseSource.addEventListener('presence.updated', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as PresenceUpdatePayload;
          if (payload && payload.userId) {
            this.dispatchPresenceUpdate(payload, false);
          }
        } catch {
          // Parse error ignored
        }
      });

      this.sseSource.onerror = () => {
        if (!this.pusher || this.connectionState !== 'pusher-connected') {
          console.warn('[Pusher] SSE fallback stream disconnected');
          this.updateConnectionState('disconnected');
        }
      };
    } catch (e) {
      console.warn('[Pusher] SSE fallback error:', e);
      if (this.connectionState !== 'pusher-connected') {
        this.updateConnectionState('disconnected');
      }
    }
  }

  private updateConnectionState(newState: RealtimeTransportState) {
    this.connectionState = newState;
    this.connectionListeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (e) {
        console.error('[Pusher] Error in connection listener:', e);
      }
    });
  }

  private dispatchLocationUpdate(payload: LocationUpdatePayload, broadcastLocal: boolean) {
    if (broadcastLocal && this.localBroadcast) {
      try {
        this.localBroadcast.postMessage({ type: 'location.updated', payload });
      } catch {
        // Broadcast error ignored
      }
    }

    this.locationListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (e) {
        console.error('[Pusher] Error in location listener:', e);
      }
    });
  }

  private dispatchPresenceUpdate(payload: PresenceUpdatePayload, broadcastLocal: boolean) {
    if (broadcastLocal && this.localBroadcast) {
      try {
        this.localBroadcast.postMessage({ type: 'presence.updated', payload });
      } catch {
        // Broadcast error ignored
      }
    }

    this.presenceListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (e) {
        console.error('[Pusher] Error in presence listener:', e);
      }
    });
  }

  /**
   * Broadcast location update: Sends to backend endpoint (which triggers Pusher event 'location.updated')
   * and dispatches locally so UI updates immediately.
   */
  async broadcastLocation(payload: LocationUpdatePayload): Promise<boolean> {
    // 1. Dispatch locally immediately for zero-lag feedback
    this.dispatchLocationUpdate(payload, true);

    // 2. Transmit to backend endpoint
    try {
      const res = await fetch('/api/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': payload.userId
        },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (e) {
      console.warn('[Pusher] Location transmission to backend failed:', e);
      return false;
    }
  }

  /**
   * Transmit Presence Heartbeat to backend
   */
  async sendHeartbeat(data: {
    userId: string;
    employeeCode?: string;
    name?: string;
    email?: string;
    role?: string;
    isSharingLocation: boolean;
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': data.userId,
          'x-user-role': data.role || ''
        },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (e) {
      console.warn('[Presence] Heartbeat failed:', e);
      return false;
    }
  }

  /**
   * Transmit Offline Presence status to backend
   */
  async sendOffline(userId: string, email?: string, employeeCode?: string): Promise<boolean> {
    try {
      const payload = { userId, email, employeeCode };
      const body = JSON.stringify(payload);

      // If sendBeacon is available during window unload/pagehide, use it
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          const blob = new Blob([body], { type: 'application/json' });
          if (navigator.sendBeacon('/api/presence/offline', blob)) {
            return true;
          }
        } catch {
          // Fallback to fetch
        }
      }

      const res = await fetch('/api/presence/offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body,
        keepalive: true
      });
      return res.ok;
    } catch (e) {
      console.warn('[Presence] Offline update failed:', e);
      return false;
    }
  }

  /**
   * Subscribe to incoming location.updated events
   */
  onLocationUpdate(callback: (payload: LocationUpdatePayload) => void): () => void {
    this.locationListeners.add(callback);
    return () => {
      this.locationListeners.delete(callback);
    };
  }

  /**
   * Subscribe to incoming presence.updated events
   */
  onPresenceUpdate(callback: (payload: PresenceUpdatePayload) => void): () => void {
    this.presenceListeners.add(callback);
    return () => {
      this.presenceListeners.delete(callback);
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(callback: (state: RealtimeTransportState) => void): () => void {
    this.connectionListeners.add(callback);
    callback(this.connectionState);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  getConnectionState(): RealtimeTransportState {
    return this.connectionState;
  }

  cleanup(): void {
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher?.unsubscribe(DEFAULT_CHANNEL_NAME);
      this.channel = null;
    }
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
  }
}

// Export singleton instance
export const pusherService = new PusherService();
