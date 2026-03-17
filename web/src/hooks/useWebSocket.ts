import { useEffect, useRef, useState, useCallback } from 'react';

type MessageHandler = (data: any) => void;

// TaskUpdate interface for future WebSocket updates
// interface TaskUpdate {
//   type: 'task_update';
//   taskId: string;
//   status: 'pending' | 'running' | 'completed' | 'failed';
//   progress: number;
//   think?: string;
//   result?: any;
// }

export function useWebSocket(taskId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const handlersRef = useRef<Map<string, MessageHandler>>(new Map());

  const connect = useCallback(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onopen = () => {
      setConnected(true);
      if (taskId) {
        ws.send(JSON.stringify({ type: 'subscribe', taskId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);

        // 如果是任务更新，调用对应的 handler
        if (data.type === 'task_update' && data.taskId) {
          const handler = handlersRef.current.get(data.taskId);
          if (handler) {
            handler(data);
          }
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    wsRef.current = ws;
  }, [taskId]);

  const subscribe = useCallback((id: string, handler: MessageHandler) => {
    handlersRef.current.set(id, handler);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', taskId: id }));
    }
  }, []);

  const unsubscribe = useCallback((id: string) => {
    handlersRef.current.delete(id);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', taskId: id }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, lastMessage, subscribe, unsubscribe };
}
