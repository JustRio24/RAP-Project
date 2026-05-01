import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Quotation, MaterialItem } from '@/types';
import { formatRupiah, formatDate } from './db';

export function generateQuotationPDF(quotation: Quotation) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 16;
  const contentW = pageW - margin * 2;
  const { input: inp, materials, materialSubtotal, laborCost, subtotal, marginAmount, grandTotal, roofArea, createdAt } = quotation;

  // ── COLOR PALETTE ──────────────────────────────────────────────────────
  const PRIMARY   = [2, 132, 199] as [number, number, number];
  const PRIMARY_DARK = [3, 105, 161] as [number, number, number];
  const SLATE_100 = [241, 245, 249] as [number, number, number];
  const SLATE_700 = [51, 65, 85] as [number, number, number];
  const WHITE     = [255, 255, 255] as [number, number, number];
  const SUCCESS   = [22, 163, 74] as [number, number, number];

  // ── HEADER BANNER ──────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setFillColor(...PRIMARY_DARK);
  doc.rect(0, 32, pageW, 8, 'F');

  // Logo / App name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('KONSTRA', margin, 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Kontraktor Sistem Terpadu Rangka & Atap', margin, 22);
  doc.text('Jl. Kontraktor No. 1, Bandung | 081234567890', margin, 27);

  // Doc title right-aligned
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT PENAWARAN HARGA', pageW - margin, 14, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`No: SPH/${new Date(createdAt).getFullYear()}/${quotation.id.slice(-4).toUpperCase()}`, pageW - margin, 20, { align: 'right' });
  doc.text(`Tanggal: ${formatDate(createdAt.split('T')[0])}`, pageW - margin, 26, { align: 'right' });

  // ── CLIENT INFO ────────────────────────────────────────────────────────
  let y = 48;
  doc.setFillColor(...SLATE_100);
  doc.roundedRect(margin, y, contentW, 28, 2, 2, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE_700);
  doc.text('DITUJUKAN KEPADA:', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(inp.clientName, margin + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`📍 ${inp.address}`, margin + 4, y + 19);
  if (inp.clientPhone) doc.text(`📞 ${inp.clientPhone}`, margin + 4, y + 24);

  // Project details right side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_700);
  doc.text('DETAIL PEKERJAAN:', pageW - margin - 55, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const roofTypeLabel: Record<string, string> = { pelana: 'Atap Pelana', perisai: 'Atap Perisai', plana: 'Atap Plana' };
  doc.text(`Jenis: ${roofTypeLabel[inp.roofType] ?? '-'}`, pageW - margin - 55, y + 13);
  doc.text(`Ukuran: ${inp.length}m × ${inp.width}m`, pageW - margin - 55, y + 19);
  doc.text(`Luas Atap: ${roofArea.toFixed(1)} m²`, pageW - margin - 55, y + 25);

  // ── MATERIAL TABLE ─────────────────────────────────────────────────────
  y += 34;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text('RINCIAN MATERIAL & PEKERJAAN', margin, y);
  y += 3;

  const categories: MaterialItem['category'][] = ['structure', 'cover', 'fastener', 'accessory', 'ceiling'];
  const catLabels: Record<string, string> = {
    structure: '🔩 Struktur Rangka Baja Ringan',
    cover: '🏠 Penutup Atap',
    fastener: '🔧 Pengencang & Sekrup',
    accessory: '🔮 Aksesoris Atap',
    ceiling: '✨ Plafon PVC',
  };

  const tableBody: (string | { content: string; styles: object })[][] = [];
  const catColors: Record<string, [number,number,number]> = {
    structure: [240,249,255], cover: [240,253,244], fastener: [254,252,232], accessory: [250,245,255], ceiling: [255,247,237],
  };

  categories.forEach(cat => {
    const catItems = materials.filter(m => m.category === cat);
    if (!catItems.length) return;
    tableBody.push([{ content: catLabels[cat], styles: { fontStyle: 'bold', fillColor: catColors[cat], colSpan: 5, textColor: [15,23,42] } }, '', '', '', '']);
    catItems.forEach((m, i) => {
      tableBody.push([
        `${i + 1}. ${m.name}`,
        `${m.qty}`,
        m.unit,
        formatRupiah(m.unitPrice),
        formatRupiah(m.total),
      ]);
    });
  });

  // Add labor row
  tableBody.push([{ content: '🧑‍🔧 Jasa Pemasangan', styles: { fontStyle: 'bold', fillColor: [240,253,250], colSpan: 5 } }, '', '', '', '']);
  tableBody.push([`Upah Pasang (${inp.includesCeiling ? 'Atap + Plafon' : 'Atap'})`, `${roofArea.toFixed(1)} m²`, 'Paket', '-', formatRupiah(laborCost)]);

  autoTable(doc, {
    startY: y + 2,
    head: [['Uraian Pekerjaan', 'Qty', 'Satuan', 'Harga Sat.', 'Total']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, textColor: [15, 23, 42] },
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  // ── TOTALS BOX ─────────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const boxX = pageW - margin - 75;
  const boxW = 75;

  const totalRows = [
    ['Subtotal Material', formatRupiah(materialSubtotal)],
    ['Jasa Pemasangan', formatRupiah(laborCost)],
    ['Subtotal', formatRupiah(subtotal)],
    [`Margin / Keuntungan (${inp.marginPercent}%)`, formatRupiah(marginAmount)],
  ];

  let ty = finalY;
  doc.setFillColor(...SLATE_100);
  doc.roundedRect(boxX - 2, ty - 2, boxW + 2, totalRows.length * 7 + 15, 2, 2, 'F');

  totalRows.forEach(([label, val]) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(label, boxX, ty + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, boxX + boxW - 2, ty + 4, { align: 'right' });
    ty += 7;
  });

  // Grand total highlight
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(boxX - 2, ty, boxW + 2, 12, 2, 2, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('TOTAL PENAWARAN', boxX, ty + 8);
  doc.text(formatRupiah(grandTotal), boxX + boxW - 2, ty + 8, { align: 'right' });

  // ── NOTES ──────────────────────────────────────────────────────────────
  const notesY = finalY;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text('CATATAN:', margin, notesY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const notes = [
    '• Harga sudah termasuk material dan jasa pemasangan',
    '• Tidak termasuk pondasi, dinding, dan pekerjaan sipil lainnya',
    '• Pembayaran: 50% DP sebelum pekerjaan, 50% setelah selesai',
    '• Garansi pekerjaan 1 tahun',
    inp.notes ? `• ${inp.notes}` : '',
  ].filter(Boolean);
  notes.forEach((note, i) => {
    doc.text(note, margin, notesY + 11 + i * 5);
  });

  // ── FOOTER SIGNATURE ───────────────────────────────────────────────────
  const footerY = 265;
  doc.setDrawColor(SLATE_100[0], SLATE_100[1], SLATE_100[2]);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Hormat kami,', pageW - margin - 40, footerY + 8, { align: 'center' });
  doc.text('KONSTRA', pageW - margin - 40, footerY + 28, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Pimpinan Proyek', pageW - margin - 40, footerY + 34, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen ini digenerate otomatis oleh KONSTRA App • ${new Date().toLocaleDateString('id-ID')}`, pageW / 2, 292, { align: 'center' });

  // ── SAVE ───────────────────────────────────────────────────────────────
  const fileName = `SPH-${inp.clientName.replace(/\s/g, '_')}-${new Date(createdAt).getTime()}.pdf`;
  doc.save(fileName);
}
