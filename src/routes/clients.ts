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

// PUT /api/clients/:id/plan - Update client plan (admin only)
const updatePlanSchema = z.object({
  planId: z.string(),
  reason: z.string().optional(),
});

clients.put('/:id/plan', authMiddleware, requireAdmin, zValidator('json', updatePlanSchema), async (c) => {
  try {
    const user = c.get('user');
    const clientId = parseInt(c.req.param('id'));
    const { planId, reason } = await c.req.json();

    // クライアントが存在するか確認
    const client = await queryFirst<Client>(
      c.env.DB,
      'SELECT * FROM clients WHERE id = ?',
      clientId
    );

    if (!client) {
      return c.json<ApiResponse>({ success: false, error: 'クライアントが見つかりません' }, 404);
    }

    // 新しいプランが存在するか確認
    const newPlan = await queryFirst(
      c.env.DB,
      'SELECT * FROM plans WHERE id = ?',
      planId
    );

    if (!newPlan) {
      return c.json<ApiResponse>({ success: false, error: '指定されたプランが見つかりません' }, 404);
    }

    // 旧プラン情報を取得
    const oldPlan = await queryFirst(
      c.env.DB,
      'SELECT * FROM plans WHERE id = ?',
      client.plan_id
    );

    // プランを更新
    await c.env.DB
      .prepare('UPDATE clients SET plan_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(planId, clientId)
      .run();

    // プラン変更履歴を記録
    const changeLogId = `plch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await c.env.DB
      .prepare(`
        INSERT INTO plan_change_history (
          id, client_id, old_plan_id, new_plan_id, 
          changed_by_user_id, change_reason, change_date
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
      .bind(
        changeLogId,
        clientId,
        client.plan_id,
        planId,
        user.id,
        reason || null
      )
      .run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: `プランを「${(oldPlan as any)?.name || '不明'}」から「${(newPlan as any)?.name || '不明'}」に変更しました`,
      data: {
        oldPlan: oldPlan,
        newPlan: newPlan,
        changeLogId: changeLogId
      }
    });
  } catch (error) {
    console.error('Update plan error:', error);
    return c.json<ApiResponse>({ success: false, error: 'プランの更新に失敗しました' }, 500);
  }
});

// GET /api/clients/:id/plan-history - Get plan change history (admin only)
clients.get('/:id/plan-history', authMiddleware, requireAdmin, async (c) => {
  try {
    const clientId = c.req.param('id');

    const history = await queryAll(
      c.env.DB,
      `SELECT 
        pch.*,
        op.name as old_plan_name,
        np.name as new_plan_name,
        u.name as changed_by_name
       FROM plan_change_history pch
       LEFT JOIN plans op ON pch.old_plan_id = op.id
       LEFT JOIN plans np ON pch.new_plan_id = np.id
       LEFT JOIN users u ON pch.changed_by_user_id = u.id
       WHERE pch.client_id = ?
       ORDER BY pch.change_date DESC`,
      clientId
    );

    return c.json<ApiResponse>({ success: true, data: history });
  } catch (error) {
    console.error('Get plan history error:', error);
    return c.json<ApiResponse>({ success: false, error: 'プラン変更履歴の取得に失敗しました' }, 500);
  }
});

// PUT /api/clients/:id/assign-staff - Assign staff to client (admin only)
const assignStaffSchema = z.object({
  mainAssigneeId: z.number().nullable().optional(),
  subAssigneeId: z.number().nullable().optional(),
});

clients.put('/:id/assign-staff', authMiddleware, requireAdmin, zValidator('json', assignStaffSchema), async (c) => {
  try {
    const clientId = parseInt(c.req.param('id'));
    const { mainAssigneeId, subAssigneeId } = await c.req.json();

    // Check if client exists
    const client = await queryFirst<Client>(
      c.env.DB,
      'SELECT * FROM clients WHERE id = ?',
      clientId
    );

    if (!client) {
      return c.json<ApiResponse>({ success: false, error: 'クライアントが見つかりません' }, 404);
    }

    // Verify staff members exist if provided
    if (mainAssigneeId) {
      const mainStaff = await queryFirst(
        c.env.DB,
        'SELECT id FROM staff WHERE id = ?',
        mainAssigneeId
      );
      if (!mainStaff) {
        return c.json<ApiResponse>({ success: false, error: '指定されたメイン担当者が見つかりません' }, 404);
      }
    }

    if (subAssigneeId) {
      const subStaff = await queryFirst(
        c.env.DB,
        'SELECT id FROM staff WHERE id = ?',
        subAssigneeId
      );
      if (!subStaff) {
        return c.json<ApiResponse>({ success: false, error: '指定されたサブ担当者が見つかりません' }, 404);
      }
    }

    // Update assignments
    const updates: string[] = [];
    const values: any[] = [];

    if (mainAssigneeId !== undefined) {
      updates.push('main_assignee_id = ?');
      values.push(mainAssigneeId);
    }

    if (subAssigneeId !== undefined) {
      updates.push('sub_assignee_id = ?');
      values.push(subAssigneeId);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(clientId);

      await c.env.DB
        .prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();
    }

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'スタッフの割り当てを更新しました' 
    });
  } catch (error) {
    console.error('Assign staff error:', error);
    return c.json<ApiResponse>({ success: false, error: 'スタッフの割り当てに失敗しました' }, 500);
  }
});

export default clients;
