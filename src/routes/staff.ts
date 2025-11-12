import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

const staff = new Hono<{ Bindings: Bindings }>();

// Validation schemas
const createStaffSchema = z.object({
  name: z.string().min(1),
  realName: z.string().min(1),
  businessName: z.string().optional().or(z.literal('')),
  displayNameType: z.enum(['real', 'business']).default('real'),
  email: z.string().email(),
  role: z.enum(['CrisisManager', 'Consultant', 'Legal', 'Admin', 'Support']),
  position: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  profile: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  realName: z.string().min(1).optional(),
  businessName: z.string().optional().or(z.literal('')),
  displayNameType: z.enum(['real', 'business']).optional(),
  email: z.string().email().optional(),
  role: z.enum(['CrisisManager', 'Consultant', 'Legal', 'Admin', 'Support']).optional(),
  position: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  profile: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
});

// GET /api/staff - Get all staff members
staff.get('/', authMiddleware, async (c) => {
  try {
    const { DB } = c.env;
    
    // Get all staff with assigned client count
    const staffList = await DB.prepare(`
      SELECT 
        s.*,
        COUNT(DISTINCT c1.id) + COUNT(DISTINCT c2.id) as assigned_clients
      FROM staff s
      LEFT JOIN clients c1 ON s.id = c1.main_assignee_id
      LEFT JOIN clients c2 ON s.id = c2.sub_assignee_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all();

    return c.json({
      success: true,
      data: staffList.results,
    });
  } catch (error: any) {
    console.error('Staff fetch error:', error);
    return c.json({
      success: false,
      error: 'スタッフ一覧の取得に失敗しました',
    }, 500);
  }
});

// GET /api/staff/:id - Get staff by ID
staff.get('/:id', authMiddleware, async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    const staffMember = await DB.prepare('SELECT * FROM staff WHERE id = ?')
      .bind(id)
      .first();

    if (!staffMember) {
      return c.json({
        success: false,
        error: 'スタッフが見つかりません',
      }, 404);
    }

    // Get assigned clients
    const assignedClients = await DB.prepare(`
      SELECT id, company_name, 
             CASE 
               WHEN main_assignee_id = ? THEN 'main'
               WHEN sub_assignee_id = ? THEN 'sub'
             END as assignment_type
      FROM clients
      WHERE main_assignee_id = ? OR sub_assignee_id = ?
    `).bind(id, id, id, id).all();

    return c.json({
      success: true,
      data: {
        staff: staffMember,
        assigned_clients: assignedClients.results,
      },
    });
  } catch (error: any) {
    console.error('Staff detail fetch error:', error);
    return c.json({
      success: false,
      error: 'スタッフ詳細の取得に失敗しました',
    }, 500);
  }
});

// POST /api/staff - Create new staff member
staff.post('/', authMiddleware, requireAdmin, zValidator('json', createStaffSchema), async (c) => {
  try {
    const { DB } = c.env;
    const data = c.req.valid('json');

    // Check if email already exists
    const existing = await DB.prepare('SELECT id FROM staff WHERE email = ?')
      .bind(data.email)
      .first();

    if (existing) {
      return c.json({
        success: false,
        error: 'このメールアドレスは既に登録されています',
      }, 400);
    }

    const result = await DB.prepare(`
      INSERT INTO staff (
        name, real_name, business_name, display_name_type, email, role, 
        position, phone, photo_url, profile, status, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      data.name,
      data.realName,
      data.businessName || null,
      data.displayNameType,
      data.email,
      data.role,
      data.position || null,
      data.phone || null,
      data.photoUrl || null,
      data.profile || null,
      data.status
    ).run();

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        message: 'スタッフを登録しました',
      },
    }, 201);
  } catch (error: any) {
    console.error('Staff creation error:', error);
    return c.json({
      success: false,
      error: 'スタッフの登録に失敗しました',
    }, 500);
  }
});

// PUT /api/staff/:id - Update staff member
staff.put('/:id', authMiddleware, requireAdmin, zValidator('json', updateStaffSchema), async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    // Check if staff exists
    const existing = await DB.prepare('SELECT id FROM staff WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({
        success: false,
        error: 'スタッフが見つかりません',
      }, 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.realName !== undefined) {
      updates.push('real_name = ?');
      values.push(data.realName);
    }
    if (data.businessName !== undefined) {
      updates.push('business_name = ?');
      values.push(data.businessName);
    }
    if (data.displayNameType !== undefined) {
      updates.push('display_name_type = ?');
      values.push(data.displayNameType);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.role !== undefined) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (data.position !== undefined) {
      updates.push('position = ?');
      values.push(data.position);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.photoUrl !== undefined) {
      updates.push('photo_url = ?');
      values.push(data.photoUrl);
    }
    if (data.profile !== undefined) {
      updates.push('profile = ?');
      values.push(data.profile);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.approvalStatus !== undefined) {
      updates.push('approval_status = ?');
      values.push(data.approvalStatus);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await DB.prepare(`
      UPDATE staff SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({
      success: true,
      message: 'スタッフ情報を更新しました',
    });
  } catch (error: any) {
    console.error('Staff update error:', error);
    return c.json({
      success: false,
      error: 'スタッフ情報の更新に失敗しました',
    }, 500);
  }
});

// PUT /api/staff/:id/approve - Approve staff member
staff.put('/:id/approve', authMiddleware, requireAdmin, async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    await DB.prepare(`
      UPDATE staff 
      SET approval_status = 'approved', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      message: 'スタッフを承認しました',
    });
  } catch (error: any) {
    console.error('Staff approval error:', error);
    return c.json({
      success: false,
      error: 'スタッフの承認に失敗しました',
    }, 500);
  }
});

// DELETE /api/staff/:id - Delete staff member
staff.delete('/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const { DB } = c.env;
    const id = parseInt(c.req.param('id'));

    // Check if staff has assigned clients
    const assignedClients = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM clients 
      WHERE main_assignee_id = ? OR sub_assignee_id = ?
    `).bind(id, id).first();

    if (assignedClients && (assignedClients as any).count > 0) {
      return c.json({
        success: false,
        error: '担当クライアントがいるスタッフは削除できません',
      }, 400);
    }

    await DB.prepare('DELETE FROM staff WHERE id = ?').bind(id).run();

    return c.json({
      success: true,
      message: 'スタッフを削除しました',
    });
  } catch (error: any) {
    console.error('Staff deletion error:', error);
    return c.json({
      success: false,
      error: 'スタッフの削除に失敗しました',
    }, 500);
  }
});

export default staff;
