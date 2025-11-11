import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, ApiResponse, Client } from '../types';

const clients = new Hono<{ Bindings: Bindings }>();

// GET /api/clients - Get all clients (admin only)
clients.get('/', authMiddleware, requireAdmin, async (c) => {
  try {
    const results = await queryAll<Client>(
      c.env.DB,
      'SELECT * FROM clients ORDER BY registration_date DESC'
    );

    return c.json<ApiResponse<Client[]>>({ success: true, data: results });
  } catch (error) {
    console.error('Get clients error:', error);
    return c.json<ApiResponse>({ success: false, error: 'クライアント情報の取得に失敗しました' }, 500);
  }
});

// GET /api/clients/:id - Get client by ID
clients.get('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const clientId = parseInt(c.req.param('id'));

    // 権限チェック：自分のクライアント情報のみ取得可能（管理者は全て可能）
    if ((user.role === 'CLIENT' || user.role === 'CLIENTADMIN') && user.clientId !== clientId) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    const client = await queryFirst<Client>(
      c.env.DB,
      'SELECT * FROM clients WHERE id = ?',
      clientId
    );

    if (!client) {
      return c.json<ApiResponse>({ success: false, error: 'クライアントが見つかりません' }, 404);
    }

    // プラン情報も取得
    const plan = await queryFirst(
      c.env.DB,
      'SELECT * FROM plans WHERE id = ?',
      client.plan_id
    );

    return c.json<ApiResponse>({ 
      success: true, 
      data: { client, plan } 
    });
  } catch (error) {
    console.error('Get client error:', error);
    return c.json<ApiResponse>({ success: false, error: 'クライアント情報の取得に失敗しました' }, 500);
  }
});

// PUT /api/clients/:id - Update client information
const updateClientSchema = z.object({
  companyName: z.string().optional(),
  companyNameKana: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  postalCode: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  website: z.string().optional(),
  establishmentDate: z.string().optional(),
  capital: z.string().optional(),
  businessDescription: z.string().optional(),
  employeeCount: z.string().optional(),
  notes: z.string().optional(),
});

clients.put('/:id', authMiddleware, zValidator('json', updateClientSchema), async (c) => {
  try {
    const user = c.get('user');
    const clientId = parseInt(c.req.param('id'));
    const data = await c.req.json();

    // 権限チェック
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role);
    const isOwnClient = user.clientId === clientId && user.role === 'CLIENTADMIN';

    if (!isAdmin && !isOwnClient) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    const client = await queryFirst<Client>(
      c.env.DB,
      'SELECT * FROM clients WHERE id = ?',
      clientId
    );

    if (!client) {
      return c.json<ApiResponse>({ success: false, error: 'クライアントが見つかりません' }, 404);
    }

    // 更新フィールドを動的に構築
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        // camelCaseをsnake_caseに変換
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updates.push(`${snakeKey} = ?`);
        values.push(value);
      }
    });

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(clientId);

      await c.env.DB
        .prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();
    }

    const updatedClient = await queryFirst<Client>(
      c.env.DB,
      'SELECT * FROM clients WHERE id = ?',
      clientId
    );

    return c.json<ApiResponse<Client>>({ 
      success: true, 
      data: updatedClient!,
      message: 'クライアント情報を更新しました' 
    });
  } catch (error) {
    console.error('Update client error:', error);
    return c.json<ApiResponse>({ success: false, error: 'クライアント情報の更新に失敗しました' }, 500);
  }
});

// PUT /api/clients/:id/status - Update client status (admin only)
const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

clients.put('/:id/status', authMiddleware, requireAdmin, zValidator('json', updateStatusSchema), async (c) => {
  try {
    const clientId = c.req.param('id');
    const data = await c.req.json();

    await c.env.DB
      .prepare('UPDATE clients SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(data.status, clientId)
      .run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'ステータスを更新しました' 
    });
  } catch (error) {
    console.error('Update status error:', error);
    return c.json<ApiResponse>({ success: false, error: 'ステータスの更新に失敗しました' }, 500);
  }
});

// GET /api/clients/:id/tickets - Get all tickets for a client (admin only)
clients.get('/:id/tickets', authMiddleware, requireAdmin, async (c) => {
  try {
    const clientId = c.req.param('id');

    const tickets = await queryAll(
      c.env.DB,
      'SELECT * FROM message_tickets WHERE client_id = ? ORDER BY last_update DESC',
      clientId
    );

    return c.json<ApiResponse>({ success: true, data: tickets });
  } catch (error) {
    console.error('Get client tickets error:', error);
    return c.json<ApiResponse>({ success: false, error: 'チケット情報の取得に失敗しました' }, 500);
  }
});

// GET /api/clients/:id/consumption - Get ticket consumption log (admin only)
clients.get('/:id/consumption', authMiddleware, requireAdmin, async (c) => {
  try {
    const clientId = c.req.param('id');

    const logs = await queryAll(
      c.env.DB,
      'SELECT * FROM ticket_consumption_logs WHERE client_id = ? ORDER BY date DESC',
      clientId
    );

    return c.json<ApiResponse>({ success: true, data: logs });
  } catch (error) {
    console.error('Get consumption logs error:', error);
    return c.json<ApiResponse>({ success: false, error: 'チケット消費履歴の取得に失敗しました' }, 500);
  }
});

export default clients;
