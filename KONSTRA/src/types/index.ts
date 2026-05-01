// ─── Project ───────────────────────────────────────────────────────────────
export type ProjectStatus = 'survey' | 'pending' | 'in_progress' | 'done';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientPhone: string;
  address: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  notes?: string;
  quotationId?: string;
  createdAt: string;
}

// ─── Worker ────────────────────────────────────────────────────────────────
export type WorkerRole = 'head_builder' | 'helper';

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  dailyRate: number;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Attendance ────────────────────────────────────────────────────────────
export type AttendanceStatus = 'full_day' | 'half_day' | 'overtime' | 'absent';

export interface AttendanceRecord {
  id: string;
  date: string;
  projectId: string;
  workerId: string;
  status: AttendanceStatus;
  overtimeHours?: number;
  notes?: string;
}

// ─── Kasbon ────────────────────────────────────────────────────────────────
export interface Kasbon {
  id: string;
  workerId: string;
  projectId?: string;
  date: string;
  amount: number;
  description: string;
}

// ─── Payroll ───────────────────────────────────────────────────────────────
export interface PayrollEntry {
  worker: Worker;
  totalDays: number;
  fullDays: number;
  halfDays: number;
  overtimeDays: number;
  grossPay: number;
  kasbon: number;
  netPay: number;
}

// ─── Expense ───────────────────────────────────────────────────────────────
export type ExpenseCategory = 'material' | 'transport' | 'tool' | 'labor' | 'other';

export interface Expense {
  id: string;
  projectId: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  receipt?: string;
  createdAt: string;
}

// ─── Calculator / Quotation ────────────────────────────────────────────────
export type RoofType = 'pelana' | 'perisai' | 'plana';

export interface QuotationInput {
  projectId?: string;
  clientName: string;
  clientPhone?: string;
  address: string;
  roofType: RoofType;
  length: number;
  width: number;
  overstekFront: number;
  overstekSide: number;
  roofPitch: number;
  includesCeiling: boolean;
  ceilingArea?: number;
  marginPercent: number;
  notes?: string;
}

export interface MaterialItem {
  code: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: 'structure' | 'cover' | 'fastener' | 'ceiling' | 'accessory';
}

export interface Quotation {
  id: string;
  input: QuotationInput;
  materials: MaterialItem[];
  materialSubtotal: number;
  laborCost: number;
  subtotal: number;
  marginAmount: number;
  grandTotal: number;
  roofArea: number;
  createdAt: string;
}

// ─── Master Price ──────────────────────────────────────────────────────────
export interface PriceItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  category: 'material' | 'labor';
}
