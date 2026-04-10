// ============================================
// RekaSedia — API Service Layer
// Wrapper fetch untuk semua endpoint backend
// ============================================

const API_BASE = '/api';

// --- Helper: get token dari localStorage ---
function getToken(): string | null {
  return localStorage.getItem('rekasedia_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// --- Auth ---
export interface LoginResponse {
  token: string;
  user: { id: number; full_name: string; email: string; role: string; department: string };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login gagal');
  }
  return res.json();
}

export async function register(data: { full_name: string; email: string; password: string; role?: string; department?: string }): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registrasi gagal');
  }
  return res.json();
}

// --- Items ---
export async function fetchItems() {
  const res = await fetch(`${API_BASE}/items`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data barang');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/items/categories/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data kategori');
  return res.json();
}

// --- Requests ---
export async function fetchRequests() {
  const res = await fetch(`${API_BASE}/requests`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data permintaan');
  return res.json();
}

export async function createRequest(items: { item_id: number; quantity: number }[], requester_id: number) {
  const res = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ items, requester_id }),
  });
  if (!res.ok) throw new Error('Gagal membuat permintaan');
  return res.json();
}

export async function updateRequestStatus(id: number, status: 'APPROVED' | 'REJECTED', reviewed_by?: number) {
  const res = await fetch(`${API_BASE}/requests/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status, reviewed_by }),
  });
  if (!res.ok) throw new Error('Gagal mengupdate permintaan');
  return res.json();
}

// --- Loans ---
export async function fetchLoans() {
  const res = await fetch(`${API_BASE}/loans`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data peminjaman');
  return res.json();
}

export async function returnLoan(id: number) {
  const res = await fetch(`${API_BASE}/loans/${id}/return`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal mengembalikan barang');
  return res.json();
}

// --- Reports & Stats ---
export async function fetchReports() {
  const res = await fetch(`${API_BASE}/reports`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data laporan');
  return res.json();
}

export interface DashboardStats {
  totalItems: number;
  activeLoans: number;
  pendingRequests: number;
  criticalStockCount: number;
  criticalItems: Array<{ id: number; name: string; stock: number; category_name: string; unit: string }>;
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/reports/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil statistik');
  return res.json();
}

// --- Session helpers ---
export function saveSession(token: string, user: LoginResponse['user']) {
  localStorage.setItem('rekasedia_token', token);
  localStorage.setItem('rekasedia_user', JSON.stringify(user));
}

export function getUser(): LoginResponse['user'] | null {
  const raw = localStorage.getItem('rekasedia_user');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem('rekasedia_token');
  localStorage.removeItem('rekasedia_user');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
