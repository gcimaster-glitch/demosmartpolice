import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, ApiResponse, MessageTicket, Client, Announcement } from '../types';

const dashboard = new Hono<{ Bindings: Bindings }>();

// GET /api/dashboard - Get dashboard data for clients
dashboard.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (!user.clientId) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'クライアント情報が見つかりません' 
      }, 400);
    }

    // クライアント情報と担当者情報を取得
    const client = await queryFirst<any>(
      c.env.DB,
      `SELECT 
        c.*,
        s1.id as main_assignee_staff_id,
        s1.name as main_assignee_name,
        s1.real_name as main_assignee_real_name,
        s1.position as main_assignee_position,
        s1.phone as main_assignee_phone,
        s1.email as main_assignee_email,
        s1.photo_url as main_assignee_photo_url,
        s1.profile as main_assignee_profile,
        s2.id as sub_assignee_staff_id,
        s2.name as sub_assignee_name,
        s2.real_name as sub_assignee_real_name
      FROM clients c
      LEFT JOIN staff s1 ON c.main_assignee_id = s1.id
      LEFT JOIN staff s2 ON c.sub_assignee_id = s2.id
      WHERE c.id = ?`,
      user.clientId
    );

    if (!client) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'クライアント情報が見つかりません' 
      }, 404);
    }

    // プラン情報取得
    const plan = await queryFirst(
      c.env.DB,
      'SELECT * FROM plans WHERE id = ?',
      client.plan_id
    );

    // 未読メッセージチケット数取得
    const unreadTicketsResult = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count 
        FROM message_tickets 
        WHERE client_id = ? AND status != '完了'
      `)
      .bind(user.clientId)
      .first<{ count: number }>();

    // 最近のチケット取得
    const recentTickets = await queryAll<MessageTicket>(
      c.env.DB,
      `SELECT * FROM message_tickets 
       WHERE client_id = ? 
       ORDER BY last_update DESC 
       LIMIT 5`,
      user.clientId
    );

    // 最新のお知らせ取得
    const recentAnnouncements = await queryAll<Announcement>(
      c.env.DB,
      `SELECT * FROM announcements 
       WHERE status = 'published' 
       ORDER BY published_at DESC 
       LIMIT 5`
    );

    // 今月のチケット消費数
    const ticketConsumptionResult = await c.env.DB
      .prepare(`
        SELECT SUM(ticket_cost) as total
        FROM ticket_consumption_logs
        WHERE client_id = ? 
        AND date >= date('now', 'start of month')
      `)
      .bind(user.clientId)
      .first<{ total: number }>();

    // 担当者情報を整形
    const mainAssignee = client.main_assignee_staff_id ? {
      id: client.main_assignee_staff_id,
      name: client.main_assignee_name,
      realName: client.main_assignee_real_name,
      position: client.main_assignee_position,
      phone: client.main_assignee_phone,
      email: client.main_assignee_email,
      photoUrl: client.main_assignee_photo_url,
      profile: client.main_assignee_profile,
    } : null;

    const subAssignee = client.sub_assignee_staff_id ? {
      id: client.sub_assignee_staff_id,
      name: client.sub_assignee_name,
      realName: client.sub_assignee_real_name,
    } : null;

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        client: {
          id: client.id,
          companyName: client.company_name,
          status: client.status,
          remainingTickets: client.remaining_tickets,
          planId: client.plan_id,
          planName: plan?.name || '',
          mainAssigneeId: client.main_assignee_id,
          subAssigneeId: client.sub_assignee_id,
        },
        plan: {
          id: plan?.id,
          name: plan?.name,
          hasDedicatedManager: plan?.name !== 'Free', // Freeプラン以外は専属担当者あり
        },
        mainAssignee,
        subAssignee,
        stats: {
          unreadTickets: unreadTicketsResult?.count || 0,
          monthlyTicketUsage: ticketConsumptionResult?.total || 0,
          remainingTickets: client.remaining_tickets,
        },
        recentTickets,
        recentAnnouncements,
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'ダッシュボード情報の取得に失敗しました' 
    }, 500);
  }
});

// GET /api/dashboard/admin - Get dashboard data for admins
dashboard.get('/admin', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    // 権限チェック
    if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Forbidden' 
      }, 403);
    }

    // 総クライアント数
    const totalClientsResult = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM clients WHERE status = ?')
      .bind('active')
      .first<{ count: number }>();

    // アクティブチケット数
    const activeTicketsResult = await c.env.DB
      .prepare(`SELECT COUNT(*) as count FROM message_tickets WHERE status != '完了'`)
      .first<{ count: number }>();

    // 今月の新規クライアント数
    const newClientsResult = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count 
        FROM clients 
        WHERE registration_date >= date('now', 'start of month')
      `)
      .first<{ count: number }>();

    // 最近のチケット
    const recentTickets = await queryAll<MessageTicket>(
      c.env.DB,
      `SELECT mt.*, c.company_name 
       FROM message_tickets mt
       LEFT JOIN clients c ON mt.client_id = c.id
       ORDER BY mt.last_update DESC 
       LIMIT 10`
    );

    // クライアント一覧（最近登録順）
    const recentClients = await queryAll<Client>(
      c.env.DB,
      `SELECT * FROM clients 
       ORDER BY registration_date DESC 
       LIMIT 10`
    );

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        stats: {
          totalClients: totalClientsResult?.count || 0,
          activeTickets: activeTicketsResult?.count || 0,
          newClientsThisMonth: newClientsResult?.count || 0,
        },
        recentTickets,
        recentClients,
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'ダッシュボード情報の取得に失敗しました' 
    }, 500);
  }
});

export default dashboard;
