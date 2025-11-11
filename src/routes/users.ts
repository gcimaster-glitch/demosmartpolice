import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { queryAll, queryFirst } from '../lib/db';
import type { Bindings, ApiResponse } from '../types';
import { hashPassword } from '../lib/auth';

const users = new Hono<{ Bindings: Bindings }>();

// GET /api/users/client/:clientId - Get all users for a client
users.get('/client/:clientId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const clientId = parseInt(c.req.param('clientId'));

    // 権限チェック：自分のクライアントのユーザーのみ取得可能（管理者は全て可能）
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role);
    const isOwnClient = user.clientId === clientId && (user.role === 'CLIENTADMIN' || user.role === 'CLIENT');

    if (!isAdmin && !isOwnClient) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    const clientUsers = await queryAll(
      c.env.DB,
      `SELECT 
        id, name, email, role, phone, position, department, 
        is_primary_contact as isPrimaryContact, client_id as clientId,
        created_at, updated_at
       FROM users 
       WHERE client_id = ? AND deleted_at IS NULL
       ORDER BY is_primary_contact DESC, created_at ASC`,
      clientId
    );

    return c.json<ApiResponse>({ success: true, data: clientUsers });
  } catch (error) {
    console.error('Get client users error:', error);
    return c.json<ApiResponse>({ success: false, error: 'ユーザー情報の取得に失敗しました' }, 500);
  }
});

// POST /api/users/client/:clientId - Create a new user for a client
const createUserSchema = z.object({
  name: z.string().min(1, '氏名を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  isPrimaryContact: z.boolean().optional(),
  role: z.enum(['CLIENT', 'CLIENTADMIN']).optional(),
});

users.post('/client/:clientId', authMiddleware, zValidator('json', createUserSchema), async (c) => {
  try {
    const user = c.get('user');
    const clientId = parseInt(c.req.param('clientId'));
    const data = await c.req.json();

    // 権限チェック：CLIENTADMIN以上のみ可能
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role);
    const isClientAdmin = user.clientId === clientId && user.role === 'CLIENTADMIN';

    if (!isAdmin && !isClientAdmin) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    // メールアドレスの重複チェック
    const existingUser = await queryFirst(
      c.env.DB,
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      data.email
    );

    if (existingUser) {
      return c.json<ApiResponse>({ success: false, error: 'このメールアドレスは既に使用されています' }, 400);
    }

    // パスワードをハッシュ化
    const hashedPassword = await hashPassword(data.password);

    // ユーザーを作成
    const result = await c.env.DB.prepare(`
      INSERT INTO users (
        client_id, name, email, password_hash, role, phone, 
        position, department, is_primary_contact, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      clientId,
      data.name,
      data.email,
      hashedPassword,
      data.role || 'CLIENT',
      data.phone || null,
      data.position || null,
      data.department || null,
      data.isPrimaryContact ? 1 : 0
    ).run();

    const newUser = await queryFirst(
      c.env.DB,
      `SELECT 
        id, name, email, role, phone, position, department, 
        is_primary_contact as isPrimaryContact, client_id as clientId,
        created_at, updated_at
       FROM users WHERE id = ?`,
      result.meta.last_row_id
    );

    return c.json<ApiResponse>({ 
      success: true, 
      data: newUser,
      message: 'ユーザーを作成しました' 
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json<ApiResponse>({ success: false, error: 'ユーザーの作成に失敗しました' }, 500);
  }
});

// PUT /api/users/:id - Update a user
const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  isPrimaryContact: z.boolean().optional(),
  role: z.enum(['CLIENT', 'CLIENTADMIN']).optional(),
});

users.put('/:id', authMiddleware, zValidator('json', updateUserSchema), async (c) => {
  try {
    const currentUser = c.get('user');
    const userId = parseInt(c.req.param('id'));
    const data = await c.req.json();

    // 更新対象のユーザーを取得
    const targetUser = await queryFirst<any>(
      c.env.DB,
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      userId
    );

    if (!targetUser) {
      return c.json<ApiResponse>({ success: false, error: 'ユーザーが見つかりません' }, 404);
    }

    // 権限チェック
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(currentUser.role);
    const isClientAdmin = currentUser.clientId === targetUser.client_id && currentUser.role === 'CLIENTADMIN';
    const isSelf = currentUser.id === userId;

    if (!isAdmin && !isClientAdmin && !isSelf) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    // メールアドレス変更の場合は重複チェック
    if (data.email && data.email !== targetUser.email) {
      const existingUser = await queryFirst(
        c.env.DB,
        'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
        data.email,
        userId
      );

      if (existingUser) {
        return c.json<ApiResponse>({ success: false, error: 'このメールアドレスは既に使用されています' }, 400);
      }
    }

    // 更新フィールドを動的に構築
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.position !== undefined) {
      updates.push('position = ?');
      values.push(data.position);
    }
    if (data.department !== undefined) {
      updates.push('department = ?');
      values.push(data.department);
    }
    if (data.isPrimaryContact !== undefined) {
      updates.push('is_primary_contact = ?');
      values.push(data.isPrimaryContact ? 1 : 0);
    }
    if (data.role !== undefined && (isAdmin || isClientAdmin)) {
      updates.push('role = ?');
      values.push(data.role);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      await c.env.DB
        .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();
    }

    const updatedUser = await queryFirst(
      c.env.DB,
      `SELECT 
        id, name, email, role, phone, position, department, 
        is_primary_contact as isPrimaryContact, client_id as clientId,
        created_at, updated_at
       FROM users WHERE id = ?`,
      userId
    );

    return c.json<ApiResponse>({ 
      success: true, 
      data: updatedUser,
      message: 'ユーザー情報を更新しました' 
    });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json<ApiResponse>({ success: false, error: 'ユーザー情報の更新に失敗しました' }, 500);
  }
});

// DELETE /api/users/:id - Delete a user (soft delete)
users.delete('/:id', authMiddleware, async (c) => {
  try {
    const currentUser = c.get('user');
    const userId = parseInt(c.req.param('id'));

    // 削除対象のユーザーを取得
    const targetUser = await queryFirst<any>(
      c.env.DB,
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      userId
    );

    if (!targetUser) {
      return c.json<ApiResponse>({ success: false, error: 'ユーザーが見つかりません' }, 404);
    }

    // 権限チェック
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(currentUser.role);
    const isClientAdmin = currentUser.clientId === targetUser.client_id && currentUser.role === 'CLIENTADMIN';

    if (!isAdmin && !isClientAdmin) {
      return c.json<ApiResponse>({ success: false, error: 'アクセス権限がありません' }, 403);
    }

    // 主担当者の削除は不可
    if (targetUser.is_primary_contact) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '主担当者は削除できません。先に別のユーザーを主担当者に設定してください。' 
      }, 400);
    }

    // 自分自身の削除は不可
    if (currentUser.id === userId) {
      return c.json<ApiResponse>({ success: false, error: '自分自身を削除することはできません' }, 400);
    }

    // ソフトデリート
    await c.env.DB.prepare(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(userId).run();

    return c.json<ApiResponse>({ 
      success: true, 
      message: 'ユーザーを削除しました' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json<ApiResponse>({ success: false, error: 'ユーザーの削除に失敗しました' }, 500);
  }
});

export default users;
