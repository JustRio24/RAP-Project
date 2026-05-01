import { useState, useEffect } from 'react';
import type { Worker, AttendanceStatus, AttendanceRecord } from '@/types';
import { db, formatRupiah } from '@/lib/db';
import { Clock, Sun, SunMedium, XCircle } from 'lucide-react';

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  short: string;
  cls: string;
}[] = [
  { value: 'full_day', label: 'Full Day', short: 'Full', cls: 'att-full' },
  { value: 'half_day', label: 'Setengah', short: '½ Day', cls: 'att-half' },
  { value: 'overtime', label: 'Lembur', short: 'Lembur', cls: 'att-over' },
  { value: 'absent', label: 'Absen', short: 'Absen', cls: 'att-absent' },
];

const STATUS_MULTIPLIER: Record<AttendanceStatus, number> = {
  full_day: 1,
  half_day: 0.5,
  overtime: 1.5,
  absent: 0,
};

interface AttendanceRowProps {
  worker: Worker;
  record?: AttendanceRecord;
  onMark: (workerId: string, status: AttendanceStatus) => void;
}

function AttendanceRow({ worker, record, onMark }: AttendanceRowProps) {
  const current = record?.status ?? null;
  const wage = current
    ? worker.dailyRate * STATUS_MULTIPLIER[current]
    : 0;

  return (
    <div className="card mb-2 animate-slide-up">
      {/* Worker info row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
          style={{
            background: worker.role === 'head_builder'
              ? 'rgba(14,165,233,0.15)'
              : 'rgba(139,92,246,0.15)',
            color: worker.role === 'head_builder' ? '#38bdf8' : '#a78bfa',
          }}
        >
          {worker.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-50 truncate text-sm">{worker.name}</p>
          <p className="text-xs text-surface-400">
            {worker.role === 'head_builder' ? 'Kepala Tukang' : 'Pembantu'} •{' '}
            {formatRupiah(worker.dailyRate)}/hari
          </p>
        </div>
        {/* Wage chip */}
        {current && current !== 'absent' && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-surface-400">Upah hari ini</p>
            <p className="text-sm font-bold text-success">{formatRupiah(wage)}</p>
          </div>
        )}
        {current === 'absent' && (
          <span className="badge badge-absent flex-shrink-0">Absen</span>
        )}
      </div>

      {/* Attendance buttons */}
      <div className="flex gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`att-btn ${opt.cls}${current === opt.value ? ' active' : ''}`}
            onClick={() => onMark(worker.id, opt.value)}
          >
            {opt.short}
          </button>
        ))}
      </div>
    </div>
  );
}

interface AttendancePanelProps {
  date: string;
  projectId: string;
  workers: Worker[];
}

export function AttendancePanel({ date, projectId, workers }: AttendancePanelProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    setRecords(db.attendance.getByDateAndProject(date, projectId));
  }, [date, projectId]);

  const handleMark = (workerId: string, status: AttendanceStatus) => {
    const updated = db.attendance.upsert(date, projectId, workerId, status);
    setRecords(db.attendance.getByDateAndProject(date, projectId));
    return updated;
  };

  const getRecord = (workerId: string) =>
    records.find((r) => r.workerId === workerId);

  const summary = workers.reduce(
    (acc, w) => {
      const rec = getRecord(w.id);
      if (!rec) return acc;
      const mult = STATUS_MULTIPLIER[rec.status];
      acc.totalWage += w.dailyRate * mult;
      if (rec.status === 'full_day') acc.full++;
      else if (rec.status === 'half_day') acc.half++;
      else if (rec.status === 'overtime') acc.over++;
      else if (rec.status === 'absent') acc.absent++;
      return acc;
    },
    { full: 0, half: 0, over: 0, absent: 0, totalWage: 0 }
  );

  const markedCount = records.length;
  const totalWorkers = workers.length;

  return (
    <div>
      {/* Progress indicator */}
      <div className="card mb-4 bg-gradient-to-br from-brand-900/50 to-surface-900">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-surface-400">
            Tercatat: <span className="text-surface-100 font-bold">{markedCount}/{totalWorkers}</span>
          </p>
          <p className="text-sm font-bold text-success">{formatRupiah(summary.totalWage)}</p>
        </div>
        <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
            style={{ width: `${totalWorkers ? (markedCount / totalWorkers) * 100 : 0}%` }}
          />
        </div>
        {/* Mini summary */}
        <div className="flex gap-3 mt-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-success inline-block" />
            <span className="text-surface-400">Full: <b className="text-surface-200">{summary.full}</b></span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-warning inline-block" />
            <span className="text-surface-400">½: <b className="text-surface-200">{summary.half}</b></span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
            <span className="text-surface-400">Lembur: <b className="text-surface-200">{summary.over}</b></span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-danger inline-block" />
            <span className="text-surface-400">Absen: <b className="text-surface-200">{summary.absent}</b></span>
          </div>
        </div>
      </div>

      {/* Worker rows */}
      {workers.length === 0 ? (
        <div className="text-center py-12 text-surface-500">
          <p className="text-4xl mb-2">👷</p>
          <p className="font-medium">Belum ada pekerja aktif</p>
          <p className="text-sm mt-1">Tambah pekerja di tab Daftar</p>
        </div>
      ) : (
        workers.map((worker) => (
          <AttendanceRow
            key={worker.id}
            worker={worker}
            record={getRecord(worker.id)}
            onMark={handleMark}
          />
        ))
      )}
    </div>
  );
}
