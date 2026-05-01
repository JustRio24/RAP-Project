import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjectStore, useQuotationStore } from '@/store';
import { calculateQuotation, MASTER_PRICES } from '@/lib/calculator';
import { generateQuotationPDF } from '@/lib/pdfGenerator';
import { db, formatRupiah, formatDate } from '@/lib/db';
import type { Quotation } from '@/types';
import { Calculator, FileDown, ChevronDown, ChevronUp, RotateCcw, Save, Info } from 'lucide-react';

const schema = z.object({
  clientName:    z.string().min(2, 'Masukkan nama klien'),
  clientPhone:   z.string().optional(),
  address:       z.string().min(3, 'Masukkan alamat'),
  projectId:     z.string().optional(),
  roofType:      z.enum(['pelana', 'perisai', 'plana']),
  length:        z.number({ error: 'Wajib diisi' }).min(1).max(100),
  width:         z.number({ error: 'Wajib diisi' }).min(1).max(100),
  overstekFront: z.number({ error: 'Wajib diisi' }).min(0).max(5),
  overstekSide:  z.number({ error: 'Wajib diisi' }).min(0).max(5),
  roofPitch:     z.number({ error: 'Wajib diisi' }).min(10).max(60),
  includesCeiling: z.boolean(),
  ceilingArea:   z.number().optional(),
  marginPercent: z.number({ error: 'Wajib diisi' }).min(0).max(100),
  notes:         z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const ROOF_TYPE_OPTS = [
  { value: 'pelana', label: '🏠 Pelana', desc: 'Dua bidang, paling umum' },
  { value: 'perisai', label: '🏯 Perisai', desc: 'Empat bidang, lebih kokoh' },
  { value: 'plana', label: '🏗️ Plana / Datar', desc: 'Satu sisi, untuk garasi/teras' },
];

const CAT_LABEL: Record<string, string> = { structure: '🔩 Rangka', cover: '🏠 Atap', fastener: '🔧 Sekrup', accessory: '✨ Aksesoris', ceiling: '🪟 Plafon' };
const CAT_COLOR: Record<string, string> = { structure: 'bg-blue-50 text-blue-700', cover: 'bg-green-50 text-green-700', fastener: 'bg-amber-50 text-amber-700', accessory: 'bg-violet-50 text-violet-700', ceiling: 'bg-orange-50 text-orange-700' };

export function CalculatorPage() {
  const [searchParams] = useSearchParams();
  const initProjectId  = searchParams.get('projectId') ?? '';
  const initQuotationId = searchParams.get('quotationId') ?? '';

  const { projects, loadProjects } = useProjectStore();
  const { saveQuotation }         = useQuotationStore();
  const [result, setResult]       = useState<Quotation | null>(null);
  const [saved, setSaved]         = useState(false);
  const [expandCat, setExpandCat] = useState<string | null>('structure');

  useEffect(() => { loadProjects(); }, []);

  // Load existing quotation if id given
  useEffect(() => {
    if (initQuotationId) {
      const q = db.quotations.get(initQuotationId);
      if (q) { setResult(q); setSaved(true); }
    }
  }, [initQuotationId]);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: initProjectId, clientName: '', clientPhone: '', address: '',
      roofType: 'pelana', length: 8, width: 6, overstekFront: 0.5, overstekSide: 0.5,
      roofPitch: 25, includesCeiling: false, ceilingArea: 0, marginPercent: 20,
    },
  });

  const includesCeiling = watch('includesCeiling');
  const selectedProjectId = watch('projectId');

  // Auto-fill client info from project
  useEffect(() => {
    if (selectedProjectId) {
      const p = projects.find(proj => proj.id === selectedProjectId);
      if (p) { setValue('clientName', p.clientName); setValue('address', p.address); setValue('clientPhone', p.clientPhone); }
    }
  }, [selectedProjectId, projects]);

  const onCalculate = (data: FormData) => {
    const quotation = calculateQuotation(data as Parameters<typeof calculateQuotation>[0]);
    setResult(quotation);
    setSaved(false);
    // scroll to result
    setTimeout(() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSave = () => {
    if (!result) return;
    saveQuotation(result);
    if (result.input.projectId) db.projects.save({ ...db.projects.get(result.input.projectId)!, quotationId: result.id });
    setSaved(true);
  };

  const handlePDF = () => { if (result) generateQuotationPDF(result); };

  const categories = result ? [...new Set(result.materials.map(m => m.category))] : [];

  return (
    <div className="animate-fade-in">
      {/* HEADER */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Kalkulator Estimasi</h1>
            <p className="text-xs text-slate-500">Hitung kebutuhan material & buat penawaran</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Calculator size={20} className="text-primary-600" />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* FORM */}
        <form onSubmit={handleSubmit(onCalculate)} className="space-y-4 mb-6">

          {/* Client & Project */}
          <div className="card">
            <p className="section-title">Informasi Klien</p>
            <div className="space-y-3">
              <div>
                <label className="input-label">Link ke Proyek (opsional)</label>
                <select className="input select" {...register('projectId')}>
                  <option value="">-- Tanpa Proyek --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Nama Klien *</label>
                <input className={`input ${errors.clientName ? 'input-error' : ''}`} placeholder="Nama klien / pemilik" {...register('clientName')} />
                {errors.clientName && <p className="error-msg">{errors.clientName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">No. HP</label>
                  <input className="input" type="tel" inputMode="tel" placeholder="08xx" {...register('clientPhone')} />
                </div>
                <div>
                  <label className="input-label">Margin Keuntungan (%)</label>
                  <input className={`input ${errors.marginPercent ? 'input-error' : ''}`} type="number" inputMode="numeric" {...register('marginPercent', { valueAsNumber: true })} />
                </div>
              </div>
              <div>
                <label className="input-label">Alamat *</label>
                <input className={`input ${errors.address ? 'input-error' : ''}`} placeholder="Alamat lokasi pekerjaan" {...register('address')} />
              </div>
            </div>
          </div>

          {/* Roof Type */}
          <div className="card">
            <p className="section-title">Jenis Atap</p>
            <div className="grid grid-cols-3 gap-2">
              {ROOF_TYPE_OPTS.map(opt => {
                const checked = watch('roofType') === opt.value;
                return (
                  <label key={opt.value} className={`border-2 rounded-xl p-2.5 cursor-pointer transition-all text-center ${checked ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'}`}>
                    <input type="radio" className="sr-only" value={opt.value} {...register('roofType')} />
                    <p className="text-lg mb-0.5">{opt.label.split(' ')[0]}</p>
                    <p className={`text-[11px] font-bold ${checked ? 'text-primary-700' : 'text-slate-600'}`}>{opt.label.split(' ').slice(1).join(' ')}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Dimensions */}
          <div className="card">
            <p className="section-title">Dimensi Bangunan</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'length', label: 'Panjang (m)', placeholder: '8' },
                { name: 'width',  label: 'Lebar (m)',   placeholder: '6' },
                { name: 'overstekFront', label: 'Overstek Depan (m)', placeholder: '0.5' },
                { name: 'overstekSide',  label: 'Overstek Samping (m)', placeholder: '0.5' },
                { name: 'roofPitch', label: 'Kemiringan (°)', placeholder: '25' },
              ].map(f => (
                <div key={f.name} className={f.name === 'roofPitch' ? 'col-span-2' : ''}>
                  <label className="input-label">{f.label}</label>
                  <input className={`input ${errors[f.name as keyof FormData] ? 'input-error' : ''}`}
                    type="number" inputMode="decimal" step="0.1" placeholder={f.placeholder}
                    {...register(f.name as keyof FormData, { valueAsNumber: true })} />
                </div>
              ))}
            </div>
            {/* Pitch visual hint */}
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <Info size={14} className="text-primary-500 flex-shrink-0" />
              <p className="text-[11px] text-slate-500">Kemiringan umum: <b>15–20°</b> (landai) • <b>25–35°</b> (standar) • <b>40–50°</b> (curam)</p>
            </div>
          </div>

          {/* Ceiling Toggle */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Termasuk Plafon PVC?</p>
                <p className="text-xs text-slate-400">Tambahkan estimasi material plafon</p>
              </div>
              <label className="relative cursor-pointer">
                <input type="checkbox" className="sr-only" {...register('includesCeiling')} />
                <div className={`toggle-track${includesCeiling ? ' on' : ''}`}>
                  <div className="toggle-thumb" />
                </div>
              </label>
            </div>
            {includesCeiling && (
              <div className="mt-3">
                <label className="input-label">Luas Plafon (m²)</label>
                <input className="input" type="number" inputMode="numeric" placeholder="cth. 48" {...register('ceilingArea', { valueAsNumber: true })} />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <label className="input-label">Catatan Tambahan (opsional)</label>
            <textarea className="input" rows={2} placeholder="Catatan khusus untuk penawaran..." {...register('notes')} />
          </div>

          <button type="submit" className="btn btn-primary w-full text-base py-3.5">
            <Calculator size={18} /> Hitung Estimasi Sekarang
          </button>
        </form>

        {/* RESULT */}
        {result && (
          <div id="result-section" className="mb-8 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <p className="section-title mb-0">Hasil Estimasi</p>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => { setResult(null); reset(); }}>
                  <RotateCcw size={14} /> Reset
                </button>
                {!saved && <button className="btn btn-success btn-sm" onClick={handleSave}><Save size={14} /> Simpan</button>}
                <button className="btn btn-primary btn-sm" onClick={handlePDF}><FileDown size={14} /> PDF</button>
              </div>
            </div>

            {/* Summary card */}
            <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white mb-4 border-0">
              <p className="text-primary-200 text-xs font-semibold mb-1">TOTAL PENAWARAN</p>
              <p className="text-3xl font-extrabold">{formatRupiah(result.grandTotal)}</p>
              <p className="text-primary-200 text-xs mt-2">Luas atap: {result.roofArea} m² • Margin: {result.input.marginPercent}%</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'Material', val: result.materialSubtotal },
                  { label: 'Jasa', val: result.laborCost },
                  { label: 'Keuntungan', val: result.marginAmount },
                ].map(row => (
                  <div key={row.label} className="bg-white/15 rounded-lg p-2 text-center">
                    <p className="text-white font-bold text-xs">{formatRupiah(row.val)}</p>
                    <p className="text-primary-200 text-[10px]">{row.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Material breakdown by category */}
            {categories.map(cat => {
              const catItems = result.materials.filter(m => m.category === cat);
              const catTotal = catItems.reduce((s, m) => s + m.total, 0);
              const isOpen   = expandCat === cat;
              return (
                <div key={cat} className="card mb-2">
                  <button className="w-full flex items-center justify-between" onClick={() => setExpandCat(isOpen ? null : cat)}>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${CAT_COLOR[cat]} text-[11px]`}>{CAT_LABEL[cat]}</span>
                      <span className="text-xs text-slate-400">{catItems.length} item</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{formatRupiah(catTotal)}</span>
                      {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-0">
                      {catItems.map(m => (
                        <div key={m.code} className="material-row">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                            <p className="text-xs text-slate-400">{m.qty} {m.unit} × {formatRupiah(m.unitPrice)}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-800 flex-shrink-0">{formatRupiah(m.total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Labor */}
            <div className="card mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">🧑‍🔧 Jasa Pemasangan</p>
                  <p className="text-xs text-slate-400">{result.roofArea} m² × tarif standar</p>
                </div>
                <p className="text-sm font-bold text-slate-800">{formatRupiah(result.laborCost)}</p>
              </div>
            </div>

            {saved && <div className="alert alert-success mb-4"><span>✓ Penawaran berhasil disimpan ke proyek</span></div>}
          </div>
        )}
      </div>
    </div>
  );
}
