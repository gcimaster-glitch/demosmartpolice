import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { queryFirst, queryAll } from '../lib/db';
import type { Bindings, ApiResponse } from '../types';

const staffTickets = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware
staffTickets.use('/*', authMiddleware);

// Middleware to check if user is staff
const requireStaff = async (c: any, next: any) => {
  const user = c.get('user');
  
  if (user.role !== 'STAFF') {
    return c.json<ApiResponse>({ 
      success: false, 
      error: '担当者権限が必要です' 
    }, 403);
  }
  
  await next();
};

staffTickets.use('/*', requireStaff);

// GET /api/staff/tickets - 担当者の全相談一覧
staffTickets.get('/', async (c) => {
  try {
    const user = c.get('user');
    const staffId = user.staffId;

    if (!staffId) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'スタッフIDが見つかりません' 
      }, 400);
    }

    // 担当者が主担当または副担当になっているクライアントの相談を取得
    const tickets = await queryAll(c.env.DB, `
      SELECT 
        t.*,
        c.company_name,
        c.contact_person as contact_name,
        c.main_assignee_id,
        c.sub_assignee_id,
        s1.real_name as main_assignee_name,
        s2.real_name as sub_assignee_name,
        CASE 
          WHEN c.main_assignee_id = ? THEN 'main'
          WHEN c.sub_assignee_id = ? THEN 'sub'
          ELSE 'none'
        END as assignment_type,
        (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) as message_count,
        (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id AND is_from_client = 1 AND is_read = 0) as unread_count
      FROM tickets t
      INNER JOIN clients c ON t.client_id = c.id
      LEFT JOIN staff s1 ON c.main_assignee_id = s1.id
      LEFT JOIN staff s2 ON c.sub_assignee_id = s2.id
      WHERE c.main_assignee_id = ? OR c.sub_assignee_id = ?
      ORDER BY t.created_at DESC
    `, staffId, staffId, staffId, staffId);

    return c.json<ApiResponse>({ 
      success: true, 
      data: { tickets } 
    });
  } catch (error) {
    console.error('Get staff tickets error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '相談一覧の取得に失敗しました' 
    }, 500);
  }
});

// GET /api/staff/tickets/:id - 特定の相談詳細取得
staffTickets.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const staffId = user.staffId;
    const ticketId = c.req.param('id');

    if (!staffId) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'スタッフIDが見つかりません' 
      }, 400);
    }

    // 相談情報を取得
    const ticket = await queryFirst(c.env.DB, `
      SELECT 
        t.*,
        c.company_name,
        c.contact_person as contact_name,
        c.main_assignee_id,
        c.sub_assignee_id
      FROM tickets t
      INNER JOIN clients c ON t.client_id = c.id
      WHERE t.id = ? AND (c.main_assignee_id = ? OR c.sub_assignee_id = ?)
    `, ticketId, staffId, staffId);

    if (!ticket) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '相談が見つからないか、アクセス権限がありません' 
      }, 404);
    }

    // メッセージ履歴を取得
    const messages = await queryAll(c.env.DB, `
      SELECT 
        tm.*,
        u.name as sender_name,
        s.real_name as staff_name
      FROM ticket_messages tm
      LEFT JOIN users u ON tm.user_id = u.id
      LEFT JOIN staff s ON tm.staff_id = s.id
      WHERE tm.ticket_id = ?
      ORDER BY tm.created_at ASC
    `, ticketId);

    return c.json<ApiResponse>({ 
      success: true, 
      data: { 
        ticket,
        messages 
      } 
    });
  } catch (error) {
    console.error('Get staff ticket detail error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '相談詳細の取得に失敗しました' 
    }, 500);
  }
});

// POST /api/staff/tickets/:id/reply - 相談に返信
staffTickets.post('/:id/reply', async (c) => {
  try {
    const user = c.get('user');
    const staffId = user.staffId;
    const ticketId = c.req.param('id');
    const { message } = await c.req.json();

    if (!staffId) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'スタッフIDが見つかりません' 
      }, 400);
    }

    if (!message || message.trim() === '') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'メッセージを入力してください' 
      }, 400);
    }

    // 担当者がこの相談にアクセス権限があるか確認
    const ticket = await queryFirst(c.env.DB, `
      SELECT t.*, c.main_assignee_id, c.sub_assignee_id
      FROM tickets t
      INNER JOIN clients c ON t.client_id = c.id
      WHERE t.id = ? AND (c.main_assignee_id = ? OR c.sub_assignee_id = ?)
    `, ticketId, staffId, staffId);

    if (!ticket) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '相談が見つからないか、アクセス権限がありません' 
      }, 404);
    }

    // メッセージを挿入
    const result = await c.env.DB.prepare(`
      INSERT INTO ticket_messages (ticket_id, staff_id, message, is_from_client)
      VALUES (?, ?, ?, 0)
    `).bind(ticketId, staffId, message.trim()).run();

    // 相談ステータスを「対応中」に更新（まだ「新規」の場合）
    if (ticket.status === 'open') {
      await c.env.DB.prepare(`
        UPDATE tickets SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(ticketId).run();
    }

    return c.json<ApiResponse>({ 
      success: true, 
      data: { 
        messageId: result.meta.last_row_id,
        message: '返信を送信しました' 
      } 
    });
  } catch (error) {
    console.error('Staff reply error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '返信の送信に失敗しました' 
    }, 500);
  }
});

// PUT /api/staff/tickets/:id/status - 相談ステータス更新
staffTickets.put('/:id/status', async (c) => {
  try {
    const user = c.get('user');
    const staffId = user.staffId;
    const ticketId = c.req.param('id');
    const { status } = await c.req.json();

    if (!staffId) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'スタッフIDが見つかりません' 
      }, 400);
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '無効なステータスです' 
      }, 400);
    }

    // 担当者がこの相談にアクセス権限があるか確認
    const ticket = await queryFirst(c.env.DB, `
      SELECT t.*, c.main_assignee_id, c.sub_assignee_id
      FROM tickets t
      INNER JOIN clients c ON t.client_id = c.id
      WHERE t.id = ? AND (c.main_assignee_id = ? OR c.sub_assignee_id = ?)
    `, ticketId, staffId, staffId);

    if (!ticket) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '相談が見つからないか、アクセス権限がありません' 
      }, 404);
    }

    // ステータス更新
    await c.env.DB.prepare(`
      UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, ticketId).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'ステータスを更新しました' 
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'ステータスの更新に失敗しました' 
    }, 500);
  }
});

// GET /api/staff/dashboard - 担当者ダッシュボード統計
staffTickets.get('/dashboard/stats', async (c) => {
  try {
    const user = c.get('user');
    const staffId = user.staffId;

    if (!staffId) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'スタッフIDが見つかりません' 
      }, 400);
    }

    // 担当クライアント数
    const clientsResult = await queryFirst(c.env.DB, `
      SELECT COUNT(DISTINCT id) as count
      FROM clients
      WHERE main_assignee_id = ? OR sub_assignee_id = ?
    `, staffId, staffId);

    // 新規相談数
    const newTicketsResult = await queryFirst(c.env.DB, `
      SELECT COUNT(t.id) as count
      FROM tickets t
      INNER JOIN clients c ON t.client_id = c.id
      WHERE (c.main_assignee_id = ? OR c.sub_assignee_id = ?)
        AND t.status = 'open'
    `, staffId, staffId);

    // 対応中の相談数
    const inProgressTicketsResult = await queryFirst(c.env.DB, `
      SELECT COUNT(t.id) as count
      FROM tickets t
      INNER JOIN clients c ON t.client_id = c.id
      WHERE (c.main_assignee_id = ? OR c.sub_assignee_id = ?)
        AND t.status = 'in_progress'
    `, staffId, staffId);

    // 今月の解決数
    const resolvedThisMonthResult = await queryFirst(c.env.DB, `
      SELECT COUNT(t.id) as count
      FROM tickets t
      INNER JOIN clients c ON t.client_id = c.id
      WHERE (c.main_assignee_id = ? OR c.sub_assignee_id = ?)
        AND t.status = 'resolved'
        AND strftime('%Y-%m', t.updated_at) = strftime('%Y-%m', 'now')
    `, staffId, staffId);

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        totalClients: clientsResult?.count || 0,
        newTickets: newTicketsResult?.count || 0,
        inProgressTickets: inProgressTicketsResult?.count || 0,
        resolvedThisMonth: resolvedThisMonthResult?.count || 0,
      }
    });
  } catch (error) {
    console.error('Get staff dashboard stats error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '統計情報の取得に失敗しました' 
    }, 500);
  }
});

export default staffTickets;
