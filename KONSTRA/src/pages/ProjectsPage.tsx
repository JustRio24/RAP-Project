import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjectStore } from '@/store';
import { db, formatRupiah, formatDateShort } from '@/lib/db';
import type { ProjectStatus } from '@/types';
import { Plus, X, FolderOpen, Search, MapPin, Phone, Calendar, TrendingDown } from 'lucide-react';

const STATUS_LABEL: Record<ProjectStatus, string> = { survey: 'Survey', pending: 'Pending', in_progress: 'Berjalan', done: 'Selesai' };
const STATUS_CLS:   Record<ProjectStatus, string> = { survey: 'badge-survey', pending: 'badge-pending', in_progress: 'badge-progress', done: 'badge-done' };
const STATUS_FILTER = [
  { value: 'all', label: 'Semua' },
  { value: 'in_progress', label: 'Berjalan' },
  { value: 'survey', label: 'Survey' },
  { value: 'pending', label: 'Pending' },
  { value: 'done', label: 'Selesai' },
];

const schema = z.object({
  name: z.string().min(3, 'Minimal 3 karakter'),
  clientName: z.string().min(2, 'Masukkan nama klien'),
  clientPhone: z.string().min(8, 'No. HP tidak valid'),
  address: z.string().min(5, 'Masukkan alamat'),
  status: z.enum(['survey', 'pending', 'in_progress', 'done']),
  startDate: z.string().min(1, 'Pilih tanggal mulai'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function ProjectsPage() {
  const { projects, loadProjects, addProject } = useProjectStore();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'survey', startDate: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = (data: FormData) => {
    addProject({ ...data, notes: data.notes ?? '' });
    reset(); setShowForm(false);
  };

  const filtered = projects.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* HEADER */}
      <div className="page-header">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Manajemen Proyek</h1>
            <p className="text-xs text-slate-500">{projects.length} proyek terdaftar</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Baru
          </button>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 text-sm" placeholder="Cari nama, klien, alamat..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {STATUS_FILTER.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filter === f.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="px-4 pt-3">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FolderOpen size={24} className="text-slate-400" /></div>
            <p className="font-semibold text-slate-600">Tidak ada proyek</p>
            <p className="text-sm text-slate-400 mt-1">{search ? 'Coba kata kunci lain' : 'Tambah proyek pertama Anda'}</p>
            {!search && <button className="btn btn-primary btn-sm mt-4" onClick={() => setShowForm(true)}><Plus size={14} /> Tambah Proyek</button>}
          </div>
        ) : (
          filtered.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <div className="card card-hover mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-slate-800 text-sm leading-snug flex-1">{p.name}</p>
                  <span className={`badge ${STATUS_CLS[p.status]} flex-shrink-0`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users2 size={12} /><span>{p.clientName}</span>
                    {p.clientPhone && <><span>•</span><Phone size={12} /><span>{p.clientPhone}</span></>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={12} /><span className="truncate">{p.address}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar size={11} /><span>{formatDateShort(p.startDate)}{p.endDate && ` – ${formatDateShort(p.endDate)}`}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-red-500">
                      <TrendingDown size={11} />
                      <span>{formatRupiah(db.expenses.totalByProject(p.id))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ADD FORM MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-slate-900">Proyek Baru</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="input-label">Nama Proyek *</label>
                <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="cth. Rumah Pak Budi – Rangka Atap" {...register('name')} />
                {errors.name && <p className="error-msg">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Nama Klien *</label>
                  <input className={`input ${errors.clientName ? 'input-error' : ''}`} placeholder="Nama klien" {...register('clientName')} />
                  {errors.clientName && <p className="error-msg">{errors.clientName.message}</p>}
                </div>
                <div>
                  <label className="input-label">No. HP *</label>
                  <input className={`input ${errors.clientPhone ? 'input-error' : ''}`} type="tel" inputMode="tel" placeholder="08xx" {...register('clientPhone')} />
                  {errors.clientPhone && <p className="error-msg">{errors.clientPhone.message}</p>}
                </div>
              </div>
              <div>
                <label className="input-label">Alamat Proyek *</label>
                <input className={`input ${errors.address ? 'input-error' : ''}`} placeholder="Jl. Contoh No. 1, Kota" {...register('address')} />
                {errors.address && <p className="error-msg">{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Status</label>
                  <select className="input select" {...register('status')}>
                    {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Tanggal Mulai *</label>
                  <input className="input" type="date" {...register('startDate')} />
                </div>
              </div>
              <div>
                <label className="input-label">Catatan (opsional)</label>
                <textarea className="input" rows={2} placeholder="Detail pekerjaan, ukuran, dll..." {...register('notes')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => { reset(); setShowForm(false); }}>Batal</button>
                <button type="submit" className="btn btn-primary flex-1">Simpan Proyek</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// inline helper component
function Users2({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
