import type { PayrollEntry } from '@/types';
import { formatRupiah, formatDate } from '@/lib/db';
import { TrendingUp, Minus, CircleDollarSign, Plus, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { db, generateId } from '@/lib/db';
import type { Kasbon } from '@/types';

interface PayrollCardProps {
  entry: PayrollEntry;
  weekFrom: string;
  weekTo: string;
  onKasbonAdded: () => void;
}

export function PayrollCard({ entry, weekFrom, weekTo, onKasbonAdded }: PayrollCardProps) {
  const [showKasbonForm, setShowKasbonForm] = useState(false);
  const [kasbonAmount, setKasbonAmount] = useState('');
  const [kasbonNote, setKasbonNote] = useState('');

  const handleAddKasbon = () => {
    const amount = parseInt(kasbonAmount.replace(/\D/g, ''));
    if (!amount || amount <= 0) return;
    const kasbon: Kasbon = {
      id: generateId('kb'),
      workerId: entry.worker.id,
      date: weekTo,
      amount,
      description: kasbonNote || 'Kasbon',
    };
    db.kasbon.save(kasbon);
    setKasbonAmount('');
    setKasbonNote('');
    setShowKasbonForm(false);
    onKasbonAdded();
  };

  const isNegative = entry.netPay < 0;

  return (
    <div className="card mb-3 animate-slide-up overflow-hidden">
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: isNegative
            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
            : 'linear-gradient(90deg, #22c55e, #0ea5e9)',
        }}
      />

      {/* Worker header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{
            background: entry.worker.role === 'head_builder'
              ? 'rgba(14,165,233,0.15)'
              : 'rgba(139,92,246,0.15)',
            color: entry.worker.role === 'head_builder' ? '#38bdf8' : '#a78bfa',
          }}
        >
          {entry.worker.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-bold text-surface-50">{entry.worker.name}</p>
          <p className="text-xs text-surface-400">
            {entry.worker.role === 'head_builder' ? 'Kepala Tukang' : 'Pembantu'} •{' '}
            {formatRupiah(entry.worker.dailyRate)}/hari
          </p>
        </div>
        {/* Net pay badge */}
        <div className="text-right">
          <p className="text-xs text-surface-400 mb-0.5">Gaji Bersih</p>
          <p
            className="text-lg font-bold"
            style={{ color: isNegative ? '#f87171' : '#4ade80' }}
          >
            {formatRupiah(entry.netPay)}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-success/10">
          <p className="text-xs text-surface-400 mb-0.5">Full</p>
          <p className="font-bold text-success">{entry.fullDays}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-warning/10">
          <p className="text-xs text-surface-400 mb-0.5">Setengah</p>
          <p className="font-bold text-warning">{entry.halfDays}</p>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)' }}>
          <p className="text-xs text-surface-400 mb-0.5">Lembur</p>
          <p className="font-bold" style={{ color: '#a78bfa' }}>{entry.overtimeDays}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-danger/10">
          <p className="text-xs text-surface-400 mb-0.5">Absen</p>
          <p className="font-bold text-danger">
            {7 - (entry.fullDays + entry.halfDays + entry.overtimeDays)}
          </p>
        </div>
      </div>

      {/* Calculation breakdown */}
      <div className="space-y-1.5 py-3 border-t border-surface-800">
        <div className="flex justify-between items-center text-sm">
          <span className="text-surface-400 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-success" />
            Upah Kotor ({entry.totalDays.toFixed(1)} hari)
          </span>
          <span className="text-surface-200 font-medium">{formatRupiah(entry.grossPay)}</span>
        </div>
        {entry.kasbon > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-surface-400 flex items-center gap-1.5">
              <Minus size={13} className="text-danger" />
              Kasbon
            </span>
            <span className="text-danger font-medium">-{formatRupiah(entry.kasbon)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm pt-1.5 border-t border-surface-800">
          <span className="font-bold text-surface-200 flex items-center gap-1.5">
            <CircleDollarSign size={13} className="text-brand-400" />
            Gaji Bersih
          </span>
          <span
            className="font-bold text-base"
            style={{ color: isNegative ? '#f87171' : '#4ade80' }}
          >
            {formatRupiah(entry.netPay)}
          </span>
        </div>
      </div>

      {/* Kasbon form */}
      {showKasbonForm ? (
        <div className="mt-3 p-3 bg-surface-800 rounded-lg space-y-2">
          <p className="text-sm font-medium text-surface-200">Tambah Kasbon</p>
          <input
            className="input text-sm"
            placeholder="Jumlah (Rp)"
            inputMode="numeric"
            value={kasbonAmount}
            onChange={(e) => setKasbonAmount(e.target.value)}
          />
          <input
            className="input text-sm"
            placeholder="Keterangan (opsional)"
            value={kasbonNote}
            onChange={(e) => setKasbonNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm flex-1" onClick={() => setShowKasbonForm(false)}>
              Batal
            </button>
            <button className="btn btn-danger btn-sm flex-1" onClick={handleAddKasbon}>
              Tambah
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn btn-ghost btn-sm w-full mt-2"
          onClick={() => setShowKasbonForm(true)}
        >
          <Plus size={14} />
          Tambah Kasbon
        </button>
      )}

      {/* Warning if overkasbon */}
      {isNegative && (
        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-danger/10 border border-danger/30">
          <AlertCircle size={14} className="text-danger flex-shrink-0" />
          <p className="text-xs text-danger">Kasbon melebihi gaji minggu ini!</p>
        </div>
      )}
    </div>
  );
}
