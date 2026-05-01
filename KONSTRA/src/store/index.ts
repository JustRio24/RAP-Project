import { create } from 'zustand';
import type { Project, Worker, AttendanceRecord, Kasbon, Expense, Quotation, AttendanceStatus, PayrollEntry } from '@/types';
import { db, generateId, getWeekRange } from '@/lib/db';

// ─── Projects ──────────────────────────────────────────────────────────────
interface ProjectState {
  projects: Project[];
  loadProjects: () => void;
  addProject: (data: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}
export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loadProjects: () => set({ projects: db.projects.getAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) }),
  addProject: (data) => {
    const p: Project = { ...data, id: generateId('proj'), createdAt: new Date().toISOString() };
    db.projects.save(p);
    set({ projects: db.projects.getAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
    return p;
  },
  updateProject: (id, updates) => {
    const p = db.projects.get(id); if (!p) return;
    db.projects.save({ ...p, ...updates });
    set({ projects: db.projects.getAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  },
  deleteProject: (id) => { db.projects.delete(id); set({ projects: db.projects.getAll() }); },
}));

// ─── Workers ───────────────────────────────────────────────────────────────
interface WorkerState {
  workers: Worker[];
  loadWorkers: () => void;
  addWorker: (data: Omit<Worker, 'id' | 'createdAt'>) => Worker;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  toggleActive: (id: string) => void;
  deleteWorker: (id: string) => void;
}
export const useWorkerStore = create<WorkerState>((set) => ({
  workers: [],
  loadWorkers: () => set({ workers: db.workers.getAll() }),
  addWorker: (data) => {
    const w: Worker = { ...data, id: generateId('wkr'), createdAt: new Date().toISOString() };
    db.workers.save(w); set({ workers: db.workers.getAll() }); return w;
  },
  updateWorker: (id, updates) => {
    const w = db.workers.get(id); if (!w) return;
    db.workers.save({ ...w, ...updates }); set({ workers: db.workers.getAll() });
  },
  toggleActive: (id) => {
    const w = db.workers.get(id); if (!w) return;
    db.workers.save({ ...w, isActive: !w.isActive }); set({ workers: db.workers.getAll() });
  },
  deleteWorker: (id) => { db.workers.delete(id); set({ workers: db.workers.getAll() }); },
}));

// ─── Attendance ────────────────────────────────────────────────────────────
interface AttendanceState {
  records: AttendanceRecord[];
  loadForDateProject: (date: string, projectId: string) => void;
  markAttendance: (date: string, projectId: string, workerId: string, status: AttendanceStatus) => void;
  computePayroll: (workerId: string, from: string, to: string) => PayrollEntry | null;
}
export const useAttendanceStore = create<AttendanceState>((set) => ({
  records: [],
  loadForDateProject: (date, projectId) => set({ records: db.attendance.getByDateAndProject(date, projectId) }),
  markAttendance: (date, projectId, workerId, status) => {
    db.attendance.upsert(date, projectId, workerId, status);
    set({ records: db.attendance.getByDateAndProject(date, projectId) });
  },
  computePayroll: (workerId, from, to) => {
    const worker = db.workers.get(workerId); if (!worker) return null;
    const records = db.attendance.getByWorkerDateRange(workerId, from, to);
    const kasbons = db.kasbon.getByWorkerDateRange(workerId, from, to);
    let fullDays = 0, halfDays = 0, overtimeDays = 0;
    records.forEach(r => { if (r.status === 'full_day') fullDays++; else if (r.status === 'half_day') halfDays++; else if (r.status === 'overtime') overtimeDays++; });
    const totalDays = fullDays + halfDays * 0.5 + overtimeDays * 1.5;
    const grossPay  = totalDays * worker.dailyRate;
    const kasbon    = kasbons.reduce((s, k) => s + k.amount, 0);
    return { worker, totalDays, fullDays, halfDays, overtimeDays, grossPay, kasbon, netPay: grossPay - kasbon };
  },
}));

// ─── Kasbon ────────────────────────────────────────────────────────────────
interface KasbonState {
  kasbons: Kasbon[];
  loadKasbons: () => void;
  addKasbon: (data: Omit<Kasbon, 'id'>) => void;
  deleteKasbon: (id: string) => void;
}
export const useKasbonStore = create<KasbonState>((set) => ({
  kasbons: [],
  loadKasbons: () => set({ kasbons: db.kasbon.getAll() }),
  addKasbon: (data) => { const k: Kasbon = { ...data, id: generateId('kb') }; db.kasbon.save(k); set({ kasbons: db.kasbon.getAll() }); },
  deleteKasbon: (id) => { db.kasbon.delete(id); set({ kasbons: db.kasbon.getAll() }); },
}));

// ─── Expenses ──────────────────────────────────────────────────────────────
interface ExpenseState {
  expenses: Expense[];
  loadByProject: (projectId: string) => void;
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
}
export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loadByProject: (projectId) => set({ expenses: db.expenses.getByProject(projectId).sort((a, b) => b.date.localeCompare(a.date)) }),
  addExpense: (data) => {
    const e: Expense = { ...data, id: generateId('exp'), createdAt: new Date().toISOString() };
    db.expenses.save(e); set({ expenses: db.expenses.getByProject(data.projectId).sort((a, b) => b.date.localeCompare(a.date)) });
  },
  deleteExpense: (id) => {
    const exp = db.expenses.getAll().find(e => e.id === id);
    db.expenses.delete(id);
    if (exp) set({ expenses: db.expenses.getByProject(exp.projectId).sort((a, b) => b.date.localeCompare(a.date)) });
  },
}));

// ─── Quotations ────────────────────────────────────────────────────────────
interface QuotationState {
  quotations: Quotation[];
  loadQuotations: () => void;
  saveQuotation: (q: Quotation) => void;
  deleteQuotation: (id: string) => void;
}
export const useQuotationStore = create<QuotationState>((set) => ({
  quotations: [],
  loadQuotations: () => set({ quotations: db.quotations.getAll() }),
  saveQuotation: (q) => { db.quotations.save(q); set({ quotations: db.quotations.getAll() }); },
  deleteQuotation: (id) => { db.quotations.delete(id); set({ quotations: db.quotations.getAll() }); },
}));

// ─── UI ────────────────────────────────────────────────────────────────────
interface UIState {
  payrollWeekRange: { from: string; to: string };
  setPayrollWeekRange: (r: { from: string; to: string }) => void;
}
export const useUIStore = create<UIState>(() => ({
  payrollWeekRange: getWeekRange(),
  setPayrollWeekRange: (r) => useUIStore.setState({ payrollWeekRange: r }),
}));
