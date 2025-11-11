import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, ApiResponse } from '../types';

const services = new Hono<{ Bindings: Bindings }>();

// GET /api/services - Get all services
services.get('/', async (c) => {
  try {
    const allServices = await queryAll(
      c.env.DB,
      `SELECT 
        id, name, category, description, long_description as longDescription,
        price, price_type as priceType, icon, color, status
       FROM services 
       WHERE status = 'active'
       ORDER BY name ASC`
    );

    return c.json<ApiResponse>({ success: true, data: allServices });
  } catch (error) {
    console.error('Get services error:', error);
    return c.json<ApiResponse>({ success: false, error: 'サービス情報の取得に失敗しました' }, 500);
  }
});

// GET /api/services/:id - Get service by ID
services.get('/:id', async (c) => {
  try {
    const serviceId = c.req.param('id');

    const service = await queryFirst(
      c.env.DB,
      `SELECT 
        id, name, category, description, long_description as longDescription,
        price, price_type as priceType, icon, color, status
       FROM services 
       WHERE id = ?`,
      serviceId
    );

    if (!service) {
      return c.json<ApiResponse>({ success: false, error: 'サービスが見つかりません' }, 404);
    }

    return c.json<ApiResponse>({ success: true, data: service });
  } catch (error) {
    console.error('Get service error:', error);
    return c.json<ApiResponse>({ success: false, error: 'サービス情報の取得に失敗しました' }, 500);
  }
});

// POST /api/services/apply - Apply for a service
const applyServiceSchema = z.object({
  serviceId: z.string(),
  notes: z.string().optional(),
  userName: z.string(),
  userEmail: z.string().email(),
});

services.post('/apply', authMiddleware, zValidator('json', applyServiceSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    if (!user.clientId) {
      return c.json<ApiResponse>({ success: false, error: 'クライアント情報が見つかりません' }, 400);
    }

    // サービスの存在確認
    const service = await queryFirst(
      c.env.DB,
      'SELECT * FROM services WHERE id = ? AND status = ?',
      data.serviceId,
      'active'
    );

    if (!service) {
      return c.json<ApiResponse>({ success: false, error: 'サービスが見つかりません' }, 404);
    }

    // 申込IDを生成
    const applicationId = `sapp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 申込を作成
    await c.env.DB.prepare(`
      INSERT INTO service_applications (
        id, service_id, client_id, user_id, notes, status, application_date
      ) VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).bind(
      applicationId,
      data.serviceId,
      user.clientId,
      user.id,
      data.notes || null
    ).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'サービスを申し込みました。担当者からの連絡をお待ちください。',
      data: { applicationId }
    });
  } catch (error) {
    console.error('Apply service error:', error);
    return c.json<ApiResponse>({ success: false, error: 'サービス申込に失敗しました' }, 500);
  }
});

// GET /api/services/applications/my - Get my service applications
services.get('/applications/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    if (!user.clientId) {
      return c.json<ApiResponse>({ success: false, error: 'クライアント情報が見つかりません' }, 400);
    }

    const applications = await queryAll(
      c.env.DB,
      `SELECT 
        sa.id, sa.service_id as serviceId, s.name as serviceName,
        sa.client_id as clientId, sa.user_id as userId,
        sa.notes, sa.status, sa.application_date as applicationDate
       FROM service_applications sa
       JOIN services s ON sa.service_id = s.id
       WHERE sa.client_id = ?
       ORDER BY sa.application_date DESC`,
      user.clientId
    );

    return c.json<ApiResponse>({ success: true, data: applications });
  } catch (error) {
    console.error('Get service applications error:', error);
    return c.json<ApiResponse>({ success: false, error: 'サービス申込履歴の取得に失敗しました' }, 500);
  }
});

// GET /api/services/applications - Get all service applications (admin only)
services.get('/applications', authMiddleware, requireAdmin, async (c) => {
  try {
    const applications = await queryAll(
      c.env.DB,
      `SELECT 
        sa.id, sa.service_id as serviceId, s.name as serviceName,
        sa.client_id as clientId, c.company_name as clientName,
        sa.user_id as userId, u.name as userName,
        sa.notes, sa.status, sa.application_date as applicationDate,
        sa.processed_date as processedDate
       FROM service_applications sa
       JOIN services s ON sa.service_id = s.id
       JOIN clients c ON sa.client_id = c.id
       JOIN users u ON sa.user_id = u.id
       ORDER BY sa.application_date DESC`
    );

    return c.json<ApiResponse>({ success: true, data: applications });
  } catch (error) {
    console.error('Get all service applications error:', error);
    return c.json<ApiResponse>({ success: false, error: 'サービス申込履歴の取得に失敗しました' }, 500);
  }
});

export default services;
