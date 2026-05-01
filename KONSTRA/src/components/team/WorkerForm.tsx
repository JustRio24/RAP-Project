import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Worker } from '@/types';
import { X } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  role: z.enum(['head_builder', 'helper']),
  dailyRate: z.number({ error: 'Masukkan angka valid' }).min(50000, 'Min Rp50.000'),
  phone: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface WorkerFormProps {
  initial?: Partial<Worker>;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export function WorkerForm({ initial, onSubmit, onCancel }: WorkerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      role: initial?.role ?? 'helper',
      dailyRate: initial?.dailyRate ?? 150000,
      phone: initial?.phone ?? '',
      isActive: initial?.isActive ?? true,
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="modal-handle" />
          <h2 className="text-lg font-bold gradient-text">
            {initial?.id ? 'Edit Pekerja' : 'Tambah Pekerja Baru'}
          </h2>
          <p className="text-xs text-surface-400 mt-0.5">Isi data pekerja dengan lengkap</p>
        </div>
        <button className="btn btn-ghost btn-sm p-2" onClick={onCancel}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1.5">
            Nama Lengkap <span className="text-danger">*</span>
          </label>
          <input
            className="input"
            placeholder="cth. Asep Sunandar"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-danger text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1.5">
            Jabatan <span className="text-danger">*</span>
          </label>
          <select className="input select" {...register('role')}>
            <option value="head_builder">Kepala Tukang</option>
            <option value="helper">Pembantu / Helper</option>
          </select>
        </div>

        {/* Daily Rate */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1.5">
            Upah Harian (Rp) <span className="text-danger">*</span>
          </label>
          <input
            className="input"
            type="number"
            placeholder="150000"
            inputMode="numeric"
            {...register('dailyRate', { valueAsNumber: true })}
          />
          {errors.dailyRate && (
            <p className="text-danger text-xs mt-1">{errors.dailyRate.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1.5">
            No. HP (opsional)
          </label>
          <input
            className="input"
            type="tel"
            placeholder="08xxxxxxxxxx"
            inputMode="tel"
            {...register('phone')}
          />
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-800 border border-surface-700">
          <div>
            <p className="text-sm font-medium text-surface-200">Status Aktif</p>
            <p className="text-xs text-surface-400">Pekerja aktif muncul di daftar absensi</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" {...register('isActive')} />
            <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer
              peer-checked:after:translate-x-full peer-checked:after:border-white
              after:content-[''] after:absolute after:top-[2px] after:left-[2px]
              after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
              peer-checked:bg-brand-600" />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
