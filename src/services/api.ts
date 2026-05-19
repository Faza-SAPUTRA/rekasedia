// ============================================
// RekaSedia — API Service Layer
// Wrapper fetch untuk semua endpoint backend
// With Mock Mode support for Vercel/Demos
// ============================================

import * as mockData from '../data/mockData';

const API_BASE = '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const MOCK_ITEMS_KEY = 'mock_items';
const MOCK_REQUESTS_KEY = 'mock_requests';
const MOCK_LOANS_KEY = 'mock_loans';
const MOCK_PENDING_USERS_KEY = 'mock_pending_users';
const MOCK_APPROVED_USERS_KEY = 'mock_approved_users';
const PROFILE_OVERRIDES_KEY = 'rekasedia_profile_overrides';

function getMockStorage() {
  localStorage.removeItem(MOCK_ITEMS_KEY);
  localStorage.removeItem(MOCK_REQUESTS_KEY);
  localStorage.removeItem(MOCK_LOANS_KEY);
  localStorage.removeItem(MOCK_PENDING_USERS_KEY);
  localStorage.removeItem(MOCK_APPROVED_USERS_KEY);
  return sessionStorage;
}

function readMockItems() {
  const saved = getMockStorage().getItem(MOCK_ITEMS_KEY);
  return saved ? JSON.parse(saved) : mockData.items;
}

function writeMockItems(items: any[]) {
  getMockStorage().setItem(MOCK_ITEMS_KEY, JSON.stringify(items));
}

function readMockRequests() {
  const saved = getMockStorage().getItem(MOCK_REQUESTS_KEY);
  const baseRequests = saved ? JSON.parse(saved) : mockData.requests;

  return baseRequests.map((request: any) => {
    if (request.requester_id) {
      return {
        ...request,
        request_date: normalizeMockDate(request.request_date),
      };
    }

    const matchedUser = [...mockData.users, ...readApprovedUsers()].find((user) => user.full_name === request.requester_name);
    return {
      ...request,
      requester_id: matchedUser?.id || 6,
      request_date: normalizeMockDate(request.request_date),
    };
  });
}

function writeMockRequests(requests: any[]) {
  getMockStorage().setItem(MOCK_REQUESTS_KEY, JSON.stringify(requests));
}

function readMockLoans() {
  const saved = getMockStorage().getItem(MOCK_LOANS_KEY);
  return saved ? JSON.parse(saved) : mockData.loans;
}

function writeMockLoans(loans: any[]) {
  getMockStorage().setItem(MOCK_LOANS_KEY, JSON.stringify(loans));
}

function readPendingUsers() {
  const saved = getMockStorage().getItem(MOCK_PENDING_USERS_KEY);
  return saved ? JSON.parse(saved) : [];
}

function writePendingUsers(users: any[]) {
  getMockStorage().setItem(MOCK_PENDING_USERS_KEY, JSON.stringify(users));
}

function readApprovedUsers() {
  const saved = getMockStorage().getItem(MOCK_APPROVED_USERS_KEY);
  return saved ? JSON.parse(saved) : [];
}

function writeApprovedUsers(users: any[]) {
  getMockStorage().setItem(MOCK_APPROVED_USERS_KEY, JSON.stringify(users));
}

function formatMockDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseMockDate(dateValue: string) {
  const parsed = new Date(dateValue);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const match = dateValue.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;

  const monthMap: Record<string, number> = {
    jan: 0,
    januari: 0,
    feb: 1,
    februari: 1,
    mar: 2,
    maret: 2,
    apr: 3,
    april: 3,
    mei: 4,
    jun: 5,
    juni: 5,
    jul: 6,
    juli: 6,
    agu: 7,
    agustus: 7,
    sep: 8,
    september: 8,
    okt: 9,
    oktober: 9,
    nov: 10,
    november: 10,
    des: 11,
    desember: 11,
  };

  const [, day, monthName, year] = match;
  const month = monthMap[monthName.toLowerCase()];
  if (month === undefined) return null;

  return new Date(Number(year), month, Number(day));
}

function normalizeMockDate(dateValue: string) {
  const parsed = parseMockDate(dateValue);
  return parsed ? formatMockDate(parsed) : dateValue;
}

function isToday(dateValue: string) {
  const parsed = parseMockDate(dateValue);
  return parsed ? formatMockDate(parsed) === formatMockDate(new Date()) : false;
}

function readProfileOverrides(): Record<string, Partial<UserProfile>> {
  const saved = localStorage.getItem(PROFILE_OVERRIDES_KEY);
  if (!saved) return {};

  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

function writeProfileOverrides(overrides: Record<string, Partial<UserProfile>>) {
  localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(overrides));
}

function applyProfileOverride<T extends UserProfile>(user: T): T {
  const override = readProfileOverrides()[String(user.id)];
  return override ? { ...user, ...override, id: user.id, email: user.email, role: user.role } : user;
}

// --- Helper: get token dari localStorage ---
function getToken(): string | null {
  return localStorage.getItem('rekasedia_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function parseJsonResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const text = await res.text();
  let data: any = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`${fallbackError}. Server tidak mengembalikan JSON valid.`);
    }
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || fallbackError);
  }

  return data as T;
}

// --- Auth ---
export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: string;
  department: string;
  avatar_color?: string;
}

export type EditableUserProfile = Pick<UserProfile, 'full_name' | 'department' | 'avatar_color'>;

export interface PendingUser {
  id: number;
  full_name: string;
  email: string;
  role: 'guru';
  department: string;
  request_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (USE_MOCK) {
    console.log('[MOCK] Login attempt:', email);
    
    const loginValue = email.trim().toLowerCase();
    let targetEmail = loginValue;
    if (/^\d{8,20}$/.test(loginValue)) {
      const matchedByNip = [...mockData.users, ...readApprovedUsers()]
        .find((u: any) => String(u.department || '').includes(loginValue));
      if (!matchedByNip) throw new Error('NIP tidak ditemukan atau belum disetujui admin.');
      targetEmail = matchedByNip.email;
    }

    const pendingUser = readPendingUsers().find((u: PendingUser) => u.email === targetEmail && u.status === 'PENDING');
    if (pendingUser) {
      throw new Error('Akun Anda masih menunggu persetujuan admin.');
    }

    const approvedUser = readApprovedUsers().find((u: PendingUser) => u.email === targetEmail && u.status === 'APPROVED');
    const user = approvedUser || mockData.users.find(u => u.email === targetEmail);
    if (!user) {
      throw new Error('Akun tidak ditemukan atau belum disetujui admin.');
    }
    return {
      token: 'mock-jwt-token-12345',
      user: applyProfileOverride({ ...user })
    };
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJsonResponse<LoginResponse>(res, 'Login gagal');
}

export async function register(data: { full_name: string; email: string; password: string; role?: string; department?: string }): Promise<LoginResponse> {
  if (USE_MOCK) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingBaseUser = mockData.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    const existingApprovedUser = readApprovedUsers().find((u: PendingUser) => u.email.toLowerCase() === normalizedEmail);
    const existingPendingUser = readPendingUsers().find((u: PendingUser) => u.email.toLowerCase() === normalizedEmail && u.status === 'PENDING');

    if (existingBaseUser || existingApprovedUser || existingPendingUser) {
      throw new Error('Email sudah terdaftar atau sedang menunggu persetujuan.');
    }

    const newUser: PendingUser = {
      id: Date.now(),
      full_name: data.full_name,
      email: normalizedEmail,
      role: 'guru',
      department: data.department || 'Guru',
      request_date: formatMockDate(new Date()),
      status: 'PENDING'
    };
    writePendingUsers([newUser, ...readPendingUsers()]);

    return {
      token: 'mock-jwt-token-new',
      user: newUser
    };
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonResponse<LoginResponse>(res, 'Registrasi gagal');
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  if (USE_MOCK) {
    const normalizedEmail = email.trim().toLowerCase();
    const knownUser = [...mockData.users, ...readApprovedUsers()]
      .find((user) => user.email.toLowerCase() === normalizedEmail);

    return {
      message: knownUser
        ? 'Instruksi pemulihan dikirim dalam mode demo.'
        : 'Jika email terdaftar, instruksi akan dikirim.'
    };
  }

  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJsonResponse<{ message: string }>(res, 'Gagal mengirim instruksi');
}

export async function fetchPendingUsers(): Promise<PendingUser[]> {
  if (USE_MOCK) {
    return readPendingUsers().filter((user: PendingUser) => user.status === 'PENDING');
  }
  return [];
}

export async function updateUserApproval(id: number, status: 'APPROVED' | 'REJECTED') {
  if (USE_MOCK) {
    const pendingUsers = readPendingUsers();
    const targetUser = pendingUsers.find((user: PendingUser) => user.id === id);
    const updatedPendingUsers = pendingUsers
      .map((user: PendingUser) => user.id === id ? { ...user, status } : user)
      .filter((user: PendingUser) => user.status === 'PENDING');
    writePendingUsers(updatedPendingUsers);

    if (status === 'APPROVED' && targetUser) {
      writeApprovedUsers([{ ...targetUser, status: 'APPROVED' }, ...readApprovedUsers()]);
    }

    return { message: `Akun ${status === 'APPROVED' ? 'disetujui' : 'ditolak'} (MOCK)` };
  }
  return { message: 'OK' };
}

// --- Items ---
export async function fetchItems(): Promise<any[]> {
  if (USE_MOCK) return readMockItems();

  const res = await fetch(`${API_BASE}/items`, { headers: authHeaders() });
  return parseJsonResponse<any[]>(res, 'Gagal mengambil data barang');
}

export async function fetchCategories(): Promise<any[]> {
  if (USE_MOCK) return mockData.categories;

  const res = await fetch(`${API_BASE}/items/categories/all`, { headers: authHeaders() });
  return parseJsonResponse<any[]>(res, 'Gagal mengambil data kategori');
}

export async function addItem(data: any) {
  if (USE_MOCK) {
    console.log('[MOCK] Add item:', data);
    const items = readMockItems();
    const newItem = { id: Date.now(), image_url: null, is_loanable: false, ...data, stock: Math.max(0, Number(data.stock) || 0) };
    writeMockItems([newItem, ...items]);
    return { ...newItem, message: 'Barang berhasil ditambahkan (MOCK)' };
  }
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse(res, 'Gagal menambah barang');
}

export async function updateItem(id: number, data: any) {
  if (USE_MOCK) {
    console.log('[MOCK] Update item:', id, data);
    const items = readMockItems();
    const normalizedData = { ...data, stock: Math.max(0, Number(data.stock) || 0) };
    writeMockItems(items.map((item: any) => (item.id === id ? { ...item, ...normalizedData } : item)));
    return { message: 'Barang berhasil diperbarui (MOCK)' };
  }
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse(res, 'Gagal memperbarui barang');
}

export async function deleteItem(id: number) {
  if (USE_MOCK) {
    console.log('[MOCK] Delete item:', id);
    writeMockItems(readMockItems().filter((item: any) => item.id !== id));
    return { message: 'Barang berhasil dihapus (MOCK)' };
  }
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseJsonResponse(res, 'Gagal menghapus barang');
}

// --- Requests ---
export async function fetchRequests(): Promise<any[]> {
  if (USE_MOCK) {
    return readMockRequests();
  }

  const res = await fetch(`${API_BASE}/requests`, { headers: authHeaders() });
  return parseJsonResponse<any[]>(res, 'Gagal mengambil data permintaan');
}

export async function createRequest(items: { item_id: number; quantity: number }[], requester_id: number) {
  if (USE_MOCK) {
    console.log('[MOCK] Create request:', items);
    const existing = readMockRequests();
    const inventoryItems = readMockItems();
    const requester = [...mockData.users, ...readApprovedUsers()].find((user) => user.id === requester_id);
    const today = formatMockDate(new Date());
    
    const newRequests = items.map((requestedItem, index) => {
      const item = inventoryItems.find((inventoryItem: any) => inventoryItem.id === requestedItem.item_id);
      const timestamp = Date.now() + index;

      return {
          id: timestamp,
          req_code: `REQ-MOCK-${timestamp.toString().slice(-4)}`,
          item_id: requestedItem.item_id,
          item_name: item?.name || 'Unknown Item',
          requester_id,
          requester_name: requester?.full_name || 'User Mock',
          requester_role: requester?.department || requester?.role || 'Guru',
          quantity: requestedItem.quantity,
          request_date: today,
          status: 'PENDING',
          priority: item?.stock <= 5 ? 'URGENT' : 'REGULER'
      };
    });
    
    writeMockRequests([...newRequests, ...existing]);
    return { message: 'Permintaan berhasil (MOCK)' };
  }

  const res = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ items, requester_id }),
  });
  return parseJsonResponse(res, 'Gagal membuat permintaan');
}

export async function updateRequestStatus(id: number, status: 'APPROVED' | 'REJECTED', reviewed_by?: number) {
  if (USE_MOCK) {
    const existing = readMockRequests();
    const targetRequest = existing.find((request: any) => request.id === id);

    const updatedRequests = existing.map((request: any) => 
      request.id === id
        ? { ...request, status, reviewed_by, reviewed_at: formatMockDate(new Date()) }
        : request
    );
    writeMockRequests(updatedRequests);

    if (status === 'APPROVED' && targetRequest && targetRequest.status !== 'APPROVED') {
      const updatedItems = readMockItems().map((item: any) => 
        item.id === targetRequest.item_id
          ? { ...item, stock: Math.max(0, item.stock - targetRequest.quantity) }
          : item
      );
      writeMockItems(updatedItems);
    }

    return { message: 'Status diupdate (MOCK)' };
  }

  const res = await fetch(`${API_BASE}/requests/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status, reviewed_by }),
  });
  return parseJsonResponse(res, 'Gagal mengupdate permintaan');
}

// --- Loans ---
export async function fetchLoans(): Promise<any[]> {
  if (USE_MOCK) {
    const items = readMockItems();
    return readMockLoans().map((loan: any) => {
      const item = items.find((inventoryItem: any) => inventoryItem.id === loan.item_id);
      return {
        ...loan,
        item_image: item?.image_url || loan.item_image,
      };
    });
  }

  const res = await fetch(`${API_BASE}/loans`, { headers: authHeaders() });
  return parseJsonResponse<any[]>(res, 'Gagal mengambil data peminjaman');
}

export async function returnLoan(id: number) {
  if (USE_MOCK) {
    const loans = readMockLoans();
    writeMockLoans(loans.map((loan: any) => (
      loan.id === id ? { ...loan, status: 'DIKEMBALIKAN', returned_at: formatMockDate(new Date()) } : loan
    )));
    return { message: 'Barang dikembalikan (MOCK)' };
  }

  const res = await fetch(`${API_BASE}/loans/${id}/return`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  return parseJsonResponse(res, 'Gagal mengembalikan barang');
}

// --- Reports & Stats ---
export async function fetchReports(): Promise<any[]> {
  if (USE_MOCK) return mockData.monthlyReports;

  const res = await fetch(`${API_BASE}/reports`, { headers: authHeaders() });
  return parseJsonResponse<any[]>(res, 'Gagal mengambil data laporan');
}

export interface DashboardStats {
  totalItems: number;
  activeLoans: number;
  pendingRequests: number;
  todayRequests: number;
  criticalStockCount: number;
  criticalItems: Array<{ id: number; name: string; stock: number; category_name: string; unit: string; image_url?: string }>;
}

export async function fetchStats(): Promise<DashboardStats> {
  if (USE_MOCK) {
    const items = readMockItems();
    const requests = readMockRequests();
    const criticalItems = items.filter((item: any) => item.stock <= 3 && !item.is_loanable);

    return {
      totalItems: items.reduce((sum: number, item: any) => sum + item.stock, 0),
      activeLoans: readMockLoans().filter((loan: any) => loan.status === 'DIPINJAM').length,
      pendingRequests: requests.filter((request: any) => request.status === 'PENDING').length,
      todayRequests: requests.filter((request: any) => isToday(request.request_date)).length,
      criticalStockCount: criticalItems.length,
      criticalItems: criticalItems.map((i: any) => ({
        id: i.id,
        name: i.name,
        stock: i.stock,
        category_name: i.category_name,
        unit: i.unit
      }))
    };
  }

  const res = await fetch(`${API_BASE}/reports/stats`, { headers: authHeaders() });
  return parseJsonResponse(res, 'Gagal mengambil statistik');
}

// --- Teacher Specific Mock ---
export interface TeacherStats {
  totalItemsRequested: number;
  activeLoansCount: number;
  pendingRequestsCount: number;
  historyCount: number;
}

export interface TeacherReportResponse {
  stats: TeacherStats;
  reports: Array<{
    month_name: string;
    month_order: number;
    total_items_requested: number;
    request_count: number;
    loan_count: number;
    status: string;
  }>;
}

export async function fetchTeacherReport(userId: number): Promise<TeacherReportResponse> {
  if (USE_MOCK) {
    const userLoans = readMockLoans().filter((loan: any) => loan.borrower_id === userId);
    const userRequests = readMockRequests().filter((request: any) => request.requester_id === userId);
    const completedRequests = userRequests.filter((request: any) => request.status !== 'PENDING');

    return {
      stats: {
        totalItemsRequested: userRequests.reduce((sum: number, request: any) => sum + request.quantity, 0),
        activeLoansCount: userLoans.filter((loan: any) => loan.status === 'DIPINJAM').length,
        pendingRequestsCount: userRequests.filter((request: any) => request.status === 'PENDING').length,
        historyCount: userLoans.length + completedRequests.length
      },
      reports: mockData.monthlyReports.map((report) => ({
        month_name: report.month_name,
        month_order: report.month_order,
        total_items_requested: Math.floor(report.total_items_ordered / 5),
        request_count: Math.floor(report.total_items_ordered / 25),
        loan_count: Math.floor(report.total_assets_borrowed / 3),
        status: 'Tervalidasi'
      }))
    };
  }

  const res = await fetch(`${API_BASE}/reports/teacher/${userId}`, { headers: authHeaders() });
  return parseJsonResponse<TeacherReportResponse>(res, 'Gagal mengambil laporan guru');
}

export async function fetchTeacherStats(userId: number): Promise<TeacherStats> {
  if (USE_MOCK) {
    const userLoans = readMockLoans().filter((loan: any) => loan.borrower_id === userId);
    const userRequests = readMockRequests().filter((request: any) => request.requester_id === userId);
    const completedRequests = userRequests.filter((request: any) => request.status !== 'PENDING');

    return {
      totalItemsRequested: userRequests.reduce((sum: number, request: any) => sum + request.quantity, 0),
      activeLoansCount: userLoans.filter((loan: any) => loan.status === 'DIPINJAM').length,
      pendingRequestsCount: userRequests.filter((request: any) => request.status === 'PENDING').length,
      historyCount: userLoans.length + completedRequests.length
    };
  }
  const report = await fetchTeacherReport(userId);
  return report.stats;
}

// --- Session helpers ---
export function saveSession(token: string, user: LoginResponse['user']) {
  localStorage.setItem('rekasedia_token', token);
  localStorage.setItem('rekasedia_user', JSON.stringify(applyProfileOverride(user)));
}

export function getUser(): LoginResponse['user'] | null {
  const raw = localStorage.getItem('rekasedia_user');
  return raw ? applyProfileOverride(JSON.parse(raw)) : null;
}

export function updateCurrentUserProfile(data: EditableUserProfile): LoginResponse['user'] {
  const currentUser = getUser();
  if (!currentUser) {
    throw new Error('User belum login.');
  }

  const normalizedProfile = {
    full_name: data.full_name.trim(),
    department: data.department.trim(),
    avatar_color: data.avatar_color,
  };

  if (!normalizedProfile.full_name || !normalizedProfile.department) {
    throw new Error('Nama dan jabatan tidak boleh kosong.');
  }

  const overrides = readProfileOverrides();
  overrides[String(currentUser.id)] = {
    ...overrides[String(currentUser.id)],
    ...normalizedProfile,
  };
  writeProfileOverrides(overrides);

  const updatedUser = applyProfileOverride({ ...currentUser, ...normalizedProfile });
  localStorage.setItem('rekasedia_user', JSON.stringify(updatedUser));
  return updatedUser;
}

export function logout() {
  localStorage.removeItem('rekasedia_token');
  localStorage.removeItem('rekasedia_user');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
