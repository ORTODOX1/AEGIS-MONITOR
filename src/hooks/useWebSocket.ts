import { useEffect, useRef, useState, useCallback } from 'react';

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

interface UseWebSocketOptions {
  url: string;
  reconnectIntervalMs?: number;
  maxRetries?: number;
}

interface UseWebSocketResult<T> {
  lastMessage: T | null;
  status: ConnectionStatus;
  send: (data: unknown) => void;
}

export function useWebSocket<T = unknown>(options: UseWebSocketOptions): UseWebSocketResult<T> {
  const { url, reconnectIntervalMs = 3000, maxRetries = 10 } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const [lastMessage, setLastMessage] = useState<T | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      setStatus('open');
      retriesRef.current = 0;
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as T;
        setLastMessage(parsed);
      } catch {
        console.warn('[AEGIS-WS] Failed to parse message:', event.data);
      }
    };

    ws.onerror = () => setStatus('error');

    ws.onclose = () => {
      setStatus('closed');
      if (retriesRef.current < maxRetries) {
        retriesRef.current += 1;
        setTimeout(connect, reconnectIntervalMs);
      }
    };
  }, [url, reconnectIntervalMs, maxRetries]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { lastMessage, status, send };
}
