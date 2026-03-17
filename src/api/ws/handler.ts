import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

// Connection management
interface WSConnection {
  ws: WebSocket;
  userId?: string;
  subscribedTasks: Set<string>;
  lastHeartbeat: number;
}

const connections: Map<string, WSConnection> = new Map();
const taskSubscribers: Map<string, Set<string>> = new Map();

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 60000;

export function setupWebSocket(wss: WebSocketServer): void {
  console.log('WebSocket server initialized');

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const connectionId = generateConnectionId();
    console.log(`[WS] New connection: ${connectionId}`);

    const connection: WSConnection = {
      ws,
      subscribedTasks: new Set(),
      lastHeartbeat: Date.now(),
    };
    connections.set(connectionId, connection);

    // Parse token from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    // In production, validate token and extract userId
    if (token) {
      // TODO: Validate token and set userId
      connection.userId = `user_${connectionId.slice(0, 8)}`;
    }

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(connectionId, message);
      } catch (error) {
        console.error('[WS] Invalid message format:', error);
        sendError(ws, 'INVALID_MESSAGE', 'Invalid JSON message format');
      }
    });

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      const conn = connections.get(connectionId);
      if (conn) {
        conn.lastHeartbeat = Date.now();
      }
    });

    // Handle close
    ws.on('close', () => {
      console.log(`[WS] Connection closed: ${connectionId}`);
      cleanupConnection(connectionId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WS] Connection error: ${connectionId}`, error);
      cleanupConnection(connectionId);
    });

    // Send welcome message
    send(ws, {
      type: 'connected',
      connectionId,
      timestamp: Date.now(),
    });
  });

  // Heartbeat check
  setInterval(() => {
    connections.forEach((conn, connectionId) => {
      const now = Date.now();
      if (now - conn.lastHeartbeat > CONNECTION_TIMEOUT) {
        console.log(`[WS] Connection timeout: ${connectionId}`);
        conn.ws.terminate();
        cleanupConnection(connectionId);
      } else {
        // Send ping
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.ping();
        }
      }
    });
  }, HEARTBEAT_INTERVAL);
}

function handleMessage(connectionId: string, message: any): void {
  const connection = connections.get(connectionId);
  if (!connection) return;

  const { type, taskId, ...payload } = message;

  switch (type) {
    case 'subscribe':
      handleSubscribe(connectionId, connection, taskId);
      break;

    case 'unsubscribe':
      handleUnsubscribe(connectionId, connection, taskId);
      break;

    case 'confirm':
      handleConfirm(connectionId, taskId, payload);
      break;

    case 'ping':
      send(connection.ws, {
        type: 'pong',
        timestamp: Date.now(),
      });
      break;

    default:
      sendError(connection.ws, 'UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${type}`);
  }
}

function handleSubscribe(connectionId: string, connection: WSConnection, taskId: string): void {
  if (!taskId) {
    sendError(connection.ws, 'INVALID_REQUEST', 'taskId is required for subscription');
    return;
  }

  connection.subscribedTasks.add(taskId);

  // Add to task subscribers
  if (!taskSubscribers.has(taskId)) {
    taskSubscribers.set(taskId, new Set());
  }
  taskSubscribers.get(taskId)!.add(connectionId);

  send(connection.ws, {
    type: 'subscribed',
    taskId,
    timestamp: Date.now(),
  });

  console.log(`[WS] Connection ${connectionId} subscribed to task ${taskId}`);
}

function handleUnsubscribe(connectionId: string, connection: WSConnection, taskId: string): void {
  if (!taskId) {
    sendError(connection.ws, 'INVALID_REQUEST', 'taskId is required for unsubscription');
    return;
  }

  connection.subscribedTasks.delete(taskId);

  // Remove from task subscribers
  const subscribers = taskSubscribers.get(taskId);
  if (subscribers) {
    subscribers.delete(connectionId);
    if (subscribers.size === 0) {
      taskSubscribers.delete(taskId);
    }
  }

  send(connection.ws, {
    type: 'unsubscribed',
    taskId,
    timestamp: Date.now(),
  });
}

function handleConfirm(connectionId: string, taskId: string, payload: any): void {
  const { action } = payload;
  
  if (!taskId || !action) {
    const connection = connections.get(connectionId);
    if (connection) {
      sendError(connection.ws, 'INVALID_REQUEST', 'taskId and action are required');
    }
    return;
  }

  console.log(`[WS] Confirm request from ${connectionId}: task=${taskId}, action=${action}`);
  
  // TODO: Forward to task manager for processing
  const connection = connections.get(connectionId);
  if (connection) {
    send(connection.ws, {
      type: 'confirm_received',
      taskId,
      action,
      timestamp: Date.now(),
    });
  }
}

// Broadcast to all subscribers of a task
export function broadcastToTask(taskId: string, event: any): void {
  const subscribers = taskSubscribers.get(taskId);
  if (!subscribers) return;

  const message = {
    ...event,
    taskId,
    timestamp: Date.now(),
  };

  subscribers.forEach((connectionId) => {
    const connection = connections.get(connectionId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      send(connection.ws, message);
    }
  });
}

// Broadcast to all connected clients
export function broadcast(event: any): void {
  const message = {
    ...event,
    timestamp: Date.now(),
  };

  connections.forEach((connection) => {
    if (connection.ws.readyState === WebSocket.OPEN) {
      send(connection.ws, message);
    }
  });
}

// Send to specific user
export function sendToUser(userId: string, event: any): void {
  const message = {
    ...event,
    timestamp: Date.now(),
  };

  connections.forEach((connection, connectionId) => {
    if (connection.userId === userId && connection.ws.readyState === WebSocket.OPEN) {
      send(connection.ws, message);
    }
  });
}

// Get online users
export function getOnlineUsers(): string[] {
  const users: string[] = [];
  connections.forEach((connection) => {
    if (connection.userId) {
      users.push(connection.userId);
    }
  });
  return users;
}

function send(ws: WebSocket, message: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws: WebSocket, code: string, message: string): void {
  send(ws, {
    type: 'error',
    error: { code, message },
    timestamp: Date.now(),
  });
}

function cleanupConnection(connectionId: string): void {
  const connection = connections.get(connectionId);
  if (!connection) return;

  // Remove from all task subscriptions
  connection.subscribedTasks.forEach((taskId) => {
    const subscribers = taskSubscribers.get(taskId);
    if (subscribers) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        taskSubscribers.delete(taskId);
      }
    }
  });

  connections.delete(connectionId);
}

function generateConnectionId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
