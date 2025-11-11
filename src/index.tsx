import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Bindings } from './types';

// Import routes
import auth from './routes/auth';
import announcements from './routes/announcements';
import dashboard from './routes/dashboard';
import tickets from './routes/tickets';
import clients from './routes/clients';
import users from './routes/users';
import billing from './routes/billing';
import plans from './routes/plans';

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
app.route('/api/users', users);
app.route('/api/billing', billing);
app.route('/api/plans', plans);

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    message: 'Smart Police Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route - for now just return API info
// Frontend will be served separately by wrangler pages dev
app.get('/', (c) => {
  return c.json({
    name: 'Smart Police Portal API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      announcements: '/api/announcements',
      tickets: '/api/tickets',
      clients: '/api/clients',
      health: '/api/health'
    }
  });
});

export default app;
