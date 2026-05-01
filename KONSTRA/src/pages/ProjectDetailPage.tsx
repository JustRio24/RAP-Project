import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjectStore, useExpenseStore } from '@/store';
import { db, formatRupiah, formatDate, formatDateShort, EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS, getTodayStr } from '@/lib/db';
import type { ExpenseCategory, ProjectStatus } from '@/types';
import { ArrowLeft, Edit2, Trash2, Plus, X, Phone, MapPin, Calendar, FileText, TrendingDown, CheckCircle2, Clock } from 'lucide-react';

const STATUS_LABEL: Record<ProjectStatus, string> = { survey: 'Survey', pending: 'Pending', in_progress: 'Berjalan', done: 'Selesai' };
const STATUS_CLS:   Record<ProjectStatus, string> = { survey: 'badge-survey', pending: 'badge-pending', in_progress: 'badge-progress', done: 'badge-done' };

const expenseSchema = z.object({
  date:        z.string().min(1, 'Pilih tanggal'),
  category:    z.enum(['material', 'transport', 'tool', 'labor', 'other']),
  description: z.string().min(2, 'Masukkan keterangan'),
  amount:      z.number({ error: 'Masukkan nominal' }).min(1000, 'Min Rp1.000'),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

const CAT_ICON: Record<ExpenseCategory, string> = {
  material: '🧱', transport: '🚚', tool: '🔧', labor: '👷', other: '📦',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, loadProjects, updateProject, deleteProject } = useProjectStore();
  const { expenses, loadByProject, addExpense, deleteExpense } = useExpenseStore();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);

  useEffect(() => { loadProjects(); if (id) loadByProject(id); }, [id]);

  const project = projects.find(p => p.id === id);
  const quotations = id ? db.quotations.getByProject(id) : [];
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: getTodayStr(), category: 'material' },
  });

  const onAddExpense = (data: ExpenseForm) => {
    if (!id) return;
    addExpense({ projectId: id, ...data, amount: data.amount });
    reset({ date: getTodayStr(), category: 'material' });
    setShowExpenseForm(false);
  };

  if (!project) return (
    <div className="p-4 text-center mt-20">
      <p className="text-slate-400">Proyek tidak ditemukan.</p>
      <Link to="/projects" className="btn btn-primary btn-sm mt-4">← Kembali</Link>
    </div>
  );

  const catTotals = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc; }, {} as Record<string, number>);

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <div className="hero-gradient px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <ArrowLeft size={18} />
          </button>
          <p className="text-blue-100 text-sm font-medium">Detail Proyek</p>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h1 className="text-white font-extrabold text-lg leading-snug">{project.name}</h1>
            <p className="text-blue-200 text-sm mt-1">{project.clientName}</p>
          </div>
          <button onClick={() => setShowStatusSheet(true)} className={`badge ${STATUS_CLS[project.status]} cursor-pointer mt-1`}>
            {STATUS_LABEL[project.status]}
          </button>
        </div>
      </div>

      {/* EXPENSE SUMMARY CARD (floating) */}
      <div className="px-4 -mt-4 mb-4">
        <div className="card shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-slate-800 text-sm">Total Pengeluaran</p>
            <span className="text-xl font-extrabold text-red-600">{formatRupiah(totalExpenses)}</span>
          </div>
          {/* Category breakdown */}
          {Object.keys(catTotals).length > 0 && (
            <div className="space-y-1.5">
              {Object.entries(catTotals).map(([cat, total]) => {
                const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">{CAT_ICON[cat as ExpenseCategory]} {EXPENSE_CATEGORY_LABELS[cat]}</span>
                      <span className="font-semibold text-slate-700">{formatRupiah(total)}</span>
                    </div>
                    <div className="progress-bar" style={{ height: '4px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PROJECT INFO */}
      <div className="px-4 mb-4">
        <p className="section-title">Informasi Proyek</p>
        <div className="card">
          <div className="info-row">
            <span className="info-label"><Phone size={12} className="inline mr-1" />No. HP</span>
            <a href={`tel:${project.clientPhone}`} className="info-value text-primary-600">{project.clientPhone || '-'}</a>
          </div>
          <div className="info-row">
            <span className="info-label"><MapPin size={12} className="inline mr-1" />Alamat</span>
            <span className="info-value">{project.address}</span>
          </div>
          <div className="info-row">
            <span className="info-label"><Calendar size={12} className="inline mr-1" />Tanggal Mulai</span>
            <span className="info-value">{formatDate(project.startDate)}</span>
          </div>
          {project.endDate && (
            <div className="info-row">
              <span className="info-label"><CheckCircle2 size={12} className="inline mr-1" />Selesai</span>
              <span className="info-value">{formatDate(project.endDate)}</span>
            </div>
          )}
          {project.notes && (
            <div className="info-row">
              <span className="info-label"><FileText size={12} className="inline mr-1" />Catatan</span>
              <span className="info-value text-slate-600">{project.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* QUOTATIONS */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="section-title mb-0">Penawaran (SPH)</p>
          <Link to={`/calculator?projectId=${id}`} className="btn btn-primary btn-sm"><Plus size={13} /> Buat SPH</Link>
        </div>
        {quotations.length === 0 ? (
          <div className="card text-center py-5">
            <p className="text-sm text-slate-400">Belum ada penawaran</p>
          </div>
        ) : (
          quotations.map(q => (
            <div key={q.id} className="card card-hover mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{formatRupiah(q.grandTotal)}</p>
                <p className="text-xs text-slate-400">{formatDateShort(q.createdAt.split('T')[0])} • {q.roofArea} m²</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/calculator?quotationId=${q.id}`} className="btn btn-ghost btn-sm">Lihat</Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EXPENSES */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="section-title mb-0">Catatan Pengeluaran ({expenses.length})</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExpenseForm(true)}><Plus size={13} /> Tambah</button>
        </div>
        {expenses.length === 0 ? (
          <div className="card text-center py-6">
            <TrendingDown size={24} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400">Belum ada catatan pengeluaran</p>
          </div>
        ) : (
          <div className="card">
            {expenses.map(e => (
              <div key={e.id} className="expense-item">
                <div className={`avatar avatar-md ${EXPENSE_CATEGORY_COLORS[e.category]}`}>
                  <span className="text-base">{CAT_ICON[e.category]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{e.description}</p>
                  <p className="text-[11px] text-slate-400">{formatDateShort(e.date)} • {EXPENSE_CATEGORY_LABELS[e.category]}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-bold text-red-600">{formatRupiah(e.amount)}</p>
                  <button className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    onClick={() => { if (confirm('Hapus pengeluaran ini?')) deleteExpense(e.id); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DELETE PROJECT */}
      <div className="px-4 mb-8">
        <button className="btn btn-ghost w-full text-red-500 border-red-200"
          onClick={() => { if (confirm(`Hapus proyek "${project.name}"?`)) { deleteProject(project.id); navigate('/projects'); } }}>
          <Trash2 size={16} /> Hapus Proyek
        </button>
      </div>

      {/* EXPENSE FORM MODAL */}
      {showExpenseForm && (
        <div className="modal-overlay" onClick={() => setShowExpenseForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-slate-900">Tambah Pengeluaran</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowExpenseForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onAddExpense)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Tanggal *</label>
                  <input className="input" type="date" {...register('date')} />
                </div>
                <div>
                  <label className="input-label">Kategori *</label>
                  <select className="input select" {...register('category')}>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Keterangan *</label>
                <input className={`input ${errors.description ? 'input-error' : ''}`} placeholder="cth. Kanal C75 – 20 batang" {...register('description')} />
                {errors.description && <p className="error-msg">{errors.description.message}</p>}
              </div>
              <div>
                <label className="input-label">Jumlah (Rp) *</label>
                <input className={`input ${errors.amount ? 'input-error' : ''}`} type="number" inputMode="numeric" placeholder="0" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="error-msg">{errors.amount.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowExpenseForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary flex-1">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS CHANGE SHEET */}
      {showStatusSheet && (
        <div className="modal-overlay" onClick={() => setShowStatusSheet(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="text-base font-extrabold text-slate-900 mb-4">Ubah Status Proyek</h2>
            <div className="space-y-2">
              {(Object.entries(STATUS_LABEL) as [ProjectStatus, string][]).map(([v, l]) => (
                <button key={v} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${project.status === v ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'}`}
                  onClick={() => { updateProject(project.id, { status: v, endDate: v === 'done' ? getTodayStr() : undefined }); setShowStatusSheet(false); }}>
                  <span className={`badge ${STATUS_CLS[v]}`}>{l}</span>
                  {project.status === v && <span className="text-xs text-primary-600 font-semibold ml-auto">● Aktif</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
