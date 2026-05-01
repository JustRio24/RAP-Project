import type { Worker, WorkerRole } from '@/types';
import { formatRupiah } from '@/lib/db';
import { HardHat, Phone, ChevronRight, MoreVertical, Trash2, PowerOff } from 'lucide-react';

const roleLabel: Record<WorkerRole, string> = {
  head_builder: 'Kepala Tukang',
  helper: 'Pembantu',
};

const roleColor: Record<WorkerRole, string> = {
  head_builder: 'text-sky-400',
  helper: 'text-violet-400',
};

interface WorkerCardProps {
  worker: Worker;
  onTap?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
}

export function WorkerCard({ worker, onTap, onToggleActive, onDelete }: WorkerCardProps) {
  return (
    <div
      className="card flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onTap}
      style={{ animationFillMode: 'both' }}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
        style={{
          background: worker.role === 'head_builder'
            ? 'rgba(14,165,233,0.15)'
            : 'rgba(139,92,246,0.15)',
          color: worker.role === 'head_builder' ? '#38bdf8' : '#a78bfa',
        }}
      >
        {worker.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-surface-50 truncate">{worker.name}</p>
          {!worker.isActive && (
            <span className="badge badge-absent text-[10px]">Nonaktif</span>
          )}
        </div>
        <p className={`text-xs ${roleColor[worker.role]} font-medium`}>
          {roleLabel[worker.role]}
        </p>
        <p className="text-xs text-surface-400 mt-0.5">
          {formatRupiah(worker.dailyRate)} / hari
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-lg text-surface-500 hover:text-warning hover:bg-warning/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggleActive?.(); }}
          title={worker.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        >
          <PowerOff size={16} />
        </button>
        <button
          className="p-2 rounded-lg text-surface-500 hover:text-danger hover:bg-danger/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          title="Hapus"
        >
          <Trash2 size={16} />
        </button>
        <ChevronRight size={16} className="text-surface-600" />
      </div>
    </div>
  );
}
