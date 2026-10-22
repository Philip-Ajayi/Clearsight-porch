'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DoorbellEventPayload } from '../types';

export function useRingEvents(providedWsUrl?: string) {
  const [latestEvent, setLatestEvent] = useState<DoorbellEventPayload | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const getResolvedWsUrl = useCallback(() => {
    if (providedWsUrl && providedWsUrl.trim().length > 0) {
      return providedWsUrl;
    }
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    }
    return 'ws://localhost:5000/ws';
  }, [providedWsUrl]);

  const connect = useCallback(() => {
    try {
      const url = getResolvedWsUrl();
      console.log(`[WebSocket] Connecting to: ${url}`);
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'DOORBELL_EVENT') {
            setLatestEvent(parsed.data as DoorbellEventPayload);
          }
        } catch (err) {
          console.error('[WebSocket] Parse error:', err);
        }
      };

      socket.onerror = (err) => {
        console.error('[WebSocket] Error encountered:', err);
        setConnectionError('WebSocket connection error');
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Automatic reconnection backoff
        setTimeout(() => connect(), 3000);
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown socket error';
      setConnectionError(message);
    }
  }, [getResolvedWsUrl]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { latestEvent, isConnected, connectionError };
}