import type { QuotationInput, MaterialItem, Quotation } from '@/types';
import { generateId } from './db';

// ─── Master Price List (Harga Satuan) ──────────────────────────────────────
export const MASTER_PRICES: Record<string, { name: string; unit: string; price: number; category: MaterialItem['category'] }> = {
  'KANAL_C75':     { name: 'Baja Ringan Kanal C75',    unit: 'batang (6m)', price: 82000,  category: 'structure'  },
  'KANAL_C100':    { name: 'Baja Ringan Kanal C100',   unit: 'batang (6m)', price: 98000,  category: 'structure'  },
  'RENG_35':       { name: 'Reng Baja Ringan 35',      unit: 'batang (6m)', price: 29000,  category: 'structure'  },
  'SPANDEK_03':    { name: 'Atap Spandek 0.3mm',       unit: 'lembar (5m)',  price: 82000,  category: 'cover'      },
  'SPANDEK_04':    { name: 'Atap Spandek 0.4mm',       unit: 'lembar (5m)',  price: 98000,  category: 'cover'      },
  'SCREW_HEX':     { name: 'Sekrup Hex 12-14 x 20',    unit: 'box (250pcs)',  price: 72000,  category: 'fastener'   },
  'SCREW_SELF':    { name: 'Sekrup Self Drilling 10',   unit: 'box (200pcs)',  price: 55000,  category: 'fastener'   },
  'RIDGE_CAP':     { name: 'Nok / Ridge Cap',           unit: 'lembar (2m)',  price: 25000,  category: 'accessory'  },
  'FLASHING':      { name: 'Flashing Talang Aluminium', unit: 'meter',        price: 35000,  category: 'accessory'  },
  'PVC_PANEL':     { name: 'Panel Plafon PVC 20cm',     unit: 'meter',        price: 28000,  category: 'ceiling'    },
  'PVC_LIST':      { name: 'List Plafon PVC',           unit: 'meter',        price: 8500,   category: 'ceiling'    },
  'FURRING_CH':    { name: 'Furring Channel (Rangka)',  unit: 'batang (3m)', price: 32000,  category: 'ceiling'    },
  'HANGER_WIRE':   { name: 'Hanger Wire',               unit: 'meter',        price: 3500,   category: 'ceiling'    },
  'LABOR_ROOF':    { name: 'Upah Pasang Rangka + Atap', unit: 'm²',           price: 95000,  category: 'cover'      },
  'LABOR_CEILING': { name: 'Upah Pasang Plafon PVC',    unit: 'm²',           price: 75000,  category: 'ceiling'    },
};

// ─── Calculation Engine ────────────────────────────────────────────────────
export function calculateRoofArea(input: QuotationInput): {
  flatArea: number;
  slopeArea: number;
  ridgeLength: number;
  eaveLength: number;
} {
  const pitchRad = (input.roofPitch * Math.PI) / 180;
  const slopeFactor = 1 / Math.cos(pitchRad);

  const effectiveLength = input.length + input.overstekFront + input.overstekFront; // front+back
  const effectiveWidth  = input.width + 2 * input.overstekSide;

  let flatArea: number;
  let ridgeLength: number;
  let eaveLength: number;

  switch (input.roofType) {
    case 'pelana':
      flatArea    = effectiveLength * effectiveWidth;
      ridgeLength = effectiveLength;
      eaveLength  = 2 * effectiveLength + 2 * (effectiveWidth / 2);
      break;
    case 'perisai':
      flatArea    = effectiveLength * effectiveWidth;
      ridgeLength = effectiveLength - effectiveWidth;
      eaveLength  = 2 * (effectiveLength + effectiveWidth);
      break;
    case 'plana':
    default:
      flatArea    = effectiveLength * effectiveWidth;
      ridgeLength = effectiveLength;
      eaveLength  = effectiveLength + 2 * (effectiveWidth / 2);
  }

  return {
    flatArea,
    slopeArea: flatArea * slopeFactor,
    ridgeLength,
    eaveLength,
  };
}

export function calculateQuotation(input: QuotationInput): Quotation {
  const { slopeArea, ridgeLength, eaveLength } = calculateRoofArea(input);

  const roofArea = slopeArea;
  const items: MaterialItem[] = [];

  // Utility: add material item
  const addItem = (code: string, qty: number, roundUp = true) => {
    const m = MASTER_PRICES[code];
    if (!m) return;
    const finalQty = roundUp ? Math.ceil(qty) : parseFloat(qty.toFixed(2));
    items.push({ code, name: m.name, qty: finalQty, unit: m.unit, unitPrice: m.price, total: finalQty * m.price, category: m.category });
  };

  // ── STRUCTURE: Kanal C (Truss) ──
  // Kuda-kuda spacing 1.2m, each rafter = half-width × slope
  const pitchRad  = (input.roofPitch * Math.PI) / 180;
  const rafterLen = (input.width / 2 + input.overstekSide) / Math.cos(pitchRad);
  const effectiveLength = input.length + 2 * input.overstekFront;
  const numRafters = Math.ceil(effectiveLength / 1.2) + 1;
  const kanalCTotal6m = Math.ceil((numRafters * rafterLen * 2 + effectiveLength) / 6);
  addItem('KANAL_C75', kanalCTotal6m);

  // ── STRUCTURE: Reng ──
  // Reng spacing 0.5m along slope
  const numRengRows = Math.ceil((rafterLen * 2) / 0.5);
  const rengBatang  = Math.ceil((numRengRows * effectiveLength) / 6);
  addItem('RENG_35', rengBatang);

  // ── COVER: Spandek ──
  // Sheet width coverage ≈ 0.75m, length = rafterLen × 2 + 0.15m overlap
  const sheetWidth = 0.75;
  const sheetLength = 5;
  const numSheetsPerRow = Math.ceil(effectiveLength / sheetWidth);
  const numSheetRows    = Math.ceil(rafterLen / (sheetLength - 0.15)) + 1;
  const totalSheets = numSheetsPerRow * numSheetRows;
  addItem('SPANDEK_03', totalSheets);

  // ── FASTENER: Screws ──
  const screwBoxes = Math.ceil(totalSheets * 12 / 250); // ~12 screws per sheet
  addItem('SCREW_HEX', screwBoxes);
  const selfDrillBoxes = Math.ceil(kanalCTotal6m * 4 / 200);
  addItem('SCREW_SELF', selfDrillBoxes);

  // ── ACCESSORY: Ridge cap & Flashing ──
  addItem('RIDGE_CAP', Math.ceil(ridgeLength / 2));
  addItem('FLASHING',  Math.ceil(eaveLength));

  // ── CEILING ──
  if (input.includesCeiling && input.ceilingArea && input.ceilingArea > 0) {
    const cArea = input.ceilingArea;
    addItem('PVC_PANEL',  cArea / 0.6 * 1.05); // 20cm panel, 5% waste
    addItem('PVC_LIST',   Math.sqrt(cArea) * 4);
    addItem('FURRING_CH', Math.ceil((cArea * 1.2) / 3));
    addItem('HANGER_WIRE', Math.ceil(cArea * 0.5));
  }

  const materialSubtotal = items.reduce((s, m) => s + m.total, 0);

  // ── LABOR ──
  const laborCost = Math.round(roofArea * MASTER_PRICES['LABOR_ROOF'].price +
    (input.includesCeiling && input.ceilingArea ? input.ceilingArea * MASTER_PRICES['LABOR_CEILING'].price : 0));

  const subtotal    = materialSubtotal + laborCost;
  const marginAmount = Math.round(subtotal * (input.marginPercent / 100));
  const grandTotal  = subtotal + marginAmount;

  return {
    id: generateId('quo'),
    input,
    materials: items,
    materialSubtotal,
    laborCost,
    subtotal,
    marginAmount,
    grandTotal,
    roofArea: parseFloat(roofArea.toFixed(2)),
    createdAt: new Date().toISOString(),
  };
}
