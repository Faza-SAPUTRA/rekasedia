// ============================================
// RekaSedia — API Service Layer
// Wrapper fetch untuk semua endpoint backend
// With Mock Mode support for Vercel/Demos
// ============================================

import * as mockData from '../data/mockData';

const API_BASE = '/api';
const USE_MOCK = true; // FORCE MOCK MODE FOR PRESENTATION

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
  if (USE_MOCK) {
    console.log('[MOCK] Login attempt:', email);
    
    // Support simple aliases for easier demos
    let targetEmail = email;
    if (email.toLowerCase() === 'admin') targetEmail = 'admin@rekasedia.sch.id';
    if (email.toLowerCase() === 'guru') targetEmail = 'sarah.putri@rekasedia.sch.id';

    const user = mockData.users.find(u => u.email === targetEmail) || mockData.users[0];
    return {
      token: 'mock-jwt-token-12345',
      user: { ...user }
    };
  }

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
  if (USE_MOCK) {
    return {
      token: 'mock-jwt-token-new',
      user: { id: Date.now(), full_name: data.full_name, email: data.email, role: (data.role as any) || 'guru', department: data.department || 'Umum' }
    };
  }

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
  if (USE_MOCK) return mockData.items;

  const res = await fetch(`${API_BASE}/items`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data barang');
  return res.json();
}

export async function fetchCategories() {
  if (USE_MOCK) return mockData.categories;

  const res = await fetch(`${API_BASE}/items/categories/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data kategori');
  return res.json();
}

export async function addItem(data: any) {
  if (USE_MOCK) {
    console.log('[MOCK] Add item:', data);
    return { id: Date.now(), ...data, message: 'Barang berhasil ditambahkan (MOCK)' };
  }
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal menambah barang');
  return res.json();
}

export async function updateItem(id: number, data: any) {
  if (USE_MOCK) {
    console.log('[MOCK] Update item:', id, data);
    return { message: 'Barang berhasil diperbarui (MOCK)' };
  }
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal memperbarui barang');
  return res.json();
}

export async function deleteItem(id: number) {
  if (USE_MOCK) {
    console.log('[MOCK] Delete item:', id);
    return { message: 'Barang berhasil dihapus (MOCK)' };
  }
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal menghapus barang');
  return res.json();
}

// --- Requests ---
export async function fetchRequests() {
  if (USE_MOCK) {
    const saved = localStorage.getItem('mock_requests');
    return saved ? JSON.parse(saved) : mockData.requests;
  }

  const res = await fetch(`${API_BASE}/requests`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data permintaan');
  return res.json();
}

export async function createRequest(items: { item_id: number; quantity: number }[], requester_id: number) {
  if (USE_MOCK) {
    console.log('[MOCK] Create request:', items);
    const existingRaw = localStorage.getItem('mock_requests');
    const existing = existingRaw ? JSON.parse(existingRaw) : [...mockData.requests];
    
    // Add new (simplified mock)
    const newReq = {
        id: Date.now(),
        req_code: `REQ-MOCK-${Date.now().toString().slice(-4)}`,
        item_id: items[0].item_id,
        item_name: mockData.items.find(i => i.id === items[0].item_id)?.name || 'Unknown Item',
        requester_name: 'User Mock',
        requester_role: 'guru',
        quantity: items[0].quantity,
        request_date: new Date().toLocaleDateString(),
        status: 'PENDING',
        priority: 'REGULER'
    };
    
    const updated = [newReq, ...existing];
    localStorage.setItem('mock_requests', JSON.stringify(updated));
    return { message: 'Permintaan berhasil (MOCK)' };
  }

  const res = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ items, requester_id }),
  });
  if (!res.ok) throw new Error('Gagal membuat permintaan');
  return res.json();
}

export async function updateRequestStatus(id: number, status: 'APPROVED' | 'REJECTED', reviewed_by?: number) {
  if (USE_MOCK) {
    const existingRaw = localStorage.getItem('mock_requests');
    let existing = existingRaw ? JSON.parse(existingRaw) : [...mockData.requests];
    existing = existing.map((r: any) => r.id === id ? { ...r, status } : r);
    localStorage.setItem('mock_requests', JSON.stringify(existing));
    return { message: 'Status diupdate (MOCK)' };
  }

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
  if (USE_MOCK) return mockData.loans;

  const res = await fetch(`${API_BASE}/loans`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data peminjaman');
  return res.json();
}

export async function returnLoan(id: number) {
  if (USE_MOCK) return { message: 'Barang dikembalikan (MOCK)' };

  const res = await fetch(`${API_BASE}/loans/${id}/return`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal mengembalikan barang');
  return res.json();
}

// --- Reports & Stats ---
export async function fetchReports() {
  if (USE_MOCK) return mockData.monthlyReports;

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
  if (USE_MOCK) {
    return {
      totalItems: mockData.getTotalItemsCount(),
      activeLoans: mockData.loans.length,
      pendingRequests: mockData.requests.filter(r => r.status === 'PENDING').length,
      criticalStockCount: mockData.getCriticalStockItems().length,
      criticalItems: mockData.getCriticalStockItems().map(i => ({
        id: i.id,
        name: i.name,
        stock: i.stock,
        category_name: i.category_name,
        unit: i.unit
      }))
    };
  }

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
