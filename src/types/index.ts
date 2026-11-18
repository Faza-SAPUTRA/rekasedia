// Domain interfaces for RekaSedia
// Replaces widespread `any` usage across the application

export interface User {
  id: number;
  full_name: string;
  email: string;
  nip: string | null;
  role: 'admin' | 'guru';
  department: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  must_change_password?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Item {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  category_name: string;
  stock: number;
  unit: string;
  description: string | null;
  image_url: string | null;
  is_loanable: boolean;
  min_stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface RequestItem {
  id: number;
  req_code: string;
  item_id: number;
  item_name: string;
  item_description?: string;
  unit?: string;
  category_name?: string;
  requester_id: number;
  requester_name: string;
  requester_role?: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  priority?: 'REGULER' | 'URGENT';
  request_date: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
}

export interface Loan {
  id: number;
  loan_code: string;
  item_id: number;
  item_name: string;
  item_image?: string | null;
  borrower_id: number;
  borrower_name: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'DIPINJAM' | 'DIKEMBALIKAN' | 'TERLAMBAT';
  notes?: string | null;
  created_at?: string;
}

export interface LoanAvailability {
  item: Item;
  total_active: number;
  available: boolean;
}

export interface AuditLogEntry {
  id: number;
  actor_id: number;
  actor_name?: string;
  actor_email?: string;
  actor_role: string;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE';
  table_affected: string;
  record_id: number;
  change_details: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export interface AuditStats {
  total_logs: number;
  total_inserts: number;
  total_updates: number;
  total_deletes: number;
  today_count: number;
  week_count: number;
}

export interface MonthlyReport {
  id?: number;
  semester: string;
  month_name: string;
  month_order: number;
  total_items_ordered: number;
  total_assets_borrowed: number;
}

export interface TeacherReport {
  month_order: number;
  month_name: string;
  total_items_requested: number;
  request_count: number;
  pending_count: number;
  completed_request_count: number;
  loan_count: number;
  active_loan_count: number;
  returned_loan_count: number;
  status: string;
}

export interface TeacherReportResponse {
  stats: {
    totalItemsRequested: number;
    activeLoansCount: number;
    pendingRequestsCount: number;
    historyCount: number;
  };
  reports: TeacherReport[];
}

export interface DashboardStats {
  totalItems: number;
  activeLoans: number;
  pendingRequests: number;
  todayRequests: number;
  criticalStockCount: number;
  criticalItems: Item[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form data types
export interface ItemFormData {
  name: string;
  sku: string;
  category_id: number | string;
  category_name?: string;
  stock: number;
  unit: string;
  description: string;
  image_url: string | null;
  is_loanable: boolean;
  min_stock: number;
}

export interface LoanFormData {
  item_id: number;
  borrow_date: string;
  due_date: string;
  notes?: string;
}

export interface CartItem {
  item_id: number;
  item_name: string;
  quantity: number;
  priority: 'REGULER' | 'URGENT';
}
