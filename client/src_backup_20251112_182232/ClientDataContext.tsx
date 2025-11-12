import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import type { MessageTicket, Announcement, Seminar, Service, Invoice, ServiceApplication, ApplicationStatus, Client, Staff, AuditLog, User, Role, Permission, UserRole, Plan, ClientPermission, Event, Material, SeminarApplication, EventApplication, ClientUser, Address, BankAccount, Affiliate, Referral, Payout, TicketConsumptionLog, TicketConsumptionType } from './types.ts';
import { useAuth } from './AuthContext.tsx';
import { sendApplicationStatusEmail, sendNewApplicationEmail } from './services/notificationService.ts';

// --- INITIAL MOCK DATA ---
const FREE_PLAN_ID = 'plan_free';

const emptyAddress: Address = { postalCode: '', prefecture: '', city: '', address1: '', address2: '' };
const emptyBankAccount: BankAccount = { bankName: '', branchName: '', accountType: '普通', accountNumber: '', accountHolderName: '' };

const initialPlans: Plan[] = [
    {
        id: FREE_PLAN_ID,
        name: 'フリー',
        catchphrase: 'まずは無料でお試し',
        description: '基本的な機能をお試しいただけるプランです。',
        features: ['お知らせの閲覧', 'セミナーへの申込', '運営へのお問い合わせ'],
        initialFee: 0,
        initialFeeDiscountRate: 0,
        monthlyFee: 0,
        monthlyFeeDiscountRate: 0,
        permissions: [],
        hasDedicatedManager: false,
        contractPeriod: '月契約',
        isPublic: true,
        initialTickets: 1,
        monthlyTickets: 0,
    },
    {
        id: 'plan_standard',
        name: 'スタンダード',
        catchphrase: '基本的な備えを固める',
        description: '中小企業向けの基本的な危機管理とセキュリティ対策を網羅したプランです。',
        features: ['オンライン相談（月5回まで）', '月次セキュリティレポート', '資料室へのアクセス'],
        initialFee: 50000,
        initialFeeDiscountRate: 0,
        monthlyFee: 55000,
        monthlyFeeDiscountRate: 0,
        permissions: ['VIEW_SERVICES', 'VIEW_MATERIALS', 'VIEW_BILLING'],
        hasDedicatedManager: false,
        contractPeriod: '年契約',
        isPublic: true,
        initialTickets: 5,
        monthlyTickets: 5,
    },
     {
        id: 'plan_premium',
        name: 'プレミアム',
        catchphrase: '総合的なサポートで安心を',
        description: '専属の危機管理官が貴社を徹底的にサポート。緊急時の対応も万全です。',
        features: ['スタンダードプランの全機能', '専属危機管理官の割当', 'オンライン相談 無制限', '緊急出動サービス（年1回）'],
        initialFee: 100000,
        initialFeeDiscountRate: 0.5,
        monthlyFee: 330000,
        monthlyFeeDiscountRate: 0,
        permissions: ['VIEW_SERVICES', 'VIEW_MATERIALS', 'VIEW_BILLING', 'VIEW_REPORTS', 'MANAGE_USERS', 'EDIT_COMPANY_INFO'],
        hasDedicatedManager: true,
        contractPeriod: '年契約',
        isPublic: true,
        initialTickets: 10,
        monthlyTickets: 10,
    },
    {
        id: 'plan_enterprise',
        name: 'エンタープライズ',
        catchphrase: '貴社専用に完全カスタマイズ',
        description: '大企業や特殊なリスクを抱える企業様向けに、サービス内容を柔軟にカスタマイズします。',
        features: ['プレミアムプランの全機能', '経営層向けコンサルティング', '法的サポート体制の構築', '従業員向け大規模研修'],
        initialFee: 0, // Custom
        initialFeeDiscountRate: 0,
        monthlyFee: 0, // Custom
        monthlyFeeDiscountRate: 0,
        permissions: ['VIEW_SERVICES', 'VIEW_MATERIALS', 'VIEW_BILLING', 'VIEW_REPORTS', 'MANAGE_USERS', 'EDIT_COMPANY_INFO'],
        hasDedicatedManager: true,
        contractPeriod: '年契約',
        isPublic: false,
        initialTickets: 99,
        monthlyTickets: 99,
    }
];

const initialStaff: Staff[] = [
    { 
        id: 1, name: '高橋 公義', realName: '高橋 公義', businessName: 'T.K.コンサルティング', displayNameType: 'real', email: 'takahashi@smartpolice.jp', role: 'CrisisManager', position: '専属危機管理官', phone: '090-1234-5678', photoUrl: 'https://picsum.photos/id/1005/100/120', profile: '元警視庁公安部出身。サイバーセキュリティと物理セキュリティの両方に精通し、数々の企業危機を解決に導いてきたエキスパート。', status: 'active', approvalStatus: 'approved', assignedClients: 2, joinedDate: '2020-04-01',
        personalInfo: { dateOfBirth: '1975-05-15', gender: '男性', address: { postalCode: '100-0001', prefecture: '東京都', city: '千代田区', address1: '千代田1-1', address2: '' } },
        skills: [{id: 's1', skillName: '交渉術', skillLevel: 5}, {id: 's2', skillName: 'サイバーフォレンジック', skillLevel: 4}],
        qualifications: [{id: 'q1', qualificationName: 'CISSP', acquisitionDate: '2018-03-01'}, {id: 'q2', qualificationName: '第一種運転免許', acquisitionDate: '1995-06-20'}],
        careerHistory: [{id: 'c1', companyName: '警視庁', position: '警部', startDate: '1998-04-01', endDate: '2020-03-31', description: '公安部にてサイバーテロ対策に従事'}],
        emergencyContact: { name: '高橋 典子', relationship: '妻', phone: '090-1111-2222' }
    },
    { 
        id: 2, name: '佐藤 誠', realName: '佐藤 誠', businessName: '佐藤コンサル', displayNameType: 'business', email: 'sato@smartpolice.jp', role: 'Consultant', position: 'シニアコンサルタント', phone: '090-8765-4321', photoUrl: 'https://picsum.photos/id/1011/100/120', profile: '大手コンサルティングファームにて10年以上の経験を積んだ後、スマートポリスに参加。特に内部統制とコンプライアンス分野を専門とする。', status: 'active', approvalStatus: 'approved', assignedClients: 1, joinedDate: '2021-08-15',
        personalInfo: { dateOfBirth: '1982-11-20', gender: '男性', address: { postalCode: '231-0001', prefecture: '神奈川県', city: '横浜市中区', address1: '日本大通１', address2: '横浜市役所' } },
        skills: [], qualifications: [], careerHistory: [], emergencyContact: {name: '', relationship: '', phone: ''}
    },
    { 
        id: 3, name: '鈴木 一郎', realName: '鈴木 一郎', businessName: '鈴木リーガルオフィス', displayNameType: 'real', email: 'suzuki@smartpolice.jp', role: 'Legal', position: '顧問弁護士', phone: '080-1122-3344', photoUrl: 'https://picsum.photos/id/1025/100/120', profile: '企業法務を専門とする弁護士。契約書のレビューから訴訟対応まで、法的な側面から企業を強力にバックアップする。', status: 'active', approvalStatus: 'approved', assignedClients: 1, joinedDate: '2022-01-10',
        personalInfo: { dateOfBirth: '1978-02-10', gender: '男性', address: { ...emptyAddress, prefecture: '東京都' } },
        skills: [], qualifications: [], careerHistory: [], emergencyContact: { name: '鈴木 法律事務所', relationship: '勤務先', phone: '03-9876-5432' }
    },
    { 
        id: 4, name: '新人 太郎', realName: '新人 太郎', businessName: 'ニュービー', displayNameType: 'real', email: 'newbie@smartpolice.jp', role: 'Consultant', position: 'アソシエイト', phone: '080-5566-7788', photoUrl: 'https://picsum.photos/id/1012/100/120', profile: 'フレッシュな視点でクライアントの問題解決に取り組みます。', status: 'active', approvalStatus: 'pending', assignedClients: 0, joinedDate: '2024-04-01',
        personalInfo: { dateOfBirth: '', gender: '男性', address: emptyAddress },
        skills: [], qualifications: [], careerHistory: [], emergencyContact: { name: '', relationship: '', phone: '' }
    },
];

const initialClients: Client[] = [
    { id: 1, companyName: '○○ホールディングス株式会社', contactPerson: '田中 太郎', email: 'admin@client.com', planId: 'plan_premium', status: 'active', mainAssigneeId: 1, subAssigneeId: 2, registrationDate: '2023-01-15', remainingTickets: 8, address: { postalCode: '100-0005', prefecture: '東京都', city: '千代田区', address1: '丸の内1-1-1', address2: 'パレスビル' }, corporateNumber: '1010001000001', website: 'https://example.com/1', phone: '03-1111-2222', paymentMethod: 'credit_card' },
    { id: 2, companyName: '株式会社ABCテクノロジー', contactPerson: '鈴木 一郎', email: 'suzuki@example.com', planId: 'plan_standard', status: 'active', mainAssigneeId: 2, subAssigneeId: null, registrationDate: '2023-03-20', remainingTickets: 5, address: { postalCode: '530-0001', prefecture: '大阪府', city: '大阪市北区', address1: '梅田2-2-2', address2: 'ヒルトンプラザウエスト' }, affiliateId: 'aff_1', corporateNumber: '1010001000002', website: 'https://example.com/2', phone: '06-1111-2222', paymentMethod: 'bank_transfer' },
    { id: 3, companyName: 'XYZソリューションズ合同会社', contactPerson: '佐藤 花子', email: 'sato@example.com', planId: 'plan_enterprise', status: 'active', mainAssigneeId: 1, subAssigneeId: 3, registrationDate: '2022-11-01', remainingTickets: 99, address: { postalCode: '810-0001', prefecture: '福岡県', city: '福岡市中央区', address1: '天神1-4-2', address2: 'エルガーラ' }, affiliateId: 'aff_1', corporateNumber: '1010001000003', website: 'https://example.com/3', phone: '092-1111-2222', paymentMethod: 'credit_card' },
];
const initialClientUsers: ClientUser[] = [
    { id: 1, clientId: 1, name: '田中 太郎', email: 'admin@client.com', position: '部長', phone: '03-1111-1111', isPrimaryContact: true, role: 'CLIENTADMIN' },
    { id: 2, clientId: 1, name: '佐藤 花子', email: 'user@client.com', position: '課長', phone: '03-2222-2222', isPrimaryContact: false, role: 'CLIENT' },
];

const initialTickets: MessageTicket[] = [
    { id: 1, clientId: 1, ticketId: 'T-1', subject: '顧客からの苦情対応について', excerpt: '顧客から商品に対する苦情が寄せられました。対応方法をご相談させてください...', priority: '高', status: '対応中', assigneeId: 1, lastUpdate: '2024/08/28 15:30', unreadCount: 3, attachmentCount: 1, category: '顧客対応', expirationDate: '2024-09-04T15:30:00Z' },
    { id: 2, clientId: 2, ticketId: 'T-2', subject: 'セキュリティ研修の件', excerpt: '来月予定している社員向けセキュリティ研修について、講師の手配をお願いします...', priority: '中', status: '完了', assigneeId: 2, lastUpdate: '2024/08/27 14:20', unreadCount: 0, attachmentCount: 0, category: '研修', expirationDate: '2024-09-03T14:20:00Z' },
    { id: 3, clientId: 1, ticketId: 'T-3', subject: '月次レポートの確認', excerpt: '8月分の月次レポートを添付しました。内容をご確認ください...', priority: '低', status: '受付中', assigneeId: null, lastUpdate: '2024/08/26 09:15', unreadCount: 1, attachmentCount: 1, category: 'レポート', expirationDate: '2024-09-02T09:15:00Z' }
];

const initialTicketConsumptionLog: TicketConsumptionLog[] = [
    { id: 'tcl-1', clientId: 1, date: '2024-08-28T14:00:00Z', type: '新規相談', description: '相談: 顧客からの苦情対応について', ticketCost: 1, relatedId: 1 },
    { id: 'tcl-2', clientId: 2, date: '2024-08-27T10:00:00Z', type: '新規相談', description: '相談: セキュリティ研修の件', ticketCost: 1, relatedId: 2 },
    { id: 'tcl-3', clientId: 1, date: '2024-08-26T09:15:00Z', type: '新規相談', description: '相談: 月次レポートの確認', ticketCost: 1, relatedId: 3 },
    { id: 'tcl-4', clientId: 1, date: '2024-08-28T16:00:00Z', type: '専門家招待', description: '専門家招待: 鈴木 一郎 (弁護士) on ticket T-1', ticketCost: 1, relatedId: 1 },
    { id: 'tcl-5', clientId: 2, date: '2024-08-29T11:00:00Z', type: 'オンラインイベント参加', description: 'セミナー参加: リスク管理基礎講座', ticketCost: 1, relatedId: 1 },
];

const initialAnnouncements: Announcement[] = [
    { id: 1, title: 'システムメンテナンスのお知らせ', content: '平素よりスマートポリスをご利用いただき、誠にありがとうございます。システムの安定性向上のため、下記の日程でメンテナンスを実施いたします。期間中はサービスをご利用いただけません。ご不便をおかけいたしますが、何卒ご理解いただけますようお願い申し上げます。\n\n【日時】\n2024年9月15日（日） AM 2:00 〜 AM 6:00', category: 'メンテナンス', priority: '緊急', status: 'published', createdAt: '2024-08-28', publishedAt: '2024-08-28', read: false },
    { id: 2, title: '新機能「レポート分析」をリリース', content: '本日、契約企業向けポータルに新機能「レポート・分析」を追加いたしました。月次の請求額推移やサービス利用割合をグラフでご確認いただけます。今後の経営判断にご活用ください。', category: 'サービス情報', priority: '重要', status: 'published', createdAt: '2024-08-25', publishedAt: '2024-08-25', read: true },
];

const initialSeminars: Seminar[] = [
    { id: 1, title: 'リスク管理基礎講座', description: '企業の基本的なリスク管理について学びます。詳細な事例を交えながら、明日から使える知識を習得します。', category: 'マネジメント', date: '2024-09-15T14:00:00Z', location: 'オンライン', capacity: 50, applicants: [], status: '募集中', mainImageUrl: 'https://picsum.photos/id/101/800/400', subImageUrls: ['https://picsum.photos/id/102/400/300', 'https://picsum.photos/id/103/400/300', 'https://picsum.photos/id/104/400/300'], pdfUrl: '#' },
    { id: 2, title: 'カスハラ対策実践', description: '顧客からのハラスメントへの具体的な対応方法を実践形式で学びます。ロールプレイングも行います。', category: 'マネジメント', date: '2024-09-22T13:00:00Z', location: '東京会場', capacity: 30, applicants: [], status: '募集中', mainImageUrl: 'https://picsum.photos/id/201/800/400', subImageUrls: ['https://picsum.photos/id/202/400/300', 'https://picsum.photos/id/203/400/300', 'https://picsum.photos/id/204/400/300'] },
];

const initialEvents: Event[] = [
    { id: 1, title: '【会員限定】セキュリティ担当者交流会', description: '日頃の悩みを共有し、他社の事例から学びましょう。軽食をご用意しております。', category: '交流会', date: '2024-10-05T18:00:00Z', location: 'スマートポリス本社ラウンジ', capacity: 30, applicants: [], status: '募集中', mainImageUrl: 'https://picsum.photos/id/10/800/400' },
    { id: 2, title: 'SNS炎上対策 基礎勉強会', description: '企業のSNS担当者様向けに、炎上のメカニズムと予防策、発生時の初期対応について解説します。', category: '勉強会', date: '2024-10-18T14:00:00Z', location: 'オンライン', capacity: 100, applicants: [], status: '募集中', mainImageUrl: 'https://picsum.photos/id/20/800/400' },
];

const initialServices: Service[] = [
    { id: 'emergency-1', name: '緊急出動サービス', category: 'emergency', description: 'カスハラや不当要求など、緊急事態に専門家が現場へ駆けつけます。', longDescription: '顧客からの過度な要求やクレーム、従業員へのハラスメント行為など、自社だけでの対応が困難な場合に、経験豊富な危機管理の専門家が現場に急行し、事態の鎮静化と円滑な解決をサポートします。24時間365日対応可能です。', price: 55000, priceType: 'per-use', icon: 'fas fa-car-crash', color: 'red-500', status: 'active', mainImageUrl: 'https://picsum.photos/id/301/800/400', subImageUrls: ['https://picsum.photos/id/302/400/300'] },
    { id: 'security-1', name: 'セキュリティ診断', category: 'security', description: 'Webサイトや社内ネットワークの脆弱性を診断し、レポートを提出します。', longDescription: '貴社のWebサイト、アプリケーション、社内ネットワークに潜むセキュリティ上の脆弱性を専門家が診断します。診断結果は詳細なレポートとして提供し、具体的な対策案も合わせてご提案。サイバー攻撃のリスクを低減します。', price: 330000, priceType: 'one-time', icon: 'fas fa-shield-alt', color: 'blue-500', status: 'active', mainImageUrl: 'https://picsum.photos/id/401/800/400', subImageUrls: [] },
];

const initialInvoices: Invoice[] = [
    { id: 'INV-2024-008', clientId: 1, clientName: '○○ホールディングス株式会社', issueDate: '2024-08-01', dueDate: '2024-08-31', amount: 462000, status: 'unpaid', items: [{description: 'プレミアムプラン月額利用料', quantity: 1, unitPrice: 320000, amount: 320000},{description: '緊急出動サービス（2024/08/15）', quantity: 1, unitPrice: 50000, amount: 50000},{description: 'データ復旧作業', quantity: 2, unitPrice: 25000, amount: 50000},] },
    { id: 'INV-2024-007', clientId: 2, clientName: '株式会社ABCテクノロジー', issueDate: '2024-07-01', dueDate: '2024-07-31', amount: 55000, status: 'paid', items: [{description: 'スタンダードプラン月額利用料', quantity: 1, unitPrice: 50000, amount: 50000}] },
];

const initialMaterials: Material[] = [
    { id: 1, title: 'サービス総合パンフレット 2024年版', description: 'スマートポリスの全サービスについて詳しく解説した最新のパンフレットです。', category: 'サービスパンフレット', fileName: 'smartpolice_pamphlet_2024.pdf', fileUrl: '#', fileSize: '2.5 MB', uploadedAt: '2024-08-01T10:00:00Z' },
    { id: 2, title: '個人情報保護法 改正点の解説', description: '最新の法改正に対応した、企業が注意すべきポイントをまとめた資料です。', category: '法令資料', fileName: 'privacy_law_update.pdf', fileUrl: '#', fileSize: '850 KB', uploadedAt: '2024-07-25T14:30:00Z' },
];

const initialAffiliates: Affiliate[] = [
    { id: 'aff_1', name: '山田 紹介', email: 'yamada@referral.com', password: 'password', referralCode: 'YAMADA01', status: 'active', defaultCommissionRate: 0.1, defaultCommissionPeriod: 'first_year', bankAccount: { bankName: 'みらい銀行', branchName: '渋谷支店', accountType: '普通', accountNumber: '1234567', accountHolderName: 'ヤマダ ショウカイ' } },
    { id: 'aff_2', name: '佐藤 パートナー', email: 'sato@partner.com', password: 'password', referralCode: 'SATO02', status: 'inactive', defaultCommissionRate: 0.15, defaultCommissionPeriod: 'lifetime', bankAccount: emptyBankAccount },
];

const initialReferrals: Referral[] = [
    { id: 1, affiliateId: 'aff_1', clientId: 2, clientName: '株式会社ABCテクノロジー', referralType: 'code', registrationDate: '2023-03-20', status: 'approved', commissionRate: 0.1, commissionPeriod: 'first_year' },
    { id: 2, affiliateId: 'aff_1', clientId: 3, clientName: 'XYZソリューションズ合同会社', referralType: 'link', registrationDate: '2022-11-01', status: 'pending', commissionRate: 0.15, commissionPeriod: 'lifetime' },
];

const initialPayouts: Payout[] = [
    { id: 1, affiliateId: 'aff_1', payoutDate: '2023-04-15', amount: 5000, status: 'paid', referralIds: [1] },
];

const allPermissions: Permission[] = [
    'VIEW_DASHBOARD', 'VIEW_CLIENTS', 'EDIT_CLIENTS', 'DELETE_CLIENTS', 'VIEW_STAFF', 'EDIT_STAFF', 'DELETE_STAFF', 'VIEW_TICKETS', 'EDIT_TICKETS',
    'VIEW_APPLICATIONS', 'PROCESS_APPLICATIONS', 'VIEW_ANNOUNCEMENTS', 'EDIT_ANNOUNCEMENTS', 'DELETE_ANNOUNCEMENTS', 'VIEW_SEMINARS',
    'EDIT_SEMINARS', 'DELETE_SEMINARS', 'VIEW_EVENTS', 'EDIT_EVENTS', 'DELETE_EVENTS', 'VIEW_MATERIALS', 'EDIT_MATERIALS', 'DELETE_MATERIALS', 'VIEW_BILLING', 'EDIT_BILLING', 'DELETE_BILLING', 'VIEW_SERVICES', 'EDIT_SERVICES', 'DELETE_SERVICES', 'VIEW_LOGS', 'MANAGE_ROLES', 'MANAGE_PLANS', 'DELETE_PLANS', 'MANAGE_AFFILIATES', 'DELETE_AFFILIATES'
];

const initialRoles: Role[] = [
    { name: 'SUPERADMIN', permissions: allPermissions },
    { name: 'ADMIN', permissions: allPermissions.filter(p => !p.startsWith('MANAGE_') && !p.startsWith('DELETE_') && p !== 'EDIT_SERVICES') },
    { name: 'STAFF', permissions: ['VIEW_DASHBOARD', 'VIEW_CLIENTS', 'VIEW_TICKETS', 'EDIT_TICKETS', 'VIEW_BILLING', 'VIEW_STAFF', 'VIEW_ANNOUNCEMENTS', 'VIEW_SEMINARS', 'VIEW_EVENTS', 'VIEW_MATERIALS'] },
    { name: 'CLIENTADMIN', permissions: [] }, // Client roles not managed here
    { name: 'CLIENT', permissions: [] }, // Client roles not managed here
    { name: 'AFFILIATE', permissions: [] },
];

// --- CONTEXT ---
interface ClientDataContextType {
    // Data
    tickets: MessageTicket[];
    announcements: Announcement[];
    seminars: Seminar[];
    events: Event[];
    materials: Material[];
    services: Service[];
    invoices: Invoice[];
    serviceApplications: ServiceApplication[];
    staff: Staff[];
    clients: Client[];
    clientUsers: ClientUser[];
    auditLogs: AuditLog[];
    roles: Role[];
    plans: Plan[];
    affiliates: Affiliate[];
    referrals: Referral[];
    payouts: Payout[];
    ticketConsumptionLog: TicketConsumptionLog[];
    currentClient: Client | undefined;
    currentPlan: Plan | undefined;

    // Functions
    hasPermission: (permission: Permission) => boolean;
    hasClientPermission: (permission: ClientPermission) => boolean;
    calculateClientProfileCompletion: (client: Client) => number;
    updateRolePermissions: (roleName: UserRole, permissions: Permission[]) => void;
    logAction: (action: string, details: string, clientId?: number) => void;
    registerClient: (data: any, type: 'easy' | 'detailed' | 'simple') => Promise<boolean>;
    updateTicketStatus: (ticketId: number, newStatus: '対応中' | '完了' | '受付中') => void;
    consumeTicket: (clientId: number, type: TicketConsumptionType, description: string, relatedId?: string | number, amount?: number) => boolean;
    createTicket: (data: { subject: string; firstMessage: string; priority: '高' | '中' | '低'; category: string; attachmentCount: number; }) => number;
    markAnnouncementAsRead: (id: number) => void;
    applyForSeminar: (application: Omit<SeminarApplication, 'seminarId' | 'applicationDate'>, seminarId: number) => { success: boolean; message: string; };
    getSeminarApplicationStatus: (id: number) => boolean;
    deleteSeminarApplication: (seminarId: number, userId: string) => void;
    applyForEvent: (application: Omit<EventApplication, 'eventId' | 'applicationDate'>, eventId: number) => { success: boolean; message: string; };
    getEventApplicationStatus: (id: number) => boolean;
    deleteEventApplication: (eventId: number, userId: string) => void;
    applyForService: (application: Omit<ServiceApplication, 'id' | 'status' | 'applicationDate' | 'clientName'>) => void;
    processApplication: (id: string, status: 'approved' | 'rejected') => void;
    saveStaff: (staffMember: Omit<Staff, 'id' | 'assignedClients' | 'joinedDate'>, id?: number) => void;
    deleteStaff: (id: number) => void;
    approveStaff: (id: number) => void;
    saveClient: (client: Client) => void;
    deleteClient: (id: number) => void;
    changeClientPlan: (clientId: number, newPlanId: string) => void;
    createInvoice: (invoiceData: Omit<Invoice, 'id'>) => void;
    deleteInvoice: (id: string) => void;
    createService: (serviceData: Omit<Service, 'id' | 'mainImageUrl' | 'subImageUrls'> & { mainImageUrl?: string; subImageUrls?: string[] }) => void;
    updateService: (serviceData: Service) => void;
    deleteService: (id: string) => void;
    saveAnnouncement: (data: Partial<Omit<Announcement, 'id' | 'read' | 'createdAt'>>, id?: number) => void;
    deleteAnnouncement: (id: number) => void;
    saveSeminar: (data: Omit<Seminar, 'id' | 'applicants'> & { applicants: SeminarApplication[] }, id?: number) => void;
    deleteSeminar: (id: number) => void;
    saveEvent: (data: Omit<Event, 'id' | 'applicants'> & { applicants: EventApplication[] }, id?: number) => void;
    deleteEvent: (id: number) => void;
    savePlan: (planData: Plan) => void;
    deletePlan: (id: string) => boolean;
    addMaterial: (data: Omit<Material, 'id' | 'uploadedAt'>) => void;
    updateMaterial: (id: number, data: Omit<Material, 'id' | 'uploadedAt'>) => void;
    deleteMaterial: (id: number) => void;
    getStaffDisplayName: (staffId: number | null) => string;
    addClientUser: (clientId: number, user: Omit<ClientUser, 'id' | 'clientId'>) => void;
    updateClientUser: (clientId: number, user: ClientUser) => void;
    deleteClientUser: (clientId: number, userId: number) => boolean;
    approveReferral: (referralId: number) => void;
    rejectReferral: (referralId: number) => void;
    saveAffiliate: (data: Omit<Affiliate, 'id'>, id?: string) => void;
    deleteAffiliate: (id: string) => void;
    requestPayout: (affiliateId: string) => void;
    markPayoutAsPaid: (payoutId: number) => void;
}

const ClientDataContext = createContext<ClientDataContextType | null>(null);

export const ClientDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const prevUserRef = useRef<User | null>(null);

    // --- STATE MANAGEMENT ---
    const [tickets, setTickets] = useState<MessageTicket[]>(initialTickets);
    const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
    const [seminars, setSeminars] = useState<Seminar[]>(initialSeminars);
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [materials, setMaterials] = useState<Material[]>(initialMaterials);
    const [services, setServices] = useState<Service[]>(initialServices);
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [serviceApplications, setServiceApplications] = useState<ServiceApplication[]>([]);
    const [staff, setStaff] = useState<Staff[]>(initialStaff);
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [clientUsers, setClientUsers] = useState<ClientUser[]>(initialClientUsers);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [affiliates, setAffiliates] = useState<Affiliate[]>(initialAffiliates);
    const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
    const [payouts, setPayouts] = useState<Payout[]>(initialPayouts);
    const [ticketConsumptionLog, setTicketConsumptionLog] = useState<TicketConsumptionLog[]>(initialTicketConsumptionLog);

    const currentClient = useMemo(() => clients.find(c => c.email === user?.email), [clients, user]);
    const currentPlan = useMemo(() => plans.find(p => p.id === currentClient?.planId), [plans, currentClient]);
    
    const logAction = useCallback((action: string, details: string, clientId?: number) => {
        if (!user) return;
        const newLog: AuditLog = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            userId: user.email,
            userName: user.name,
            action,
            details,
            clientId,
        };
        setAuditLogs(prev => [newLog, ...prev]);
    }, [user]);
    
    const getStaffDisplayName = useCallback((staffId: number | null): string => {
        if (staffId === null) return '未割当';
        const staffMember = staff.find(s => s.id === staffId);
        if (!staffMember) return '不明な担当者';

        if (user && ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user.role)) {
            return staffMember.realName;
        }
        
        return staffMember.displayNameType === 'business' && staffMember.businessName ? staffMember.businessName : staffMember.realName;
    }, [staff, user]);
    
    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!user) return false;
        const userRole = roles.find(r => r.name === user.role);
        return userRole?.permissions.includes(permission) ?? false;
    }, [user, roles]);
    
    const hasClientPermission = useCallback((permission: ClientPermission): boolean => {
        if (!currentPlan) return false;
        return currentPlan.permissions.includes(permission);
    }, [currentPlan]);

    const calculateClientProfileCompletion = useCallback((client: Client): number => {
        const fieldsToCheck: (string | boolean | undefined | null)[] = [
            client.registeredName,
            client.repName,
            client.businessOverview,
            client.billingContactName,
            client.riskManagementOfficerName,
            (client.emergencyContact?.day || client.emergencyContact?.night || client.emergencyContact?.holiday),
            client.hasBcp,
            client.hasAntisocialExclusionClause
        ];

        const totalFields = fieldsToCheck.length;
        let completedFields = 0;

        fieldsToCheck.forEach(field => {
            if (typeof field === 'string' && field.trim() !== '') {
                completedFields++;
            } else if (typeof field === 'boolean') {
                completedFields++;
            }
        });

        return totalFields > 0 ? (completedFields / totalFields) * 100 : 100;
    }, []);
    
    const updateRolePermissions = (roleName: UserRole, permissions: Permission[]) => {
        setRoles(prevRoles => prevRoles.map(role => role.name === roleName ? { ...role, permissions } : role));
        logAction('UPDATE_ROLE', `Updated permissions for role ${roleName}.`);
    };
    
    const registerClient = async (data: any, type: 'easy' | 'detailed' | 'simple'): Promise<boolean> => {
        const newClientId = Math.max(0, ...clients.map(c => c.id)) + 1;
        const planId = type === 'detailed' ? data.contract_plan : FREE_PLAN_ID;
        const plan = plans.find(p => p.id === planId);
    
        const newClient: Client = {
            id: newClientId,
            companyName: data.company_name || data.company,
            companyNameKana: data.company_name_kana,
            contactPerson: `${data.family_name || ''} ${data.given_name || ''}`.trim() || data.name,
            email: data.email,
            mainEmail: data.email,
            planId: planId,
            status: 'active',
            mainAssigneeId: null,
            subAssigneeId: null,
            registrationDate: new Date().toISOString().split('T')[0],
            address: {
                postalCode: data.postal_code || '',
                prefecture: data.prefecture || '',
                city: data.city || '',
                address1: data.address || '',
                address2: '',
            },
            corporateNumber: data.company_registration_number || '',
            website: '',
            phone: data.phone || '',
            mainTel: data.phone || '',
            paymentMethod: data.payment_method || 'credit_card',
            remainingTickets: plan?.initialTickets || 0,
            registrationStatus: '基本情報完了',
            createdAt: new Date().toISOString(),
            createdBy: 0, // Placeholder for admin ID
            updatedAt: new Date().toISOString(),
            updatedBy: 0, // Placeholder for admin ID
            confidentialityLevel: '通常',
            consentFlag: true,
            billingName: data.billing_name,
            billingAddress: {
                postalCode: data.billing_postal_code || '',
                prefecture: data.billing_prefecture || '',
                city: data.billing_city || '',
                address1: data.billing_address || '',
                address2: '',
            },
            billingPhone: data.billing_phone,
            cardNumber: data.card_number,
            cardExpiry: data.card_expiry,
            bankAccount: {
                bankName: data.bank_name || '',
                branchName: data.branch_name || '',
                accountType: data.account_type || '普通',
                accountNumber: data.account_number || '',
                accountHolderName: data.account_holder_name || '',
            },
            affiliateId: data.referral_code || undefined,
        };
    
        const newClientUser: ClientUser = {
            id: Math.max(0, ...clientUsers.map(u => u.id)) + 1,
            clientId: newClientId,
            name: newClient.contactPerson,
            email: newClient.email,
            position: data.position || '主担当者',
            phone: data.user_phone || data.phone || '',
            isPrimaryContact: true,
            role: 'CLIENTADMIN',
            department: data.department,
            familyNameKana: data.family_name_kana,
            givenNameKana: data.given_name_kana,
        };

        setClients(prev => [...prev, newClient]);
        setClientUsers(prev => [...prev, newClientUser]);
        logAction('REGISTER_CLIENT', `New client registered: ${newClient.companyName}`, newClientId);
        return new Promise(resolve => setTimeout(() => resolve(true), 500));
    };

    const updateTicketStatus = (ticketId: number, newStatus: '対応中' | '完了' | '受付中') => {
         setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
         logAction('UPDATE_TICKET', `Updated ticket #${ticketId} status to ${newStatus}.`);
    };

    const consumeTicket = (clientId: number, type: TicketConsumptionType, description: string, relatedId?: string | number, amount: number = 1): boolean => {
        let success = false;
        setClients(prev => prev.map(c => {
            if (c.id === clientId && c.remainingTickets >= amount) {
                success = true;
                return { ...c, remainingTickets: c.remainingTickets - amount };
            }
            return c;
        }));
        if (success) {
            const newLog: TicketConsumptionLog = {
                id: `tcl-${Date.now()}`,
                clientId,
                date: new Date().toISOString(),
                type,
                description,
                ticketCost: amount,
                relatedId,
            };
            setTicketConsumptionLog(prev => [newLog, ...prev]);
            logAction('CONSUME_TICKET', `Client #${clientId} consumed ${amount} ticket(s) for ${type}. Desc: ${description}`, clientId);
        }
        return success;
    };

    const createTicket = (data: { subject: string; firstMessage: string; priority: '高' | '中' | '低'; category: string; attachmentCount: number; }): number => {
        if (!currentClient) return -1;

        const newId = Math.max(0, ...tickets.map(t => t.id)) + 1;

        if (!consumeTicket(currentClient.id, '新規相談', `相談: ${data.subject}`, newId, 1)) {
            alert('チケット残数がありません。');
            return -1;
        }

        const newTicket: MessageTicket = {
            id: newId,
            clientId: currentClient.id,
            ticketId: `T-${newId}`,
            subject: data.subject,
            excerpt: data.firstMessage.substring(0, 50) + '...',
            priority: data.priority,
            status: '受付中',
            assigneeId: null,
            lastUpdate: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }).slice(0, 16).replace('T', ' '),
            unreadCount: 1,
            attachmentCount: data.attachmentCount,
            category: data.category,
        };
        setTickets(prev => [newTicket, ...prev]);
        return newId;
    };
    
    const markAnnouncementAsRead = (id: number) => {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    };
    
    const applyForSeminar = (application: Omit<SeminarApplication, 'seminarId' | 'applicationDate'>, seminarId: number): { success: boolean; message: string; } => {
        const seminar = seminars.find(s => s.id === seminarId);
        if (!seminar) return { success: false, message: 'セミナーが見つかりません。' };

        if (seminar.applicants.length >= seminar.capacity) {
            return { success: false, message: 'このセミナーは満員です。' };
        }
        if (seminar.applicants.some(app => app.userId === application.userId)) {
            return { success: false, message: 'すでにこのセミナーに申し込み済みです。' };
        }

        const isOnline = seminar.location === 'オンライン';
        if (isOnline) {
            if (!consumeTicket(application.clientId, 'オンラインイベント参加', `セミナー参加: ${seminar.title}`, seminar.id, 1)) {
                return { success: false, message: 'チケットが不足しているため、お申し込みできません。' };
            }
        }

        const newApplication: SeminarApplication = { ...application, seminarId, applicationDate: new Date().toISOString() };
        setSeminars(prev => prev.map(s => s.id === seminarId ? { ...s, applicants: [...s.applicants, newApplication] } : s));
        
        const successMessage = isOnline 
            ? 'セミナーに申し込みました。（チケットを1枚消費しました）'
            : 'セミナーに申し込みました。';

        return { success: true, message: successMessage };
    };
    
    const getSeminarApplicationStatus = (id: number): boolean => {
        const seminar = seminars.find(s => s.id === id);
        return seminar?.applicants.some(app => app.userId === user?.email) || false;
    };

    const deleteSeminarApplication = (seminarId: number, userId: string) => {
        setSeminars(prev => prev.map(s => {
            if (s.id === seminarId) {
                return { ...s, applicants: s.applicants.filter(app => app.userId !== userId) };
            }
            return s;
        }));
    };
    
    const applyForEvent = (application: Omit<EventApplication, 'eventId' | 'applicationDate'>, eventId: number): { success: boolean; message: string; } => {
        const event = events.find(e => e.id === eventId);
        if (!event) return { success: false, message: 'イベントが見つかりません。' };

        if (event.applicants.length >= event.capacity) {
            return { success: false, message: 'このイベントは満員です。' };
        }
        if (event.applicants.some(app => app.userId === application.userId)) {
            return { success: false, message: 'すでにこのイベントに申し込み済みです。' };
        }
        
        const isOnline = event.location === 'オンライン';
        if (isOnline) {
            if (!consumeTicket(application.clientId, 'オンラインイベント参加', `イベント参加: ${event.title}`, event.id, 1)) {
                return { success: false, message: 'チケットが不足しているため、お申し込みできません。' };
            }
        }

        const newApplication: EventApplication = { ...application, eventId, applicationDate: new Date().toISOString() };
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, applicants: [...e.applicants, newApplication] } : e));
        
        const successMessage = isOnline 
            ? 'イベントに申し込みました。（チケットを1枚消費しました）'
            : 'イベントに申し込みました。';
            
        return { success: true, message: successMessage };
    };

    const getEventApplicationStatus = (id: number): boolean => {
        const event = events.find(e => e.id === id);
        return event?.applicants.some(app => app.userId === user?.email) || false;
    };

    const deleteEventApplication = (eventId: number, userId: string) => {
        setEvents(prev => prev.map(e => {
            if (e.id === eventId) {
                return { ...e, applicants: e.applicants.filter(app => app.userId !== userId) };
            }
            return e;
        }));
    };

    const applyForService = (application: Omit<ServiceApplication, 'id' | 'status' | 'applicationDate' | 'clientName'>) => {
         const newApp: ServiceApplication = {
            ...application,
            id: `APP-${Date.now()}`,
            status: 'pending',
            applicationDate: new Date().toISOString(),
            clientName: clients.find(c => c.id === application.clientId)?.companyName || 'Unknown Client',
        };
        setServiceApplications(prev => [newApp, ...prev]);
        sendNewApplicationEmail('admin@smartpolice.jp', newApp.serviceName, newApp.clientName);
        logAction('APPLY_SERVICE', `Applied for service "${newApp.serviceName}".`, application.clientId);
    };
    
    const processApplication = (id: string, status: 'approved' | 'rejected') => {
        const app = serviceApplications.find(a => a.id === id);
        if (app) {
            const client = clients.find(c => c.id === app.clientId);
            if (client) {
                sendApplicationStatusEmail(client.email, app.serviceName, status);
            }
            setServiceApplications(prev => prev.map(a => a.id === id ? { ...a, status, processedDate: new Date().toISOString(), processedBy: user?.name } : a));
            logAction('PROCESS_APPLICATION', `Processed application #${id} to ${status}.`, app.clientId);
        }
    };

    const saveStaff = (staffMember: Omit<Staff, 'id' | 'assignedClients' | 'joinedDate'>, id?: number) => {
        if (id) {
            setStaff(prev => prev.map(s => s.id === id ? { ...s, ...staffMember, name: staffMember.realName, id: s.id, assignedClients: s.assignedClients, joinedDate: s.joinedDate } : s));
            logAction('UPDATE_STAFF', `Updated staff member #${id} ${staffMember.name}.`);
        } else {
            const newId = Math.max(0, ...staff.map(s => s.id)) + 1;
            const newStaff: Staff = {
                ...staffMember,
                id: newId,
                name: staffMember.realName,
                assignedClients: 0,
                joinedDate: new Date().toISOString().split('T')[0],
            };
            setStaff(prev => [...prev, newStaff]);
            logAction('CREATE_STAFF', `Created new staff member ${newStaff.name}.`);
        }
    };

    const deleteStaff = (id: number) => {
        setStaff(prev => prev.filter(s => s.id !== id));
        logAction('DELETE_STAFF', `Deleted staff member #${id}.`);
    };

    const approveStaff = (id: number) => {
        setStaff(prev => prev.map(s => s.id === id ? { ...s, approvalStatus: 'approved' } : s));
        logAction('APPROVE_STAFF', `Approved staff member #${id}.`);
    };

    const saveClient = (client: Client) => {
        setClients(prev => prev.map(c => c.id === client.id ? client : c));
        logAction('UPDATE_CLIENT', `Updated client #${client.id} ${client.companyName}.`, client.id);
    };

    const deleteClient = (id: number) => {
        setClients(prev => prev.filter(c => c.id !== id));
        logAction('DELETE_CLIENT', `Deleted client #${id}.`);
    };

    const changeClientPlan = (clientId: number, newPlanId: string) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, planId: newPlanId } : c));
        logAction('CHANGE_PLAN', `Client #${clientId} changed plan to ${newPlanId}.`, clientId);
    };

    const createInvoice = (invoiceData: Omit<Invoice, 'id'>) => {
        const newId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
        const newInvoice: Invoice = { ...invoiceData, id: newId };
        setInvoices(prev => [newInvoice, ...prev]);
        logAction('CREATE_INVOICE', `Created invoice #${newId} for ${invoiceData.clientName}.`, invoiceData.clientId);
    };

    const deleteInvoice = (id: string) => {
        setInvoices(prev => prev.filter(i => i.id !== id));
        logAction('DELETE_INVOICE', `Deleted invoice #${id}.`);
    };
    
    const createService = (serviceData: Omit<Service, 'id'>) => {
        const newId = `SVC-${Date.now()}`;
        const newService: Service = { ...serviceData, id: newId };
        setServices(prev => [...prev, newService]);
        logAction('CREATE_SERVICE', `Created service "${newService.name}".`);
    };

    const updateService = (serviceData: Service) => {
        setServices(prev => prev.map(s => s.id === serviceData.id ? serviceData : s));
        logAction('UPDATE_SERVICE', `Updated service "${serviceData.name}".`);
    };

    const deleteService = (id: string) => {
        setServices(prev => prev.filter(s => s.id !== id));
        logAction('DELETE_SERVICE', `Deleted service #${id}.`);
    };

    const saveAnnouncement = (data: Partial<Omit<Announcement, 'id' | 'read' | 'createdAt'>>, id?: number) => {
        if (id) {
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...data, id: a.id, read: a.read, createdAt: a.createdAt } : a));
            logAction('UPDATE_ANNOUNCEMENT', `Updated announcement #${id}.`);
        } else {
            const newId = Math.max(0, ...announcements.map(a => a.id)) + 1;
            const newAnnouncement: Announcement = {
                id: newId,
                title: data.title || '',
                content: data.content || '',
                category: data.category || 'サービス情報',
                priority: data.priority || '一般',
                status: data.status || 'draft',
                read: false,
                createdAt: new Date().toISOString().split('T')[0],
                publishedAt: data.publishedAt || (data.status === 'published' ? new Date().toISOString().split('T')[0] : null),
            };
            setAnnouncements(prev => [newAnnouncement, ...prev]);
            logAction('CREATE_ANNOUNCEMENT', `Created announcement "${newAnnouncement.title}".`);
        }
    };
    

    const deleteAnnouncement = (id: number) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        logAction('DELETE_ANNOUNCEMENT', `Deleted announcement #${id}.`);
    };
    
    const saveSeminar = (data: Omit<Seminar, 'id' | 'applicants'> & { applicants: SeminarApplication[] }, id?: number) => {
        if (id) {
            setSeminars(prev => prev.map(s => s.id === id ? { ...s, ...data, id: s.id } : s));
            logAction('UPDATE_SEMINAR', `Updated seminar #${id}.`);
        } else {
            const newId = Math.max(0, ...seminars.map(s => s.id)) + 1;
            const newSeminar: Seminar = { ...data, id: newId };
            setSeminars(prev => [newSeminar, ...prev]);
            logAction('CREATE_SEMINAR', `Created seminar "${newSeminar.title}".`);
        }
    };

    const deleteSeminar = (id: number) => {
        setSeminars(prev => prev.filter(s => s.id !== id));
        logAction('DELETE_SEMINAR', `Deleted seminar #${id}.`);
    };

    const saveEvent = (data: Omit<Event, 'id' | 'applicants'> & { applicants: EventApplication[] }, id?: number) => {
        if (id) {
            setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data, id: e.id } : e));
            logAction('UPDATE_EVENT', `Updated event #${id}.`);
        } else {
            const newId = Math.max(0, ...events.map(e => e.id)) + 1;
            const newEvent: Event = { ...data, id: newId };
            setEvents(prev => [newEvent, ...prev]);
            logAction('CREATE_EVENT', `Created event "${newEvent.title}".`);
        }
    };

    const deleteEvent = (id: number) => {
        setEvents(prev => prev.filter(e => e.id !== id));
        logAction('DELETE_EVENT', `Deleted event #${id}.`);
    };
    
    const addMaterial = (data: Omit<Material, 'id' | 'uploadedAt'>) => {
        const newId = Math.max(0, ...materials.map(m => m.id)) + 1;
        const newMaterial: Material = {
            ...data,
            id: newId,
            uploadedAt: new Date().toISOString(),
        };
        setMaterials(prev => [newMaterial, ...prev]);
        logAction('ADD_MATERIAL', `Added new material "${data.title}".`);
    };

    const updateMaterial = (id: number, data: Omit<Material, 'id' | 'uploadedAt'>) => {
        setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data, id: m.id, uploadedAt: m.uploadedAt } : m));
        logAction('UPDATE_MATERIAL', `Updated material #${id} "${data.title}".`);
    };

    const deleteMaterial = (id: number) => {
        setMaterials(prev => prev.filter(m => m.id !== id));
        logAction('DELETE_MATERIAL', `Deleted material #${id}.`);
    };

    const savePlan = (planData: Plan) => {
        setPlans(prev => {
            const existing = prev.find(p => p.id === planData.id);
            if (existing) {
                return prev.map(p => p.id === planData.id ? planData : p);
            }
            return [...prev, planData];
        });
        logAction('SAVE_PLAN', `Saved plan "${planData.name}".`);
    };

    const deletePlan = (id: string) => {
        if (clients.some(c => c.planId === id)) {
            alert('このプランを利用中のクライアントが存在するため、削除できません。');
            return false;
        }
        setPlans(prev => prev.filter(p => p.id !== id));
        logAction('DELETE_PLAN', `Deleted plan #${id}.`);
        return true;
    };
    
    const addClientUser = (clientId: number, user: Omit<ClientUser, 'id' | 'clientId'>) => {
        const newId = Math.max(0, ...clientUsers.map(u => u.id)) + 1;
        const newUser: ClientUser = { ...user, id: newId, clientId };
        if (newUser.isPrimaryContact) {
            setClientUsers(prev => [...prev.map(u => u.clientId === clientId ? {...u, isPrimaryContact: false} : u), newUser]);
        } else {
            setClientUsers(prev => [...prev, newUser]);
        }
    };

    const updateClientUser = (clientId: number, updatedUser: ClientUser) => {
        setClientUsers(prev => {
            if (updatedUser.isPrimaryContact) {
                return prev.map(u => {
                    if (u.clientId === clientId) {
                        return u.id === updatedUser.id ? updatedUser : { ...u, isPrimaryContact: false };
                    }
                    return u;
                });
            }
            return prev.map(u => u.id === updatedUser.id ? updatedUser : u);
        });
    };

    const deleteClientUser = (clientId: number, userId: number): boolean => {
        const userToDelete = clientUsers.find(u => u.id === userId && u.clientId === clientId);
        if (userToDelete && userToDelete.isPrimaryContact) {
            alert('主担当者は削除できません。まず別のユーザーを主担当者に設定してください。');
            return false;
        }
        setClientUsers(prev => prev.filter(u => u.id !== userId));
        return true;
    };

    const approveReferral = (referralId: number) => {
        setReferrals(prev => {
            const ref = prev.find(r => r.id === referralId);
            if(ref) {
                logAction('APPROVE_REFERRAL', `Approved referral for client ${ref.clientName} from affiliate ${ref.affiliateId}.`);
            }
            return prev.map(r => r.id === referralId ? { ...r, status: 'approved' } : r)
        });
    };

    const rejectReferral = (referralId: number) => {
        setReferrals(prev => {
            const ref = prev.find(r => r.id === referralId);
            if(ref) {
                logAction('REJECT_REFERRAL', `Rejected referral for client ${ref.clientName} from affiliate ${ref.affiliateId}.`);
            }
            return prev.map(r => r.id === referralId ? { ...r, status: 'rejected' } : r)
        });
    };
    
    const saveAffiliate = (data: Omit<Affiliate, 'id'>, id?: string) => {
        if (id) {
            setAffiliates(prev => prev.map(a => a.id === id ? { ...a, ...data, id } : a));
            logAction('UPDATE_AFFILIATE', `Updated affiliate ${data.name}.`);
        } else {
            const newId = `aff_${Date.now()}`;
            const newAffiliate: Affiliate = { ...data, id: newId };
            setAffiliates(prev => [...prev, newAffiliate]);
            logAction('CREATE_AFFILIATE', `Created new affiliate ${newAffiliate.name}.`);
        }
    };

    const deleteAffiliate = (id: string) => {
        setAffiliates(prev => prev.filter(a => a.id !== id));
        logAction('DELETE_AFFILIATE', `Deleted affiliate #${id}.`);
    };

    const requestPayout = (affiliateId: string) => {
        const affiliateReferrals = referrals.filter(r => r.affiliateId === affiliateId && r.status === 'approved');
        const allPaidReferralIds = payouts.flatMap(p => p.referralIds);
        const unpaidReferrals = affiliateReferrals.filter(r => !allPaidReferralIds.includes(r.id));
        
        if (unpaidReferrals.length === 0) {
            alert('支払い対象の紹介がありません。');
            return;
        }
        
        const commissionPerReferral = 5000; // Simplified calculation
        const totalPayoutAmount = unpaidReferrals.length * commissionPerReferral;

        if (totalPayoutAmount < 3000) {
            alert(`支払い可能な最低額(¥3,000)に達していません。現在の残高: ¥${totalPayoutAmount.toLocaleString()}`);
            return;
        }

        const newPayout: Payout = {
            id: Math.max(0, ...payouts.map(p => p.id)) + 1,
            affiliateId,
            payoutDate: new Date().toISOString(),
            amount: totalPayoutAmount,
            status: 'pending',
            referralIds: unpaidReferrals.map(r => r.id),
        };
        
        setPayouts(prev => [...prev, newPayout]);
        logAction('REQUEST_PAYOUT', `Affiliate ${affiliateId} requested a payout of ¥${totalPayoutAmount}.`);
        alert('支払いリクエストを送信しました。管理者の承認をお待ちください。');
    };

    const markPayoutAsPaid = (payoutId: number) => {
        setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: 'paid', payoutDate: new Date().toISOString() } : p));
        const payout = payouts.find(p => p.id === payoutId);
        if(payout) {
            logAction('PROCESS_PAYOUT', `Marked payout #${payoutId} as paid for affiliate ${payout.affiliateId}.`);
        }
    };

    useEffect(() => {
        if (user && user !== prevUserRef.current) {
            logAction('LOGIN', `User ${user.name} logged in.`);
        }
        prevUserRef.current = user;
    }, [user, logAction]);

    const value: ClientDataContextType = {
        tickets, announcements, seminars, events, materials, services, invoices, serviceApplications, staff, clients, clientUsers, auditLogs, roles, plans, affiliates, referrals, payouts, ticketConsumptionLog, currentClient, currentPlan,
        hasPermission, hasClientPermission, calculateClientProfileCompletion, updateRolePermissions, logAction, registerClient, updateTicketStatus, consumeTicket, createTicket, markAnnouncementAsRead, applyForSeminar, getSeminarApplicationStatus, deleteSeminarApplication, applyForEvent, getEventApplicationStatus, deleteEventApplication, applyForService, processApplication, saveStaff, deleteStaff, approveStaff, saveClient, deleteClient, changeClientPlan, createInvoice, deleteInvoice, createService, updateService, deleteService, saveAnnouncement, deleteAnnouncement, saveSeminar, deleteSeminar, saveEvent, deleteEvent, savePlan, deletePlan, addMaterial, updateMaterial, deleteMaterial,
        getStaffDisplayName, addClientUser, updateClientUser, deleteClientUser, approveReferral, rejectReferral, saveAffiliate, deleteAffiliate, requestPayout, markPayoutAsPaid
    };

    return (
        <ClientDataContext.Provider value={value}>
            {children}
        </ClientDataContext.Provider>
    );
};

export const useClientData = (): ClientDataContextType => {
  const context = useContext(ClientDataContext);
  if (!context) {
    throw new Error('useClientData must be used within an ClientDataProvider');
  }
  return context;
};