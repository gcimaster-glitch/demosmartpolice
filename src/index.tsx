import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

// Import routes
import auth from './routes/auth';
import announcements from './routes/announcements';
import dashboard from './routes/dashboard';
import tickets from './routes/tickets';
import clients from './routes/clients';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// API Routes
app.route('/api/auth', auth);
app.route('/api/announcements', announcements);
app.route('/api/dashboard', dashboard);
app.route('/api/tickets', tickets);
app.route('/api/clients', clients);

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    message: 'Smart Police Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from client build
app.use('/*', serveStatic({ root: './client/dist' }));

// Fallback to index.html for client-side routing
app.get('*', serveStatic({ path: './client/dist/index.html' }));

export default app;
