// Cloudflare Workers Environment Bindings
export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;
};

// User Roles
export type UserRole = 'CLIENTADMIN' | 'CLIENT' | 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'AFFILIATE';

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  clientId?: number;
  staffId?: number;
  affiliateId?: string;
  iat: number;
  exp: number;
}

// User from Database
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  client_id: number | null;
  staff_id: number | null;
  affiliate_id: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Login Request/Response
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    clientId?: number;
    staffId?: number;
    affiliateId?: string;
  };
  token: string;
}

// Register Request
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  companyName: string;
  planId: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  address2?: string;
  affiliateCode?: string;
}

// Client Permission
export type ClientPermission =
  | 'VIEW_SERVICES'
  | 'VIEW_MATERIALS'
  | 'VIEW_BILLING'
  | 'VIEW_REPORTS'
  | 'MANAGE_USERS'
  | 'EDIT_COMPANY_INFO';

// Plan
export interface Plan {
  id: string;
  name: string;
  catchphrase: string;
  description: string;
  features: string[];
  initial_fee: number;
  initial_fee_discount_rate: number;
  monthly_fee: number;
  monthly_fee_discount_rate: number;
  permissions: ClientPermission[];
  has_dedicated_manager: boolean;
  contract_period: string;
  is_public: boolean;
  initial_tickets: number;
  monthly_tickets: number;
}

// Client
export interface Client {
  id: number;
  company_name: string;
  company_name_kana: string | null;
  contact_person: string;
  email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address1: string;
  address2: string | null;
  corporate_number: string | null;
  website: string | null;
  plan_id: string;
  status: 'active' | 'suspended';
  remaining_tickets: number;
  created_at: string;
  updated_at: string;
}

// Message Ticket
export interface MessageTicket {
  id: number;
  ticket_id: string;
  client_id: number;
  subject: string;
  category: string;
  priority: '高' | '中' | '低';
  status: '受付中' | '対応中' | '完了';
  assignee_id: number | null;
  created_by_user_id: number;
  last_update: string;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
}

// Message
export interface Message {
  id: string;
  ticket_id: number;
  sender_user_id: number;
  sender_type: 'user' | 'support' | 'admin' | 'system';
  text: string;
  timestamp: string;
  read_by: number[];
  has_attachment: number;
}

// Announcement
export interface Announcement {
  id: number;
  category: 'メンテナンス' | 'サービス情報' | 'セキュリティ' | 'その他';
  priority: '緊急' | '重要' | '一般';
  title: string;
  content: string;
  status: 'published' | 'draft';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Service
export interface Service {
  id: string;
  name: string;
  category: 'emergency' | 'security' | 'training' | 'consulting';
  description: string;
  long_description: string;
  price: number;
  price_type: 'monthly' | 'one-time' | 'per-use';
  icon: string;
  color: string;
  status: 'active' | 'inactive';
  main_image_url: string | null;
  sub_image_urls: string[] | null;
}

// Seminar
export interface Seminar {
  id: number;
  title: string;
  description: string;
  category: 'セキュリティ' | 'マネジメント' | '法務' | 'その他';
  date: string;
  location: string;
  capacity: number;
  status: '募集中' | '開催済み' | '中止';
  main_image_url: string | null;
  sub_image_urls: string[] | null;
  pdf_url: string | null;
  applicant_count?: number;
}

// Event
export interface Event {
  id: number;
  title: string;
  description: string;
  category: '交流会' | '勉強会' | 'その他';
  date: string;
  location: string;
  capacity: number;
  status: '募集中' | '開催済み' | '中止';
  main_image_url: string | null;
  applicant_count?: number;
}

// Staff
export interface Staff {
  id: number;
  user_id: number;
  real_name: string;
  business_name: string;
  display_name_type: 'real' | 'business';
  email: string;
  role: 'CrisisManager' | 'Consultant' | 'Legal' | 'Accounting' | 'Admin';
  position: string;
  phone: string;
  photo_url: string | null;
  profile: string | null;
  status: 'active' | 'inactive';
  approval_status: 'approved' | 'pending';
  assigned_clients: number;
  joined_date: string;
}
