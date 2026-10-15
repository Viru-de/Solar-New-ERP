import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { BillOfMaterials, Warehouse } from '../../types/solar';
import { storageService } from '../../services/storage';
import { useApp } from '../../context/AppContext';
import { numberToIndianWords } from '../../utils/indianNumberWords';
import {
  X,
  Printer,
  Download,
  Copy,
  CheckCircle2,
  Truck,
  FileText,
  Building2,
  Calendar,
  MapPin,
  QrCode,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Edit3,
  Layers,
  ChevronDown
} from 'lucide-react';

interface EWayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bom: BillOfMaterials | null;
  onSaved?: (ewbNumber: string) => void;
}

// Indian GST State Code mapping
const GST_STATE_CODES: Record<string, string> = {
  Chhattisgarh: '22',
  Gujarat: '24',
  Maharashtra: '27',
  Karnataka: '29',
  Haryana: '06',
  Delhi: '07',
  Rajasthan: '08',
  'Madhya Pradesh': '23',
  'Uttar Pradesh': '09',
  'Tamil Nadu': '33',
  Telangana: '36',
  'Andhra Pradesh': '37',
  'West Bengal': '19',
  Punjab: '03',
  Odisha: '21'
};

function getStateCode(stateName?: string): string {
  if (!stateName) return '22';
  for (const [key, code] of Object.entries(GST_STATE_CODES)) {
    if (stateName.toLowerCase().includes(key.toLowerCase())) return code;
  }
  return '22';
}

function formatEwbDate(dateStr?: string): string {
  if (!dateStr) return '23-Sep-26';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export const EWayBillModal: React.FC<EWayBillModalProps> = ({
  isOpen,
  onClose,
  bom,
  onSaved
}) => {
  const { showToast, triggerRefresh } = useApp();

  // Mode: 'eway' (Page 2), 'invoice' (Page 1), 'both' (Both pages for print), 'edit' (Parameters)
  const [activeTab, setActiveTab] = useState<'eway' | 'invoice' | 'both' | 'edit'>('eway');
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Retrieve contextual ERP records
  const settings = useMemo(() => storageService.getSettings(), [isOpen]);
  const customers = useMemo(() => storageService.getCustomers(), [isOpen]);
  const projects = useMemo(() => storageService.getProjects(), [isOpen]);
  const products = useMemo(() => storageService.getProducts(), [isOpen]);
  const invoices = useMemo(() => storageService.getSalesInvoices(), [isOpen]);
  const warehouses = useMemo(() => storageService.getWarehouses(), [isOpen]);

  // Warehouse selection state - default to BOM warehouse, or Bhilai warehouse, or default
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Match records for active BOM
  const linkedProject = useMemo(() => {
    if (!bom) return null;
    return (
      projects.find(
        p => p.id === bom.projectId || p.projectCode === bom.projectCode || p.title === bom.projectTitle
      ) || null
    );
  }, [bom, projects]);

  const linkedCustomer = useMemo(() => {
    if (!bom) return null;
    return (
      customers.find(
        c =>
          (linkedProject && c.id === linkedProject.customerId) ||
          c.name.toLowerCase() === bom.customerName.toLowerCase() ||
          (c.companyName && c.companyName.toLowerCase() === bom.customerName.toLowerCase())
      ) || null
    );
  }, [bom, linkedProject, customers]);

  const linkedInvoice = useMemo(() => {
    if (!bom) return null;
    return (
      invoices.find(
        inv =>
          (bom.projectId && inv.projectId === bom.projectId) ||
          inv.customerName.toLowerCase() === bom.customerName.toLowerCase()
      ) || null
    );
  }, [bom, invoices]);

  // Form State for E-Way Bill & Transport Parameters
  const [ewbNumber, setEwbNumber] = useState('871743958765');
  const [docNumber, setDocNumber] = useState('RSP/199');
  const [docDate, setDocDate] = useState('2026-09-23');
  const [supplyType, setSupplyType] = useState('Outward-Supply');
  const [transactionType, setTransactionType] = useState('Regular');
  const [transporterName, setTransporterName] = useState('');
  const [transporterId, setTransporterId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('CG04QR4154');
  const [transportDocNo, setTransportDocNo] = useState('');
  const [transportDocDate, setTransportDocDate] = useState('');
  const [transportMode, setTransportMode] = useState<'1 - Road' | '2 - Rail' | '3 - Air' | '4 - Ship'>('1 - Road');
  const [distanceKm, setDistanceKm] = useState('24');
  const [cewbNo, setCewbNo] = useState('');

  // Initialize or reset EWB details when BOM changes or modal opens
  useEffect(() => {
    if (!bom) return;

    // Pick warehouse: 1. bom.warehouseId, 2. bom.warehouseName, 3. Bhilai warehouse, 4. default warehouse
    let matchWh = warehouses.find(w => w.id === bom.warehouseId);
    if (!matchWh && bom.warehouseName) {
      matchWh = warehouses.find(w => w.name === bom.warehouseName);
    }
    if (!matchWh) {
      matchWh = warehouses.find(w => w.city.toLowerCase().includes('bhilai')) || storageService.getDefaultWarehouse();
    }
    if (matchWh) {
      setSelectedWarehouseId(matchWh.id);
    } else if (warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }

    const existingNum = bom.ewayBillNumber;
    const generatedNum = existingNum || (bom.projectCode === 'RSP/199' ? '871743958765' : `8717${Math.floor(10000000 + Math.random() * 90000000)}`);

    setEwbNumber(generatedNum);
    setDocNumber(bom.projectCode && bom.projectCode.includes('/') ? bom.projectCode : (linkedInvoice?.invoiceNumber || 'RSP/199'));
    setDocDate(linkedInvoice?.invoiceDate || '2026-09-23');
    setVehicleNumber(bom.projectCode === 'RSP/199' ? 'CG04QR4154' : 'CG04QR4154');
    setDistanceKm('24');
    setActiveTab('eway');
  }, [bom, linkedInvoice, warehouses]);

  // Selected Warehouse object
  const selectedWarehouse = useMemo<Warehouse>(() => {
    const found = warehouses.find(w => w.id === selectedWarehouseId);
    if (found) return found;
    return (
      warehouses.find(w => w.city.toLowerCase().includes('bhilai')) ||
      storageService.getDefaultWarehouse() || {
        id: 'wh-bhl-01',
        name: 'Bhilai Central Logistics Depot',
        code: 'WH-BHL-01',
        address: 'PLOT NO- 14, STREET NO- 14B, PRAGATI NAGAR, RISALI BHILAI',
        city: 'BHILAI',
        state: 'Chhattisgarh',
        pincode: '490006',
        contactPerson: 'Sanjay Deshmukh',
        contactPhone: '+91 98250 12345',
        status: 'ACTIVE',
        createdAt: '',
        updatedAt: ''
      }
    );
  }, [warehouses, selectedWarehouseId]);

  // Generate authentic official scannable QR code
  useEffect(() => {
    if (!ewbNumber) return;
    const cleanEwb = ewbNumber.replace(/\s+/g, '');
    const qrData = `https://ewaybillgst.gov.in/verify?ewb=${cleanEwb}&gstin=22AAOCR0748K1Z5&doc=${docNumber}&dt=${docDate}&val=${bom?.totalCost || 0}`;
    QRCode.toDataURL(qrData, {
      width: 160,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [ewbNumber, docNumber, docDate, bom]);

  if (!isOpen || !bom) return null;

  // Build items with authentic GST rates & HSN codes
  const enrichedItems = bom.items.map(it => {
    const prod = products.find(p => p.id === it.productId || p.sku === it.sku || p.name === it.productName);

    let hsn = prod?.hsnCode || '';
    let gstRate = 18; // default
    let standardDesc = '';

    const cat = it.category?.toLowerCase() || '';
    const name = it.productName.toLowerCase();

    if (cat.includes('panel') || name.includes('module') || name.includes('topcon') || name.includes('dcr')) {
      hsn = '85414300';
      gstRate = 5; // 2.5% CGST + 2.5% SGST as per solar module GST notification
      standardDesc = 'Photovoltaic Cells Assembled In Modules Or Made Up Into Panels';
    } else if (name.includes('earthing') || cat.includes('electrical')) {
      hsn = '8536';
      gstRate = 18; // 9% CGST + 9% SGST
      standardDesc =
        'Electrical Apparatus For Switching Or Protecting Electrical Circuits, Or For Making Connections To Or In Electrical Circuits';
    } else if (cat.includes('inverter') || name.includes('inverter')) {
      hsn = '85044090';
      gstRate = 12; // 6% CGST + 6% SGST
      standardDesc = 'Static Converters / Solar Grid-Tied Inverter';
    } else if (cat.includes('structure')) {
      hsn = '73089090';
      gstRate = 18;
      standardDesc = 'Galvanized Structures and Parts of Structures of Iron or Steel';
    } else {
      hsn = prod?.hsnCode || '85414011';
      gstRate = 18;
      standardDesc = 'Solar System Ancillary Components';
    }

    const taxableValue = it.totalCost || (it.estimatedUnitCost || 0) * it.requiredQty;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    const cgstAmount = Number(((taxableValue * cgstRate) / 100).toFixed(2));
    const sgstAmount = Number(((taxableValue * sgstRate) / 100).toFixed(2));
    const lineTotal = taxableValue + cgstAmount + sgstAmount;
    const rateInclTax = Number((taxableValue * (1 + gstRate / 100) / it.requiredQty).toFixed(2));

    return {
      ...it,
      hsnCode: hsn,
      standardDesc,
      gstRate,
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      taxableValue,
      rateInclTax,
      rate: it.estimatedUnitCost || taxableValue / it.requiredQty,
      lineTotal
    };
  });

  const totalTaxable = enrichedItems.reduce((acc, i) => acc + i.taxableValue, 0);
  const totalCGST = enrichedItems.reduce((acc, i) => acc + i.cgstAmount, 0);
  const totalSGST = enrichedItems.reduce((acc, i) => acc + i.sgstAmount, 0);
  const totalTax = totalCGST + totalSGST;
  const rawGrandTotal = totalTaxable + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));
  const totalQty = enrichedItems.reduce((acc, i) => acc + i.requiredQty, 0);

  // Group HSN summary for the tax breakdown table
  const hsnSummaryMap = new Map<string, { hsn: string; taxable: number; cgstRate: number; cgstAmt: number; sgstRate: number; sgstAmt: number; totalTax: number }>();
  enrichedItems.forEach(it => {
    const key = `${it.hsnCode}-${it.gstRate}`;
    const curr = hsnSummaryMap.get(key) || {
      hsn: it.hsnCode,
      taxable: 0,
      cgstRate: it.cgstRate,
      cgstAmt: 0,
      sgstRate: it.sgstRate,
      sgstAmt: 0,
      totalTax: 0
    };
    curr.taxable += it.taxableValue;
    curr.cgstAmt += it.cgstAmount;
    curr.sgstAmt += it.sgstAmount;
    curr.totalTax += it.cgstAmount + it.sgstAmount;
    hsnSummaryMap.set(key, curr);
  });
  const hsnSummaryList = Array.from(hsnSummaryMap.values());

  const formattedDocDate = formatEwbDate(docDate);
  const validUntilDateFormatted = formatEwbDate(
    new Date(new Date(docDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
  );

  const customerName = linkedCustomer?.name || bom.customerName || 'Manohar Gyan Chandani';
  const customerGstin = linkedCustomer?.gstNumber || '';
  const customerAddress = linkedProject?.siteAddress || linkedCustomer?.siteAddress || 'Kadambari Nagar';
  const customerCity = linkedProject?.city || linkedCustomer?.city || 'Durg';
  const customerState = linkedCustomer?.state || 'Chhattisgarh';
  const customerPincode = linkedCustomer?.pincode || '491001';
  const customerStateCode = getStateCode(customerState);

  const fromState = selectedWarehouse.state || 'Chhattisgarh';
  const fromStateCode = getStateCode(fromState);

  const handleCopyEwb = () => {
    navigator.clipboard.writeText(ewbNumber.replace(/\s+/g, ''));
    setCopied(true);
    showToast('E-Way Bill Number copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEWayBill = () => {
    try {
      const updatedBOM: BillOfMaterials = {
        ...bom,
        warehouseId: selectedWarehouse.id,
        warehouseName: selectedWarehouse.name,
        ewayBillNumber: ewbNumber,
        ewayBillDate: new Date().toISOString()
      };
      storageService.saveBOM(updatedBOM);
      triggerRefresh();
      showToast(`E-Way Bill ${ewbNumber} generated with dispatch from ${selectedWarehouse.name}`, 'success');
      if (onSaved) onSaved(ewbNumber);
    } catch (e: any) {
      showToast(e?.message || 'Failed to save E-Way Bill', 'error');
    }
  };

  const handleDownloadJSON = () => {
    const payload = {
      version: '1.0.0924',
      billLists: [
        {
          userGstin: '22AAOCR0748K1Z5',
          supplyType: 'O',
          subSupplyType: '1',
          docType: 'INV',
          docNo: docNumber,
          docDate: docDate.split('-').reverse().join('/'),
          fromGstin: '22AAOCR0748K1Z5',
          fromTrdName: 'REJOY SOLAR POWER PVT. LTD',
          fromAddr1: selectedWarehouse.address,
          fromPlace: selectedWarehouse.city,
          fromPincode: Number(selectedWarehouse.pincode) || 490006,
          fromStateCode: Number(fromStateCode) || 22,
          toGstin: customerGstin || 'URP',
          toTrdName: customerName,
          toAddr1: customerAddress,
          toPlace: customerCity,
          toPincode: Number(customerPincode) || 491001,
          toStateCode: Number(customerStateCode) || 22,
          totalValue: totalTaxable,
          cgstValue: totalCGST,
          sgstValue: totalSGST,
          igstValue: 0,
          totInvValue: grandTotal,
          transporterId,
          transporterName,
          transDocNo: transportDocNo,
          transMode: '1',
          transDistance: distanceKm,
          vehicleNo: vehicleNumber.replace(/[^A-Za-z0-9]/g, ''),
          vehicleType: 'R',
          itemList: enrichedItems.map((item, idx) => ({
            itemNo: idx + 1,
            productName: item.productName,
            productDesc: item.sku,
            hsnCode: item.hsnCode.replace(/\s+/g, ''),
            quantity: item.requiredQty,
            qtyUnit: item.unit,
            taxableAmount: item.taxableValue,
            cgstRate: item.cgstRate,
            sgstRate: item.sgstRate,
            igstRate: 0
          }))
        }
      ]
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EWB_${ewbNumber}_${docNumber.replace(/[^A-Za-z0-9]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('GST Portal E-Way Bill JSON downloaded', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Inject print-only styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-document-root, #print-document-root * {
            visibility: visible;
          }
          #print-document-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto print:max-w-none print:max-h-none print:shadow-none print:rounded-none">
        {/* Top Header Controls Bar (Hidden during print) */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-xs font-black">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  GST E-Way Bill & Tax Invoice
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Form GST EWB-01
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                BOM: {bom.bomNumber} • {customerName}
              </p>
            </div>
          </div>

          {/* Warehouse Selector in Top Bar */}
          <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="font-bold text-slate-700 text-[11px] whitespace-nowrap">Dispatch Warehouse:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="font-bold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer text-xs pr-4 py-0"
              title="Select dispatch warehouse to update e-way bill Dispatch From address"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('eway')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'eway'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                e-Way Bill
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('invoice')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'invoice'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('both')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'both'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Both Pages
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Transport</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/60 print:bg-white print:p-0">
          {activeTab === 'edit' ? (
            /* Transport & Warehouse Configuration Tab */
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 animate-in fade-in">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Dispatch Warehouse & Transport Parameters</span>: The system dynamically takes the selected warehouse address for the <strong>Dispatch From</strong> field in the e-Way bill and the consignor invoice address.
                </div>
              </div>

              {/* Warehouse Selection Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Selected Dispatch Warehouse
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Takes this address for e-Way Bill & Dispatch Note
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Choose Warehouse / Depot
                    </label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code} - {w.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Dispatch Address</span>
                    <p className="font-bold text-slate-900">{selectedWarehouse.address}</p>
                    <p className="text-slate-600">
                      {selectedWarehouse.city}, {selectedWarehouse.state} - {selectedWarehouse.pincode}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Contact: {selectedWarehouse.contactPerson} ({selectedWarehouse.contactPhone})
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document / Invoice Number
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Date
                  </label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={e => setDocDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Number (Part-B)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CG04QR4154"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Approximate Transit Distance (km)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={distanceKm}
                      onChange={e => setDistanceKm(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">km</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transporter Name
                  </label>
                  <input
                    type="text"
                    placeholder="Transporter Name"
                    value={transporterName}
                    onChange={e => setTransporterName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transporter ID / GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={transporterId}
                    onChange={e => setTransporterId(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transporter Doc / LR Number
                  </label>
                  <input
                    type="text"
                    placeholder="LR / Consignment Note No"
                    value={transportDocNo}
                    onChange={e => setTransportDocNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Consolidated EWB (CEWB No)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional CEWB No."
                    value={cewbNo}
                    onChange={e => setCewbNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('eway');
                    showToast('Transport and warehouse parameters applied to E-Way Bill', 'info');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply & Preview Format
                </button>
              </div>
            </div>
          ) : (
            /* Printable Document Layout matching user-provided exact format */
            <div id="print-document-root" className="space-y-8 font-sans">
              {/* PAGE 1: TAX INVOICE (Rendered if 'invoice' or 'both' active) */}
              {(activeTab === 'invoice' || activeTab === 'both') && (
                <div className="bg-white p-6 sm:p-8 border border-black shadow-md print:shadow-none print:border-black max-w-[850px] mx-auto text-black text-[12px] leading-tight page-break">
                  <h2 className="text-center font-bold text-base uppercase tracking-wider mb-2">
                    Tax Invoice
                  </h2>

                  {/* Header 2-column box */}
                  <div className="border border-black grid grid-cols-2">
                    {/* Left: Supplier with Selected Warehouse Address */}
                    <div className="p-2 border-r border-black space-y-0.5">
                      <div className="font-bold text-sm">REJOY SOLAR POWER PVT. LTD</div>
                      <div className="uppercase">{selectedWarehouse.address}</div>
                      <div className="uppercase">{selectedWarehouse.city}</div>
                      <div>
                        <strong>GSTIN/UIN:</strong> 22AAOCR0748K1Z5
                      </div>
                      <div>
                        <strong>State Name :</strong> {selectedWarehouse.state}, Code : {fromStateCode}
                      </div>
                      <div>
                        <strong>E-Mail :</strong> {selectedWarehouse.email || 'rejoysolarpower@gmail.com'}
                      </div>
                    </div>

                    {/* Right: Invoice & E-Way Bill Meta Grid */}
                    <div className="grid grid-cols-2 text-[11px] divide-y divide-black">
                      <div className="p-1.5 border-r border-black">
                        <span className="text-[10px] text-slate-600 block">Invoice No.</span>
                        <span className="font-bold">{docNumber}</span>
                      </div>
                      <div className="p-1.5">
                        <span className="text-[10px] text-slate-600 block">e-Way Bill No.</span>
                        <span className="font-bold">{ewbNumber}</span>
                      </div>
                      <div className="p-1.5 border-r border-black">
                        <span className="text-[10px] text-slate-600 block">Dated</span>
                        <span className="font-bold">{formattedDocDate}</span>
                      </div>
                      <div className="p-1.5">
                        <span className="text-[10px] text-slate-600 block">Mode/Terms of Payment</span>
                        <span>Road</span>
                      </div>
                      <div className="p-1.5 border-r border-black">
                        <span className="text-[10px] text-slate-600 block">Reference No. & Date.</span>
                        <span>BOM: {bom.bomNumber}</span>
                      </div>
                      <div className="p-1.5">
                        <span className="text-[10px] text-slate-600 block">Other References</span>
                        <span>{bom.projectCode}</span>
                      </div>
                      <div className="p-1.5 border-r border-black">
                        <span className="text-[10px] text-slate-600 block">Buyer's Order No.</span>
                        <span>PO-{bom.projectCode}</span>
                      </div>
                      <div className="p-1.5">
                        <span className="text-[10px] text-slate-600 block">Dated</span>
                        <span>{formattedDocDate}</span>
                      </div>
                      <div className="p-1.5 border-r border-black">
                        <span className="text-[10px] text-slate-600 block">Dispatch Doc No.</span>
                        <span>{transportDocNo || 'DC-' + bom.bomNumber}</span>
                      </div>
                      <div className="p-1.5">
                        <span className="text-[10px] text-slate-600 block">Delivery Note Date</span>
                        <span>{formattedDocDate}</span>
                      </div>
                      <div className="p-1.5 border-r border-black">
                        <span className="text-[10px] text-slate-600 block">Dispatched through</span>
                        <span>{transporterName || 'By Road'}</span>
                      </div>
                      <div className="p-1.5">
                        <span className="text-[10px] text-slate-600 block">Destination</span>
                        <span>{customerCity}</span>
                      </div>
                      <div className="p-1.5 col-span-2">
                        <span className="text-[10px] text-slate-600 block">Terms of Delivery</span>
                        <span>Door delivery with solar transit insurance</span>
                      </div>
                    </div>
                  </div>

                  {/* Consignee & Buyer Row */}
                  <div className="border-x border-b border-black grid grid-cols-2">
                    <div className="p-2 border-r border-black space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-600 block">Consignee (Ship to)</span>
                      <div className="font-bold">{customerName}</div>
                      <div>{customerAddress}</div>
                      <div>
                        State Name : {customerState}, Code : {customerStateCode}
                      </div>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-600 block">Buyer (Bill to)</span>
                      <div className="font-bold">{customerName}</div>
                      <div>{customerAddress}</div>
                      <div>
                        State Name : {customerState}, Code : {customerStateCode}
                      </div>
                    </div>
                  </div>

                  {/* Main Line Items Table */}
                  <div className="border-x border-b border-black">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black text-[11px] font-bold bg-slate-50">
                          <th className="p-1.5 border-r border-black text-center w-8">Sl No.</th>
                          <th className="p-1.5 border-r border-black">Description of Goods</th>
                          <th className="p-1.5 border-r border-black text-center w-20">HSN/SAC</th>
                          <th className="p-1.5 border-r border-black text-center w-16">Quantity</th>
                          <th className="p-1.5 border-r border-black text-right w-24">Rate (Incl. of Tax)</th>
                          <th className="p-1.5 border-r border-black text-right w-20">Rate</th>
                          <th className="p-1.5 border-r border-black text-center w-12">per</th>
                          <th className="p-1.5 text-right w-24">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrichedItems.map((it, idx) => (
                          <tr key={it.id} className="align-top border-b border-slate-200">
                            <td className="p-1.5 border-r border-black text-center font-medium">{idx + 1}</td>
                            <td className="p-1.5 border-r border-black">
                              <span className="font-bold block">{it.productName}</span>
                              <span className="text-[10px] text-slate-600 block">{it.standardDesc}</span>
                            </td>
                            <td className="p-1.5 border-r border-black text-center font-mono">{it.hsnCode}</td>
                            <td className="p-1.5 border-r border-black text-center font-bold">
                              {it.requiredQty} {it.unit}
                            </td>
                            <td className="p-1.5 border-r border-black text-right font-mono">
                              {it.rateInclTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1.5 border-r border-black text-right font-mono">
                              {it.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1.5 border-r border-black text-center">{it.unit}</td>
                            <td className="p-1.5 text-right font-bold font-mono">
                              {it.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}

                        {/* Tax Breakdowns Rows */}
                        <tr className="border-t border-black">
                          <td colSpan={7} className="p-1.5 text-right font-semibold border-r border-black">
                            Sub Total
                          </td>
                          <td className="p-1.5 text-right font-bold font-mono">
                            {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>

                        {hsnSummaryList.map((s, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <tr>
                              <td colSpan={7} className="p-1 text-right text-[11px] border-r border-black">
                                CGST @ {s.cgstRate}%
                              </td>
                              <td className="p-1 text-right font-mono text-[11px]">
                                {s.cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={7} className="p-1 text-right text-[11px] border-r border-black">
                                SGST @ {s.sgstRate}%
                              </td>
                              <td className="p-1 text-right font-mono text-[11px]">
                                {s.sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}

                        {roundOff !== 0 && (
                          <tr>
                            <td colSpan={7} className="p-1 text-right text-[11px] border-r border-black">
                              Less : Round Off
                            </td>
                            <td className="p-1 text-right font-mono text-[11px]">
                              {roundOff < 0 ? `(-)${Math.abs(roundOff).toFixed(2)}` : `(+) ${roundOff.toFixed(2)}`}
                            </td>
                          </tr>
                        )}

                        <tr className="border-t border-black font-bold bg-slate-50">
                          <td colSpan={3} className="p-1.5 text-right border-r border-black">
                            Total
                          </td>
                          <td className="p-1.5 text-center border-r border-black">
                            {totalQty} NOS
                          </td>
                          <td colSpan={3} className="p-1.5 border-r border-black" />
                          <td className="p-1.5 text-right font-mono text-sm">
                            ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Amount Chargeable in Words */}
                  <div className="border-x border-b border-black p-2 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold">Amount Chargeable (in words) :</span>
                      <div className="font-bold mt-0.5">INR {numberToIndianWords(grandTotal)}</div>
                    </div>
                    <span className="font-bold italic">E. & O.E</span>
                  </div>

                  {/* HSN/SAC Tax Breakdown Table */}
                  <div className="border-x border-b border-black">
                    <table className="w-full text-[10px] text-center border-collapse">
                      <thead>
                        <tr className="border-b border-black bg-slate-50 font-bold">
                          <th rowSpan={2} className="p-1 border-r border-black">HSN/SAC</th>
                          <th rowSpan={2} className="p-1 border-r border-black">Taxable Value</th>
                          <th colSpan={2} className="p-1 border-r border-black">CGST</th>
                          <th colSpan={2} className="p-1 border-r border-black">SGST/UTGST</th>
                          <th rowSpan={2} className="p-1">Total Tax Amount</th>
                        </tr>
                        <tr className="border-b border-black bg-slate-50 font-bold">
                          <th className="p-0.5 border-r border-black">Rate</th>
                          <th className="p-0.5 border-r border-black">Amount</th>
                          <th className="p-0.5 border-r border-black">Rate</th>
                          <th className="p-0.5 border-r border-black">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hsnSummaryList.map((h, idx) => (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className="p-1 border-r border-black font-mono">{h.hsn}</td>
                            <td className="p-1 border-r border-black font-mono text-right">
                              {h.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1 border-r border-black">{h.cgstRate}%</td>
                            <td className="p-1 border-r border-black font-mono text-right">
                              {h.cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1 border-r border-black">{h.sgstRate}%</td>
                            <td className="p-1 border-r border-black font-mono text-right">
                              {h.sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1 font-mono text-right font-bold">
                              {h.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        <tr className="font-bold border-t border-black bg-slate-50">
                          <td className="p-1 border-r border-black">Total</td>
                          <td className="p-1 border-r border-black font-mono text-right">
                            {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 border-r border-black" />
                          <td className="p-1 border-r border-black font-mono text-right">
                            {totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 border-r border-black" />
                          <td className="p-1 border-r border-black font-mono text-right">
                            {totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 font-mono text-right">
                            {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="border-x border-b border-black p-2 text-[11px]">
                    <strong>Tax Amount (in words) :</strong> INR {numberToIndianWords(totalTax)}
                  </div>

                  {/* Declaration and Bank Details Footer */}
                  <div className="border-x border-b border-black grid grid-cols-2 p-2.5 text-[11px]">
                    <div className="pr-3 space-y-2">
                      <div>
                        <strong>Declaration</strong>
                        <p className="text-[10px] text-slate-600 mt-1 leading-normal">
                          We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                        </p>
                      </div>
                    </div>
                    <div className="pl-3 border-l border-black space-y-1">
                      <div className="font-bold">Company's Bank Details</div>
                      <div className="grid grid-cols-2 text-[10px]">
                        <span className="text-slate-600">Bank Name :</span>
                        <span className="font-bold">KOTAK BANK CURRENT A/C</span>
                        <span className="text-slate-600">A/c No. :</span>
                        <span className="font-mono font-bold">3650607339</span>
                        <span className="text-slate-600">Branch & IFS Code :</span>
                        <span className="font-mono font-bold">Nehru Nagar Bhilai & KKBK0006429</span>
                      </div>
                      <div className="pt-6 text-right">
                        <div className="font-bold text-[10px]">for REJOY SOLAR POWER PVT. LTD</div>
                        <div className="pt-8 text-[10px] font-bold">Authorised Signatory</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-500 py-1">
                    This is a Computer Generated Invoice
                  </div>
                </div>
              )}

              {/* PAGE 2: OFFICIAL E-WAY BILL (Rendered if 'eway' or 'both' active) */}
              {(activeTab === 'eway' || activeTab === 'both') && (
                <div className="bg-white p-6 sm:p-8 border border-black shadow-md print:shadow-none print:border-black max-w-[850px] mx-auto text-black text-[12px] leading-tight">
                  {/* Top Header */}
                  <div className="flex items-start justify-between pb-2 border-b border-black">
                    <div>
                      <div className="font-bold">
                        Doc No. : Tax Invoice - {docNumber}
                      </div>
                      <div className="font-bold mt-0.5">
                        Date : {formattedDocDate}
                      </div>
                    </div>

                    <div className="text-center">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        e-Way Bill
                      </h2>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-xs block mb-1">e-Way Bill</span>
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="Official GST Verification QR Code"
                          className="w-20 h-20 border border-slate-300"
                        />
                      ) : (
                        <div className="w-20 h-20 border border-slate-300 flex items-center justify-center bg-slate-50">
                          <QrCode className="w-12 h-12 text-slate-800" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1. e-Way Bill Details */}
                  <div className="py-2.5 border-b border-black">
                    <h3 className="font-bold text-xs mb-2">1. e-Way Bill Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-4 text-[11px]">
                      <div>
                        <span className="text-slate-600 inline-block w-28">e-Way Bill No. :</span>
                        <strong className="font-mono">{ewbNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Mode :</span>
                        <strong className="font-mono">{transportMode}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Generated Date :</span>
                        <strong>{formattedDocDate} 9:54 AM</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Generated By :</span>
                        <strong className="font-mono">22AAOCR0748K1Z5</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Approx Distance :</span>
                        <strong>{distanceKm} KM</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Valid Upto :</span>
                        <strong>{validUntilDateFormatted} 11:59 PM</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Supply Type :</span>
                        <strong>{supplyType}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Transaction Type :</span>
                        <strong>{transactionType}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. Address Details */}
                  <div className="py-2.5 border-b border-black">
                    <h3 className="font-bold text-xs mb-2">2. Address Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                      {/* From */}
                      <div>
                        <div className="font-bold mb-1">From</div>
                        <div className="font-bold">REJOY SOLAR POWER PVT. LTD</div>
                        <div>GSTIN : 22AAOCR0748K1Z5</div>
                        <div>{fromState}</div>
                      </div>

                      {/* To */}
                      <div>
                        <div className="font-bold mb-1">To</div>
                        <div className="font-bold">{customerName}</div>
                        <div>GSTIN : {customerGstin || ''}</div>
                        <div>{customerState}</div>
                      </div>

                      {/* Dispatch From: Takes selected warehouse address */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="font-bold mb-1">Dispatch From</div>
                        <div className="uppercase font-semibold text-slate-900">{selectedWarehouse.address}</div>
                        <div className="uppercase">
                          {selectedWarehouse.city} {selectedWarehouse.state} {selectedWarehouse.pincode}
                        </div>
                      </div>

                      {/* Ship To */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="font-bold mb-1">Ship To</div>
                        <div className="font-semibold text-slate-900">{customerAddress}</div>
                        <div>
                          {customerCity} {customerState} {customerPincode}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Goods Details */}
                  <div className="py-2.5 border-b border-black">
                    <h3 className="font-bold text-xs mb-2">3. Goods Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-black bg-slate-50">
                            <th className="p-1.5 font-bold">HSN Code</th>
                            <th className="p-1.5 font-bold">Product Name & Desc</th>
                            <th className="p-1.5 font-bold text-center">Quantity</th>
                            <th className="p-1.5 font-bold text-right">Taxable Amt</th>
                            <th className="p-1.5 font-bold text-right">Tax Rate (C+S)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {enrichedItems.map(it => (
                            <tr key={it.id} className="align-top">
                              <td className="p-1.5 font-mono font-medium">{it.hsnCode}</td>
                              <td className="p-1.5">
                                <span className="font-bold block">{it.productName}</span>
                                <span className="text-[10px] text-slate-600 block leading-tight">
                                  & {it.standardDesc}
                                </span>
                              </td>
                              <td className="p-1.5 text-center font-bold">
                                {it.requiredQty} {it.unit}
                              </td>
                              <td className="p-1.5 text-right font-mono font-bold">
                                {it.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 text-right font-mono">
                                {it.cgstRate.toFixed(2)}+{it.sgstRate.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Goods Summary Totals */}
                    <div className="pt-3 mt-2 border-t border-black space-y-1 text-[11px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-slate-600">Tot.Taxable Amt :</span>{' '}
                          <strong className="font-mono">
                            {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-600">Other Amt :</span>{' '}
                          <strong className="font-mono">
                            {roundOff < 0 ? `(-)${Math.abs(roundOff).toFixed(2)}` : roundOff > 0 ? `(+)${roundOff.toFixed(2)}` : '(-)0.02'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-600">Total Inv Amt :</span>{' '}
                          <strong className="font-mono text-sm">
                            {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-8 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-600">CGST Amt :</span>{' '}
                          <strong className="font-mono">
                            {totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-600">SGST Amt :</span>{' '}
                          <strong className="font-mono">
                            {totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Transportation Details */}
                  <div className="py-2.5 border-b border-black">
                    <h3 className="font-bold text-xs mb-1.5">4. Transportation Details</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-600 inline-block w-28">Transporter ID :</span>
                        <span className="font-mono">{transporterId}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Doc No. :</span>
                        <span className="font-mono">{transportDocNo}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Name :</span>
                        <span>{transporterName}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-28">Date :</span>
                        <span>{transportDocDate || formattedDocDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Vehicle Details */}
                  <div className="pt-2.5">
                    <h3 className="font-bold text-xs mb-1.5">5. Vehicle Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-600 inline-block w-24">Vehicle No. :</span>
                        <strong className="font-mono">{vehicleNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-16">From :</span>
                        <strong className="uppercase">{selectedWarehouse.city}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 inline-block w-20">CEWB No.:</span>
                        <span className="font-mono">{cewbNo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls Bar (Hidden during print) */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Consignment Total:{' '}
              <strong className="text-slate-900 font-mono">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>{' '}
              ({enrichedItems.length} items from {selectedWarehouse.name})
            </span>
            {bom.ewayBillNumber && (
              <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
                Saved in ERP
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyEwb}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy EWB'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              title="Download standard JSON for GST E-Way Bill portal upload"
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>GST Portal JSON</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print official Form GST EWB-01 certificate & Tax Invoice"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form</span>
            </button>

            <button
              type="button"
              onClick={handleSaveEWayBill}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Confirm EWB</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
