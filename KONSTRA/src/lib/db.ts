import type { Project, Worker, AttendanceRecord, Kasbon, Expense, Quotation } from '@/types';

const PROJECTS_KEY   = 'konstra_projects';
const WORKERS_KEY    = 'konstra_workers';
const ATTENDANCE_KEY = 'konstra_attendance';
const KASBON_KEY     = 'konstra_kasbon';
const EXPENSES_KEY   = 'konstra_expenses';
const QUOTATIONS_KEY = 'konstra_quotations';

// ─── Seed Data ─────────────────────────────────────────────────────────────
const defaultProjects: Project[] = [
  {
    id: 'proj-1', name: 'Rumah Pak Budi – Rangka Atap Baja Ringan',
    clientName: 'Budi Santoso', clientPhone: '081234567890',
    address: 'Jl. Melati No. 12, Bandung', status: 'in_progress',
    startDate: '2026-04-25', notes: 'Atap pelana, luas 72m², bahan baja ringan galvalum',
    createdAt: new Date('2026-04-20').toISOString(),
  },
  {
    id: 'proj-2', name: 'Ruko Bu Sari – Plafon PVC',
    clientName: 'Sari Dewi', clientPhone: '082198765432',
    address: 'Jl. Raya Cimahi No. 45, Cimahi', status: 'survey',
    startDate: '2026-05-05', notes: 'Plafon PVC motif kayu, tinggi 3m',
    createdAt: new Date('2026-04-28').toISOString(),
  },
  {
    id: 'proj-3', name: 'Gudang Pak Dani – Rangka + Spandek',
    clientName: 'Dani Pratama', clientPhone: '085611223344',
    address: 'Jl. Industri Blok B No. 7, Padalarang', status: 'done',
    startDate: '2026-04-01', endDate: '2026-04-18',
    createdAt: new Date('2026-03-25').toISOString(),
  },
  {
    id: 'proj-4', name: 'Villa Pak Herman – Atap Perisai',
    clientName: 'Herman Wijaya', clientPhone: '081398765001',
    address: 'Perumahan Griya Asri Blok C-12, Lembang', status: 'pending',
    startDate: '2026-05-15', notes: 'Atap perisai, kemiringan 35°',
    createdAt: new Date('2026-04-29').toISOString(),
  },
];

const defaultWorkers: Worker[] = [
  { id: 'wkr-1', name: 'Asep Sunandar', role: 'head_builder', dailyRate: 250000, phone: '081320001234', isActive: true, createdAt: new Date('2026-01-01').toISOString() },
  { id: 'wkr-2', name: 'Ujang Saepudin', role: 'helper', dailyRate: 150000, phone: '082300001111', isActive: true, createdAt: new Date('2026-01-01').toISOString() },
  { id: 'wkr-3', name: 'Dede Kurniawan', role: 'helper', dailyRate: 150000, phone: '083900002222', isActive: true, createdAt: new Date('2026-02-15').toISOString() },
  { id: 'wkr-4', name: 'Rian Hidayat', role: 'helper', dailyRate: 150000, phone: '089500003333', isActive: false, createdAt: new Date('2026-03-01').toISOString() },
];

function generateSampleAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const allStatuses: AttendanceRecord['status'][] = ['full_day', 'full_day', 'half_day', 'full_day', 'absent', 'full_day', 'overtime'];
  const today = new Date();
  ['wkr-1', 'wkr-2', 'wkr-3'].forEach((workerId, wi) => {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const status = allStatuses[(wi + d) % allStatuses.length];
      records.push({ id: `att-${workerId}-${dateStr}`, date: dateStr, projectId: 'proj-1', workerId, status, overtimeHours: status === 'overtime' ? 3 : undefined });
    }
  });
  return records;
}

const defaultKasbon: Kasbon[] = [
  { id: 'kb-1', workerId: 'wkr-1', projectId: 'proj-1', date: '2026-04-28', amount: 100000, description: 'Kasbon minggu ini' },
  { id: 'kb-2', workerId: 'wkr-2', projectId: 'proj-1', date: '2026-04-29', amount: 50000, description: 'Kasbon transport' },
];

const defaultExpenses: Expense[] = [
  { id: 'exp-1', projectId: 'proj-1', date: '2026-04-26', category: 'material', description: 'Kanal C 75 – 20 batang', amount: 1600000, createdAt: new Date('2026-04-26').toISOString() },
  { id: 'exp-2', projectId: 'proj-1', date: '2026-04-26', category: 'material', description: 'Reng 35 – 30 batang', amount: 870000, createdAt: new Date('2026-04-26').toISOString() },
  { id: 'exp-3', projectId: 'proj-1', date: '2026-04-27', category: 'transport', description: 'Sewa pickup angkut material', amount: 350000, createdAt: new Date('2026-04-27').toISOString() },
  { id: 'exp-4', projectId: 'proj-1', date: '2026-04-28', category: 'material', description: 'Spandek 0.3mm – 40 lembar', amount: 3200000, createdAt: new Date('2026-04-28').toISOString() },
  { id: 'exp-5', projectId: 'proj-3', date: '2026-04-05', category: 'material', description: 'Material rangka lengkap', amount: 4500000, createdAt: new Date('2026-04-05').toISOString() },
  { id: 'exp-6', projectId: 'proj-3', date: '2026-04-10', category: 'labor', description: 'Upah tukang minggu 1', amount: 2800000, createdAt: new Date('2026-04-10').toISOString() },
];

// ─── Generic Storage Helpers ───────────────────────────────────────────────
function getStorage<T>(key: string, defaults: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) { localStorage.setItem(key, JSON.stringify(defaults)); return defaults; }
    return JSON.parse(raw) as T[];
  } catch { return defaults; }
}
function setStorage<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }

// ─── DB Object ─────────────────────────────────────────────────────────────
export const db = {
  projects: {
    getAll: (): Project[] => getStorage(PROJECTS_KEY, defaultProjects),
    get: (id: string) => db.projects.getAll().find(p => p.id === id),
    save: (p: Project) => { const all = db.projects.getAll().filter(x => x.id !== p.id); setStorage(PROJECTS_KEY, [...all, p]); },
    delete: (id: string) => setStorage(PROJECTS_KEY, db.projects.getAll().filter(p => p.id !== id)),
  },

  workers: {
    getAll: (): Worker[] => getStorage(WORKERS_KEY, defaultWorkers),
    getActive: () => db.workers.getAll().filter(w => w.isActive),
    get: (id: string) => db.workers.getAll().find(w => w.id === id),
    save: (w: Worker) => { const all = db.workers.getAll().filter(x => x.id !== w.id); setStorage(WORKERS_KEY, [...all, w]); },
    delete: (id: string) => setStorage(WORKERS_KEY, db.workers.getAll().filter(w => w.id !== id)),
  },

  attendance: {
    getAll: (): AttendanceRecord[] => getStorage(ATTENDANCE_KEY, generateSampleAttendance()),
    getByDateAndProject: (date: string, projectId: string) =>
      db.attendance.getAll().filter(a => a.date === date && a.projectId === projectId),
    getByWorkerDateRange: (workerId: string, from: string, to: string) =>
      db.attendance.getAll().filter(a => a.workerId === workerId && a.date >= from && a.date <= to),
    save: (r: AttendanceRecord) => { const all = db.attendance.getAll().filter(x => x.id !== r.id); setStorage(ATTENDANCE_KEY, [...all, r]); },
    upsert: (date: string, projectId: string, workerId: string, status: AttendanceRecord['status'], overtimeHours?: number) => {
      const existing = db.attendance.getAll().find(a => a.date === date && a.projectId === projectId && a.workerId === workerId);
      const record: AttendanceRecord = { id: existing?.id ?? `att-${workerId}-${date}-${Date.now()}`, date, projectId, workerId, status, overtimeHours };
      db.attendance.save(record);
      return record;
    },
  },

  kasbon: {
    getAll: (): Kasbon[] => getStorage(KASBON_KEY, defaultKasbon),
    getByWorkerDateRange: (workerId: string, from: string, to: string) =>
      db.kasbon.getAll().filter(k => k.workerId === workerId && k.date >= from && k.date <= to),
    save: (k: Kasbon) => { const all = db.kasbon.getAll().filter(x => x.id !== k.id); setStorage(KASBON_KEY, [...all, k]); },
    delete: (id: string) => setStorage(KASBON_KEY, db.kasbon.getAll().filter(k => k.id !== id)),
  },

  expenses: {
    getAll: (): Expense[] => getStorage(EXPENSES_KEY, defaultExpenses),
    getByProject: (projectId: string) => db.expenses.getAll().filter(e => e.projectId === projectId),
    save: (e: Expense) => { const all = db.expenses.getAll().filter(x => x.id !== e.id); setStorage(EXPENSES_KEY, [...all, e]); },
    delete: (id: string) => setStorage(EXPENSES_KEY, db.expenses.getAll().filter(e => e.id !== id)),
    totalByProject: (projectId: string) => db.expenses.getByProject(projectId).reduce((s, e) => s + e.amount, 0),
  },

  quotations: {
    getAll: (): Quotation[] => getStorage(QUOTATIONS_KEY, []),
    get: (id: string) => db.quotations.getAll().find(q => q.id === id),
    getByProject: (projectId: string) => db.quotations.getAll().filter(q => q.input.projectId === projectId),
    save: (q: Quotation) => { const all = db.quotations.getAll().filter(x => x.id !== q.id); setStorage(QUOTATIONS_KEY, [...all, q]); },
    delete: (id: string) => setStorage(QUOTATIONS_KEY, db.quotations.getAll().filter(q => q.id !== id)),
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr + 'T00:00:00'));
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }).format(new Date(dateStr + 'T00:00:00'));
}

export function getTodayStr(): string { return new Date().toISOString().split('T')[0]; }

export function getWeekRange(referenceDate: Date = new Date()): { from: string; to: string } {
  const day = referenceDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: monday.toISOString().split('T')[0], to: sunday.toISOString().split('T')[0] };
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  material: 'Material', transport: 'Transport', tool: 'Alat', labor: 'Tenaga Kerja', other: 'Lainnya',
};
export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  material: 'avatar-blue', transport: 'avatar-amber', tool: 'avatar-violet', labor: 'avatar-green', other: 'avatar-sky',
};
