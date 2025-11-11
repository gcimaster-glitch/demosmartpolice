import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  generateToken,
  hashPassword,
  verifyPassword,
  getUserByEmail,
  updateLastLogin,
  createCookieHeader,
  deleteCookieHeader,
  extractToken,
  verifyToken,
} from '../lib/auth';
import { execute } from '../lib/db';
import type { Bindings, LoginRequest, RegisterRequest, ApiResponse, LoginResponse } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
});

// Register validation schema
const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  name: z.string().min(1, '名前を入力してください'),
  companyName: z.string().min(1, '会社名を入力してください'),
  planId: z.string().min(1, 'プランを選択してください'),
  phone: z.string().min(1, '電話番号を入力してください'),
  postalCode: z.string().min(1, '郵便番号を入力してください'),
  prefecture: z.string().min(1, '都道府県を入力してください'),
  city: z.string().min(1, '市区町村を入力してください'),
  address1: z.string().min(1, '住所を入力してください'),
  address2: z.string().optional(),
  affiliateCode: z.string().optional(),
});

// POST /api/auth/login - ログイン
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = await c.req.json<LoginRequest>();

    // ユーザーを検索
    const user = await getUserByEmail(c.env.DB, email);

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'メールアドレスまたはパスワードが正しくありません' 
      }, 401);
    }

    // パスワード検証
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'メールアドレスまたはパスワードが正しくありません' 
      }, 401);
    }

    // JWTトークン生成
    const token = await generateToken(user, c.env.JWT_SECRET);

    // 最終ログイン時刻を更新
    await updateLastLogin(c.env.DB, user.id);

    // レスポンスデータ
    const response: LoginResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.client_id || undefined,
        staffId: user.staff_id || undefined,
        affiliateId: user.affiliate_id || undefined,
      },
      token,
    };

    // クッキーにトークンを設定
    return c.json<ApiResponse<LoginResponse>>({ 
      success: true, 
      data: response,
      message: 'ログインに成功しました'
    }, 200, {
      'Set-Cookie': createCookieHeader(token),
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'ログイン処理中にエラーが発生しました' 
    }, 500);
  }
});

// POST /api/auth/register - 新規登録
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const data = await c.req.json<RegisterRequest>();

    // メールアドレスの重複チェック
    const existingUser = await getUserByEmail(c.env.DB, data.email);
    if (existingUser) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'このメールアドレスは既に登録されています' 
      }, 400);
    }

    // プランの存在確認
    const plan = await c.env.DB
      .prepare('SELECT * FROM plans WHERE id = ?')
      .bind(data.planId)
      .first();

    if (!plan) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '選択されたプランが見つかりません' 
      }, 400);
    }

    // アフィリエイトコードの確認
    let affiliateId: string | null = null;
    if (data.affiliateCode) {
      const affiliate = await c.env.DB
        .prepare('SELECT id FROM affiliates WHERE referral_code = ? AND status = ?')
        .bind(data.affiliateCode, 'active')
        .first<{ id: string }>();

      if (affiliate) {
        affiliateId = affiliate.id;
      }
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(data.password);

    // トランザクション開始 (D1はトランザクション非対応なので順次実行)
    
    // 1. クライアント企業登録
    const clientResult = await c.env.DB
      .prepare(`
        INSERT INTO clients (
          company_name, contact_person, email, phone,
          postal_code, prefecture, city, address1, address2,
          plan_id, status, remaining_tickets, affiliate_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.companyName,
        data.name,
        data.email,
        data.phone,
        data.postalCode,
        data.prefecture,
        data.city,
        data.address1,
        data.address2 || null,
        data.planId,
        'active',
        (plan as any).initial_tickets || 0,
        affiliateId
      )
      .run();

    const clientId = clientResult.meta.last_row_id;

    // 2. ユーザー登録
    const userResult = await c.env.DB
      .prepare(`
        INSERT INTO users (email, password_hash, name, role, client_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.email,
        passwordHash,
        data.name,
        'CLIENTADMIN',
        clientId,
        1
      )
      .run();

    const userId = userResult.meta.last_row_id;

    // 3. クライアントユーザー登録
    await c.env.DB
      .prepare(`
        INSERT INTO client_users (client_id, user_id, name, email, position, phone, is_primary_contact, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        clientId,
        userId,
        data.name,
        data.email,
        '代表者',
        data.phone,
        1,
        'CLIENTADMIN'
      )
      .run();

    // 4. アフィリエイト紹介記録
    if (affiliateId) {
      const affiliate = await c.env.DB
        .prepare('SELECT default_commission_rate, default_commission_period FROM affiliates WHERE id = ?')
        .bind(affiliateId)
        .first<{ default_commission_rate: number; default_commission_period: string }>();

      if (affiliate) {
        await c.env.DB
          .prepare(`
            INSERT INTO referrals (affiliate_id, client_id, referral_type, status, commission_rate, commission_period)
            VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(
            affiliateId,
            clientId,
            'code',
            'pending',
            affiliate.default_commission_rate,
            affiliate.default_commission_period
          )
          .run();
      }
    }

    // 5. 監査ログ記録
    await c.env.DB
      .prepare(`
        INSERT INTO audit_logs (user_id, action, details, client_id)
        VALUES (?, ?, ?, ?)
      `)
      .bind(
        userId,
        'USER_REGISTERED',
        `New client registered: ${data.companyName}`,
        clientId
      )
      .run();

    // ユーザー情報を取得
    const user = await c.env.DB
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      throw new Error('Failed to retrieve created user');
    }

    // JWTトークン生成
    const token = await generateToken(user as any, c.env.JWT_SECRET);

    // レスポンスデータ
    const response: LoginResponse = {
      user: {
        id: user.id as number,
        name: user.name as string,
        email: user.email as string,
        role: user.role as any,
        clientId: clientId as number,
      },
      token,
    };

    return c.json<ApiResponse<LoginResponse>>({ 
      success: true, 
      data: response,
      message: '登録が完了しました。ログインしています...'
    }, 201, {
      'Set-Cookie': createCookieHeader(token),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: '登録処理中にエラーが発生しました' 
    }, 500);
  }
});

// POST /api/auth/logout - ログアウト
auth.post('/logout', async (c) => {
  return c.json<ApiResponse>({ 
    success: true, 
    message: 'ログアウトしました' 
  }, 200, {
    'Set-Cookie': deleteCookieHeader(),
  });
});

// GET /api/auth/me - 現在のユーザー情報取得
auth.get('/me', async (c) => {
  try {
    const token = extractToken(c.req.raw);

    if (!token) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Unauthorized' 
      }, 401);
    }

    const payload = await verifyToken(token, c.env.JWT_SECRET);

    if (!payload) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Invalid token' 
      }, 401);
    }

    // ユーザー情報を取得
    const user = await c.env.DB
      .prepare('SELECT id, name, email, role, client_id, staff_id, affiliate_id FROM users WHERE id = ? AND is_active = 1')
      .bind(payload.userId)
      .first();

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: user.client_id,
          staffId: user.staff_id,
          affiliateId: user.affiliate_id,
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to get user information' 
    }, 500);
  }
});

export default auth;
