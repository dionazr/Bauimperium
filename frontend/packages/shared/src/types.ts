// ============================================================
// BAUIMPERIUM - Shared Type Definitions
// ============================================================

// User Types
export type UserRole = 'CLIENT' | 'CRAFTSMAN' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Project Types
export type ProjectStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'IN_OFFER_PHASE' | 'IN_EXECUTION' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type BudgetType = 'FIXED' | 'HOURLY' | 'ESTIMATE' | 'NEGOTIABLE';
export type MediaType = 'IMAGE' | 'VIDEO_3D' | 'DOCUMENT' | 'BLUEPRINT' | 'CAD_FILE' | 'OTHER';

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  categoryId?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetType: BudgetType;
  squareMeters?: number;
  isUrgent: boolean;
  isFinancingRequired: boolean;
  address?: Address;
  category?: Category;
  media: ProjectMedia[];
  specifications: ProjectSpecification[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSpecification {
  id: string;
  key: string;
  value: string;
  unit?: string;
  isRequired: boolean;
}

export interface ProjectMedia {
  id: string;
  type: MediaType;
  url: string;
  fileName: string;
  fileSize?: number;
}

// Address
export interface Address {
  id: string;
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  state?: string;
  country: string;
  lat?: number;
  lng?: number;
}

// Category
export interface Category {
  id: string;
  name: string;
  nameDe: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  parentId?: string;
  children?: Category[];
}

// Craftsman
export interface CraftsmanProfile {
  id: string;
  userId: string;
  user: Pick<User, 'firstName' | 'lastName' | 'avatarUrl' | 'email'>;
  companyName: string;
  companyLegalForm?: string;
  description?: string;
  foundedYear?: number;
  employeeCount?: number;
  logoUrl?: string;
  coverImageUrl?: string;
  isVerified: boolean;
  verificationStatus: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  isPremium: boolean;
  creditRating?: number;
  address?: Address;
  categories: CraftsmanCategory[];
  averageRating: number;
  reviewCount: number;
  workPhotos: string[];
  completedProjects: number;
}

export interface CraftsmanCategory {
  id: string;
  category: Category;
  experienceYears?: number;
  isPrimary: boolean;
  ratePerHour?: number;
}

// Offer
export interface Offer {
  id: string;
  offerNumber: string;
  projectId: string;
  craftsmanId: string;
  title: string;
  description?: string;
  totalAmount: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COUNTERED';
  isAiGenerated: boolean;
  items: OfferItem[];
  createdAt: string;
}

export interface OfferItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// Milestone & Escrow
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  phaseNumber: number;
  amount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'APPROVED' | 'RELEASED' | 'DISPUTED' | 'FAILED';
  verificationVideoUrl?: string;
  completedAt?: string;
  releasedAt?: string;
}

export interface EscrowAccount {
  id: string;
  projectId: string;
  totalAmount: number;
  releasedAmount: number;
  remainingAmount: number;
  platformFee: number;
  status: 'PENDING_FUNDING' | 'FUNDED' | 'PARTIALLY_RELEASED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  milestones: Milestone[];
  transactions: EscrowTransaction[];
}

export interface EscrowTransaction {
  id: string;
  type: 'DEPOSIT' | 'MILESTONE_RELEASE' | 'PLATFORM_FEE' | 'REFUND' | 'CANCELLATION';
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  description?: string;
  executedAt?: string;
}

// Invoice
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'REMINDED' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'CREDITED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  craftsmanId: string;
  clientName: string;
  clientAddress: string;
  type: 'INVOICE' | 'CREDIT_NOTE' | 'PROFORMA' | 'PARTIAL' | 'FINAL';
  status: InvoiceStatus;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  dueDate: string;
  paidAt?: string;
  isGoBDCompliant: boolean;
  pdfUrl?: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// Subscription
export interface SubscriptionPlan {
  id: string;
  name: string;
  nameDe: string;
  slug: string;
  description: string;
  features: Record<string, any>;
  priceMonthly: number;
  priceYearly?: number;
  maxUsers: number;
  includesAi: boolean;
  includesEscrow: boolean;
  includesErp: boolean;
  includesTeam: boolean;
  isPopular: boolean;
}

// Review
export interface Review {
  id: string;
  projectId: string;
  authorId: string;
  craftsmanId: string;
  rating: number;
  title?: string;
  description?: string;
  isVerified: boolean;
  response?: string;
  author: { user: { firstName: string; lastName: string } };
  project: { title: string };
  createdAt: string;
}

// Message
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  projectId?: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'OFFER' | 'MILESTONE' | 'SYSTEM';
  isRead: boolean;
  sender: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'role'>;
  createdAt: string;
}

// Notification
export interface Notification {
  id: string;
  type: 'NEW_PROJECT' | 'NEW_OFFER' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED' | 'MILESTONE_COMPLETED' | 'MILESTONE_RELEASED' | 'PAYMENT_RECEIVED' | 'NEW_MESSAGE' | 'REVIEW_RECEIVED' | 'SUBSCRIPTION_EXPIRING' | 'VERIFICATION_STATUS' | 'SYSTEM';
  title: string;
  body?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// Material
export interface MaterialSupplier {
  id: string;
  name: string;
  logoUrl?: string;
  commissionRate: number;
}

export interface MaterialProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number;
  unit: string;
  supplier: Pick<MaterialSupplier, 'name' | 'logoUrl'>;
}

export interface MaterialOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  platformFee: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROCESS' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  supplier: Pick<MaterialSupplier, 'name' | 'logoUrl'>;
  items: MaterialOrderItem[];
  deliveryDate?: string;
  createdAt: string;
}

export interface MaterialOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// AI Analysis
export interface AIAnalysis {
  id: string;
  confidence: number;
  estimatedCosts?: { min: number; max: number; currency: string };
  estimatedDuration?: { min: number; max: number; unit: string };
  dinNormReferences?: string[];
  requiredMaterials?: Array<{ name: string; estimatedQuantity: string; unit: string }>;
}

// API Types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}
