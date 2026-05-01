import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore, useWorkerStore } from '@/store';
import { db, formatRupiah, formatDateShort, getTodayStr } from '@/lib/db';
import { FolderKanban, Users, CheckCircle2, ClipboardList, TrendingUp, ArrowRight, HardHat } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = { survey: 'Survey', pending: 'Pending', in_progress: 'Berjalan', done: 'Selesai' };
const STATUS_CLS:   Record<string, string> = { survey: 'badge-survey', pending: 'badge-pending', in_progress: 'badge-progress', done: 'badge-done' };

export function DashboardPage() {
  const { projects, loadProjects } = useProjectStore();
  const { workers, loadWorkers }   = useWorkerStore();

  useEffect(() => { loadProjects(); loadWorkers(); }, []);

  const today  = getTodayStr();
  const active = projects.filter(p => p.status === 'in_progress');
  const done   = projects.filter(p => p.status === 'done');
  const team   = workers.filter(w => w.isActive);

  const totalExpenses = projects.reduce((s, p) => s + db.expenses.totalByProject(p.id), 0);

  return (
    <div className="animate-fade-in">
      {/* ── HERO HEADER ── */}
      <div className="hero-gradient px-4 pt-10 pb-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-blue-200 text-xs font-medium">Selamat datang 👋</p>
            <h1 className="text-white text-2xl font-extrabold tracking-tight mt-0.5">KONSTRA</h1>
            <p className="text-blue-200 text-[11px] mt-0.5">Kontraktor Sistem Terpadu Rangka & Atap</p>
          </div>
          <div className="text-right mt-1">
            <p className="text-blue-100 text-xs">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 pulse-dot" />
              <span className="text-green-300 text-[11px] font-semibold">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="px-4 -mt-4 grid grid-cols-2 gap-3 mb-4">
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FolderKanban size={16} className="text-blue-600" />
            </div>
            <span className="badge badge-progress">{active.length} aktif</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{projects.length}</p>
          <p className="text-xs text-slate-500 font-medium">Total Proyek</p>
        </div>
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Users size={16} className="text-violet-600" />
            </div>
            <span className="badge badge-fullday">{team.length} aktif</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{workers.length}</p>
          <p className="text-xs text-slate-500 font-medium">Total Tim</p>
        </div>
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{done.length}</p>
          <p className="text-xs text-slate-500 font-medium">Proyek Selesai</p>
        </div>
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-amber-600" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-slate-900">{formatRupiah(totalExpenses)}</p>
          <p className="text-xs text-slate-500 font-medium">Total Pengeluaran</p>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="px-4 mb-4">
        <p className="section-title">Aksi Cepat</p>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/team?tab=attendance">
            <div className="card card-hover flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Absensi</p>
                <p className="text-[11px] text-slate-400">Catat hari ini</p>
              </div>
            </div>
          </Link>
          <Link to="/team?tab=payroll">
            <div className="card card-hover flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Rekap Gaji</p>
                <p className="text-[11px] text-slate-400">Minggu ini</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── ACTIVE PROJECTS ── */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Proyek Berjalan</p>
          <Link to="/projects" className="text-xs text-primary-600 font-semibold flex items-center gap-0.5">
            Lihat Semua <ArrowRight size={12} />
          </Link>
        </div>
        {active.length === 0 ? (
          <div className="card text-center py-8">
            <HardHat size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400">Tidak ada proyek aktif</p>
          </div>
        ) : (
          active.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <div className="card card-hover mb-2 flex items-center gap-3">
                <div className="w-1.5 h-12 rounded-full bg-violet-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate text-sm">{p.name}</p>
                  <p className="text-xs text-slate-500 truncate">{p.clientName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mulai: {formatDateShort(p.startDate)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`badge ${STATUS_CLS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  <p className="text-xs text-slate-500 font-medium">{formatRupiah(db.expenses.totalByProject(p.id))}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
