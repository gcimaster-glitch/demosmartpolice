import { Context, Next } from 'hono';
import { verifyToken, extractToken, getUserById } from '../lib/auth';
import type { Bindings, JWTPayload, UserRole } from '../types';

// Extend Context with user information
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

// Authentication middleware - verifies JWT token
export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const token = extractToken(c.req.raw);

  if (!token) {
    return c.json({ success: false, error: 'Unauthorized - No token provided' }, 401);
  }

  const payload = await verifyToken(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ success: false, error: 'Unauthorized - Invalid token' }, 401);
  }

  // Verify user still exists and is active
  const user = await getUserById(c.env.DB, payload.userId);
  if (!user || !user.is_active) {
    return c.json({ success: false, error: 'Unauthorized - User not found or inactive' }, 401);
  }

  // Store user info in context
  c.set('user', payload);

  await next();
}

// Role-based authorization middleware
export function requireRole(...roles: UserRole[]) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ 
        success: false, 
        error: `Forbidden - Required roles: ${roles.join(', ')}` 
      }, 403);
    }

    await next();
  };
}

// Admin-only middleware
export const requireAdmin = requireRole('SUPERADMIN', 'ADMIN', 'STAFF');

// Client-only middleware
export const requireClient = requireRole('CLIENTADMIN', 'CLIENT');

// Client admin only middleware
export const requireClientAdmin = requireRole('CLIENTADMIN');

// Super admin only middleware
export const requireSuperAdmin = requireRole('SUPERADMIN');
