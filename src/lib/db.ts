import type { D1Database } from '@cloudflare/workers-types';

// Helper function to parse JSON fields from database
export function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

// Helper function to execute a query and return first result
export async function queryFirst<T>(
  db: D1Database,
  query: string,
  ...params: any[]
): Promise<T | null> {
  const result = await db.prepare(query).bind(...params).first<T>();
  return result;
}

// Helper function to execute a query and return all results
export async function queryAll<T>(
  db: D1Database,
  query: string,
  ...params: any[]
): Promise<T[]> {
  const result = await db.prepare(query).bind(...params).all<T>();
  return result.results || [];
}

// Helper function to execute an insert/update/delete and return result
export async function execute(
  db: D1Database,
  query: string,
  ...params: any[]
): Promise<D1Result> {
  const result = await db.prepare(query).bind(...params).run();
  return result;
}

// Generate unique ticket ID (e.g., T-1234)
export function generateTicketId(id: number): string {
  return `T-${id.toString().padStart(4, '0')}`;
}

// Generate unique message ID
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate unique service application ID
export function generateApplicationId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate unique invoice ID (e.g., INV-2024-001)
export function generateInvoiceId(year: number, sequence: number): string {
  return `INV-${year}-${sequence.toString().padStart(3, '0')}`;
}

// Format date to ISO string
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

// Check if user has permission based on role
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}
