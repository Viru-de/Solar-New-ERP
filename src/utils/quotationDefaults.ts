import { Quotation, QuotationItem, QuotationPaymentMilestone } from '../types/solar';

export const REFERENCE_5KW_BOM: QuotationItem[] = [
  {
    id: 'bom-1',
    productName: 'DCR Bifacial Solar 545W Module',
    make: 'Waaree',
    specification: '545Wp DCR Tier-1 Bifacial Dual Glass Mono PERC Modules',
    quantity: 9,
    unit: 'Nos',
    rate: 14500,
    amount: 130500,
    category: 'Panels'
  },
  {
    id: 'bom-2',
    productName: 'Grid Tie Inverter 5KW 3PH (With WIFI Stick)',
    make: 'Waaree',
    specification: '5 kW 3-Phase On-Grid String Inverter with remote WiFi monitoring',
    quantity: 1,
    unit: 'No',
    rate: 52000,
    amount: 52000,
    category: 'Inverter'
  },
  {
    id: 'bom-3',
    productName: 'ACDB - DCDB BOX 3PH - 1 in 1 out',
    make: 'Waaree',
    specification: 'IP65 Polycarbonate Enclosure, SPD Type-II, MCB/MCCB & Fuse Protection',
    quantity: 1,
    unit: 'Pair',
    rate: 9500,
    amount: 9500,
    category: 'Electrical'
  },
  {
    id: 'bom-4',
    productName: 'JSW/APL GI Module Mounting Structure Elevated',
    make: 'JSW / APL Apollo',
    specification: 'Hot-Dip Galvanized / Pre-GI elevated rooftop structure (80-120 micron)',
    quantity: 1,
    unit: 'Set',
    rate: 38000,
    amount: 38000,
    category: 'Structure'
  },
  {
    id: 'bom-5',
    productName: 'Net Meter (CSPDCL) Genius/Equivalent',
    make: 'Genius / Secure',
    specification: '3-Phase Bi-directional Net Meter approved by CSPDCL/DISCOM',
    quantity: 1,
    unit: 'No',
    rate: 8500,
    amount: 8500,
    category: 'Net Metering'
  },
  {
    id: 'bom-6',
    productName: 'Earthing Kit',
    make: 'Waaree',
    specification: 'Chemical Earthing Electrodes with BFC compound & grounding strip',
    quantity: 1,
    unit: 'Set',
    rate: 7500,
    amount: 7500,
    category: 'Electrical'
  },
  {
    id: 'bom-7',
    productName: 'DC/AC/Earthing wires and cables',
    make: 'Polycab / FlipCap / HPL',
    specification: '1C x 4/6 sq.mm Solar DC XLPO Cable, 4C Cu/Al AC armored cable',
    quantity: 1,
    unit: 'Lot',
    rate: 16848,
    amount: 16848,
    category: 'Electrical'
  },
  {
    id: 'bom-8',
    productName: 'PVC Pipes, MC4 Connectors, Tape, Joints, Cable Tray, Meter Board, Zip Tie, etc.',
    make: 'As Standard',
    specification: 'Balance of System: Conduit pipes, glands, lugs, fasteners, trays',
    quantity: 1,
    unit: 'Lot',
    rate: 6000,
    amount: 6000,
    category: 'Other'
  }
];

export const REFERENCE_3KW_BOM: QuotationItem[] = [
  {
    id: 'bom-3k-1',
    productName: 'Waaree 545W Mono PERC Bifacial Solar PV Module',
    make: 'Waaree Energies',
    specification: '545Wp DCR Bifacial Dual Glass, 144 Half-cut Cells, IP68',
    quantity: 6,
    unit: 'Nos',
    rate: 14500,
    amount: 87000,
    category: 'Panels'
  },
  {
    id: 'bom-3k-2',
    productName: 'Single Phase Grid Tie Inverter 3.3KW with WiFi',
    make: 'Growatt / Waaree',
    specification: '3.3 kW 1-Phase 230V String Inverter with MPPT & Remote App Monitoring',
    quantity: 1,
    unit: 'No',
    rate: 34000,
    amount: 34000,
    category: 'Inverter'
  },
  {
    id: 'bom-3k-3',
    productName: '1-Phase ACDB / DCDB Integrated Protection Box',
    make: 'Havells / L&T',
    specification: 'IP65 Enclosure with 1000V DC Fuse, SPD Type-II & AC MCB Isolator',
    quantity: 1,
    unit: 'Pair',
    rate: 6800,
    amount: 6800,
    category: 'Electrical'
  },
  {
    id: 'bom-3k-4',
    productName: 'Pre-GI Standard Elevated Rooftop Mounting Structure',
    make: 'JSW / APL Apollo',
    specification: 'Pre-Galvanized C-channel Solar structure with SS304 fasteners',
    quantity: 1,
    unit: 'Set',
    rate: 22000,
    amount: 22000,
    category: 'Structure'
  },
  {
    id: 'bom-3k-5',
    productName: 'Discom 1-Phase Bi-directional Net Meter',
    make: 'Genus / Secure',
    specification: 'Discom approved single phase smart bidirectional export/import meter',
    quantity: 1,
    unit: 'No',
    rate: 5500,
    amount: 5500,
    category: 'Net Metering'
  },
  {
    id: 'bom-3k-6',
    productName: 'Chemical Earthing Electrodes & Lightning Protection',
    make: 'True Power / Ashlok',
    specification: '2x Chemical Earth Electrodes + BFC compound + Conventional Lightning Arrester',
    quantity: 1,
    unit: 'Set',
    rate: 6500,
    amount: 6500,
    category: 'Electrical'
  },
  {
    id: 'bom-3k-7',
    productName: 'Solar DC Cable 4 sq.mm & AC Armoured Cable Lot',
    make: 'Polycab / KEI',
    specification: 'UV resistant cross-linked solar cable & 4 sq.mm 2-core copper AC wire',
    quantity: 1,
    unit: 'Lot',
    rate: 9800,
    amount: 9800,
    category: 'Electrical'
  },
  {
    id: 'bom-3k-8',
    productName: 'Balance of System: Conduits, MC4, Clamps & Fasteners',
    make: 'Standard EPC Kit',
    specification: 'Heavy PVC conduit pipes, UV ties, SS304 mid/end clamps, anchor bolts',
    quantity: 1,
    unit: 'Lot',
    rate: 4500,
    amount: 4500,
    category: 'Other'
  }
];

export const REFERENCE_10KW_BOM: QuotationItem[] = [
  {
    id: 'bom-10k-1',
    productName: 'Waaree 545Wp Mono PERC Bifacial Solar PV Module',
    make: 'Waaree Energies',
    specification: '545Wp DCR Bifacial Dual Glass, 144 Half-cut Cells, IP68',
    quantity: 19,
    unit: 'Nos',
    rate: 14200,
    amount: 269800,
    category: 'Panels'
  },
  {
    id: 'bom-10k-2',
    productName: '10 kW 3-Phase On-Grid Solar Inverter with Dual MPPT',
    make: 'Sungrow / Waaree',
    specification: '10 kW 415V 3-Phase String Inverter with Dual MPPT & 4G/WiFi Dongle',
    quantity: 1,
    unit: 'No',
    rate: 78000,
    amount: 78000,
    category: 'Inverter'
  },
  {
    id: 'bom-10k-3',
    productName: '3-Phase ACDB & Dual-String DCDB Distribution Panels',
    make: 'Schneider / L&T',
    specification: 'IP65 with 1000V DC SPD, 63A 4-Pole AC MCCB and surge suppressors',
    quantity: 1,
    unit: 'Pair',
    rate: 16500,
    amount: 16500,
    category: 'Electrical'
  },
  {
    id: 'bom-10k-4',
    productName: 'Heavy HDG 80 Micron Elevated Rooftop Structure',
    make: 'Jindal / APL Apollo',
    specification: 'Hot-Dip Galvanized 80 micron elevated structure with 150 km/h wind certification',
    quantity: 1,
    unit: 'Set',
    rate: 72000,
    amount: 72000,
    category: 'Structure'
  },
  {
    id: 'bom-10k-5',
    productName: 'CSPDCL 3-Phase Bi-Directional Net Metering Kit',
    make: 'Secure / Genus',
    specification: '3-Phase 4-Wire Whole Current / CT Net Meter with test report certificate',
    quantity: 1,
    unit: 'No',
    rate: 11500,
    amount: 11500,
    category: 'Net Metering'
  },
  {
    id: 'bom-10k-6',
    productName: 'Heavy Duty Chemical Earthing (4 Pits) & ESE Lightning Arrester',
    make: 'Ashlok / ERICO',
    specification: '4 Nos 50mm x 3m copper bonded chemical rods + Early Streamer Emission Arrester',
    quantity: 1,
    unit: 'Set',
    rate: 18000,
    amount: 18000,
    category: 'Electrical'
  },
  {
    id: 'bom-10k-7',
    productName: 'Polycab Solar DC Cables & 4-Core Copper AC Cable Lot',
    make: 'Polycab',
    specification: '1C x 4 sq.mm Red/Black DC XLPO (200m) + 4C x 10 sq.mm Armoured AC Cable (50m)',
    quantity: 1,
    unit: 'Lot',
    rate: 32000,
    amount: 32000,
    category: 'Electrical'
  },
  {
    id: 'bom-10k-8',
    productName: 'Complete Balance of System (BOS) & GI Perforated Cable Tray',
    make: 'Profab / Standard',
    specification: 'Perforated GI Cable Trays, MC4 Y-connectors, heavy conduits, civil anchors',
    quantity: 1,
    unit: 'Lot',
    rate: 14000,
    amount: 14000,
    category: 'Other'
  }
];

export interface BomPresetTemplate {
  id: string;
  name: string;
  capacityKw: number;
  systemType: 'On-Grid' | 'Off-Grid' | 'Hybrid';
  badge: string;
  description: string;
  items: QuotationItem[];
}

export const BOM_PRESET_TEMPLATES: BomPresetTemplate[] = [
  {
    id: 'tpl-5kw',
    name: '5 kW Turnkey Residential / Commercial (Waaree)',
    capacityKw: 5,
    systemType: 'On-Grid',
    badge: 'Standard 5kW',
    description: '9x 545W Bifacial Modules, 5kW 3-Phase Inverter, Elevated HDG Structure',
    items: REFERENCE_5KW_BOM
  },
  {
    id: 'tpl-3kw',
    name: '3.3 kW PM Surya Ghar Scheme (Single Phase)',
    capacityKw: 3.3,
    systemType: 'On-Grid',
    badge: 'PM Surya Ghar',
    description: '6x 545W Modules, 3.3kW 1-Phase Inverter, Net Meter, Standard GI Structure',
    items: REFERENCE_3KW_BOM
  },
  {
    id: 'tpl-10kw',
    name: '10 kW Commercial Turnkey (3-Phase)',
    capacityKw: 10,
    systemType: 'On-Grid',
    badge: 'Commercial 10kW',
    description: '19x 545W Modules, 10kW String Inverter, 4-Pit Earthing, GI Cable Trays',
    items: REFERENCE_10KW_BOM
  }
];

export const DEFAULT_PAYMENT_MILESTONES: QuotationPaymentMilestone[] = [
  {
    id: 'pm-1',
    title: '10% Advance / Token',
    percentage: 10,
    amount: 32000,
    description: 'Upon signing of the purchase order / contract'
  },
  {
    id: 'pm-2',
    title: '70% Material Procurement',
    percentage: 70,
    amount: 224000,
    description: 'On delivery of PV modules and inverter at site'
  },
  {
    id: 'pm-3',
    title: '18% Installation Day',
    percentage: 18,
    amount: 57600,
    description: 'On structure & module mounting completion'
  },
  {
    id: 'pm-4',
    title: '2% Grid Connection Completion',
    percentage: 2,
    amount: 6400,
    description: 'On net-metering synchronization & final commissioning'
  }
];

export const REFERENCE_5KW_QUOTATION: Quotation = {
  id: 'quote-waaree-5kw-ref',
  quotationNumber: 'RSP/QTN/2026-27/0010',
  quotationDate: '2026-09-21',
  customerId: 'cust-1',
  customerName: 'Shri Rameshwar Patel',
  companyName: 'Patel Agro Industries',
  customerPhone: '+91 98795 44321',
  customerEmail: 'rameshwar.patel@example.com',
  siteAddress: 'Survey No. 142/2, Near Industrial Area, Mandir Hasaud',
  city: 'Raipur, Chhattisgarh',
  customerGst: '22AAAAA0000A1Z5',
  systemType: 'On-Grid',
  capacityKw: 5,
  panelType: 'DCR Bifacial Mono PERC',
  panelBrand: 'Waaree 545W',
  inverterBrand: 'Waaree 5KW 3PH Grid Tie',
  structureType: 'Elevated HDG / GI Structure',
  bomSubtotal: 268348,
  installationCharges: 20000,
  transportationCharges: 5500,
  otherCharges: 0,
  discountAmount: 0,
  baseProjectPrice: 293848,
  costPerKw: 58770,
  gstEquipmentPercent: 70,
  gstEquipmentRate: 5,
  gstServicesPercent: 30,
  gstServicesRate: 18,
  gstAmount: 26152,
  totalProjectCost: 320000,
  centralSubsidy: 78000,
  stateSubsidy: 30000,
  totalSubsidy: 108000,
  finalProjectInvestment: 212000,
  amountInWords: 'Three Lakh Twenty Thousand Rupees Only',
  validityDays: 15,
  validTill: '2026-10-06',
  paymentMilestones: DEFAULT_PAYMENT_MILESTONES,
  items: REFERENCE_5KW_BOM,
  status: 'SENT',
  createdAt: '2026-09-21',
  ratePerWp: 58.77,
  baseAmount: 293848,
  taxAmount: 26152,
  totalAmount: 320000
};
