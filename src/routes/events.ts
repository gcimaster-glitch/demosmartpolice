import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, ApiResponse } from '../types';

const events = new Hono<{ Bindings: Bindings }>();

// GET /api/events - Get all events
events.get('/', async (c) => {
  try {
    const allEvents = await queryAll(
      c.env.DB,
      `SELECT 
        id, title, description, category, date, location, capacity, status,
        main_image_url as mainImageUrl, created_at as createdAt
       FROM events 
       WHERE status != '中止'
       ORDER BY date DESC`
    );

    // 各イベントの申込数を取得
    const eventsWithApplicants = await Promise.all(
      allEvents.map(async (event: any) => {
        const applicants = await queryAll(
          c.env.DB,
          `SELECT 
            client_id as clientId, user_id as userId,
            notes, application_date as applicationDate
           FROM event_applications
           WHERE event_id = ?`,
          event.id
        );
        
        return {
          ...event,
          applicants: applicants || []
        };
      })
    );

    return c.json<ApiResponse>({ success: true, data: eventsWithApplicants });
  } catch (error) {
    console.error('Get events error:', error);
    return c.json<ApiResponse>({ success: false, error: 'イベント情報の取得に失敗しました' }, 500);
  }
});

// GET /api/events/:id - Get event by ID
events.get('/:id', async (c) => {
  try {
    const eventId = parseInt(c.req.param('id'));

    const event = await queryFirst(
      c.env.DB,
      `SELECT 
        id, title, description, category, date, location, capacity, status,
        main_image_url as mainImageUrl, created_at as createdAt
       FROM events 
       WHERE id = ?`,
      eventId
    );

    if (!event) {
      return c.json<ApiResponse>({ success: false, error: 'イベントが見つかりません' }, 404);
    }

    // 申込者を取得
    const applicants = await queryAll(
      c.env.DB,
      `SELECT 
        client_id as clientId, user_id as userId,
        notes, application_date as applicationDate
       FROM event_applications
       WHERE event_id = ?`,
      eventId
    );

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        ...event,
        applicants: applicants || []
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    return c.json<ApiResponse>({ success: false, error: 'イベント情報の取得に失敗しました' }, 500);
  }
});

// POST /api/events/apply - Apply for an event
const applyEventSchema = z.object({
  eventId: z.number(),
  notes: z.string().optional(),
  userName: z.string(),
  userEmail: z.string().email(),
});

events.post('/apply', authMiddleware, zValidator('json', applyEventSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    if (!user.clientId) {
      return c.json<ApiResponse>({ success: false, error: 'クライアント情報が見つかりません' }, 400);
    }

    // イベントの存在確認と空席確認
    const event = await queryFirst(
      c.env.DB,
      'SELECT * FROM events WHERE id = ?',
      data.eventId
    );

    if (!event) {
      return c.json<ApiResponse>({ success: false, error: 'イベントが見つかりません' }, 404);
    }

    if ((event as any).status !== '募集中') {
      return c.json<ApiResponse>({ success: false, error: 'このイベントは現在募集していません' }, 400);
    }

    // 申込数を確認
    const applicantCount = await queryFirst(
      c.env.DB,
      'SELECT COUNT(*) as count FROM event_applications WHERE event_id = ?',
      data.eventId
    );

    if ((applicantCount as any).count >= (event as any).capacity) {
      return c.json<ApiResponse>({ success: false, error: 'このイベントは満員です' }, 400);
    }

    // 重複申込チェック
    const existingApplication = await queryFirst(
      c.env.DB,
      'SELECT * FROM event_applications WHERE event_id = ? AND client_id = ?',
      data.eventId,
      user.clientId
    );

    if (existingApplication) {
      return c.json<ApiResponse>({ success: false, error: '既に申し込み済みです' }, 400);
    }

    // チケット消費（オンラインイベントの場合）
    if ((event as any).location === 'オンライン') {
      const client = await queryFirst(
        c.env.DB,
        'SELECT remaining_tickets FROM clients WHERE id = ?',
        user.clientId
      );

      if ((client as any).remaining_tickets < 1) {
        return c.json<ApiResponse>({ success: false, error: 'チケットが不足しています' }, 400);
      }

      // チケットを消費
      await c.env.DB.prepare(
        'UPDATE clients SET remaining_tickets = remaining_tickets - 1 WHERE id = ?'
      ).bind(user.clientId).run();

      // チケット消費ログを記録
      await c.env.DB.prepare(`
        INSERT INTO ticket_consumption_logs (
          client_id, date, type, description, ticket_cost, related_id
        ) VALUES (?, CURRENT_TIMESTAMP, 'オンラインイベント参加', ?, 1, ?)
      `).bind(user.clientId, `イベント: ${(event as any).title}`, data.eventId).run();
    }

    // 申込を作成
    await c.env.DB.prepare(`
      INSERT INTO event_applications (
        event_id, client_id, user_id, notes, application_date
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      data.eventId,
      user.clientId,
      user.id,
      data.notes || null
    ).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'イベントに申し込みました' 
    });
  } catch (error) {
    console.error('Apply event error:', error);
    return c.json<ApiResponse>({ success: false, error: 'イベント申込に失敗しました' }, 500);
  }
});

// GET /api/events/applications/my - Get my event applications
events.get('/applications/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    if (!user.clientId) {
      return c.json<ApiResponse>({ success: false, error: 'クライアント情報が見つかりません' }, 400);
    }

    const applications = await queryAll(
      c.env.DB,
      `SELECT 
        ea.event_id as eventId, e.title as eventTitle,
        ea.client_id as clientId, ea.user_id as userId,
        ea.notes, ea.application_date as applicationDate
       FROM event_applications ea
       JOIN events e ON ea.event_id = e.id
       WHERE ea.client_id = ?
       ORDER BY ea.application_date DESC`,
      user.clientId
    );

    return c.json<ApiResponse>({ success: true, data: applications });
  } catch (error) {
    console.error('Get event applications error:', error);
    return c.json<ApiResponse>({ success: false, error: 'イベント申込履歴の取得に失敗しました' }, 500);
  }
});

export default events;
