import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, Announcement, ApiResponse } from '../types';

const announcements = new Hono<{ Bindings: Bindings }>();

// GET /api/announcements - Get all published announcements (for clients)
announcements.get('/', authMiddleware, async (c) => {
  try {
    const results = await queryAll<Announcement>(
      c.env.DB,
      `SELECT * FROM announcements 
       WHERE status = 'published' 
       ORDER BY priority DESC, published_at DESC`
    );

    return c.json<ApiResponse<Announcement[]>>({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'お知らせの取得に失敗しました' 
    }, 500);
  }
});

// GET /api/announcements/admin - Get all announcements (for admin)
announcements.get('/admin', authMiddleware, requireAdmin, async (c) => {
  try {
    const results = await queryAll<Announcement>(
      c.env.DB,
      `SELECT * FROM announcements ORDER BY created_at DESC`
    );

    return c.json<ApiResponse<Announcement[]>>({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    console.error('Get admin announcements error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'お知らせの取得に失敗しました' 
    }, 500);
  }
});

// GET /api/announcements/:id - Get announcement by ID
announcements.get('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await queryFirst<Announcement>(
      c.env.DB,
      'SELECT * FROM announcements WHERE id = ?',
      id
    );

    if (!result) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'お知らせが見つかりません' 
      }, 404);
    }

    return c.json<ApiResponse<Announcement>>({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'お知らせの取得に失敗しました' 
    }, 500);
  }
});

// POST /api/announcements - Create new announcement (admin only)
const createAnnouncementSchema = z.object({
  category: z.enum(['メンテナンス', 'サービス情報', 'セキュリティ', 'その他']),
  priority: z.enum(['緊急', '重要', '一般']),
  title: z.string().min(1),
  content: z.string().min(1),
  status: z.enum(['published', 'draft']).default('draft'),
});

announcements.post('/', authMiddleware, requireAdmin, zValidator('json', createAnnouncementSchema), async (c) => {
  try {
    const data = await c.req.json();
    
    const result = await c.env.DB
      .prepare(`
        INSERT INTO announcements (category, priority, title, content, status, published_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.category,
        data.priority,
        data.title,
        data.content,
        data.status,
        data.status === 'published' ? new Date().toISOString() : null
      )
      .run();

    const newAnnouncement = await queryFirst<Announcement>(
      c.env.DB,
      'SELECT * FROM announcements WHERE id = ?',
      result.meta.last_row_id
    );

    return c.json<ApiResponse<Announcement>>({ 
      success: true, 
      data: newAnnouncement!,
      message: 'お知らせを作成しました' 
    }, 201);
  } catch (error) {
    console.error('Create announcement error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'お知らせの作成に失敗しました' 
    }, 500);
  }
});

// PUT /api/announcements/:id - Update announcement (admin only)
announcements.put('/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await queryFirst<Announcement>(
      c.env.DB,
      'SELECT * FROM announcements WHERE id = ?',
      id
    );

    if (!existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'お知らせが見つかりません' 
      }, 404);
    }

    await c.env.DB
      .prepare(`
        UPDATE announcements 
        SET category = ?, priority = ?, title = ?, content = ?, status = ?, 
            published_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        data.category,
        data.priority,
        data.title,
        data.content,
        data.status,
        data.status === 'published' && !existing.published_at ? new Date().toISOString() : existing.published_at,
        id
      )
      .run();

    const updated = await queryFirst<Announcement>(
      c.env.DB,
      'SELECT * FROM announcements WHERE id = ?',
      id
    );

    return c.json<ApiResponse<Announcement>>({ 
      success: true, 
      data: updated!,
      message: 'お知らせを更新しました' 
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'お知らせの更新に失敗しました' 
    }, 500);
  }
});

// DELETE /api/announcements/:id - Delete announcement (admin only)
announcements.delete('/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    
    const existing = await queryFirst<Announcement>(
      c.env.DB,
      'SELECT * FROM announcements WHERE id = ?',
      id
    );

    if (!existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'お知らせが見つかりません' 
      }, 404);
    }

    await c.env.DB
      .prepare('DELETE FROM announcements WHERE id = ?')
      .bind(id)
      .run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'お知らせを削除しました' 
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'お知らせの削除に失敗しました' 
    }, 500);
  }
});

export default announcements;
