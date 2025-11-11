import { Hono } from 'hono';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, ApiResponse } from '../types';

const billing = new Hono<{ Bindings: Bindings }>();

// GET /api/billing/client/:clientId - Get invoices for a client
billing.get('/client/:clientId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const clientId = parseInt(c.req.param('clientId'));

    // 権限チェック：自分のクライアントの請求情報のみ取得可能（管理者は全て可能）
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role);
    const isOwnClient = user.clientId === clientId;

    if (!isAdmin && !isOwnClient) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    // 請求書を取得
    const invoices = await queryAll(
      c.env.DB,
      `SELECT 
        id, client_id as clientId, client_name as clientName,
        issue_date as issueDate, due_date as dueDate,
        amount, status, created_at, updated_at
       FROM invoices 
       WHERE client_id = ?
       ORDER BY issue_date DESC`,
      clientId
    );

    // 各請求書の明細を取得
    const invoicesWithItems = await Promise.all(
      invoices.map(async (invoice: any) => {
        const items = await queryAll(
          c.env.DB,
          `SELECT description, quantity, unit_price as unitPrice, amount
           FROM invoice_items
           WHERE invoice_id = ?
           ORDER BY id`,
          invoice.id
        );
        return { ...invoice, items };
      })
    );

    return c.json<ApiResponse>({ success: true, data: invoicesWithItems });
  } catch (error) {
    console.error('Get invoices error:', error);
    return c.json<ApiResponse>({ success: false, error: '請求情報の取得に失敗しました' }, 500);
  }
});

// GET /api/billing/:id - Get invoice by ID
billing.get('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const invoiceId = c.req.param('id');

    const invoice = await queryFirst(
      c.env.DB,
      `SELECT 
        id, client_id as clientId, client_name as clientName,
        issue_date as issueDate, due_date as dueDate,
        amount, status, created_at, updated_at
       FROM invoices 
       WHERE id = ?`,
      invoiceId
    );

    if (!invoice) {
      return c.json<ApiResponse>({ success: false, error: '請求書が見つかりません' }, 404);
    }

    // 権限チェック
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role);
    const isOwnClient = user.clientId === (invoice as any).clientId;

    if (!isAdmin && !isOwnClient) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    // 明細を取得
    const items = await queryAll(
      c.env.DB,
      `SELECT description, quantity, unit_price as unitPrice, amount
       FROM invoice_items
       WHERE invoice_id = ?
       ORDER BY id`,
      invoiceId
    );

    return c.json<ApiResponse>({ 
      success: true, 
      data: { ...invoice, items } 
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return c.json<ApiResponse>({ success: false, error: '請求書の取得に失敗しました' }, 500);
  }
});

// GET /api/billing - Get all invoices (admin only)
billing.get('/', authMiddleware, requireAdmin, async (c) => {
  try {
    const invoices = await queryAll(
      c.env.DB,
      `SELECT 
        id, client_id as clientId, client_name as clientName,
        issue_date as issueDate, due_date as dueDate,
        amount, status, created_at, updated_at
       FROM invoices 
       ORDER BY issue_date DESC`
    );

    return c.json<ApiResponse>({ success: true, data: invoices });
  } catch (error) {
    console.error('Get all invoices error:', error);
    return c.json<ApiResponse>({ success: false, error: '請求情報の取得に失敗しました' }, 500);
  }
});

export default billing;
