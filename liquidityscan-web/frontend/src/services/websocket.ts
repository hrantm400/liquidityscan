import { io, Socket } from 'socket.io-client';
import { Signal } from '../types';

// Use proxy for WebSocket in development, or direct URL in production
// In development, Vite proxy handles /socket.io, so we use relative URL
// In production, use the full WebSocket URL
const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? '' : window.location.origin);

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private pendingSubscriptions: Array<{ type: 'strategy' | 'symbol'; data: any }> = [];
  private isConnecting = false;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    if (this.isConnecting) {
      return; // Already connecting
    }

    this.isConnecting = true;

    // In development, use empty string to use Vite proxy
    // In production, use full URL
    const socketUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_WS_URL || window.location.origin);
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Allow both transports
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected', this.socket?.id);
      this.isConnecting = false;
      
      // Process pending subscriptions
      const pending = [...this.pendingSubscriptions];
      this.pendingSubscriptions = [];
      
      pending.forEach(sub => {
        if (sub.type === 'strategy') {
          console.log(`Processing pending subscription to strategy: ${sub.data.strategyType}`);
          this.socket?.emit('subscribe:strategy', sub.data);
        } else if (sub.type === 'symbol') {
          console.log(`Processing pending subscription to symbol: ${sub.data.symbol} ${sub.data.timeframe || ''}`);
          this.socket?.emit('subscribe:symbol', sub.data);
        }
      });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
    });

    this.socket.on('signal:new', (signal: Signal) => {
      console.log('New signal received via WebSocket:', signal);
      this.emit('signal:new', signal);
    });

    this.socket.on('candle:update', (candle: any) => {
      this.emit('candle:update', candle);
    });

    this.socket.on('price:update', (data: { symbol: string; price: number }) => {
      this.emit('price:update', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToSymbol(symbol: string, timeframe?: string) {
    // Ensure connection
    if (!this.socket && !this.isConnecting) {
      this.connect();
    }

    if (this.socket?.connected) {
      this.socket.emit('subscribe:symbol', { symbol, timeframe });
      console.log(`Subscribed to symbol: ${symbol} ${timeframe || ''}`);
    } else {
      // Queue subscription for when connected
      const exists = this.pendingSubscriptions.some(
        sub => sub.type === 'symbol' && sub.data.symbol === symbol && sub.data.timeframe === timeframe
      );
      if (!exists) {
        this.pendingSubscriptions.push({ type: 'symbol', data: { symbol, timeframe } });
        console.log(`Queued subscription to symbol: ${symbol} ${timeframe || ''}`);
      }
      // Ensure connection is initiated
      if (!this.socket && !this.isConnecting) {
        this.connect();
      }
    }
  }

  unsubscribeFromSymbol(symbol: string, timeframe?: string) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe:symbol', { symbol, timeframe });
    }
    // Remove from pending subscriptions
    this.pendingSubscriptions = this.pendingSubscriptions.filter(
      sub => !(sub.type === 'symbol' && sub.data.symbol === symbol && sub.data.timeframe === timeframe)
    );
  }

  subscribeToStrategy(strategyType: string) {
    // Ensure connection
    if (!this.socket && !this.isConnecting) {
      this.connect();
    }

    if (this.socket?.connected) {
      console.log(`Subscribing to strategy: ${strategyType}`);
      this.socket.emit('subscribe:strategy', { strategyType });
    } else {
      // Queue subscription for when connected
      const exists = this.pendingSubscriptions.some(
        sub => sub.type === 'strategy' && sub.data.strategyType === strategyType
      );
      if (!exists) {
        this.pendingSubscriptions.push({ type: 'strategy', data: { strategyType } });
        console.log(`Queued subscription to strategy: ${strategyType}`);
      }
      // Ensure connection is initiated
      if (!this.socket && !this.isConnecting) {
        this.connect();
      }
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
