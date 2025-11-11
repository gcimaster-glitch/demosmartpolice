import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { queryAll, queryFirst, generateTicketId, generateMessageId } from '../lib/db';
import type { Bindings, ApiResponse, MessageTicket, Message } from '../types';

const tickets = new Hono<{ Bindings: Bindings }>();

// GET /api/tickets - Get all tickets for current user
tickets.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    let query = 'SELECT * FROM message_tickets';
    let params: any[] = [];

    // クライアントユーザーは自分のチケットのみ取得
    if (user.role === 'CLIENT' || user.role === 'CLIENTADMIN') {
      if (!user.clientId) {
        return c.json<ApiResponse>({ success: false, error: 'クライアント情報が見つかりません' }, 400);
      }
      query += ' WHERE client_id = ?';
      params.push(user.clientId);
    }

    query += ' ORDER BY last_update DESC';

    const results = await queryAll<MessageTicket>(c.env.DB, query, ...params);

    return c.json<ApiResponse<MessageTicket[]>>({ success: true, data: results });
  } catch (error) {
    console.error('Get tickets error:', error);
    return c.json<ApiResponse>({ success: false, error: 'チケットの取得に失敗しました' }, 500);
  }
});

// GET /api/tickets/:id - Get ticket details
tickets.get('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const ticketId = c.req.param('id');

    const ticket = await queryFirst<MessageTicket>(
      c.env.DB,
      'SELECT * FROM message_tickets WHERE id = ?',
      ticketId
    );

    if (!ticket) {
      return c.json<ApiResponse>({ success: false, error: 'チケットが見つかりません' }, 404);
    }

    // 権限チェック
    if (user.role === 'CLIENT' || user.role === 'CLIENTADMIN') {
      if (ticket.client_id !== user.clientId) {
        return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
      }
    }

    // メッセージ取得
    const messages = await queryAll<Message>(
      c.env.DB,
      'SELECT * FROM messages WHERE ticket_id = ? ORDER BY timestamp ASC',
      ticketId
    );

    // メッセージのread_byをパース
    const parsedMessages = messages.map(msg => ({
      ...msg,
      read_by: JSON.parse(msg.read_by as any || '[]') as number[],
    }));

    return c.json<ApiResponse>({ 
      success: true, 
      data: { 
        ticket, 
        messages: parsedMessages 
      } 
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    return c.json<ApiResponse>({ success: false, error: 'チケット情報の取得に失敗しました' }, 500);
  }
});

// POST /api/tickets - Create new ticket
const createTicketSchema = z.object({
  subject: z.string().min(1, '件名を入力してください'),
  category: z.string().min(1, 'カテゴリを選択してください'),
  priority: z.enum(['高', '中', '低']).default('中'),
  message: z.string().min(1, 'メッセージを入力してください'),
});

tickets.post('/', authMiddleware, zValidator('json', createTicketSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    if (!user.clientId) {
      return c.json<ApiResponse>({ success: false, error: 'クライアント情報が見つかりません' }, 400);
    }

    // チケット作成
    const ticketResult = await c.env.DB
      .prepare(`
        INSERT INTO message_tickets (
          ticket_id, client_id, subject, category, priority, 
          status, created_by_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        '', // 仮のticket_id（後で更新）
        user.clientId,
        data.subject,
        data.category,
        data.priority,
        '受付中',
        user.userId
      )
      .run();

    const newTicketId = ticketResult.meta.last_row_id as number;
    const ticketIdString = generateTicketId(newTicketId);

    // ticket_idを更新
    await c.env.DB
      .prepare('UPDATE message_tickets SET ticket_id = ? WHERE id = ?')
      .bind(ticketIdString, newTicketId)
      .run();

    // 最初のメッセージを追加
    const messageId = generateMessageId();
    await c.env.DB
      .prepare(`
        INSERT INTO messages (id, ticket_id, sender_user_id, sender_type, text)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(messageId, newTicketId, user.userId, 'user', data.message)
      .run();

    // チケット消費ログ記録
    await c.env.DB
      .prepare(`
        INSERT INTO ticket_consumption_logs (
          id, client_id, date, type, description, ticket_cost, related_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        `tcl-${Date.now()}`,
        user.clientId,
        new Date().toISOString().split('T')[0],
        '新規相談',
        data.subject,
        1,
        ticketIdString
      )
      .run();

    // 残チケット数を減らす
    await c.env.DB
      .prepare('UPDATE clients SET remaining_tickets = remaining_tickets - 1 WHERE id = ?')
      .bind(user.clientId)
      .run();

    const newTicket = await queryFirst<MessageTicket>(
      c.env.DB,
      'SELECT * FROM message_tickets WHERE id = ?',
      newTicketId
    );

    return c.json<ApiResponse<MessageTicket>>({ 
      success: true, 
      data: newTicket!,
      message: 'チケットを作成しました' 
    }, 201);
  } catch (error) {
    console.error('Create ticket error:', error);
    return c.json<ApiResponse>({ success: false, error: 'チケットの作成に失敗しました' }, 500);
  }
});

// POST /api/tickets/:id/messages - Add message to ticket
const addMessageSchema = z.object({
  text: z.string().min(1, 'メッセージを入力してください'),
});

tickets.post('/:id/messages', authMiddleware, zValidator('json', addMessageSchema), async (c) => {
  try {
    const user = c.get('user');
    const ticketId = c.req.param('id');
    const data = await c.req.json();

    const ticket = await queryFirst<MessageTicket>(
      c.env.DB,
      'SELECT * FROM message_tickets WHERE id = ?',
      ticketId
    );

    if (!ticket) {
      return c.json<ApiResponse>({ success: false, error: 'チケットが見つかりません' }, 404);
    }

    // 権限チェック
    if (user.role === 'CLIENT' || user.role === 'CLIENTADMIN') {
      if (ticket.client_id !== user.clientId) {
        return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
      }
    }

    // 送信者タイプを判定
    let senderType: 'user' | 'support' | 'admin' | 'system' = 'user';
    if (['SUPERADMIN', 'ADMIN'].includes(user.role)) {
      senderType = 'admin';
    } else if (user.role === 'STAFF') {
      senderType = 'support';
    }

    // メッセージ追加
    const messageId = generateMessageId();
    await c.env.DB
      .prepare(`
        INSERT INTO messages (id, ticket_id, sender_user_id, sender_type, text)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(messageId, ticketId, user.userId, senderType, data.text)
      .run();

    // チケットの最終更新日時を更新
    await c.env.DB
      .prepare('UPDATE message_tickets SET last_update = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(ticketId)
      .run();

    const newMessage = await queryFirst<Message>(
      c.env.DB,
      'SELECT * FROM messages WHERE id = ?',
      messageId
    );

    return c.json<ApiResponse<Message>>({ 
      success: true, 
      data: newMessage!,
      message: 'メッセージを送信しました' 
    }, 201);
  } catch (error) {
    console.error('Add message error:', error);
    return c.json<ApiResponse>({ success: false, error: 'メッセージの送信に失敗しました' }, 500);
  }
});

// PUT /api/tickets/:id/status - Update ticket status (admin only)
const updateStatusSchema = z.object({
  status: z.enum(['受付中', '対応中', '完了']),
});

tickets.put('/:id/status', authMiddleware, requireAdmin, zValidator('json', updateStatusSchema), async (c) => {
  try {
    const ticketId = c.req.param('id');
    const data = await c.req.json();

    await c.env.DB
      .prepare('UPDATE message_tickets SET status = ?, last_update = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(data.status, ticketId)
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

// PUT /api/tickets/:id/assign - Assign ticket to staff (admin only)
const assignTicketSchema = z.object({
  assigneeId: z.number().nullable(),
});

tickets.put('/:id/assign', authMiddleware, requireAdmin, zValidator('json', assignTicketSchema), async (c) => {
  try {
    const ticketId = c.req.param('id');
    const data = await c.req.json();

    await c.env.DB
      .prepare('UPDATE message_tickets SET assignee_id = ?, last_update = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(data.assigneeId, ticketId)
      .run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: '担当者を割り当てました' 
    });
  } catch (error) {
    console.error('Assign ticket error:', error);
    return c.json<ApiResponse>({ success: false, error: '担当者の割り当てに失敗しました' }, 500);
  }
});

export default tickets;
