import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Zap,
  Leaf,
  DollarSign,
  Award,
  Clock,
  FileCheck
} from 'lucide-react';
import { Quotation } from '../../types/solar';
import { formatINR, numberToIndianWords } from '../../utils/indianNumberWords';
import { generateQuotationPdf, WATERMARK_TEXT } from '../../utils/quotationPdfGenerator';

interface QuotationPdfPreviewModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onShareWhatsApp?: (quote: Quotation) => void;
}

export const QuotationPdfPreviewModal: React.FC<QuotationPdfPreviewModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onShareWhatsApp
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    generateQuotationPdf(quotation);
  };

  const scrollToPage = (pageIndex: number) => {
    const pageEl = document.getElementById(`quotation-page-${pageIndex}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Safe Financial & Calculation Normalization
  const capacityKw = quotation.capacityKw || 5;
  const systemType = quotation.systemType || 'On-Grid';
  const basePrice = quotation.baseProjectPrice || quotation.baseAmount || 293848;
  const eqPct = quotation.gstEquipmentPercent || 70;
  const eqRate = quotation.gstEquipmentRate || 5;
  const srvPct = quotation.gstServicesPercent || 30;
  const srvRate = quotation.gstServicesRate || 18;
  const eqTax = Math.round((basePrice * (eqPct / 100) * eqRate) / 100);
  const srvTax = Math.round((basePrice * (srvPct / 100) * srvRate) / 100);
  const totalGst = quotation.gstAmount || quotation.taxAmount || eqTax + srvTax;
  const totalProjectCost = quotation.totalProjectCost || quotation.totalAmount || basePrice + totalGst;
  const centralSubsidy = quotation.centralSubsidy || 0;
  const stateSubsidy = quotation.stateSubsidy || 0;
  const totalSubsidy = quotation.totalSubsidy || (centralSubsidy + stateSubsidy);
  const finalInvestment = quotation.finalProjectInvestment || (totalProjectCost - totalSubsidy);
  const costPerKw = quotation.costPerKw || Math.round(basePrice / Math.max(1, capacityKw));

  const dailyUnits = (capacityKw * 4.2).toFixed(1);
  const annualUnits = Math.round(capacityKw * 1460);
  const annualSavings = Math.round(annualUnits * 7.5);
  const paybackYears = (finalInvestment / Math.max(1, annualSavings)).toFixed(1);
  const lifetimeSavings = Math.round(annualSavings * 25 * 0.92);

  const bomItems = quotation.items && quotation.items.length > 0 ? quotation.items : [];

  const milestones = quotation.paymentMilestones && quotation.paymentMilestones.length > 0
    ? quotation.paymentMilestones
    : [
      { id: '1', title: '10% Advance / Token', percentage: 10, amount: Math.round(totalProjectCost * 0.1), description: 'Upon signing of purchase order & contract execution' },
      { id: '2', title: '70% Material Delivery', percentage: 70, amount: Math.round(totalProjectCost * 0.7), description: 'On delivery of PV modules and inverter at site' },
      { id: '3', title: '18% Installation Day', percentage: 18, amount: Math.round(totalProjectCost * 0.18), description: 'On structural mounting & solar panel installation' },
      { id: '4', title: '2% Grid Synchronization', percentage: 2, amount: Math.round(totalProjectCost * 0.02), description: 'On net-metering synchronization & final commissioning' }
    ];

  // Helper for repeated page footer in HTML preview
  const renderPageFooter = (pageNum: number) => {
    const padNum = pageNum < 10 ? `0${pageNum}` : `${pageNum}`;
    return (
      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium z-10 shrink-0">
        <div>
          Rejoy Solar Power Pvt. Ltd. | CREDA Approved Solar EPC Contractor | An ISO 9001:2015 Certified Co.
        </div>
        <div className="font-bold text-slate-700">
          Ref: {quotation.quotationNumber} | Page {padNum} of 10
        </div>
      </div>
    );
  };

  // Helper for repeated page header in HTML preview
  const renderPageHeader = (pageTitle: string) => {
    return (
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/logo-dark.png" alt="Rejoy Solar" className="h-8 w-auto object-contain" />
          <div>
            <span className="font-black text-xs text-amber-700 tracking-wider">REJOY SOLAR</span>
            <span className="text-[10px] text-slate-500 block -mt-1 font-semibold">POWER PVT. LTD.</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
            {pageTitle}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">CREDA Approved Solar EPC</span>
        </div>
      </div>
    );
  };

  // Helper for Consistent CSS-Layered Semi-Transparent Watermark Overlay on Every Page
  const renderWatermark = () => {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20 overflow-hidden">
        {/* Center Prominent Watermark */}
        <div className="transform -rotate-45 text-amber-500/[0.08] font-black text-6xl tracking-widest whitespace-nowrap uppercase select-none">
          {WATERMARK_TEXT}
        </div>
        {/* Upper Diagonal Repetition */}
        <div className="absolute top-28 -left-12 transform -rotate-45 text-amber-500/[0.055] font-black text-4xl tracking-widest whitespace-nowrap uppercase select-none">
          {WATERMARK_TEXT}
        </div>
        {/* Lower Diagonal Repetition */}
        <div className="absolute bottom-28 -right-12 transform -rotate-45 text-amber-500/[0.055] font-black text-4xl tracking-widest whitespace-nowrap uppercase select-none">
          {WATERMARK_TEXT}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* Top Toolbar (Hidden during Print) */}
      <div className="print:hidden flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-white select-none z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <Sun className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Quotation Preview: {quotation.quotationNumber}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {capacityKw} kW {systemType.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {quotation.customerName} {quotation.companyName ? `• ${quotation.companyName}` : ''}
            </p>
          </div>
        </div>

        {/* 10-Page Jump Quick Buttons */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          {[
            { page: 1, label: '1. Cover' },
            { page: 2, label: '2. Benefits' },
            { page: 3, label: '3. Working' },
            { page: 4, label: '4. Specs' },
            { page: 5, label: '5. BOM' },
            { page: 6, label: '6. Cost' },
            { page: 7, label: '7. ROI' },
            { page: 8, label: '8. Structure' },
            { page: 9, label: '9. Terms' },
            { page: 10, label: '10. Warranties' }
          ].map(p => (
            <button
              key={p.page}
              onClick={() => scrollToPage(p.page)}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors font-medium text-[11px]"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setZoom(z => Math.max(60, z - 10))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-bold text-[11px] text-slate-200">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(130, z + 10))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1 text-slate-400 hover:text-white ml-1"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {onShareWhatsApp && (
            <button
              onClick={() => onShareWhatsApp(quotation)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors"
            title="Download PDF document"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
            title="Print Quotation"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Document Scroll View */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 print:p-0 print:m-0 print:bg-white print:overflow-visible"
      >
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 ease-out print:transform-none"
        >
          {/* ==========================================
              PAGE 1: COVER & FORMAL PROPOSAL
              ========================================== */}
          <div
            id="quotation-page-1"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('Turnkey Solar EPC Proposal')}

              {/* Title Hero */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1">
                  OFFICIAL COMMERCIAL & TECHNICAL PROPOSAL
                </span>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  QUOTATION FOR {capacityKw} KW {quotation.panelType || 'DCR'}{' '}
                  {systemType.toUpperCase()} SOLAR PLANT
                </h1>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  High-Efficiency Rooftop Photovoltaic Power Generation System with Net Metering
                </p>
              </div>

              {/* Metadata Bar */}
              <div className="mt-3.5 grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Quotation Ref</span>
                  <span className="font-bold text-slate-900 text-xs">{quotation.quotationNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Date of Issue</span>
                  <span className="font-semibold text-slate-700 text-xs">{quotation.quotationDate || quotation.createdAt}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Validity</span>
                  <span className="font-semibold text-slate-700 text-xs">{quotation.validityDays || 15} Days</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Capacity</span>
                  <span className="font-bold text-amber-700 text-xs">{capacityKw} kWp Grid-Tied</span>
                </div>
              </div>

              {/* Two Column Party Boxes */}
              <div className="mt-3.5 grid grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <div className="bg-amber-600 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                    Prepared For (Client Details)
                  </div>
                  <div className="p-3 text-xs space-y-1 text-slate-600">
                    <p className="font-bold text-slate-900 text-sm">{quotation.customerName}</p>
                    {quotation.companyName && (
                      <p className="font-medium text-slate-700">{quotation.companyName}</p>
                    )}
                    <p className="text-[11px] leading-tight">{quotation.siteAddress || 'Site Location'}</p>
                    <p className="text-[11px] text-slate-500">{quotation.city || 'Chhattisgarh'}</p>
                    <p className="text-[11px] pt-1">
                      <span className="font-semibold text-slate-700">Phone:</span> {quotation.customerPhone || 'N/A'}
                    </p>
                    <p className="text-[11px]">
                      <span className="font-semibold text-slate-700">Email:</span> {quotation.customerEmail || 'N/A'}
                    </p>
                    {quotation.customerGst && (
                      <p className="text-[11px]">
                        <span className="font-semibold text-slate-700">GSTIN:</span> {quotation.customerGst}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <div className="bg-slate-900 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                    Prepared By (Solar EPC Contractor)
                  </div>
                  <div className="p-3 text-xs space-y-1 text-slate-600">
                    <p className="font-bold text-amber-600 text-sm">Rejoy Solar Power Pvt. Ltd.</p>
                    <p className="font-semibold text-slate-700 text-[11px]">CREDA Approved Solar Rooftop EPC Contractor</p>
                    <p className="text-[11px] leading-tight">Plot No. 14, St. 14/b, Pragati Nagar Risali, Bhilai, CG</p>
                    <p className="text-[11px] text-slate-500">Branch Office: Raipur, Chhattisgarh - 492001</p>
                    <p className="text-[11px] pt-1">
                      <span className="font-semibold text-slate-700">Helpline:</span> +91 97705 77527 / +91 78038 44457
                    </p>
                    <p className="text-[11px]">
                      <span className="font-semibold text-slate-700">Email:</span> info@rejoysolarpower.in
                    </p>
                    <p className="text-[11px]">
                      <span className="font-semibold text-slate-700">Web:</span> rejoysolarpower.in
                    </p>
                  </div>
                </div>
              </div>

              {/* Formal Executive Letter */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                <p className="font-bold text-slate-900">Dear {quotation.customerName},</p>
                <p>
                  Thank you for showing your valued interest in Rejoy Solar Power Pvt. Ltd. We take immense pleasure in submitting our comprehensive commercial and technical proposal for the design, engineering, procurement, erection, testing, and commissioning of a {capacityKw} kW {systemType} Rooftop Solar Power Plant at your premises.
                </p>
                <p>
                  Our turnkey EPC solution integrates Tier-1 high-efficiency solar photovoltaic modules, state-of-the-art grid-tied string inverters, heavy-duty elevated hot-dip galvanized mounting structures, and robust electrical balance of systems. The proposed plant is custom-engineered to maximize solar energy generation, reduce your grid power dependence by up to 90%, and deliver long-term, inflation-proof savings for over 25 years.
                </p>
                <p>
                  Rejoy Solar handles the complete statutory liaison process with CSPDCL (Chhattisgarh State Power Distribution Co. Ltd.) and CEIG, from initial application to bidirectional net-meter synchronisation, ensuring an effortless transition to clean, green energy.
                </p>
              </div>

              {/* Highlights Card */}
              <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-300">
                <span className="text-[10px] font-black uppercase text-amber-800 block mb-1">Key Proposal Highlights</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Project Cost</span>
                    <span className="font-bold text-slate-900 text-sm">{formatINR(totalProjectCost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Eligible Subsidy</span>
                    <span className="font-bold text-emerald-700 text-sm">{formatINR(totalSubsidy)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Net Client Investment</span>
                    <span className="font-black text-amber-800 text-sm">{formatINR(finalInvestment)}</span>
                  </div>
                </div>
              </div>
            </div>

            {renderPageFooter(1)}
          </div>

          {/* ==========================================
              PAGE 2: KEY BENEFITS & ENVIRONMENTAL IMPACT
              ========================================== */}
          <div
            id="quotation-page-2"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('Technical & Environmental Value Proposition')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-3">
                1. Key Benefits of On-Grid Solar Power
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    title: 'Dramatic Electricity Bill Reduction',
                    desc: 'Save up to 80% to 90% on monthly power bills by generating clean kWh onsite. Protect your business or household against escalating grid power expenditures.'
                  },
                  {
                    title: '25-Year Energy Inflation Hedge',
                    desc: 'While commercial and retail grid tariffs historically rise by 5-8% annually, solar power cost remains permanently zero once commissioned.'
                  },
                  {
                    title: 'High Reliability & Minimal Maintenance',
                    desc: 'Solid-state semiconductor generation with zero moving parts. Backed by 25-Year Linear Power Output Warranty on Tier-1 Solar PV Modules.'
                  },
                  {
                    title: 'Carbon Footprint Reduction & ESG',
                    desc: `A ${capacityKw} kW solar installation offsets over ${(capacityKw * 1.3).toFixed(1)} tons of CO2 emissions annually, equivalent to planting hundreds of mature trees.`
                  },
                  {
                    title: 'Property Capital Value Appreciation',
                    desc: 'Rooftop solar infrastructure modernizes premises, elevates real estate appraisal value, and provides prestigious green-building recognition.'
                  },
                  {
                    title: 'Attractive Payback & High Financial IRR',
                    desc: 'Generates rapid capital payback within 3 to 4 years. Enjoy virtually free green electricity for the remaining 20+ years of plant lifespan.'
                  }
                ].map((b, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <h3 className="text-xs font-bold text-amber-800 uppercase">{b.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-4">{b.desc}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-6 mb-3">
                2. Environmental Impact & Sustainability Index
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[11px]">
                    <tr>
                      <th className="py-2 px-3 text-left font-bold">Sustainability Metric</th>
                      <th className="py-2 px-3 text-right font-bold">Project Impact ({capacityKw} kW System)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Annual Clean Energy Generation</td>
                      <td className="py-2 px-3 text-right font-bold text-amber-700">{annualUnits.toLocaleString('en-IN')} kWh / Units per year</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Annual CO2 Greenhouse Gas Offset</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{(capacityKw * 1.3).toFixed(1)} Metric Tons per year</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">25-Year Cumulative Carbon Footprint Abatement</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{(capacityKw * 1.3 * 25).toFixed(0)} Metric Tons of CO2</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Equivalent Mature Trees Planted & Nurtured</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{Math.round(capacityKw * 58)} Fully Grown Trees</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Standard Thermal Coal Combustion Avoided</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{Math.round(capacityKw * 584).toLocaleString('en-IN')} Kilograms per year</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Passenger Vehicle Kilometers Neutralized</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{Math.round(capacityKw * 5200).toLocaleString('en-IN')} km equivalent driven</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {renderPageFooter(2)}
          </div>

          {/* ==========================================
              PAGE 3: SYSTEM OPERATING PRINCIPLE
              ========================================== */}
          <div
            id="quotation-page-3"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('System Operating Principle & Energy Flow')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-3">
                1. How a Solar On-Grid System Functions
              </h2>

              <div className="space-y-2.5">
                {[
                  {
                    step: 'STEP 1',
                    title: 'Solar PV Array Absorption',
                    desc: 'High-efficiency mono-crystalline/bifacial solar panels absorb solar irradiance and generate direct current (DC) electricity seamlessly during daylight hours.'
                  },
                  {
                    step: 'STEP 2',
                    title: 'Synchronous Grid Inverter Conversion',
                    desc: 'A state-of-the-art grid-tie string inverter transforms DC electricity into regulated 3-phase/single-phase alternating current (AC) matching utility grid frequency and voltage.'
                  },
                  {
                    step: 'STEP 3',
                    title: 'Priority Onsite Consumption',
                    desc: 'Solar electricity first powers internal appliances, lighting, machinery, and air conditioning loads, drastically reducing instantaneous grid power draw.'
                  },
                  {
                    step: 'STEP 4',
                    title: 'Bi-Directional Net Metering Export',
                    desc: 'Surplus solar energy generated beyond current load demand is automatically exported to the CSPDCL utility grid. The bi-directional net meter accurately logs export units.'
                  },
                  {
                    step: 'STEP 5',
                    title: 'Grid Offset & Nighttime Credit Settlement',
                    desc: 'During nighttime or heavy cloud cover, power is smoothly imported from the grid. At the end of each billing cycle, exported units offset imported units, leaving a nominal energy bill.'
                  }
                ].map((s, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-700 text-white">
                        {s.step}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">{s.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-1">{s.desc}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-5 mb-3">
                2. System Architecture & Interconnection Schematic
              </h2>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="grid grid-cols-4 gap-3 text-center relative">
                  {[
                    { title: 'Solar PV Array', sub: 'Waaree Bifacial PERC', tag: 'Sunlight to DC', color: 'bg-amber-600', badge: 'bg-amber-100 text-amber-800' },
                    { title: 'String Inverter', sub: 'Dual MPPT Convert', tag: 'DC to AC 230/415V', color: 'bg-blue-600', badge: 'bg-blue-100 text-blue-800' },
                    { title: 'Premises Loads', sub: 'Internal Appliances', tag: 'Priority Supply', color: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
                    { title: 'CSPDCL Grid', sub: 'Bi-Directional Meter', tag: 'Net-Metering Sync', color: 'bg-slate-700', badge: 'bg-slate-100 text-slate-800' }
                  ].map((node, i) => (
                    <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs relative flex flex-col justify-between">
                      <div className={`h-1 w-full rounded-t -mt-2.5 mb-1.5 ${node.color}`} />
                      <div className="font-bold text-xs text-slate-900">{node.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{node.sub}</div>
                      <div className={`mt-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${node.badge}`}>
                        {node.tag}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SVG Pipeline Flow Diagram */}
                <div className="mt-3 py-1">
                  <svg viewBox="0 0 500 24" className="w-full h-6">
                    <line x1="60" y1="12" x2="440" y2="12" stroke="#d97706" strokeWidth="2" strokeDasharray="6 3" />
                    {/* Solar PV to Inverter Arrow */}
                    <polygon points="175,12 165,8 165,16" fill="#d97706" />
                    {/* Inverter to Loads Arrow */}
                    <polygon points="300,12 290,8 290,16" fill="#2563eb" />
                    {/* Bi-directional Loads <-> Grid */}
                    <polygon points="425,12 415,8 415,16" fill="#059669" />
                    <polygon points="360,12 370,8 370,16" fill="#059669" />
                  </svg>
                </div>

                <p className="text-[10px] text-slate-500 italic text-center mt-1">
                  * Real-time synchronization guarantees instant transition between onsite solar generation and utility grid power with zero interruption.
                </p>
              </div>
            </div>

            {renderPageFooter(3)}
          </div>

          {/* ==========================================
              PAGE 4: DETAILED TECHNICAL SPECIFICATIONS
              ========================================== */}
          <div
            id="quotation-page-4"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('Detailed Technical Specifications')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-3">
                1. Complete System Technical Specification Matrix
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[11px]">
                    <tr>
                      <th className="py-2 px-3 text-left font-bold w-1/3">System Component / Parameter</th>
                      <th className="py-2 px-3 text-left font-bold">Technical Specification & Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {[
                      ['System Capacity & Plant Type', `${capacityKw} kW Turnkey Rooftop Grid-Connected Solar Power Plant`],
                      ['Solar PV Module Brand / Technology', `${quotation.panelBrand || 'Waaree 545W'} / ${quotation.panelType || 'DCR Mono PERC Bifacial'}`],
                      ['Module Certification & Compliance', 'ALMM Listed, BIS Certified, IEC 61215, IEC 61730, PID & Salt Mist Resistant'],
                      ['Grid-Tied Inverter Make & Model', `${quotation.inverterBrand || 'Waaree 5KW 3PH'} Grid-Tie String Inverter`],
                      ['Inverter Output & Grid Sync', 'Pure Sine Wave AC Output, THD <3%, Efficiency >98.6%, Synchronized with DISCOM LT Grid'],
                      ['IoT Data Logger & Remote Monitoring', 'Integrated WiFi / 4G Remote Monitoring Stick with Live Mobile App & Web Portal'],
                      ['Module Mounting Structure', `${quotation.structureType || 'Elevated Rooftop HDG / Pre-GI Structure (7-8 Ft Clearance)'}`],
                      ['Structure Wind Velocity Rating', 'Engineered & certified to withstand sustained wind speeds up to 150 km/h (IS 875 Part 3)'],
                      ['DC Solar Cable Specifications', '1C x 4/6 sq.mm Electron Beam Cross-Linked XLPO Copper Cable, UV & Ozone Resistant'],
                      ['AC Armoured Power Cable', 'Heavy-Duty Multi-core Armoured Copper / Aluminium Cable sized for <2% voltage drop'],
                      ['DC Distribution Box (DCDB)', 'IP65 Enclosure with 1000V DC Type-II Surge Protection Devices (SPD) & Fuses'],
                      ['AC Distribution Box (ACDB)', 'IP65 Enclosure with Type-II AC Surge Protection Devices & Isolator MCB / MCCB'],
                      ['Earthing & Grounding Protection', 'Dedicated Maintenance-Free Chemical Earthing Electrodes with Backfill Compound'],
                      ['Lightning Protection System', 'ESE / Copper Spike Lightning Arrester designed in compliance with IS/IEC 62305'],
                      ['Bi-Directional Net Metering Kit', 'Discom Approved Smart Bi-directional Net Meter with optical test port & terminal block']
                    ].map(([comp, spec], i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-800">{comp}</td>
                        <td className="py-2 px-3 text-slate-600">{spec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {renderPageFooter(4)}
          </div>

          {/* ==========================================
              PAGE 5: BILL OF MATERIALS (BOM) & SERVICES
              ========================================== */}
          <div
            id="quotation-page-5"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('Bill of Materials & Scope of Work')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-2.5">
                1. Bill of Materials (BOM)
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2 text-center w-8">#</th>
                      <th className="py-1.5 px-2 text-left">Product Description</th>
                      <th className="py-1.5 px-2 text-left">Make / Brand</th>
                      <th className="py-1.5 px-2 text-center">Qty</th>
                      <th className="py-1.5 px-2 text-right">Rate (₹)</th>
                      <th className="py-1.5 px-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-[11px]">
                    {bomItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-medium text-slate-900">{item.productName || item.description}</td>
                        <td className="py-1.5 px-2 text-slate-600">{item.make || item.makeModel || 'Standard'}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-700">{item.quantity} {item.unit}</td>
                        <td className="py-1.5 px-2 text-right text-slate-600">{formatINR(item.rate || item.unitPrice)}</td>
                        <td className="py-1.5 px-2 text-right font-bold text-slate-900">{formatINR(item.amount || item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-100 text-amber-900 font-bold text-xs border-t border-amber-300">
                    <tr>
                      <td colSpan={5} className="py-2 px-3 text-left">TOTAL MATERIAL COST (BOM SUBTOTAL)</td>
                      <td className="py-2 px-3 text-right font-black text-amber-800">{formatINR(quotation.bomSubtotal || quotation.baseAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-5 mb-2">
                2. Our Turnkey Services (Included in Proposal)
              </h2>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  'Comprehensive 3D Shadow Profiling, Site Topography & Roof Load Assessment.',
                  'Complete Structural Design & Wind Load Calculation (Compliant with IS 875 standards).',
                  'Procurement, Factory Testing & Safe Onsite Logistics of all PV modules, inverters & BOS.',
                  'Precision Mechanical Assembly, Module Clamping & Elevated Structure Erection.',
                  'Complete DC & AC Cabling, Combiner Box Wiring, Earthing Pits & Lightning Protection.',
                  'End-to-End Liaisoning with CSPDCL / State DISCOM for Net-Metering Approvals & CEIG.',
                  'Plant Testing, Commissioning, Inverter Cloud WiFi Monitoring Setup & User Handover.',
                  'Comprehensive 5-Year Operation & Preventive Maintenance (O&M) Warranty Support.'
                ].map((s, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-700 leading-snug">{s}</span>
                  </div>
                ))}
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-2">
                3. Notes & Client Scope
              </h2>

              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                <li>Net Metering approval is subject to CSPDCL/DISCOM guidelines, transformer capacity, and sanctioned load.</li>
                <li>Client to provide adequate shadow-free roof area and structurally stable roof terrace.</li>
                <li>Client to provide single-phase auxiliary electricity and clean water supply during erection & module cleaning.</li>
                <li>All Balance of Material (BOM) items conform to IEC / BIS specifications with heavy-duty UV resistant conduits.</li>
              </ul>
            </div>

            {renderPageFooter(5)}
          </div>

          {/* ==========================================
              PAGE 6: COMMERCIAL PROPOSAL & FINANCIALS
              ========================================== */}
          <div
            id="quotation-page-6"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('Commercial Proposal & Financial Breakdown')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-3">
                1. Turnkey Project Cost Breakdown
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[11px]">
                    <tr>
                      <th className="py-2 px-3 text-left font-bold">Financial Parameter / Milestone</th>
                      <th className="py-2 px-3 text-right font-bold">Amount / Specification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="hover:bg-slate-50 font-bold">
                      <td className="py-2 px-3 text-slate-800">Solar Plant Capacity</td>
                      <td className="py-2 px-3 text-right text-slate-900">{capacityKw} kW</td>
                    </tr>
                    <tr className="hover:bg-slate-50 font-bold">
                      <td className="py-2 px-3 text-slate-800">Cost Per KW</td>
                      <td className="py-2 px-3 text-right text-amber-700">{formatINR(costPerKw)} / kW</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Base Turnkey Project Price (Excl. Tax)</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(basePrice)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">Equipment GST Component ({eqPct}% of Base @ {eqRate}% GST)</td>
                      <td className="py-2 px-3 text-right text-slate-700">{formatINR(eqTax)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">Services GST Component ({srvPct}% of Base @ {srvRate}% GST)</td>
                      <td className="py-2 px-3 text-right text-slate-700">{formatINR(srvTax)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-700">Total GST Amount (Composite EPC Scheme)</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(totalGst)}</td>
                    </tr>
                    <tr className="bg-amber-50 font-black text-amber-900 border-y border-amber-200">
                      <td className="py-2.5 px-3">TOTAL PROJECT COST (GROSS EPC VALUE)</td>
                      <td className="py-2.5 px-3 text-right text-amber-800 text-sm">{formatINR(totalProjectCost)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-emerald-700">
                      <td className="py-2 px-3 font-medium">Central Subsidy Assistance (PM Surya Ghar Scheme)</td>
                      <td className="py-2 px-3 text-right font-bold">- {formatINR(centralSubsidy)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-emerald-700">
                      <td className="py-2 px-3 font-medium">State Subsidy Assistance (Chhattisgarh State Policy)</td>
                      <td className="py-2 px-3 text-right font-bold">- {formatINR(stateSubsidy)}</td>
                    </tr>
                    <tr className="bg-emerald-50 text-emerald-800 font-bold border-y border-emerald-200">
                      <td className="py-2 px-3">TOTAL APPLICABLE SUBSIDY</td>
                      <td className="py-2 px-3 text-right font-black">- {formatINR(totalSubsidy)}</td>
                    </tr>
                    <tr className="bg-amber-100/60 font-black text-amber-950 border-t-2 border-amber-400">
                      <td className="py-2.5 px-3 text-sm">FINAL NET PROJECT INVESTMENT (CLIENT PAYABLE)</td>
                      <td className="py-2.5 px-3 text-right text-amber-800 text-base">{formatINR(finalInvestment)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Cost in Words */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Total Cost in Words:</span>
                <p className="text-xs font-black text-slate-900 mt-0.5">
                  {quotation.amountInWords || numberToIndianWords(totalProjectCost)}
                </p>
              </div>

              {/* VISUAL GRAPHIC: Commercial Investment & Govt Subsidy Financial Waterfall */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-tight mb-2.5 text-center">
                  Commercial Investment & Govt Subsidy Financial Waterfall
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <div className="h-1 bg-slate-900 rounded-t -mt-2 mb-1" />
                    <div className="text-[10px] font-bold text-slate-700">Gross EPC Value</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{formatINR(totalProjectCost)}</div>
                    <span className="mt-1 inline-block text-[8px] px-1 py-0.5 bg-slate-100 text-slate-600 rounded">100% Value</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-200 shadow-xs">
                    <div className="h-1 bg-emerald-600 rounded-t -mt-2 mb-1" />
                    <div className="text-[10px] font-bold text-emerald-800">PM Surya Ghar</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">-{formatINR(centralSubsidy)}</div>
                    <span className="mt-1 inline-block text-[8px] px-1 py-0.5 bg-emerald-100 text-emerald-800 rounded">Central DBT</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-teal-200 shadow-xs">
                    <div className="h-1 bg-teal-600 rounded-t -mt-2 mb-1" />
                    <div className="text-[10px] font-bold text-teal-800">State Subsidy</div>
                    <div className="text-xs font-bold text-teal-700 mt-0.5">-{formatINR(stateSubsidy)}</div>
                    <span className="mt-1 inline-block text-[8px] px-1 py-0.5 bg-teal-100 text-teal-800 rounded">State Policy</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-amber-300 shadow-xs">
                    <div className="h-1 bg-amber-600 rounded-t -mt-2 mb-1" />
                    <div className="text-[10px] font-bold text-amber-900">Net Client Payable</div>
                    <div className="text-xs font-black text-amber-800 mt-0.5">{formatINR(finalInvestment)}</div>
                    <span className="mt-1 inline-block text-[8px] px-1 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">Client Out-of-Pocket</span>
                  </div>
                </div>
                <div className="mt-2.5 py-1 px-3 bg-emerald-50 rounded-lg text-center text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  TOTAL GOVT SUBSIDY RELIEF: {formatINR(totalSubsidy)} ({totalProjectCost > 0 ? ((totalSubsidy / totalProjectCost) * 100).toFixed(1) : 33.8}% EFFECTIVE SAVINGS ON GROSS VALUE)
                </div>
              </div>

              {/* Subsidy Info Card */}
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-300 text-xs space-y-1.5">
                <h3 className="font-bold text-amber-900 uppercase text-[11px]">
                  Government Subsidy & Direct Benefit Transfer (DBT) Guidelines
                </h3>
                <ul className="text-[11px] text-slate-700 space-y-1 list-disc pl-4">
                  <li>PM Surya Ghar Muft Bijli Yojana provides direct bank transfer subsidy of up to ₹78,000 for residential systems.</li>
                  <li>Chhattisgarh State Government provides additional state financial assistance of up to ₹30,000 for empaneled vendors.</li>
                  <li>Subsidy is directly credited into consumer bank account post physical inspection & bi-directional meter synchronisation.</li>
                  <li>Rejoy Solar Power handles the entire online portal documentation, feasibility report, and liaisons with CSPDCL / CREDA.</li>
                  <li>Mandatory Client Documents: Latest electricity bill copy, Aadhaar Card, PAN Card, and cancelled cheque leaf.</li>
                </ul>
              </div>
            </div>

            {renderPageFooter(6)}
          </div>

          {/* ==========================================
              PAGE 7: 25-YEAR GENERATION & FINANCIAL ROI
              ========================================== */}
          <div
            id="quotation-page-7"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('25-Year Generation & Financial Returns')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-3">
                1. Energy Generation & Financial Return Metrics
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[11px]">
                    <tr>
                      <th className="py-2 px-3 text-left font-bold">Financial / Generation Metric</th>
                      <th className="py-2 px-3 text-right font-bold">Projected Estimate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">System DC Capacity</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{capacityKw} kWp</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Estimated Average Daily Generation</td>
                      <td className="py-2 px-3 text-right font-bold text-amber-700">{dailyUnits} Units / Day</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Estimated 1st Year Annual Generation</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{annualUnits.toLocaleString('en-IN')} kWh / Units</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Estimated Average Grid Tariff Benchmark</td>
                      <td className="py-2 px-3 text-right text-slate-600">₹7.50 / Unit (Historical 5% annual escalation)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Estimated 1st Year Power Bill Savings</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-700">{formatINR(annualSavings)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 bg-amber-50/50">
                      <td className="py-2 px-3 font-bold text-slate-900">Simple Capital Payback Period</td>
                      <td className="py-2 px-3 text-right font-black text-amber-800">~{paybackYears} Years (Rapid capital recovery)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">25-Year Cumulative Financial Savings</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-700">{formatINR(lifetimeSavings)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">Estimated Financial Internal Rate of Return (IRR)</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">&gt;28% Risk-Free Annual Return</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* VISUAL GRAPHIC: 25-Year Cumulative Savings & Degradation ROI Chart Graphic */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-tight">
                    25-Year Cumulative Financial Savings & PV Output Guarantee
                  </div>
                  <div className="flex items-center gap-3 text-[9px]">
                    <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                      <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs inline-block" /> Cumulative Savings (₹)
                    </span>
                    <span className="flex items-center gap-1 text-amber-800 font-semibold">
                      <span className="w-2.5 h-2.5 bg-amber-600 rounded-full inline-block" /> PV Output (%)
                    </span>
                  </div>
                </div>

                {/* SVG Visual Bars & Degradation Curve */}
                <div className="h-28 w-full bg-white rounded-lg p-2 border border-slate-200 flex flex-col justify-between relative">
                  <svg viewBox="0 0 500 90" className="w-full h-full">
                    {/* Grid lines */}
                    <line x1="30" y1="15" x2="480" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="30" y1="35" x2="480" y2="35" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="30" y1="55" x2="480" y2="55" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="30" y1="75" x2="480" y2="75" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Y-axis labels */}
                    <text x="25" y="18" fill="#94a3b8" fontSize="7" textAnchor="end">₹20L</text>
                    <text x="25" y="38" fill="#94a3b8" fontSize="7" textAnchor="end">₹15L</text>
                    <text x="25" y="58" fill="#94a3b8" fontSize="7" textAnchor="end">₹5L</text>
                    <text x="25" y="78" fill="#94a3b8" fontSize="7" textAnchor="end">₹0</text>

                    {/* Bars for 7 Milestones: Yr 1, 3, 5, 10, 15, 20, 25 */}
                    {/* Yr 1 */}
                    <rect x="55" y="70" width="22" height="5" fill="#059669" rx="2" />
                    <text x="66" y="67" fill="#059669" fontSize="6.5" fontWeight="bold" textAnchor="middle">₹35K</text>
                    <text x="66" y="85" fill="#64748b" fontSize="6.5" textAnchor="middle">Yr 1</text>

                    {/* Yr 3 Payback */}
                    <rect x="115" y="62" width="22" height="13" fill="#059669" rx="2" />
                    <text x="126" y="59" fill="#059669" fontSize="6.5" fontWeight="bold" textAnchor="middle">₹1.1L</text>
                    <rect x="106" y="47" width="40" height="9" fill="#d97706" rx="2" />
                    <text x="126" y="54" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">★ PAYBACK</text>
                    <text x="126" y="85" fill="#64748b" fontSize="6.5" textAnchor="middle">Yr 3</text>

                    {/* Yr 5 */}
                    <rect x="175" y="54" width="22" height="21" fill="#059669" rx="2" />
                    <text x="186" y="50" fill="#059669" fontSize="6.5" fontWeight="bold" textAnchor="middle">₹1.9L</text>
                    <text x="186" y="85" fill="#64748b" fontSize="6.5" textAnchor="middle">Yr 5</text>

                    {/* Yr 10 */}
                    <rect x="235" y="43" width="22" height="32" fill="#059669" rx="2" />
                    <text x="246" y="39" fill="#059669" fontSize="6.5" fontWeight="bold" textAnchor="middle">₹4.8L</text>
                    <text x="246" y="85" fill="#64748b" fontSize="6.5" textAnchor="middle">Yr 10</text>

                    {/* Yr 15 */}
                    <rect x="295" y="32" width="22" height="43" fill="#059669" rx="2" />
                    <text x="306" y="28" fill="#059669" fontSize="6.5" fontWeight="bold" textAnchor="middle">₹8.6L</text>
                    <text x="306" y="85" fill="#64748b" fontSize="6.5" textAnchor="middle">Yr 15</text>

                    {/* Yr 20 */}
                    <rect x="355" y="21" width="22" height="54" fill="#059669" rx="2" />
                    <text x="366" y="17" fill="#059669" fontSize="6.5" fontWeight="bold" textAnchor="middle">₹13.2L</text>
                    <text x="366" y="85" fill="#64748b" fontSize="6.5" textAnchor="middle">Yr 20</text>

                    {/* Yr 25 */}
                    <rect x="415" y="10" width="22" height="65" fill="#059669" rx="2" />
                    <text x="426" y="7" fill="#059669" fontSize="6.5" fontWeight="bold" textAnchor="middle">₹18.5L</text>
                    <text x="426" y="85" fill="#64748b" fontSize="6.5" textAnchor="middle">Yr 25</text>

                    {/* Degradation line */}
                    <polyline
                      points="66,15 126,18 186,21 246,26 306,32 366,37 426,42"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2"
                    />
                    <circle cx="66" cy="15" r="2.5" fill="#d97706" />
                    <circle cx="126" cy="18" r="2.5" fill="#d97706" />
                    <circle cx="186" cy="21" r="2.5" fill="#d97706" />
                    <circle cx="246" cy="26" r="2.5" fill="#d97706" />
                    <circle cx="306" cy="32" r="2.5" fill="#d97706" />
                    <circle cx="366" cy="37" r="2.5" fill="#d97706" />
                    <circle cx="426" cy="42" r="2.5" fill="#d97706" />
                  </svg>
                </div>
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-5 mb-2.5">
                2. 25-Year Lifetime Generation & Cumulative Return Schedule
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2 text-left font-bold">Milestone Year</th>
                      <th className="py-1.5 px-2 text-center font-bold">PV Generation</th>
                      <th className="py-1.5 px-2 text-center font-bold">Grid Tariff</th>
                      <th className="py-1.5 px-2 text-right font-bold">Annual Savings</th>
                      <th className="py-1.5 px-2 text-right font-bold">Cumulative Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-[11px]">
                    {[
                      ['Year 01', `${annualUnits.toLocaleString('en-IN')} kWh`, '₹7.50', formatINR(annualSavings), formatINR(annualSavings)],
                      ['Year 03 (Payback)', `${Math.round(annualUnits * 0.99).toLocaleString('en-IN')} kWh`, '₹8.27', formatINR(Math.round(annualSavings * 1.09)), formatINR(Math.round(annualSavings * 3.1))],
                      ['Year 05', `${Math.round(annualUnits * 0.98).toLocaleString('en-IN')} kWh`, '₹9.12', formatINR(Math.round(annualSavings * 1.19)), formatINR(Math.round(annualSavings * 5.4))],
                      ['Year 10', `${Math.round(annualUnits * 0.95).toLocaleString('en-IN')} kWh`, '₹11.64', formatINR(Math.round(annualSavings * 1.47)), formatINR(Math.round(annualSavings * 12.2))],
                      ['Year 15', `${Math.round(annualUnits * 0.92).toLocaleString('en-IN')} kWh`, '₹14.85', formatINR(Math.round(annualSavings * 1.82)), formatINR(Math.round(annualSavings * 20.6))],
                      ['Year 20', `${Math.round(annualUnits * 0.89).toLocaleString('en-IN')} kWh`, '₹18.96', formatINR(Math.round(annualSavings * 2.25)), formatINR(Math.round(annualSavings * 31.0))],
                      ['Year 25', `${Math.round(annualUnits * 0.85).toLocaleString('en-IN')} kWh`, '₹24.19', formatINR(Math.round(annualSavings * 2.74)), formatINR(lifetimeSavings)]
                    ].map((row, idx) => (
                      <tr key={idx} className={idx === 1 ? 'bg-amber-50/70 font-semibold' : 'hover:bg-slate-50'}>
                        <td className="py-1.5 px-2 font-bold text-slate-800">{row[0]}</td>
                        <td className="py-1.5 px-2 text-center text-slate-600">{row[1]}</td>
                        <td className="py-1.5 px-2 text-center text-slate-600">{row[2]}</td>
                        <td className="py-1.5 px-2 text-right font-medium text-slate-800">{row[3]}</td>
                        <td className="py-1.5 px-2 text-right font-black text-amber-800">{row[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {renderPageFooter(7)}
          </div>

          {/* ==========================================
              PAGE 8: ELEVATED STRUCTURE & 3D MODEL
              ========================================== */}
          <div
            id="quotation-page-8"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('Technical Architecture & Elevated Structure')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-3">
                1. Elevated Structure & Solar Panel 3D Technical Design
              </h2>

              {/* 3D Blueprint Canvas */}
              <div className="h-64 bg-slate-950 rounded-2xl p-4 relative overflow-hidden border border-slate-800 shadow-inner">
                {/* Blueprint Grid Lines */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Vector Structural Graphics */}
                <div className="relative h-full flex flex-col justify-between z-10">
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ENGINEERED ELEVATED ROOFTOP MOUNTING STRUCTURE
                    </span>
                    <p className="text-[11px] text-slate-400">
                      True-South Azimuth Alignment with 15°-22° Latitude-Optimized Tilt & 7-8 Ft Walkability Headroom
                    </p>
                  </div>

                  {/* SVG Blueprint Illustration */}
                  <div className="flex-1 flex items-center justify-center my-2">
                    <svg viewBox="0 0 500 160" className="w-full h-full max-h-40">
                      {/* Ground line */}
                      <line x1="30" y1="140" x2="470" y2="140" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
                      <text x="40" y="152" fill="#64748b" fontSize="8" fontFamily="sans-serif">ROOFTOP RCC SLAB (ZERO PUNCTURE CHEMICAL ANCHORS)</text>

                      {/* Pedestals */}
                      <rect x="70" y="130" width="30" height="10" fill="#64748b" rx="2" />
                      <rect x="220" y="130" width="30" height="10" fill="#64748b" rx="2" />
                      <rect x="370" y="130" width="30" height="10" fill="#64748b" rx="2" />

                      {/* Columns */}
                      <line x1="85" y1="130" x2="85" y2="70" stroke="#f59e0b" strokeWidth="3" />
                      <line x1="235" y1="130" x2="235" y2="55" stroke="#f59e0b" strokeWidth="3" />
                      <line x1="385" y1="130" x2="385" y2="40" stroke="#f59e0b" strokeWidth="3" />

                      {/* Cross Bracing */}
                      <line x1="85" y1="110" x2="235" y2="75" stroke="#d97706" strokeWidth="1.5" />
                      <line x1="235" y1="110" x2="85" y2="75" stroke="#d97706" strokeWidth="1.5" />
                      <line x1="235" y1="110" x2="385" y2="60" stroke="#d97706" strokeWidth="1.5" />
                      <line x1="385" y1="110" x2="235" y2="60" stroke="#d97706" strokeWidth="1.5" />

                      {/* Tilted Rafter */}
                      <line x1="60" y1="75" x2="420" y2="35" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />

                      {/* Solar PV Modules tilted */}
                      <polygon points="70,69 150,59 150,45 70,55" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
                      <polygon points="160,57 240,47 240,33 160,43" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
                      <polygon points="250,45 330,35 330,21 250,31" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
                      <polygon points="340,33 420,23 420,9 340,19" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />

                      {/* Dimension Arrow for Clearance */}
                      <line x1="50" y1="130" x2="50" y2="75" stroke="#fbbf24" strokeWidth="1" markerEnd="url(#arrow)" />
                      <text x="35" y="105" fill="#fde047" fontSize="7" fontWeight="bold">7 - 8 FT</text>
                    </svg>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[9px] text-slate-300">
                    <div>
                      <span className="text-amber-400 font-bold block">COLUMNS:</span>
                      80x80 / 60x60 HDG Tube
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold block">PURLINS:</span>
                      Pre-GI C-Channels (80μ)
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold block">FASTENERS:</span>
                      SS304 Anti-Theft Bolts
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold block">WIND SPEED:</span>
                      Certified 150 km/h
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-5 mb-2.5">
                2. Mounting Structure & Engineering Parameters
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[10px]">
                    <tr>
                      <th className="py-2 px-3 text-left font-bold w-1/3">Engineering Parameter</th>
                      <th className="py-2 px-3 text-left font-bold">Technical Specification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {[
                      ['Structure Type', quotation.structureType || 'Elevated Rooftop HDG / Pre-GI Solar Mounting Structure'],
                      ['Clearance Height', 'Minimum 7 to 8 Feet headroom clearance allowing full roof utilization'],
                      ['Steel Grade & Coating', 'High-Strength Steel (YSt 310 / 550 MPa) with 80-120 Micron Hot-Dip Galvanization'],
                      ['Tilt Angle & Orientation', '15° to 22° True South orientation calculated for maximum annual solar yield'],
                      ['Wind Load Rating', 'Aerodynamically certified to withstand sustained wind speeds up to 150 km/h (IS 875)'],
                      ['Fasteners & Hardware', 'Grade SS304 Stainless Steel bolts, Belleville washers, and serrated flange nuts'],
                      ['Foundation Anchoring', 'M25 RCC Pedestals with Hilti/Fischer Chemical Anchors (Zero roof puncture)'],
                      ['Warranty & Lifespan', '25 Years structural integrity warranty designed for harsh weather conditions']
                    ].map(([param, spec], i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-bold text-slate-800">{param}</td>
                        <td className="py-1.5 px-3 text-slate-600">{spec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {renderPageFooter(8)}
          </div>

          {/* ==========================================
              PAGE 9: TERMS, CONDITIONS & MILESTONES
              ========================================== */}
          <div
            id="quotation-page-9"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('Terms, Conditions & Payment Schedule')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-2.5">
                1. Contractual Milestone Payment Schedule
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2 text-center w-12">Stage</th>
                      <th className="py-1.5 px-3 text-left">Milestone</th>
                      <th className="py-1.5 px-3 text-left">Condition / Trigger</th>
                      <th className="py-1.5 px-2 text-center">Share</th>
                      <th className="py-1.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {milestones.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-center font-bold text-slate-500">Stage 0{idx + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{m.title}</td>
                        <td className="py-1.5 px-3 text-slate-600 text-[11px]">{m.description}</td>
                        <td className="py-1.5 px-2 text-center font-black text-amber-700">{m.percentage}%</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">{formatINR(m.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-100 text-amber-900 font-bold text-xs border-t border-amber-300">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-left">TOTAL CONTRACTUAL PAYMENT</td>
                      <td className="py-2 px-2 text-center font-black">100%</td>
                      <td className="py-2 px-3 text-right font-black text-amber-800">{formatINR(totalProjectCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-5 mb-2.5">
                2. Project Delivery & Commissioning Timeline
              </h2>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { phase: 'Phase 1: Engineering & Feasibility (Days 1 - 3)', desc: 'Site visit, structural load verification, 3D shadow analysis, and DISCOM net metering online application filing.' },
                  { phase: 'Phase 2: Procurement & Logistics (Days 4 - 10)', desc: 'Factory dispatch, transit insurance, and safe delivery of PV modules, inverters, and HDG structure at site.' },
                  { phase: 'Phase 3: Civil & Mechanical Erection (Days 11 - 15)', desc: 'Erection of elevated mounting structure, module clamping, and array grounding with chemical earthing.' },
                  { phase: 'Phase 4: Electrical Commissioning & Net Metering (Days 16 - 21)', desc: 'Inverter setup, ACDB/DCDB cabling, DISCOM net-meter installation, synchronization, and plant handover.' }
                ].map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-amber-800 text-xs block mb-0.5">{t.phase}</span>
                    <p className="text-[11px] text-slate-600 leading-snug">{t.desc}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-5 mb-2">
                3. Commercial Terms & General Conditions
              </h2>

              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
                <li>Price Validity: This quotation is valid for {quotation.validityDays || 15} days from issuance ({quotation.validTill || '15 Days'}).</li>
                <li>Taxation: GST is calculated on 70:30 composite EPC scheme. Any statutory revision shall be charged to the client.</li>
                <li>Title of Goods: Ownership of equipment remains with Rejoy Solar until 100% contractual milestone payments are cleared.</li>
                <li>Discom Interconnection: Net-metering approval is contingent on CSPDCL DT capacity and sanctions as per state regulations.</li>
                <li>Client Responsibility: Client to ensure clear rooftop access, auxiliary single-phase power, and water for construction.</li>
              </ul>
            </div>

            {renderPageFooter(9)}
          </div>

          {/* ==========================================
              PAGE 10: WARRANTIES, BANKING & ACCEPTANCE
              ========================================== */}
          <div
            id="quotation-page-10"
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto mb-10 p-[14mm] relative flex flex-col justify-between box-border rounded-xs print:shadow-none print:m-0 print:mb-0 print:rounded-none print:break-after-page print:page-break-after-always overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 z-10" />
            {renderWatermark()}

            <div className="relative z-10">
              {renderPageHeader('Warranties, Banking & Client Acceptance')}

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-2.5">
                1. Comprehensive Performance Warranties & Guarantees
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white text-[10px]">
                    <tr>
                      <th className="py-2 px-3 text-left font-bold w-1/3">System Component</th>
                      <th className="py-2 px-3 text-left font-bold">Warranty Term & Performance Guarantee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {[
                      ['Tier-1 Solar PV Modules', '25-Year Linear Power Output Warranty (>=90% at 10 Yrs, >=80% at 25 Yrs) + 12-Yr Product Warranty'],
                      ['Grid-Tied String Inverter', '5 to 10 Years Replacement Warranty against manufacturing defects with remote cloud diagnostics'],
                      ['Elevated HDG Mounting Structure', '25-Year Structural Integrity Warranty against corrosion, deformation, and mechanical failure'],
                      ['Comprehensive EPC Workmanship', '5-Year Complete EPC Workmanship Warranty with free annual preventive maintenance checks']
                    ].map(([comp, war], i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-bold text-slate-800">{comp}</td>
                        <td className="py-1.5 px-3 text-slate-600">{war}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-2">
                2. Statutory Registrations & Empanelment
              </h2>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { title: 'CREDA Approved', desc: 'Rooftop Solar EPC' },
                  { title: 'CSPDCL Empaneled', desc: 'Net-Metering Vendor' },
                  { title: 'PM Surya Ghar', desc: 'Authorized Portal Partner' },
                  { title: 'ISO 9001:2015', desc: 'Certified Quality Management' }
                ].map((sb, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-amber-800 text-[11px] block">{sb.title}</span>
                    <span className="text-[10px] text-slate-500">{sb.desc}</span>
                  </div>
                ))}
              </div>

              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-2">
                3. Official Bank Account Details (NEFT / RTGS / IMPS)
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {[
                      ['Beneficiary Name', 'Rejoy Solar Power Pvt. Ltd.'],
                      ['Bank Name', 'HDFC Bank Ltd.'],
                      ['Account Number', '50200084729103'],
                      ['Account Type', 'Current Account'],
                      ['IFSC Code', 'HDFC0001234'],
                      ['Branch', 'Bhilai / Raipur Main Branch, Chhattisgarh']
                    ].map(([label, val], i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-semibold text-slate-700 w-1/3">{label}</td>
                        <td className="py-1.5 px-3 font-bold text-amber-800">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures & Acceptance Box */}
              <div className="mt-4 grid grid-cols-2 gap-3.5">
                <div className="p-3 bg-white/90 rounded-xl border border-slate-200 flex flex-col justify-between h-28 relative overflow-hidden">
                  <div>
                    <span className="font-bold text-amber-800 text-xs block">FOR REJOY SOLAR POWER PVT. LTD.</span>
                    <span className="text-[10px] text-slate-500">CREDA Approved Turnkey EPC Contractor</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-500 relative z-10">
                    Authorized Signatory
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between h-28">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">CLIENT ACCEPTANCE & PURCHASE CONFIRMATION</span>
                    <span className="text-[10px] text-slate-600">Accepted By: {quotation.customerName}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-400 flex justify-between">
                    <span>Signature / Stamp</span>
                    <span>Date: ____________</span>
                  </div>
                </div>
              </div>
            </div>

            {renderPageFooter(10)}
          </div>
        </div>
      </div>
    </div>
  );
};
