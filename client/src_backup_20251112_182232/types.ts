
export type UserRole = 'CLIENTADMIN' | 'CLIENT' | 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'AFFILIATE';

export type Permission = 
  | 'VIEW_DASHBOARD'
  | 'VIEW_CLIENTS' | 'EDIT_CLIENTS' | 'DELETE_CLIENTS'
  | 'VIEW_STAFF' | 'EDIT_STAFF' | 'DELETE_STAFF'
  | 'VIEW_TICKETS' | 'EDIT_TICKETS'
  | 'VIEW_APPLICATIONS' | 'PROCESS_APPLICATIONS'
  | 'VIEW_ANNOUNCEMENTS' | 'EDIT_ANNOUNCEMENTS' | 'DELETE_ANNOUNCEMENTS'
  | 'VIEW_SEMINARS' | 'EDIT_SEMINARS' | 'DELETE_SEMINARS'
  | 'VIEW_EVENTS' | 'EDIT_EVENTS' | 'DELETE_EVENTS'
  | 'VIEW_MATERIALS' | 'EDIT_MATERIALS' | 'DELETE_MATERIALS'
  | 'VIEW_BILLING' | 'EDIT_BILLING' | 'DELETE_BILLING'
  | 'VIEW_SERVICES' | 'EDIT_SERVICES' | 'DELETE_SERVICES'
  | 'VIEW_LOGS'
  | 'MANAGE_ROLES'
  | 'MANAGE_PLANS' | 'DELETE_PLANS'
  | 'MANAGE_AFFILIATES' | 'DELETE_AFFILIATES';

export interface Role {
  name: UserRole;
  permissions: Permission[];
}

export type ClientPermission =
  | 'VIEW_SERVICES'
  | 'VIEW_MATERIALS'
  | 'VIEW_BILLING'
  | 'VIEW_REPORTS'
  | 'MANAGE_USERS'
  | 'EDIT_COMPANY_INFO';

export interface Plan {
  id: string;
  name: string;
  catchphrase: string;
  description: string;
  features: string[];
  initialFee: number;
  initialFeeDiscountRate: number; // 0 to 1
  monthlyFee: number;
  monthlyFeeDiscountRate: number; // 0 to 1
  permissions: ClientPermission[];
  hasDedicatedManager: boolean;
  contractPeriod: string; // e.g., "1年", "月契約"
  isPublic: boolean; // To show on landing page
  initialTickets: number;
  monthlyTickets: number;
}

export interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  address2: string;
}

export interface BankAccount {
  bankName: string;
  branchName: string;
  accountType: '普通' | '当座';
  accountNumber: string;
  accountHolderName: string;
}

export type StaffRole = 'CrisisManager' | 'Consultant' | 'Legal' | 'Accounting' | 'Admin';

export interface User {
  name: string;
  company: string;
  email: string;
  role: UserRole;
  avatar?: string;
  clientId?: number;
  staffId?: number;
  affiliateId?: string;
}

export interface Notification {
  id: number;
  type: 'payment' | 'urgent' | 'general' | 'security' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  icon: string;
  color: string;
}

export interface Message {
    id: string;
    sender: string;
    senderType: 'user' | 'support' | 'admin' | 'system';
    avatar: string; // icon class or image url
    text: string;
    timestamp: string;
    readBy: string[];
}

export interface Participant {
  id: string;
  name: string;
  role: 'クライアント管理者' | 'クライアント担当者' | '危機管理官' | '担当者' | '副担当者' | '弁護士' | '公認会計士';
  avatar: string; // icon class
}

export interface MessageTicket {
  id: number;
  subject: string;
  excerpt: string;
  priority: '高' | '中' | '低';
  status: '対応中' | '完了' | '受付中';
  assigneeId: number | null;
  lastUpdate: string;
  unreadCount: number;
  attachmentCount: number;
  ticketId: string;
  category: string;
  clientId: number;
  expirationDate?: string;
}

export type TicketConsumptionType = '新規相談' | '専門家招待' | 'オンラインイベント参加';

export interface TicketConsumptionLog {
  id: string;
  clientId: number;
  date: string; // ISO date string
  type: TicketConsumptionType;
  description: string;
  ticketCost: number;
  relatedId?: string | number; // e.g., MessageTicket id, Event id, Seminar id
}

export interface Announcement {
  id: number;
  category: 'メンテナンス' | 'サービス情報' | 'セキュリティ' | 'その他';
  priority: '緊急' | '重要' | '一般';
  title: string;
  content: string;
  createdAt: string;
  read: boolean; // For client-side
  status: 'published' | 'draft'; // For admin-side
  publishedAt?: string | null; // For admin-side
}

export interface Service {
  id: string;
  name: string;
  category: 'emergency' | 'security' | 'training' | 'consulting';
  description: string;
  longDescription: string;
  price: number;
  priceType: 'monthly' | 'one-time' | 'per-use';
  icon: string;
  color: string;
  status: 'active' | 'inactive';
  mainImageUrl?: string;
  subImageUrls?: string[];
}


export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export interface ServiceApplication {
  id: string;
  serviceId: string;
  serviceName: string;
  clientId: number;
  clientName: string;
  userId: string;
  userName: string;
  userEmail: string;
  notes: string;
  status: ApplicationStatus;
  applicationDate: string;
  processedDate?: string;
  processedBy?: string; // Admin name
}

export interface ClientUser {
  id: number;
  clientId: number;
  name: string;
  email: string;
  position: string;
  phone: string;
  isPrimaryContact: boolean;
  role: 'CLIENTADMIN' | 'CLIENT';
  department?: string;
  familyNameKana?: string;
  givenNameKana?: string;
  dateOfBirth?: string;
  mobileTel?: string;
  preferredContactMethod?: '電話優先' | 'メール優先' | 'チャット';
  contactAvailableTime?: string;
  loginId?: string; // Future use
  identityVerifiedFlag?: boolean;
}

export interface Officer {
  id: string;
  name: string;
  title: string;
  responsibility?: string;
  isRiskOwner?: boolean;
}

export interface Client {
  // Existing fields from provided file
  id: number;
  companyName: string;
  companyNameKana?: string;
  contactPerson: string;
  email: string;
  planId: string;
  status: 'active' | 'suspended';
  mainAssigneeId: number | null;
  subAssigneeId: number | null;
  registrationDate: string; 
  address: Address;
  corporateNumber: string;
  website: string;
  phone: string;
  paymentMethod: 'credit_card' | 'bank_transfer';
  notes?: string;
  remainingTickets: number;
  affiliateId?: string;
  establishmentDate?: string;
  capital?: string;
  businessDescription?: string;
  employeeCount?: string;
  billingAddress?: Address;
  billingName?: string;
  billingPhone?: string;
  cardNumber?: string;
  cardExpiry?: string;

  // NEW fields from spec, all optional for safety
  // 2-1. System Meta
  registrationStatus?: '仮登録' | '基本情報完了' | '詳細情報入力中' | '完全登録';
  createdAt?: string;
  createdBy?: number; // Staff ID
  updatedAt?: string;
  updatedBy?: number; // Staff ID
  contractStartDate?: string;
  contractEndDate?: string;
  renewalDueDate?: string;
  terminatedAt?: string;
  confidentialityLevel?: '通常' | '要注意' | '取扱い制限あり';
  consentFlag?: boolean;

  // 2-2. Basic Company Info
  companyNameEn?: string;
  mainTel?: string;
  fax?: string;
  mainEmail?: string;
  websiteUrl?: string;
  industry?: { main?: string; sub?: string; detail?: string };
  listingStatus?: '上場' | '未上場' | '公的機関';
  numEmployees?: number; // Can replace employeeCount string
  hasMultipleLocations?: boolean;

  // 2-4. Registration Info
  registeredName?: string;
  registeredAddress?: Address;
  regDocAcquiredAt?: string;
  regCheckedBy?: number; // Staff ID
  majorShareholdersSummary?: string;
  hasGroupCompany?: boolean;
  
  // 2-5. Representative & Officer Info
  repName?: string;
  repNameKana?: string;
  repTitle?: string;
  repDateOfBirth?: string;
  repContactTel?: string;
  repContactEmail?: string;
  repTermStart?: string;
  repTermEnd?: string;
  officers?: Officer[];

  // 2-6. Business Structure
  businessOverview?: string; // Replaces businessDescription
  businessDomains?: string[];
  customerTypes?: string[];
  salesChannels?: string[];
  mainLocations?: string;
  hasOverseasBusiness?: boolean;
  handlesPersonalData?: boolean;
  handlesSensitiveData?: boolean;
  isCriticalInfrastructure?: boolean;
  saasUsageSummary?: string;
  
  // 2-7. Product/Service Info
  productsServicesList?: string;
  hasHighRiskProduct?: boolean;
  hasRegulatedProduct?: boolean;
  serviceAreas?: string;
  
  // 2-8. Billing Info (extended)
  billingDepartment?: string;
  billingContactName?: string;
  billingContactEmail?: string;
  billingMethod?: '郵送' | 'PDFメール' | '電子インボイス';
  bankAccount?: BankAccount;
  closingDay?: string; // e.g., '月末', '20日'
  paymentDay?: string; // e.g., '翌月末'
  invoiceRegistrationNumber?: string;
  fiscalMonth?: number;

  // 2-9. Risk Management Info
  riskManagementOfficerName?: string;
  riskOfficerContact?: string;
  emergencyContact?: { day: string; night: string; holiday: string; };
  hasBcp?: boolean;
  bcpDocumentLocation?: string;
  hasCompanyPolicies?: boolean;
  hasAntisocialExclusionClause?: boolean;
  hasPastIncidents?: boolean;
  pastIncidentsSummary?: string;
  prContactName?: string;
  prContactEmail?: string;
  hasLegalCounsel?: boolean;
  legalCounselInfo?: string;

  // 2-10. Communication History
  firstContactDate?: string;
  lastContactDate?: string;
  internalOwnerId?: number; // Staff ID
  nextActionDate?: string;
  tags?: string[];
}


export interface StaffPersonalInfo {
  dateOfBirth: string;
  gender: '男性' | '女性' | 'その他';
  address: Address;
}

export interface StaffSkill {
  id: string;
  skillName: string;
  skillLevel: 1 | 2 | 3 | 4 | 5;
}

export interface StaffQualification {
  id: string;
  qualificationName: string;
  acquisitionDate: string;
}

export interface StaffCareer {
  id: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface StaffEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Staff {
  id: number;
  name: string; // This will be used for 'realName' and is required for form state consistency
  realName: string;
  businessName: string;
  displayNameType: 'real' | 'business';
  email: string;
  role: StaffRole;
  position: string;
  phone: string;
  photoUrl: string;
  profile: string; // Kept for simple overview
  status: 'active' | 'inactive';
  approvalStatus: 'approved' | 'pending';
  assignedClients: number;
  joinedDate: string;
  // Detailed Information
  personalInfo: StaffPersonalInfo;
  skills: StaffSkill[];
  qualifications: StaffQualification[];
  careerHistory: StaffCareer[];
  emergencyContact: StaffEmergencyContact;
}

export interface AdminTicket {
  id: string; // e.g., 'T-1024'
  clientId: number;
  clientName: string;
  subject: string;
  assigneeId: number | null; // Corresponds to Staff id
  priority: '高' | '中' | '低';
  status: '未対応' | '対応中' | '完了';
  lastUpdate: string; // ISO date string
  createdAt: string; // ISO date string
}

export interface SeminarApplication {
  seminarId: number;
  clientId: number;
  userId: string;
  userName: string;
  userEmail: string;
  notes: string;
  applicationDate: string;
}

export interface Seminar {
    id: number;
    title: string;
    description: string;
    category: 'セキュリティ' | 'マネジメント' | '法務' | 'その他';
    date: string; // ISO date string
    location: string; // "オンライン" or address
    capacity: number;
    applicants: SeminarApplication[];
    status: '募集中' | '開催済み' | '中止';
    mainImageUrl: string;
    subImageUrls: string[];
    pdfUrl?: string;
}

export interface EventApplication {
  eventId: number;
  clientId: number;
  userId: string;
  userName: string;
  userEmail: string;
  notes: string;
  applicationDate: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  category: '交流会' | '勉強会' | 'その他';
  date: string; // ISO date string
  location: string;
  capacity: number;
  applicants: EventApplication[];
  status: '募集中' | '開催済み' | '中止';
  mainImageUrl: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string; // e.g., 'INV-2024-001'
  clientId: number;
  clientName: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  items: InvoiceItem[];
}

export interface AuditLog {
  id: number;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  clientId?: number;
}

export interface Material {
  id: number;
  title: string;
  description: string;
  category: 'サービスパンフレット' | '法令資料' | '社内研修資料' | 'その他';
  fileName: string;
  fileUrl: string; // In a real app, this would be a secure URL
  fileSize: string; // e.g., "1.2 MB"
  uploadedAt: string; // ISO date string
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  password?: string;
  referralCode: string;
  status: 'active' | 'inactive';
  defaultCommissionRate: number;
  defaultCommissionPeriod: 'first_year' | 'lifetime';
  bankAccount: BankAccount;
}

export interface Referral {
  id: number;
  affiliateId: string;
  clientId: number;
  clientName: string;
  referralType: 'link' | 'code';
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  commissionRate: number; // e.g., 0.1 for 10%
  commissionPeriod: 'first_year' | 'lifetime';
}

export interface Payout {
  id: number;
  affiliateId: string;
  payoutDate: string;
  amount: number;
  status: 'paid' | 'pending';
  referralIds: number[];
}
