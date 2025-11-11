import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { JWTPayload, User, Bindings } from '../types';

// Generate JWT token
export async function generateToken(user: User, secret: string): Promise<string> {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clientId: user.client_id || undefined,
    staffId: user.staff_id || undefined,
    affiliateId: user.affiliate_id || undefined,
  };

  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(new TextEncoder().encode(secret));

  return token;
}

// Verify JWT token
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Get user from database by email
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
    .bind(email)
    .first<User>();

  return result;
}

// Get user from database by ID
export async function getUserById(db: D1Database, userId: number): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
    .bind(userId)
    .first<User>();

  return result;
}

// Update last login timestamp
export async function updateLastLogin(db: D1Database, userId: number): Promise<void> {
  await db
    .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(userId)
    .run();
}

// Extract token from Authorization header or Cookie
export function extractToken(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try Cookie
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    const match = cookie.match(/token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Create secure cookie header
export function createCookieHeader(token: string, maxAge: number = 7 * 24 * 60 * 60): string {
  return `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

// Create cookie deletion header
export function deleteCookieHeader(): string {
  return 'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}
