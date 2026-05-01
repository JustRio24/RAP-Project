import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWorkerStore, useProjectStore, useKasbonStore } from '@/store';
import { db, formatRupiah, formatDate, getTodayStr, getWeekRange, generateId } from '@/lib/db';
import type { Worker, AttendanceStatus, AttendanceRecord, PayrollEntry, Kasbon } from '@/types';
import { Users, ClipboardList, TrendingUp, Plus, X, ChevronLeft, ChevronRight, Calendar, PowerOff, Trash2, Minus, AlertCircle, Info } from 'lucide-react';

// ── Worker Form Schema ─────────────────────────────────────────────────────
const workerSchema = z.object({
  name:      z.string().min(2, 'Minimal 2 karakter'),
  role:      z.enum(['head_builder', 'helper']),
  dailyRate: z.number({ error: 'Masukkan angka' }).min(50000, 'Min Rp50.000'),
  phone:     z.string().optional(),
  isActive:  z.boolean(),
});
type WorkerFormData = z.infer<typeof workerSchema>;

const ROLE_LABEL: Record<string, string> = { head_builder: 'Kepala Tukang', helper: 'Pembantu' };
const ROLE_CLS:  Record<string, string>  = { head_builder: 'avatar-blue', helper: 'avatar-violet' };
const ATT_STATUS: { value: AttendanceStatus; label: string; short: string; cls: string }[] = [
  { value: 'full_day', label: 'Full Day',   short: 'Full',   cls: 'att-full'   },
  { value: 'half_day', label: 'Setengah',   short: '½ Hari', cls: 'att-half'   },
  { value: 'overtime', label: 'Lembur',     short: 'Lembur', cls: 'att-over'   },
  { value: 'absent',   label: 'Tidak Hadir', short: 'Absen', cls: 'att-absent' },
];
const STATUS_MULT: Record<AttendanceStatus, number> = { full_day: 1, half_day: 0.5, overtime: 1.5, absent: 0 };

type Tab = 'workers' | 'attendance' | 'payroll';

export function TeamPage() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'workers');
  const { workers, loadWorkers, addWorker, toggleActive, deleteWorker } = useWorkerStore();
  const { projects, loadProjects } = useProjectStore();
  const [showWorkerForm, setShowWorkerForm] = useState(false);

  // Attendance state
  const [attDate, setAttDate]         = useState(getTodayStr());
  const [attProject, setAttProject]   = useState('');
  const [attRecords, setAttRecords]   = useState<AttendanceRecord[]>([]);

  // Payroll state
  const [weekRange, setWeekRange]     = useState(getWeekRange());
  const [payrollData, setPayrollData] = useState<PayrollEntry[]>([]);
  const [payrollKey, setPayrollKey]   = useState(0);

  useEffect(() => { loadWorkers(); loadProjects(); }, []);
  useEffect(() => {
    if (!attProject) {
      const ap = projects.find(p => p.status !== 'done');
      if (ap) setAttProject(ap.id);
    }
  }, [projects, attProject]);

  useEffect(() => {
    if (attDate && attProject) setAttRecords(db.attendance.getByDateAndProject(attDate, attProject));
  }, [attDate, attProject]);

  useEffect(() => {
    if (tab !== 'payroll') return;
    const active = workers.filter(w => w.isActive);
    const entries = active.map(w => {
      const recs = db.attendance.getByWorkerDateRange(w.id, weekRange.from, weekRange.to);
      const kbs  = db.kasbon.getByWorkerDateRange(w.id, weekRange.from, weekRange.to);
      let full = 0, half = 0, over = 0;
      recs.forEach(r => { if (r.status === 'full_day') full++; else if (r.status === 'half_day') half++; else if (r.status === 'overtime') over++; });
      const totalDays = full + half * 0.5 + over * 1.5;
      const grossPay  = totalDays * w.dailyRate;
      const kasbon    = kbs.reduce((s, k) => s + k.amount, 0);
      return { worker: w, totalDays, fullDays: full, halfDays: half, overtimeDays: over, grossPay, kasbon, netPay: grossPay - kasbon } as PayrollEntry;
    }).filter(e => e.totalDays > 0 || e.kasbon > 0);
    setPayrollData(entries);
  }, [tab, weekRange, workers, payrollKey]);

  const markAttendance = (workerId: string, status: AttendanceStatus) => {
    db.attendance.upsert(attDate, attProject, workerId, status);
    setAttRecords(db.attendance.getByDateAndProject(attDate, attProject));
  };

  const shiftWeek = (dir: -1|1) => {
    const ref = new Date(weekRange.from);
    ref.setDate(ref.getDate() + dir * 7);
    setWeekRange(getWeekRange(ref));
  };

  const activeWorkers   = workers.filter(w => w.isActive);
  const inactiveWorkers = workers.filter(w => !w.isActive);
  const totalNetPay     = payrollData.reduce((s, e) => s + e.netPay, 0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: { role: 'helper', dailyRate: 150000, isActive: true },
  });

  const onAddWorker = (data: WorkerFormData) => {
    addWorker({ ...data, phone: data.phone ?? '' });
    reset(); setShowWorkerForm(false);
  };

  const TABS: { id: Tab; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
    { id: 'workers',    icon: Users,         label: 'Daftar'   },
    { id: 'attendance', icon: ClipboardList, label: 'Absensi'  },
    { id: 'payroll',    icon: TrendingUp,    label: 'Gaji'     },
  ];

  return (
    <div className="animate-fade-in">
      {/* HEADER */}
      <div className="page-header">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Tim & Absensi</h1>
            <p className="text-xs text-slate-500">{activeWorkers.length} pekerja aktif</p>
          </div>
          {tab === 'workers' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowWorkerForm(true)}>
              <Plus size={16} /> Tambah
            </button>
          )}
        </div>
        <div className="tab-bar">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} className={`tab-item${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* ─── WORKERS TAB ─── */}
        {tab === 'workers' && (
          <div>
            {workers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Users size={24} className="text-slate-400" /></div>
                <p className="font-semibold text-slate-600">Belum ada pekerja</p>
                <p className="text-sm text-slate-400 mt-1">Tambah pekerja untuk mulai mencatat absensi</p>
                <button className="btn btn-primary btn-sm mt-4" onClick={() => setShowWorkerForm(true)}><Plus size={14} /> Tambah Pekerja</button>
              </div>
            ) : (
              <>
                {activeWorkers.length > 0 && (
                  <div className="mb-4">
                    <p className="section-title">Aktif ({activeWorkers.length})</p>
                    {activeWorkers.map(w => <WorkerRow key={w.id} worker={w} onToggle={() => toggleActive(w.id)} onDelete={() => { if (confirm(`Hapus ${w.name}?`)) deleteWorker(w.id); }} />)}
                  </div>
                )}
                {inactiveWorkers.length > 0 && (
                  <div className="mb-4 opacity-60">
                    <p className="section-title">Nonaktif ({inactiveWorkers.length})</p>
                    {inactiveWorkers.map(w => <WorkerRow key={w.id} worker={w} onToggle={() => toggleActive(w.id)} onDelete={() => { if (confirm(`Hapus ${w.name}?`)) deleteWorker(w.id); }} />)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── ATTENDANCE TAB ─── */}
        {tab === 'attendance' && (
          <div>
            <div className="card mb-3">
              <p className="section-title">Pilih Tanggal & Proyek</p>
              <div className="space-y-2">
                <div>
                  <label className="input-label">Tanggal</label>
                  <input type="date" className="input" value={attDate} max={getTodayStr()} onChange={e => setAttDate(e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Proyek</label>
                  <select className="input select" value={attProject} onChange={e => setAttProject(e.target.value)}>
                    <option value="">-- Pilih Proyek --</option>
                    {projects.filter(p => p.status !== 'done').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {!attProject ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Info size={20} className="text-slate-400" /></div>
                <p className="text-sm text-slate-500">Pilih proyek untuk mencatat absensi</p>
              </div>
            ) : (
              <AttendanceSection workers={activeWorkers} records={attRecords} onMark={markAttendance} />
            )}
          </div>
        )}

        {/* ─── PAYROLL TAB ─── */}
        {tab === 'payroll' && (
          <div>
            {/* Week navigator */}
            <div className="card mb-4">
              <div className="flex items-center justify-between">
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => shiftWeek(-1)}><ChevronLeft size={18} /></button>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Periode</p>
                  <p className="text-sm font-bold text-slate-800">{formatDate(weekRange.from)} – {formatDate(weekRange.to)}</p>
                </div>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => shiftWeek(1)} disabled={weekRange.to >= getTodayStr()}><ChevronRight size={18} /></button>
              </div>
            </div>

            {payrollData.length > 0 && (
              <div className="card mb-4 bg-gradient-to-br from-green-500 to-green-700 border-0 text-white text-center">
                <p className="text-green-100 text-xs mb-1">Total Gaji Minggu Ini</p>
                <p className="text-2xl font-extrabold">{formatRupiah(totalNetPay)}</p>
                <p className="text-green-200 text-xs mt-1">{payrollData.length} pekerja</p>
              </div>
            )}

            {payrollData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><TrendingUp size={22} className="text-slate-400" /></div>
                <p className="font-semibold text-slate-600">Belum ada data absensi</p>
                <p className="text-sm text-slate-400 mt-1">Catat absensi terlebih dahulu</p>
                <button className="btn btn-primary btn-sm mt-4" onClick={() => setTab('attendance')}>Ke Absensi →</button>
              </div>
            ) : (
              payrollData.map(entry => (
                <PayrollRow key={entry.worker.id + weekRange.from + payrollKey} entry={entry} weekFrom={weekRange.from} weekTo={weekRange.to} onUpdate={() => setPayrollKey(k => k + 1)} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Worker Form Modal */}
      {showWorkerForm && (
        <div className="modal-overlay" onClick={() => setShowWorkerForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-slate-900">Tambah Pekerja</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowWorkerForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onAddWorker)} className="space-y-3">
              <div>
                <label className="input-label">Nama Lengkap *</label>
                <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="cth. Asep Sunandar" {...register('name')} />
                {errors.name && <p className="error-msg">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Jabatan *</label>
                  <select className="input select" {...register('role')}>
                    <option value="head_builder">Kepala Tukang</option>
                    <option value="helper">Pembantu</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Upah Harian (Rp) *</label>
                  <input className={`input ${errors.dailyRate ? 'input-error' : ''}`} type="number" inputMode="numeric" {...register('dailyRate', { valueAsNumber: true })} />
                  {errors.dailyRate && <p className="error-msg">{errors.dailyRate.message}</p>}
                </div>
              </div>
              <div>
                <label className="input-label">No. HP</label>
                <input className="input" type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" {...register('phone')} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Status Aktif</p>
                  <p className="text-xs text-slate-400">Tampil di daftar absensi</p>
                </div>
                <label className="relative cursor-pointer">
                  <input type="checkbox" className="sr-only" {...register('isActive')} />
                  <div className="toggle-track on"><div className="toggle-thumb" /></div>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => { reset(); setShowWorkerForm(false); }}>Batal</button>
                <button type="submit" className="btn btn-primary flex-1">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function WorkerRow({ worker, onToggle, onDelete }: { worker: Worker; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="card mb-2 flex items-center gap-3">
      <div className={`avatar avatar-md ${worker.role === 'head_builder' ? 'avatar-blue' : 'avatar-violet'}`}>
        {worker.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-800 truncate text-sm">{worker.name}</p>
          {!worker.isActive && <span className="badge badge-gray text-[10px]">Nonaktif</span>}
        </div>
        <p className={`text-xs font-medium ${worker.role === 'head_builder' ? 'text-blue-600' : 'text-violet-600'}`}>{ROLE_LABEL[worker.role]}</p>
        <p className="text-xs text-slate-400 mt-0.5">{formatRupiah(worker.dailyRate)}/hari{worker.phone ? ` • ${worker.phone}` : ''}</p>
      </div>
      <div className="flex gap-1">
        <button className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" onClick={onToggle} title="Toggle aktif">
          <PowerOff size={15} />
        </button>
        <button className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" onClick={onDelete} title="Hapus">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function AttendanceSection({ workers, records, onMark }: { workers: Worker[]; records: AttendanceRecord[]; onMark: (wId: string, s: AttendanceStatus) => void }) {
  const getRecord = (wId: string) => records.find(r => r.workerId === wId);
  const summary = workers.reduce((acc, w) => {
    const r = getRecord(w.id);
    if (r) { acc.total += w.dailyRate * STATUS_MULT[r.status]; acc[r.status] = (acc[r.status] ?? 0) + 1; }
    return acc;
  }, { total: 0, full_day: 0, half_day: 0, overtime: 0, absent: 0 } as Record<string, number>);

  return (
    <div>
      {/* Summary bar */}
      <div className="card mb-3 bg-primary-50 border-primary-200">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-primary-700">Tercatat: {records.length}/{workers.length}</p>
          <p className="text-sm font-extrabold text-green-700">{formatRupiah(summary.total)}</p>
        </div>
        <div className="progress-bar mb-2"><div className="progress-fill" style={{ width: `${workers.length ? (records.length / workers.length) * 100 : 0}%` }} /></div>
        <div className="flex gap-3">
          {[['full_day','success','Full'],['half_day','warning','½'],['overtime','violet','Lmbr'],['absent','danger','Absen']].map(([key, color, lbl]) => (
            <div key={key} className="flex items-center gap-1 text-xs">
              <span className={`w-2 h-2 rounded-full bg-${color}-500`} style={{ background: color === 'violet' ? '#7c3aed' : undefined }} />
              <span className="text-slate-500">{lbl}: <b className="text-slate-700">{summary[key] ?? 0}</b></span>
            </div>
          ))}
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-slate-400">Belum ada pekerja aktif</p>
        </div>
      ) : (
        workers.map(w => {
          const rec = getRecord(w.id);
          const wage = rec ? w.dailyRate * STATUS_MULT[rec.status] : 0;
          return (
            <div key={w.id} className="card mb-2">
              <div className="flex items-center gap-3 mb-3">
                <div className={`avatar avatar-md ${w.role === 'head_builder' ? 'avatar-blue' : 'avatar-violet'}`}>{w.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate text-sm">{w.name}</p>
                  <p className="text-xs text-slate-400">{ROLE_LABEL[w.role]} • {formatRupiah(w.dailyRate)}/hari</p>
                </div>
                {rec && rec.status !== 'absent' && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-400">Upah hari ini</p>
                    <p className="text-sm font-extrabold text-green-700">{formatRupiah(wage)}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                {ATT_STATUS.map(opt => (
                  <button key={opt.value} className={`att-btn ${opt.cls}${rec?.status === opt.value ? ' active' : ''}`} onClick={() => onMark(w.id, opt.value)}>
                    {opt.short}
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function PayrollRow({ entry, weekFrom, weekTo, onUpdate }: { entry: PayrollEntry; weekFrom: string; weekTo: string; onUpdate: () => void }) {
  const [showKasbon, setShowKasbon] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const isNeg = entry.netPay < 0;

  const addKasbon = () => {
    const n = parseInt(amount.replace(/\D/g, ''));
    if (!n) return;
    const k: Kasbon = { id: generateId('kb'), workerId: entry.worker.id, date: weekTo, amount: n, description: note || 'Kasbon' };
    db.kasbon.save(k);
    setAmount(''); setNote(''); setShowKasbon(false); onUpdate();
  };

  return (
    <div className="card mb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className={`avatar avatar-lg ${entry.worker.role === 'head_builder' ? 'avatar-blue' : 'avatar-violet'}`}>{entry.worker.name.charAt(0)}</div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-900">{entry.worker.name}</p>
          <p className="text-xs text-slate-400">{ROLE_LABEL[entry.worker.role]} • {formatRupiah(entry.worker.dailyRate)}/hari</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400">Gaji Bersih</p>
          <p className={`text-lg font-extrabold ${isNeg ? 'text-red-600' : 'text-green-700'}`}>{formatRupiah(entry.netPay)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { lbl: 'Full', val: entry.fullDays, cls: 'bg-green-50 text-green-700' },
          { lbl: '½ Hari', val: entry.halfDays, cls: 'bg-amber-50 text-amber-700' },
          { lbl: 'Lembur', val: entry.overtimeDays, cls: 'bg-violet-50 text-violet-700' },
          { lbl: 'Absen', val: 7 - (entry.fullDays + entry.halfDays + entry.overtimeDays), cls: 'bg-red-50 text-red-600' },
        ].map(s => (
          <div key={s.lbl} className={`rounded-lg p-2 text-center ${s.cls}`}>
            <p className="text-xs text-slate-500 mb-0.5">{s.lbl}</p>
            <p className="font-extrabold">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="space-y-1 border-t border-slate-100 pt-2 mb-2">
        <div className="flex justify-between text-xs"><span className="text-slate-500">Upah Kotor ({entry.totalDays.toFixed(1)} hr)</span><span className="font-semibold text-slate-700">{formatRupiah(entry.grossPay)}</span></div>
        {entry.kasbon > 0 && <div className="flex justify-between text-xs"><span className="text-red-500">Kasbon</span><span className="font-semibold text-red-600">-{formatRupiah(entry.kasbon)}</span></div>}
        <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
          <span className="font-bold text-slate-800">Gaji Bersih</span>
          <span className={`font-extrabold ${isNeg ? 'text-red-600' : 'text-green-700'}`}>{formatRupiah(entry.netPay)}</span>
        </div>
      </div>

      {showKasbon ? (
        <div className="bg-slate-50 rounded-xl p-3 space-y-2">
          <p className="text-sm font-semibold text-slate-700">Tambah Kasbon</p>
          <input className="input text-sm" inputMode="numeric" placeholder="Jumlah (Rp)" value={amount} onChange={e => setAmount(e.target.value)} />
          <input className="input text-sm" placeholder="Keterangan" value={note} onChange={e => setNote(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm flex-1" onClick={() => setShowKasbon(false)}>Batal</button>
            <button className="btn btn-danger btn-sm flex-1" onClick={addKasbon}>Tambah</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm w-full text-slate-500" onClick={() => setShowKasbon(true)}><Minus size={13} /> Tambah Kasbon</button>
      )}

      {isNeg && (
        <div className="alert alert-danger mt-2 text-xs">
          <AlertCircle size={13} className="flex-shrink-0" /><span>Kasbon melebihi gaji minggu ini!</span>
        </div>
      )}
    </div>
  );
}
