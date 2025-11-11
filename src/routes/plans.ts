import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, ApiResponse } from '../types';

const plans = new Hono<{ Bindings: Bindings }>();

// GET /api/plans - Get all public plans
plans.get('/', async (c) => {
  try {
    const allPlans = await queryAll(
      c.env.DB,
      `SELECT 
        id, name, catchphrase, monthly_fee as monthlyFee, 
        monthly_tickets as monthlyTickets, features, is_public as isPublic
       FROM plans 
       WHERE is_public = 1
       ORDER BY monthly_fee ASC`
    );

    // featuresをJSONパース
    const parsedPlans = allPlans.map((plan: any) => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      isPublic: Boolean(plan.isPublic)
    }));

    return c.json<ApiResponse>({ success: true, data: parsedPlans });
  } catch (error) {
    console.error('Get plans error:', error);
    return c.json<ApiResponse>({ success: false, error: 'プラン情報の取得に失敗しました' }, 500);
  }
});

// GET /api/plans/:id - Get plan by ID
plans.get('/:id', async (c) => {
  try {
    const planId = c.req.param('id');

    const plan = await queryFirst(
      c.env.DB,
      `SELECT 
        id, name, catchphrase, monthly_fee as monthlyFee, 
        monthly_tickets as monthlyTickets, features, is_public as isPublic
       FROM plans 
       WHERE id = ?`,
      planId
    );

    if (!plan) {
      return c.json<ApiResponse>({ success: false, error: 'プランが見つかりません' }, 404);
    }

    // featuresをJSONパース
    const parsedPlan = {
      ...plan,
      features: typeof (plan as any).features === 'string' ? JSON.parse((plan as any).features) : (plan as any).features,
      isPublic: Boolean((plan as any).isPublic)
    };

    return c.json<ApiResponse>({ success: true, data: parsedPlan });
  } catch (error) {
    console.error('Get plan error:', error);
    return c.json<ApiResponse>({ success: false, error: 'プラン情報の取得に失敗しました' }, 500);
  }
});

// POST /api/plans/change - Change client plan
const changePlanSchema = z.object({
  clientId: z.number(),
  newPlanId: z.string(),
});

plans.post('/change', authMiddleware, zValidator('json', changePlanSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    // 権限チェック：自分のクライアントのプラン変更のみ可能（管理者は全て可能）
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role);
    const isOwnClient = user.clientId === data.clientId && user.role === 'CLIENTADMIN';

    if (!isAdmin && !isOwnClient) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    // クライアントの存在確認
    const client = await queryFirst(
      c.env.DB,
      'SELECT * FROM clients WHERE id = ?',
      data.clientId
    );

    if (!client) {
      return c.json<ApiResponse>({ success: false, error: 'クライアントが見つかりません' }, 404);
    }

    // 新しいプランの存在確認
    const newPlan = await queryFirst(
      c.env.DB,
      'SELECT * FROM plans WHERE id = ? AND is_public = 1',
      data.newPlanId
    );

    if (!newPlan) {
      return c.json<ApiResponse>({ success: false, error: 'プランが見つかりません' }, 404);
    }

    // プラン変更を実行
    await c.env.DB.prepare(
      'UPDATE clients SET plan_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(data.newPlanId, data.clientId).run();

    // プラン変更履歴を記録（オプション：plan_change_historyテーブルがある場合）
    // await c.env.DB.prepare(
    //   'INSERT INTO plan_change_history (client_id, old_plan_id, new_plan_id, changed_by, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
    // ).bind(data.clientId, (client as any).plan_id, data.newPlanId, user.id).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'プランを変更しました。次回請求から新しい料金が適用されます。' 
    });
  } catch (error) {
    console.error('Change plan error:', error);
    return c.json<ApiResponse>({ success: false, error: 'プラン変更に失敗しました' }, 500);
  }
});

export default plans;
