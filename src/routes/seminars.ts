import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, ApiResponse } from '../types';

const seminars = new Hono<{ Bindings: Bindings }>();

// GET /api/seminars - Get all seminars
seminars.get('/', async (c) => {
  try {
    const allSeminars = await queryAll(
      c.env.DB,
      `SELECT 
        id, title, description, category, date, location, capacity, status,
        main_image_url as mainImageUrl, sub_image_urls as subImageUrls,
        pdf_url as pdfUrl
       FROM seminars 
       WHERE status != '中止'
       ORDER BY date DESC`
    );

    // 各セミナーの申込数を取得
    const seminarsWithApplicants = await Promise.all(
      allSeminars.map(async (seminar: any) => {
        const applicants = await queryAll(
          c.env.DB,
          `SELECT 
            client_id as clientId, user_id as userId,
            notes, application_date as applicationDate
           FROM seminar_applications
           WHERE seminar_id = ?`,
          seminar.id
        );
        
        return {
          ...seminar,
          subImageUrls: seminar.subImageUrls ? JSON.parse(seminar.subImageUrls) : [],
          applicants: applicants || []
        };
      })
    );

    return c.json<ApiResponse>({ success: true, data: seminarsWithApplicants });
  } catch (error) {
    console.error('Get seminars error:', error);
    return c.json<ApiResponse>({ success: false, error: 'セミナー情報の取得に失敗しました' }, 500);
  }
});

// GET /api/seminars/:id - Get seminar by ID
seminars.get('/:id', async (c) => {
  try {
    const seminarId = parseInt(c.req.param('id'));

    const seminar = await queryFirst(
      c.env.DB,
      `SELECT 
        id, title, description, category, date, location, capacity, status,
        main_image_url as mainImageUrl, sub_image_urls as subImageUrls,
        pdf_url as pdfUrl
       FROM seminars 
       WHERE id = ?`,
      seminarId
    );

    if (!seminar) {
      return c.json<ApiResponse>({ success: false, error: 'セミナーが見つかりません' }, 404);
    }

    // 申込者を取得
    const applicants = await queryAll(
      c.env.DB,
      `SELECT 
        client_id as clientId, user_id as userId,
        notes, application_date as applicationDate
       FROM seminar_applications
       WHERE seminar_id = ?`,
      seminarId
    );

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        ...(seminar as any),
        subImageUrls: (seminar as any).subImageUrls ? JSON.parse((seminar as any).subImageUrls) : [],
        applicants: applicants || []
      }
    });
  } catch (error) {
    console.error('Get seminar error:', error);
    return c.json<ApiResponse>({ success: false, error: 'セミナー情報の取得に失敗しました' }, 500);
  }
});

// POST /api/seminars/apply - Apply for a seminar
const applySeminarSchema = z.object({
  seminarId: z.number(),
  notes: z.string().optional(),
  userName: z.string(),
  userEmail: z.string().email(),
});

seminars.post('/apply', authMiddleware, zValidator('json', applySeminarSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    if (!user.clientId) {
      return c.json<ApiResponse>({ success: false, error: 'クライアント情報が見つかりません' }, 400);
    }

    // セミナーの存在確認と空席確認
    const seminar = await queryFirst(
      c.env.DB,
      'SELECT * FROM seminars WHERE id = ?',
      data.seminarId
    );

    if (!seminar) {
      return c.json<ApiResponse>({ success: false, error: 'セミナーが見つかりません' }, 404);
    }

    if ((seminar as any).status !== '募集中') {
      return c.json<ApiResponse>({ success: false, error: 'このセミナーは現在募集していません' }, 400);
    }

    // 申込数を確認
    const applicantCount = await queryFirst(
      c.env.DB,
      'SELECT COUNT(*) as count FROM seminar_applications WHERE seminar_id = ?',
      data.seminarId
    );

    if ((applicantCount as any).count >= (seminar as any).capacity) {
      return c.json<ApiResponse>({ success: false, error: 'このセミナーは満員です' }, 400);
    }

    // 重複申込チェック
    const existingApplication = await queryFirst(
      c.env.DB,
      'SELECT * FROM seminar_applications WHERE seminar_id = ? AND client_id = ?',
      data.seminarId,
      user.clientId
    );

    if (existingApplication) {
      return c.json<ApiResponse>({ success: false, error: '既に申し込み済みです' }, 400);
    }

    // チケット消費（オンラインセミナーの場合）
    if ((seminar as any).location === 'オンライン') {
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
        ) VALUES (?, CURRENT_TIMESTAMP, 'セミナー参加', ?, 1, ?)
      `).bind(user.clientId, `セミナー: ${(seminar as any).title}`, data.seminarId).run();
    }

    // 申込を作成
    await c.env.DB.prepare(`
      INSERT INTO seminar_applications (
        seminar_id, client_id, user_id, notes, application_date
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      data.seminarId,
      user.clientId,
      user.id,
      data.notes || null
    ).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'セミナーに申し込みました' 
    });
  } catch (error) {
    console.error('Apply seminar error:', error);
    return c.json<ApiResponse>({ success: false, error: 'セミナー申込に失敗しました' }, 500);
  }
});

// GET /api/seminars/applications/my - Get my seminar applications
seminars.get('/applications/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    if (!user.clientId) {
      return c.json<ApiResponse>({ success: false, error: 'クライアント情報が見つかりません' }, 400);
    }

    const applications = await queryAll(
      c.env.DB,
      `SELECT 
        sa.seminar_id as seminarId, s.title as seminarTitle,
        sa.client_id as clientId, sa.user_id as userId,
        sa.notes, sa.application_date as applicationDate
       FROM seminar_applications sa
       JOIN seminars s ON sa.seminar_id = s.id
       WHERE sa.client_id = ?
       ORDER BY sa.application_date DESC`,
      user.clientId
    );

    return c.json<ApiResponse>({ success: true, data: applications });
  } catch (error) {
    console.error('Get seminar applications error:', error);
    return c.json<ApiResponse>({ success: false, error: 'セミナー申込履歴の取得に失敗しました' }, 500);
  }
});

export default seminars;
