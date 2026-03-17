/**
 * Manus-Style API Server Entry Point
 * 
 * This is the main entry file for starting the API server.
 * It initializes Express, WebSocket, and all required routes.
 * 
 * Usage:
 *   npm run start:api    # Start production server
 *   npm run dev:api      # Start development server with hot reload
 * 
 * Environment Variables:
 *   PORT        - Server port (default: 3001)
 *   NODE_ENV    - Environment (development/production)
 *   CORS_ORIGIN - Allowed CORS origins
 */

import { startServer } from './api/server';

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
