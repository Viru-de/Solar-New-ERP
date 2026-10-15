import { jsPDF, GState } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation } from '../types/solar';
import { formatINR, numberToIndianWords } from './indianNumberWords';
import { REJOY_LOGO_BASE64 } from './logoData';

export const WATERMARK_TEXT = 'Rejoy Solar Power';

/**
 * Generates an off-screen HTML canvas data URL with a dynamic,
 * semi-transparent watermark overlay scaled proportionally to the target dimensions.
 * The text remains perfectly centered and proportional across different page sizes and orientations.
 */
export function createCanvasWatermarkOverlay(
  watermarkText: string = WATERMARK_TEXT,
  width: number = 1240,
  height: number = 1754
): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Central primary diagonal watermark - translated to the exact center of the canvas
    ctx.translate(width / 2, height / 2);
    ctx.rotate((-45 * Math.PI) / 180);

    // Dynamic diagonal scaling factor relative to standard A4 (1240 x 1754 px at ~150 DPI)
    const baseHypot = Math.hypot(1240, 1754);
    const currentHypot = Math.hypot(width, height);
    const scale = currentHypot / baseHypot;

    const primaryFontSize = Math.max(16, Math.round(68 * scale));
    const secondaryFontSize = Math.max(12, Math.round(44 * scale));
    const spacingY = Math.round(320 * scale);

    // Subtle semi-transparent amber branding tone (rgba(217, 119, 6, 0.08))
    ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
    ctx.font = `900 ${primaryFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(watermarkText, 0, 0);

    // Upper repetition for comprehensive page coverage (rgba(217, 119, 6, 0.055))
    ctx.font = `700 ${secondaryFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(217, 119, 6, 0.055)';
    ctx.fillText(watermarkText, 0, -spacingY);

    // Lower repetition
    ctx.fillText(watermarkText, 0, spacingY);

    ctx.restore();
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Draws a dynamically scaled, perfectly centered vector watermark on the active page of doc.
 * Dynamically computes page width, height, diagonal scaling, and symmetrical offsets
 * across different page sizes (A4, A3, Letter, etc.) and orientations (portrait & landscape),
 * strictly maintaining the requested opacity (0.08 primary, 0.055 secondary repetitions).
 */
export function drawDynamicWatermark(
  doc: jsPDF,
  watermarkText: string = WATERMARK_TEXT
): void {
  try {
    const pWidth = doc.internal.pageSize.getWidth();
    const pHeight = doc.internal.pageSize.getHeight();
    const centerX = pWidth / 2;
    const centerY = pHeight / 2;

    // Diagonal-based dynamic scaling factor relative to A4 portrait (210 x 297 mm)
    const baseDiag = Math.hypot(210, 297);
    const pageDiag = Math.hypot(pWidth, pHeight);
    const scale = pageDiag / baseDiag;

    const primaryFontSize = Math.max(14, Math.round(38 * scale * 10) / 10);
    const secondaryFontSize = Math.max(10, Math.round(26 * scale * 10) / 10);

    // Proportional symmetrical offsets along page axes
    const deltaX = (pWidth / 2) * 0.2857;
    const deltaY = (pHeight / 2) * 0.4377;

    doc.saveGraphicsState();
    // Central primary diagonal watermark with requested 0.08 opacity
    doc.setGState(new GState({ opacity: 0.08 }));
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.setFontSize(primaryFontSize);
    doc.text(watermarkText, centerX, centerY, { align: 'center', angle: 45 });

    // Secondary upper and lower repetitions with subtle 0.055 opacity
    doc.setGState(new GState({ opacity: 0.055 }));
    doc.setFontSize(secondaryFontSize);
    doc.text(watermarkText, centerX - deltaX, centerY - deltaY, { align: 'center', angle: 45 });
    doc.text(watermarkText, centerX + deltaX, centerY + deltaY, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();
  } catch {
    // Safe fallback if GState is not supported
    try {
      const pWidth = doc.internal.pageSize.getWidth();
      const pHeight = doc.internal.pageSize.getHeight();
      const scale = Math.hypot(pWidth, pHeight) / Math.hypot(210, 297);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 230, 211);
      doc.setFontSize(Math.max(14, Math.round(38 * scale * 10) / 10));
      doc.text(watermarkText, pWidth / 2, pHeight / 2, { align: 'center', angle: 45 });
    } catch {
      // Ignore
    }
  }
}

/**
 * Applies a consistent, semi-transparent watermark overlay across all pages
 * of the quotation using dynamically scaled canvas-based overlay or GState vector layering.
 * Inspects each individual page's dimensions and orientation to ensure
 * 'Rejoy Solar Power' text remains perfectly centered and proportionally scaled.
 */
export function applyWatermarkOverlayToDoc(
  doc: jsPDF,
  watermarkText: string = WATERMARK_TEXT
): void {
  const total = doc.getNumberOfPages();
  const canvasCache = new Map<string, string | null>();

  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    const pWidth = doc.internal.pageSize.getWidth();
    const pHeight = doc.internal.pageSize.getHeight();

    let applied = false;
    if (typeof document !== 'undefined') {
      // Convert mm to pixels at approx 150 DPI (~5.9055 px/mm)
      const pxWidth = Math.round(pWidth * 5.9055);
      const pxHeight = Math.round(pHeight * 5.9055);
      const cacheKey = `${pxWidth}x${pxHeight}_${watermarkText}`;

      let canvasOverlay = canvasCache.get(cacheKey);
      if (canvasOverlay === undefined) {
        canvasOverlay = createCanvasWatermarkOverlay(watermarkText, pxWidth, pxHeight);
        canvasCache.set(cacheKey, canvasOverlay);
      }

      if (canvasOverlay) {
        try {
          doc.addImage(
            canvasOverlay,
            'PNG',
            0,
            0,
            pWidth,
            pHeight,
            `rejoy_wm_${pxWidth}x${pxHeight}`,
            'FAST'
          );
          applied = true;
        } catch {
          applied = false;
        }
      }
    }

    if (!applied) {
      drawDynamicWatermark(doc, watermarkText);
    }
  }
}

export function generateQuotationPdf(quote: Quotation): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const totalPages = 10;

  // Primary Theme Colors (Rejoy Solar Official Brand Palette)
  const primaryColor = [217, 119, 6]; // Amber-600 #d97706
  const primaryDark = [180, 83, 9]; // Amber-700 #b45309
  const slateDark = [15, 23, 42]; // Slate-900 #0f172a
  const slateMuted = [71, 85, 105]; // Slate-600 #475569
  const slateLight = [248, 250, 252]; // Slate-50 #f8fafc

  // Financial & Technical Normalization
  const capacityKw = quote.capacityKw || 5;
  const systemType = quote.systemType || 'On-Grid';
  const basePrice = quote.baseProjectPrice || quote.baseAmount || 293848;
  const eqPct = quote.gstEquipmentPercent || 70;
  const eqRate = quote.gstEquipmentRate || 5;
  const srvPct = quote.gstServicesPercent || 30;
  const srvRate = quote.gstServicesRate || 18;
  const eqTax = Math.round((basePrice * (eqPct / 100) * eqRate) / 100);
  const srvTax = Math.round((basePrice * (srvPct / 100) * srvRate) / 100);
  const totalGst = quote.gstAmount || quote.taxAmount || (eqTax + srvTax);
  const totalProjectCost = quote.totalProjectCost || quote.totalAmount || (basePrice + totalGst);
  const centralSubsidy = quote.centralSubsidy || (capacityKw >= 3 ? 78000 : capacityKw >= 2 ? 60000 : 30000);
  const stateSubsidy = quote.stateSubsidy || 0;
  const totalSubsidy = quote.totalSubsidy || (centralSubsidy + stateSubsidy);
  const finalInvestment = quote.finalProjectInvestment || Math.max(0, totalProjectCost - totalSubsidy);
  const costPerKw = quote.costPerKw || Math.round(basePrice / Math.max(1, capacityKw));

  // Daily & Lifetime Projections
  const dailyUnits = (capacityKw * 4.2).toFixed(1);
  const annualUnits = Math.round(capacityKw * 1460);
  const annualSavings = Math.round(annualUnits * 7.5);
  const paybackYears = (finalInvestment / Math.max(1, annualSavings)).toFixed(1);
  const lifetimeSavings = Math.round(annualSavings * 25 * 0.92);

  // Mandatory Diagonal Watermark Treatment (Drawn on every page with dynamic scaling)
  const drawWatermark = () => {
    drawDynamicWatermark(doc, WATERMARK_TEXT);
  };

  // Repeated Top Header with Official Logo Graphic
  const drawHeader = (pageTitle: string, pageNum: number) => {
    // Top primary amber accent bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 3.5, 'F');

    // Official Company Logo Image
    try {
      doc.addImage(REJOY_LOGO_BASE64, 'PNG', margin, 5.5, 26, 10.5, 'rejoy_logo', 'FAST');
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
      doc.text('REJOY', margin, 12);
    }

    // Company Credentials next to Logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.text('POWER PVT. LTD.', margin + 28, 10);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('CREDA Approved Solar EPC Contractor', margin + 28, 14);

    // Page Section Title on Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.text(pageTitle.toUpperCase(), pageWidth - margin, 10, { align: 'right' });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('An ISO 9001:2015 Certified Co.', pageWidth - margin, 14, { align: 'right' });

    // Header Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(margin, 17.5, pageWidth - margin, 17.5);
  };

  // Repeated Bottom Footer
  const drawFooter = (pageNum: number) => {
    const y = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('Rejoy Solar Power Pvt. Ltd. | CREDA Approved Solar EPC Contractor | An ISO 9001:2015 Certified Co.', margin, y);

    const padNum = pageNum < 10 ? `0${pageNum}` : `${pageNum}`;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`Ref: ${quote.quotationNumber} | Page ${padNum} of ${totalPages}`, pageWidth - margin, y, { align: 'right' });
  };

  // Helper for Section Titles
  const drawSectionTitle = (title: string, yPos: number): number => {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, yPos, contentWidth, 7, 1.5, 1.5, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, contentWidth, 7, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.text(title.toUpperCase(), margin + 4, yPos + 4.8);
    return yPos + 10;
  };

  // ==========================================
  // PAGE 1: COVER & FORMAL PROPOSAL
  // ==========================================
  drawWatermark();
  drawHeader('Turnkey Solar EPC Proposal', 1);

  // Large Hero Proposal Card
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, 21, contentWidth, 25, 2.5, 2.5, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, 21, contentWidth, 25, 2.5, 2.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('OFFICIAL COMMERCIAL & TECHNICAL PROPOSAL', margin + 6, 27);

  doc.setFontSize(13);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const capText = `${capacityKw} KW ${quote.panelType || 'DCR'} ${systemType.toUpperCase()} SOLAR PLANT`;
  doc.text(`QUOTATION FOR ${capText}`, margin + 6, 36);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('High-Efficiency Rooftop Photovoltaic Power Generation System with Net Metering', margin + 6, 42);

  // Metadata Strip Bar
  const metaY = 49;
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(margin, metaY, contentWidth, 13, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, metaY, contentWidth, 13, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('QUOTATION REF', margin + 5, metaY + 4.5);
  doc.text('DATE OF ISSUE', margin + 52, metaY + 4.5);
  doc.text('VALIDITY PERIOD', margin + 100, metaY + 4.5);
  doc.text('SYSTEM CAPACITY', margin + 145, metaY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(quote.quotationNumber, margin + 5, metaY + 9.5);
  doc.text(quote.quotationDate || quote.createdAt, margin + 52, metaY + 9.5);
  doc.text(`${quote.validityDays || 15} Days (${quote.validTill || '15 Days'})`, margin + 100, metaY + 9.5);
  doc.text(`${capacityKw} kWp Grid-Tied`, margin + 145, metaY + 9.5);

  // Two Column Entity Cards: Customer Information vs Company Information
  const colW = (contentWidth - 6) / 2;
  const colY = 65;
  const colH = 50;

  // Client Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, colY, colW, colH, 2, 2, 'S');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, colY, colW, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('CLIENT DETAILS & INSTALLATION SITE', margin + 4, colY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(quote.customerName || 'Valued Customer', margin + 4, colY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  if (quote.companyName) {
    doc.text(quote.companyName, margin + 4, colY + 16.5);
  }
  doc.text(`Phone: ${quote.customerPhone || 'N/A'}`, margin + 4, colY + 22);
  doc.text(`Email: ${quote.customerEmail || 'N/A'}`, margin + 4, colY + 27);
  doc.text(`Site: ${quote.siteAddress || 'Site Address as per survey'}`, margin + 4, colY + 32);
  doc.text(`City: ${quote.city || 'Chhattisgarh'}`, margin + 4, colY + 37);
  doc.text(`GSTIN: ${quote.customerGst || 'Unregistered / Residential'}`, margin + 4, colY + 42);

  // EPC Contractor Box
  const epcX = margin + colW + 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(epcX, colY, colW, colH, 2, 2, 'S');

  doc.setFillColor(254, 243, 199);
  doc.roundedRect(epcX, colY, colW, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('EPC CONTRACTOR & SERVICE PROVIDER', epcX + 4, colY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('REJOY SOLAR POWER PRIVATE LIMITED', epcX + 4, colY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('CREDA Approved Solar EPC Contractor', epcX + 4, colY + 16.5);
  doc.text('Plot No. 14, St No 14/b, Pragati Nagar Risali', epcX + 4, colY + 22);
  doc.text('Civic Centre, Bhilai, Durg, CG - 490006', epcX + 4, colY + 27);
  doc.text('Phone: +91 9770577527 / +91 7803844457', epcX + 4, colY + 32);
  doc.text('Email: rejoysolarpower@gmail.com', epcX + 4, colY + 37);
  doc.text('Web: www.rejoysolarpower.in | CIN: U40106CT2021PTC011234', epcX + 4, colY + 42);

  // Executive Project Summary Table
  const sumY = colY + colH + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('EXECUTIVE PROJECT SUMMARY', margin, sumY + 3);

  autoTable(doc, {
    startY: sumY + 5,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Parameter', 'Technical & Commercial Specification']],
    body: [
      ['System Capacity & Topology', `${capacityKw} kWp Rooftop Grid-Tied (On-Grid) Photovoltaic Plant`],
      ['Solar PV Modules', `${quote.panelBrand || 'Waaree 545W'} DCR Bifacial Dual Glass Mono PERC Modules`],
      ['Solar Grid Inverter', `${quote.inverterBrand || 'Waaree / Growatt'} High Efficiency String Inverter with WiFi`],
      ['Rooftop Mounting Structure', `${quote.structureType || 'Elevated Hot-Dip Galvanized (HDG) Rooftop Structure'}`],
      ['Estimated Daily Power Generation', `~${dailyUnits} Units (kWh) per day (Weather & Irradiance dependent)`],
      ['Estimated Annual Generation', `~${annualUnits.toLocaleString('en-IN')} Units (kWh) per year`],
      ['Government Subsidy Support', `Eligible under PM Surya Ghar Muft Bijli Yojana (₹${totalSubsidy.toLocaleString('en-IN')})`],
      ['Net Customer Project Investment', `${formatINR(finalInvestment)} (Turnkey supply, installation & commissioning)`]
    ],
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: contentWidth - 55 }
    }
  });

  // Official Accreditation Graphics Badges Bar
  const badgeY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, badgeY, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, badgeY, contentWidth, 22, 2, 2, 'S');

  // Badges Inside
  const bW = (contentWidth - 12) / 3;
  // Badge 1: CREDA Approved
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin + 3, badgeY + 3, bW, 16, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('CREDA APPROVED', margin + 3 + bW / 2, badgeY + 8, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Govt. of Chhattisgarh Agency', margin + 3 + bW / 2, badgeY + 13, { align: 'center' });

  // Badge 2: ISO 9001:2015
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(margin + 6 + bW, badgeY + 3, bW, 16, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(67, 56, 202);
  doc.text('ISO 9001:2015 CERTIFIED', margin + 6 + bW * 1.5, badgeY + 8, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Quality Management Standards', margin + 6 + bW * 1.5, badgeY + 13, { align: 'center' });

  // Badge 3: PM Surya Ghar
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin + 9 + bW * 2, badgeY + 3, bW, 16, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('PM SURYA GHAR YOJANA', margin + 9 + bW * 2.5, badgeY + 8, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('National Portal Subsidized EPC', margin + 9 + bW * 2.5, badgeY + 13, { align: 'center' });

  drawFooter(1);

  // ==========================================
  // PAGE 2: KEY BENEFITS & ENVIRONMENTAL IMPACT
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('Technical & Environmental Value Proposition', 2);

  let curY = 22;
  curY = drawSectionTitle('1. Key Benefits of Solar On-Grid System', curY);

  const cardW = (contentWidth - 6) / 2;
  const cardH = 34;

  const benefits = [
    {
      title: 'Drastic Electricity Bill Reduction',
      desc: 'Cuts up to 80-90% off monthly power bills by substituting costly grid units with free solar energy. Bi-directional net meter credits excess export.',
      badge: 'Zero Monthly Peak Cost'
    },
    {
      title: '25-Year Long-Term Energy Security',
      desc: 'Protects residential and commercial consumers from recurring DISCOM tariff hikes. High performance bifacial modules offer linear output up to 30 years.',
      badge: 'Protected ROI'
    },
    {
      title: 'Direct Government Subsidy Support',
      desc: 'Pre-qualified for central DBT subsidies up to ₹78,000 under PM Surya Ghar Yojana. Direct transfer to customer bank account post commissioning.',
      badge: 'PM Surya Ghar Ready'
    },
    {
      title: 'Zero Battery Maintenance & Top Efficiency',
      desc: 'Unlike off-grid systems, on-grid topology has no recurring battery replacement expenses. High inverter efficiency (>98.6%) ensures maximum generation.',
      badge: '>98.6% Conversion Efficiency'
    }
  ];

  benefits.forEach((b, idx) => {
    const colIndex = idx % 2;
    const rowIndex = Math.floor(idx / 2);
    const x = margin + colIndex * (cardW + 6);
    const y = curY + rowIndex * (cardH + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');

    doc.setFillColor(254, 243, 199);
    doc.roundedRect(x + 3, y + 3, 20, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.text(b.badge, x + 13, y + 6.5, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(b.title, x + 3, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const splitDesc = doc.splitTextToSize(b.desc, cardW - 6);
    doc.text(splitDesc, x + 3, y + 18);
  });

  curY += 2 * (cardH + 4) + 6;
  curY = drawSectionTitle('2. Environmental Impact & Green Energy Contribution', curY);

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Environmental Metric', 'Estimated Offset / Contribution', 'Equivalent Impact']],
    body: [
      ['CO2 Emission Mitigation', `~${(capacityKw * 1.3).toFixed(1)} Metric Tons / Year`, `Reduces ${(capacityKw * 32.5).toFixed(1)} MT carbon over 25 years`],
      ['Equivalent Trees Planted', `~${Math.round(capacityKw * 62)} Mature Trees`, 'Natural carbon sequestration equivalent'],
      ['Coal Consumption Conserved', `~${Math.round(capacityKw * 580)} kg Coal / Year`, 'Replaces fossil-fuel powered thermal energy generation'],
      ['Vehicular Miles Offset', `~${Math.round(capacityKw * 3100).toLocaleString('en-IN')} Passenger km / Year`, 'Equivalent to removing 1 passenger car off the road']
    ],
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [5, 150, 105], // Emerald green
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });

  // Sustainability Banner Card
  const greenY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin, greenY, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, greenY, contentWidth, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text('ACCELERATING CHHATTISGARH TOWARDS CLEAN ENERGY INDEPENDENCE', margin + 6, greenY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  const greenText = `By adopting Rejoy Solar's high-efficiency ${capacityKw} kW on-grid solar plant, you actively reduce state grid strain and thermal coal burning while creating measurable green savings. Your installation is fully compliant with CREDA and Ministry of New and Renewable Energy (MNRE) standards.`;
  doc.text(doc.splitTextToSize(greenText, contentWidth - 12), margin + 6, greenY + 13);

  drawFooter(2);

  // ==========================================
  // PAGE 3: HOW ON-GRID SOLAR WORKS
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('System Operating Principle & Energy Flow', 3);

  curY = 22;
  curY = drawSectionTitle('3. How a Solar On-Grid System Functions', curY);

  const steps = [
    {
      step: 'STEP 1',
      title: 'Solar PV Array Absorption',
      desc: 'High-efficiency mono-crystalline/bifacial solar panels absorb solar irradiance on rooftop and generate direct current (DC) electricity seamlessly during daylight hours.'
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
      desc: 'During nighttime or cloud cover, power is smoothly imported from grid. At the end of billing cycle, exported units offset imported units, leaving a nominal energy bill.'
    }
  ];

  steps.forEach(s => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, curY, contentWidth, 11, 1.2, 1.2, 'S');

    doc.setFillColor(217, 119, 6);
    doc.roundedRect(margin + 2, curY + 2, 14, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(s.step, margin + 9, curY + 6.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(s.title, margin + 19, curY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(s.desc, margin + 19, curY + 9);

    curY += 13;
  });

  // ========================================================
  // VISUAL GRAPHIC: SYSTEM ARCHITECTURE & INTERCONNECTION
  // ========================================================
  curY += 1;
  const diagCardH = 46;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, diagCardH, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, diagCardH, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('SYSTEM ARCHITECTURE & GRID INTERCONNECTION SCHEMATIC', margin + contentWidth / 2, curY + 5, { align: 'center' });

  // 4 Core Interconnected Nodes
  const nodeY = curY + 8;
  const nodeH = 24;
  const nodeW = (contentWidth - 28) / 4;
  const nodeGap = 6;

  const archNodes = [
    {
      title: 'Solar PV Array',
      sub: 'Waaree Bifacial PERC',
      tag: 'Sunlight to DC',
      badgeColor: [245, 158, 11],
      accent: [217, 119, 6]
    },
    {
      title: 'String Inverter',
      sub: 'Dual MPPT Conversion',
      tag: 'DC to AC 230/415V',
      badgeColor: [37, 99, 235],
      accent: [29, 78, 216]
    },
    {
      title: 'Premises Loads',
      sub: 'Internal Appliances',
      tag: 'Priority Supply',
      badgeColor: [16, 185, 129],
      accent: [5, 150, 105]
    },
    {
      title: 'CSPDCL Grid',
      sub: 'Bi-Directional Meter',
      tag: 'Net-Metering Sync',
      badgeColor: [100, 116, 139],
      accent: [71, 85, 105]
    }
  ];

  archNodes.forEach((node, i) => {
    const nx = margin + 5 + i * (nodeW + nodeGap);

    // Node Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(nx, nodeY, nodeW, nodeH, 1.5, 1.5, 'FD');

    // Header Color Accent
    doc.setFillColor(node.accent[0], node.accent[1], node.accent[2]);
    doc.roundedRect(nx, nodeY, nodeW, 4, 1.5, 1.5, 'F');
    doc.rect(nx, nodeY + 2.5, nodeW, 1.5, 'F');

    // Node Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(node.title, nx + nodeW / 2, nodeY + 8.5, { align: 'center' });

    // Node Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(node.sub, nx + nodeW / 2, nodeY + 13, { align: 'center' });

    // Tag Badge
    doc.setFillColor(node.badgeColor[0], node.badgeColor[1], node.badgeColor[2]);
    doc.roundedRect(nx + 3, nodeY + 16, nodeW - 6, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.setTextColor(255, 255, 255);
    doc.text(node.tag, nx + nodeW / 2, nodeY + 19.5, { align: 'center' });

    // Connecting Directional Arrows
    if (i < 3) {
      const ax = nx + nodeW + 0.5;
      const aw = nodeGap - 1;
      const ay = nodeY + nodeH / 2;

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.8);
      doc.line(ax, ay, ax + aw, ay);

      // Arrowhead
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.triangle(ax + aw, ay, ax + aw - 1.5, ay - 1.2, ax + aw - 1.5, ay + 1.2, 'F');

      // Bi-directional reverse indicator for Grid interaction
      if (i === 2) {
        doc.line(ax, ay + 2, ax + aw, ay + 2);
        doc.triangle(ax, ay + 2, ax + 1.5, ay + 0.8, ax + 1.5, ay + 3.2, 'F');
      }
    }
  });

  // Schematic Bottom Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('* Real-time synchronization guarantees instant transition between onsite solar generation and utility grid power with zero interruption.', margin + contentWidth / 2, curY + 38, { align: 'center' });
  doc.text('Bi-Directional Power Flow: Day-time surplus exports to CSPDCL Grid; Night-time consumption draws from Grid with 1:1 billing offset.', margin + contentWidth / 2, curY + 42, { align: 'center' });

  curY += diagCardH + 4;
  curY = drawSectionTitle('4. Why Choose Rejoy Solar Power Pvt. Ltd.', curY);

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Distinction', 'Rejoy Solar Engineering Edge', 'Client Value']],
    body: [
      ['CREDA Approved Grade-A', 'Officially empaneled EPC with Chhattisgarh State Renewable Energy Development Agency', '100% compliant subsidy clearance'],
      ['Tier-1 DCR PV Modules', 'Exclusively DCR Bifacial Dual-Glass Waaree modules with high temperature coefficient', 'Higher generation in Indian climate'],
      ['Certified Civil HDG Structures', 'Wind rated up to 150 km/h with 80-120 micron hot-dip galvanization', 'Zero roof damage, rust-proof 25 yrs'],
      ['Complete Liaisoning Service', 'End-to-end DISCOM approval, net meter testing, documentation and portal sanction', 'Hassle-free turnaround in 15-21 days'],
      ['Live IoT App Monitoring', 'Cloud WiFi remote monitoring via smartphone application for daily kWh generation', 'Instant performance transparency']
    ],
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 6.8,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });

  drawFooter(3);

  // ==========================================
  // PAGE 4: DETAILED TECHNICAL SPECIFICATIONS
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('Detailed Technical Specifications', 4);

  curY = 22;
  curY = drawSectionTitle('5. Comprehensive Technical Specifications & System Components', curY);

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['System Subsystem', 'Component Details & Technical Standards', 'Compliance / Standard']],
    body: [
      ['Solar PV Modules', `${quote.panelBrand || 'Waaree 545W'} DCR Bifacial Dual Glass Mono PERC Modules, 144 Half-cut cells, 21.5% Module Efficiency, IP68 Junction Box with bypass diodes`, 'IEC 61215, IEC 61730, BIS Approved, ALMM Listed'],
      ['Grid-Tied String Inverter', `${quote.inverterBrand || 'Waaree / Growatt'} High Efficiency String Inverter, Dual MPPT, >98.6% European Efficiency, IP65 Waterproof Enclosure, Integrated WiFi Monitoring Dongle`, 'IEC 61683, IEC 62109-1/2, IEEE 1547, VDE 0126'],
      ['Module Mounting Structure', 'Elevated HDG (Hot-Dip Galvanized 80-120 micron) Rooftop Structure, Pre-GI C-channel purlins, SS304 Hardware, Wind Velocity Rated up to 150 km/h, 7-9 Ft clearance', 'IS 2062, IS 4759, IS 875 Part 3 (Wind Speed Certified)'],
      ['DC Distribution Box (DCDB)', 'IP65 Polycarbonate Enclosure, 1000V DC Fuse Protection per string, Type-II Surge Protection Device (SPD), DC Isolator Switch', 'IEC 61439-1, DIN Rail Mounted'],
      ['AC Distribution Box (ACDB)', 'IP65 Weatherproof Enclosure, 4-Pole / 2-Pole AC MCB / MCCB with Type-II AC Surge Arrester, Phase Indicator Lamps', 'IS / IEC 60947-2, IS 13947'],
      ['Bi-Directional Net Meter', '3-Phase / 1-Phase Bi-Directional Net Metering Kit approved by CSPDCL / DISCOM, Optical Port, DLMS Protocol', 'IS 13779, IS 14697, CEA Metering Regulations'],
      ['Earthing & Surge Protection', 'Maintenance-free Chemical Earthing with Copper-bonded Electrodes & Backfill Compound (BFC), Copper/GI Flat Strips + Class-I Lightning Arrester', 'IS 3043 (Code of Practice for Earthing), IEEE 80'],
      ['Solar DC & AC Cabling', '1C x 4/6 sq.mm XLPO Electron Beam Cross-linked Solar DC Cable, UV Resistant, 2C/4C Armoured Aluminium/Copper AC Grid Cable', 'EN 50618 (TUV 2PfG 1169), IS 7098']
    ],
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 7.2,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 90 },
      2: { cellWidth: contentWidth - 135 }
    }
  });

  // Quality Standards Note
  const specNoteY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, specNoteY, contentWidth, 20, 2, 2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, specNoteY, contentWidth, 20, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('MANUFACTURING QUALITY & MNRE DCR COMPLIANCE', margin + 6, specNoteY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const qText = 'All solar components supplied by Rejoy Solar Power Private Limited strictly comply with ALMM (Approved List of Models and Manufacturers) and Domestic Content Requirement (DCR) protocols required for government subsidy disbursement. Tier-1 solar modules are tested against potential induced degradation (PID) and salt mist corrosion.';
  doc.text(doc.splitTextToSize(qText, contentWidth - 12), margin + 6, specNoteY + 11);

  drawFooter(4);

  // ==========================================
  // PAGE 5: BILL OF MATERIALS (BOM) & SERVICES
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('Bill of Materials & Scope of Work', 5);

  curY = 22;
  curY = drawSectionTitle('6. Bill of Materials (BOM) & Equipment Schedule', curY);

  const bomItems = quote.items && quote.items.length > 0 ? quote.items : [
    {
      id: '1',
      productName: `${quote.panelBrand || 'Waaree 545W'} DCR Bifacial Solar PV Modules`,
      make: 'Waaree Energies',
      specification: '545Wp DCR Bifacial Dual Glass Mono PERC 144 Half-cut cells',
      quantity: Math.ceil((capacityKw * 1000) / 545),
      unit: 'Nos',
      rate: 14500,
      amount: Math.ceil((capacityKw * 1000) / 545) * 14500
    },
    {
      id: '2',
      productName: `${capacityKw} kW Grid-Tie String Solar Inverter`,
      make: 'Waaree / Growatt',
      specification: `${capacityKw} kW String Inverter with Dual MPPT & Remote WiFi Monitoring`,
      quantity: 1,
      unit: 'No',
      rate: capacityKw >= 10 ? 78000 : capacityKw >= 5 ? 52000 : 34000,
      amount: capacityKw >= 10 ? 78000 : capacityKw >= 5 ? 52000 : 34000
    },
    {
      id: '3',
      productName: 'Integrated ACDB & DCDB Protection Enclosures',
      make: 'Havells / L&T',
      specification: 'IP65 Enclosure with 1000V DC SPD, Fuses, MCB/MCCB isolators',
      quantity: 1,
      unit: 'Pair',
      rate: 9500,
      amount: 9500
    },
    {
      id: '4',
      productName: 'Elevated Hot-Dip Galvanized Rooftop Structure',
      make: 'JSW / APL Apollo',
      specification: 'Pre-GI / HDG C-Channels (80-120 micron), 150 km/h wind rated, SS304 bolts',
      quantity: 1,
      unit: 'Set',
      rate: capacityKw >= 10 ? 72000 : capacityKw >= 5 ? 38000 : 22000,
      amount: capacityKw >= 10 ? 72000 : capacityKw >= 5 ? 38000 : 22000
    },
    {
      id: '5',
      productName: 'DISCOM / CSPDCL Bi-directional Net Meter',
      make: 'Genus / Secure',
      specification: 'Whole Current / CT Bi-directional Smart Net Meter approved by CSPDCL',
      quantity: 1,
      unit: 'No',
      rate: 8500,
      amount: 8500
    },
    {
      id: '6',
      productName: 'Chemical Earthing Electrodes & Lightning Arrester',
      make: 'True Power / Ashlok',
      specification: 'Copper-bonded chemical earth electrodes with BFC compound + Class-I LA',
      quantity: 1,
      unit: 'Set',
      rate: 7500,
      amount: 7500
    },
    {
      id: '7',
      productName: 'Solar DC XLPO Cables & Armoured AC Cables Lot',
      make: 'Polycab / KEI',
      specification: '1C x 4/6 sq.mm UV resistant Solar DC wire + 4-core AC grid power cable',
      quantity: 1,
      unit: 'Lot',
      rate: 16848,
      amount: 16848
    },
    {
      id: '8',
      productName: 'Balance of System: Conduits, MC4, Fasteners, Trays',
      make: 'Standard EPC Kit',
      specification: 'Heavy PVC conduits, UV ties, cable trays, anchor bolts, warning labels',
      quantity: 1,
      unit: 'Lot',
      rate: 6000,
      amount: 6000
    }
  ];

  const bomBody = bomItems.map((item, idx) => [
    (idx + 1).toString(),
    item.productName,
    item.make || 'Tier-1 Standard',
    item.specification || 'As per EPC design',
    item.quantity.toString(),
    item.unit || 'Nos',
    formatINR(item.rate),
    formatINR(item.amount)
  ]);

  const bomSubtotal = bomItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['S.No', 'Description of Goods', 'Make / Brand', 'Technical Specification', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)']],
    body: bomBody,
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 6.8,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 50 },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 17, halign: 'right' },
      7: { cellWidth: 17, halign: 'right', fontStyle: 'bold' }
    }
  });

  // BOM Total Summary Bar
  const bomTotalY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, bomTotalY, contentWidth, 10, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, bomTotalY, contentWidth, 10, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('TOTAL BILL OF MATERIALS (BOM) VALUE (EXCLUDING TAXES & SERVICES)', margin + 4, bomTotalY + 6.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text(formatINR(quote.bomSubtotal || bomSubtotal), pageWidth - margin - 4, bomTotalY + 6.5, { align: 'right' });

  // ========================================================
  // VISUAL GRAPHIC: TURNKEY SERVICES & EPC SCOPE
  // ========================================================
  const scopeY = bomTotalY + 12;
  drawSectionTitle('Scope of Engineering, Procurement & Commissioning (EPC)', scopeY);

  const turnkeyServices = [
    {
      title: '3D Shadow Profiling & Topography',
      desc: 'Comprehensive 3D shadow analysis, roof load assessment & civil inspection.'
    },
    {
      title: 'IS 875 Structural Design & Wind Safety',
      desc: 'Complete structural calculation certified for wind velocity up to 150 km/h.'
    },
    {
      title: 'Tier-1 Procurement & Safe Logistics',
      desc: 'Factory flash-tested DCR modules, inverters & balance of material delivered.'
    },
    {
      title: 'Elevated HDG Structure Erection',
      desc: 'Hot-dip galvanized (80-120u) mechanical assembly & SS304 anti-theft fasteners.'
    },
    {
      title: 'DC/AC Cabling & Protection Pits',
      desc: 'UV-resistant cross-linked solar DC cables, IP65 combiner boxes & chemical earthing.'
    },
    {
      title: 'CSPDCL / DISCOM Liaisoning',
      desc: 'End-to-end DISCOM net metering sanction, CEIG approval & test documentation.'
    },
    {
      title: 'Plant Testing & IoT WiFi Telemetry',
      desc: 'Insulation verification, inverter synchronization & smartphone cloud monitoring.'
    },
    {
      title: '5-Year Comprehensive O&M Warranty',
      desc: 'Preventive maintenance, scheduled module health checks & warranty support.'
    }
  ];

  const sCardW = (contentWidth - 6) / 2;
  const sCardH = 11.5;
  const sStartY = scopeY + 8;

  turnkeyServices.forEach((svc, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const sx = margin + col * (sCardW + 6);
    const sy = sStartY + row * (sCardH + 3);

    // Card background & border
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(sx, sy, sCardW, sCardH, 1.2, 1.2, 'FD');

    // Left Accent Pill
    doc.setFillColor(217, 119, 6);
    doc.roundedRect(sx, sy, 2.5, sCardH, 1, 1, 'F');

    // Checkmark Glyph Circle
    doc.setFillColor(236, 253, 245);
    doc.circle(sx + 6.5, sy + sCardH / 2, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(5, 150, 105);
    doc.text('✓', sx + 6.5, sy + sCardH / 2 + 2, { align: 'center' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(svc.title, sx + 12, sy + 4.5);

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(svc.desc, sx + 12, sy + 8.5);
  });

  // Notes & Client Scope Callout Card
  const notesY = sStartY + 4 * (sCardH + 3) + 3;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, notesY, contentWidth, 23, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, notesY, contentWidth, 23, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('CLIENT SCOPE & PROJECT NOTES:', margin + 4, notesY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const notesList = [
    '• Net Metering approval is subject to CSPDCL/DISCOM guidelines, transformer capacity, and sanctioned load.',
    '• Client to provide adequate shadow-free roof terrace and auxiliary single-phase power/water during construction.',
    '• All Balance of Material (BOM) items conform to IEC / BIS specifications with heavy-duty UV resistant conduits.',
    '• Elevated structure provides 7-9 Ft walkability clearance with zero slab puncture using chemical anchoring.'
  ];
  notesList.forEach((n, i) => {
    doc.text(n, margin + 4, notesY + 9 + i * 3.5);
  });

  drawFooter(5);

  // ==========================================
  // PAGE 6: COMMERCIAL PROPOSAL & FINANCIALS
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('Commercial Proposal & Financial Breakdown', 6);

  curY = 22;
  curY = drawSectionTitle('7. Commercial Price Schedule & Tax Structure', curY);

  const instCharges = quote.installationCharges || 20000;
  const transCharges = quote.transportationCharges || 5500;
  const otherCharges = quote.otherCharges || 0;
  const discount = quote.discountAmount || 0;

  const priceBreakdown = [
    ['1', 'Supply of Solar PV Modules, Inverter, Elevated Structure & Electrical BOS', formatINR(quote.bomSubtotal || bomSubtotal)],
    ['2', 'Transportation, Freight, Handling & Transit Insurance to Site', formatINR(transCharges)],
    ['3', 'Installation, Testing, Civil Grouting & Commissioning Services', formatINR(instCharges)],
    ['4', 'Liaisoning, CSPDCL Documentation & Net-Metering Synchronization Charges', 'Included in Turnkey EPC'],
    ['5', 'Gross Turnkey EPC Price before Discount & Taxes', formatINR(basePrice)],
    ['6', 'Special Promotional / Scheme Discount', discount > 0 ? `-${formatINR(discount)}` : 'Nil'],
    ['7', `GST on Equipment Portion (${eqPct}% of Base @ ${eqRate}% GST)`, formatINR(eqTax)],
    ['8', `GST on Services & Installation (${srvPct}% of Base @ ${srvRate}% GST)`, formatINR(srvTax)],
    ['9', 'TOTAL PROJECT VALUE (INCLUSIVE OF APPLICABLE GST)', formatINR(totalProjectCost)],
    ['10', 'Direct Central Government Subsidy (PM Surya Ghar Scheme)', `-${formatINR(centralSubsidy)}`],
    ['11', 'State Government Clean Energy Subsidy (If Applicable)', stateSubsidy > 0 ? `-${formatINR(stateSubsidy)}` : 'Nil'],
    ['12', 'NET EFFECTIVE PROJECT INVESTMENT (POST SUBSIDY DISBURSEMENT)', formatINR(finalInvestment)]
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Item', 'Description of Financial Head', 'Amount (INR)']],
    body: priceBreakdown,
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: contentWidth - 45 },
      2: { cellWidth: 33, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Highlight Grand Total and Net Investment Rows
      if (data.row.index === 8) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [180, 83, 9];
      }
      if (data.row.index === 11) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [5, 150, 105]; // Green
      }
    }
  });

  // Amount In Words Card
  const wordsY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, wordsY, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, wordsY, contentWidth, 12, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('TOTAL PROJECT AMOUNT IN WORDS:', margin + 4, wordsY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const words = quote.amountInWords || numberToIndianWords(totalProjectCost);
  doc.text(words, margin + 4, wordsY + 9);

  // ========================================================
  // VISUAL GRAPHIC: COMMERCIAL SUBSIDY WATERFALL BREAKDOWN
  // ========================================================
  const wfY = wordsY + 16;
  const wfH = 38;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, wfY, contentWidth, wfH, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, wfY, contentWidth, wfH, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('COMMERCIAL INVESTMENT & GOVT SUBSIDY FINANCIAL WATERFALL', margin + contentWidth / 2, wfY + 5, { align: 'center' });

  // 4 Waterfall Step Cards
  const wfCardY = wfY + 8;
  const wfCardH = 20;
  const wfGap = 5;
  const wfCardW = (contentWidth - 26) / 4;

  const totalSubsidyAmount = centralSubsidy + stateSubsidy;
  const subsidyPercent = totalProjectCost > 0 ? ((totalSubsidyAmount / totalProjectCost) * 100).toFixed(1) : '33.8';

  const wfSteps = [
    {
      label: 'Gross EPC Value',
      val: formatINR(totalProjectCost),
      sub: 'Supply + Installation',
      color: [15, 23, 42],
      tag: '100% Value'
    },
    {
      label: 'Central Govt DBT',
      val: `-${formatINR(centralSubsidy)}`,
      sub: 'PM Surya Ghar Portal',
      color: [5, 150, 105],
      tag: 'Direct Bank Transfer'
    },
    {
      label: 'State Govt Subsidy',
      val: stateSubsidy > 0 ? `-${formatINR(stateSubsidy)}` : 'Nil / Empaneled',
      sub: 'Chhattisgarh State',
      color: [13, 148, 136],
      tag: 'State Incentive'
    },
    {
      label: 'Net Client Payable',
      val: formatINR(finalInvestment),
      sub: 'Effective Out-of-Pocket',
      color: [217, 119, 6],
      tag: 'Final Investment'
    }
  ];

  wfSteps.forEach((s, idx) => {
    const sx = margin + 5 + idx * (wfCardW + wfGap);

    // Card Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(sx, wfCardY, wfCardW, wfCardH, 1.5, 1.5, 'FD');

    // Header Accent Strip
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.roundedRect(sx, wfCardY, wfCardW, 3.5, 1.5, 1.5, 'F');
    doc.rect(sx, wfCardY + 2, wfCardW, 1.5, 'F');

    // Step Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(s.label, sx + wfCardW / 2, wfCardY + 7.5, { align: 'center' });

    // Step Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(s.color[0], s.color[1], s.color[2]);
    doc.text(s.val, sx + wfCardW / 2, wfCardY + 12.5, { align: 'center' });

    // Tag Pill
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(sx + 2.5, wfCardY + 14.5, wfCardW - 5, 4.2, 0.8, 0.8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(s.tag, sx + wfCardW / 2, wfCardY + 17.5, { align: 'center' });

    // Connecting Arrow
    if (idx < 3) {
      const ax = sx + wfCardW + 0.5;
      const aw = wfGap - 1;
      const ay = wfCardY + wfCardH / 2;

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.8);
      doc.line(ax, ay, ax + aw, ay);
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.triangle(ax + aw, ay, ax + aw - 1.2, ay - 1, ax + aw - 1.2, ay + 1, 'F');
    }
  });

  // Highlight Ribbon at bottom of waterfall
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin + 5, wfY + 30.5, contentWidth - 10, 5.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(5, 150, 105);
  doc.text(`TOTAL GOVT SUBSIDY RELIEF: ${formatINR(totalSubsidyAmount)} (${subsidyPercent}% EFFECTIVE DISCOUNT ON GROSS VALUE)`, margin + contentWidth / 2, wfY + 34.2, { align: 'center' });

  // Subsidy Mechanism Guidance Card
  const subY = wfY + wfH + 4;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin, subY, contentWidth, 23, 1.5, 1.5, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, subY, contentWidth, 23, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('PM SURYA GHAR MUFT BIJLI YOJANA SUBSIDY DISBURSEMENT PROCESS', margin + 6, subY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  const subText = `The central government DBT subsidy of ${formatINR(centralSubsidy)} is directly transferred into the customer's bank account via the National Portal (pmsuryaghar.gov.in) post net-meter installation and DISCOM inspection. Rejoy Solar takes full responsibility for registration, document submission, portal uploading, and approval verification.`;
  doc.text(doc.splitTextToSize(subText, contentWidth - 12), margin + 6, subY + 10);

  drawFooter(6);

  // ==========================================
  // PAGE 7: 25-YEAR GENERATION & FINANCIAL ROI
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('25-Year Generation & Financial Returns', 7);

  curY = 22;
  curY = drawSectionTitle('8. 25-Year Estimated Generation & Return on Investment (ROI)', curY);

  // Financial Highlights Bar
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 18, 2, 2, 'S');

  const roiMetrics = [
    { label: 'ANNUAL GENERATION', val: `~${annualUnits.toLocaleString('en-IN')} kWh` },
    { label: '1ST YR SAVINGS', val: formatINR(annualSavings) },
    { label: 'PAYBACK PERIOD', val: `~${paybackYears} Years` },
    { label: '25-YR NET SAVINGS', val: formatINR(lifetimeSavings) }
  ];

  const rW = contentWidth / 4;
  roiMetrics.forEach((m, idx) => {
    const rx = margin + idx * rW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(m.label, rx + rW / 2, curY + 5.5, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.text(m.val, rx + rW / 2, curY + 12, { align: 'center' });

    if (idx < 3) {
      doc.setDrawColor(226, 232, 240);
      doc.line(rx + rW, curY + 3, rx + rW, curY + 14);
    }
  });

  // ========================================================
  // VISUAL GRAPHIC: 25-YEAR CUMULATIVE SAVINGS & ROI CHART
  // ========================================================
  const chartY = curY + 18;
  const chartH = 46;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, chartY, contentWidth, chartH, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, chartY, contentWidth, chartH, 2, 2, 'S');

  // Chart Title & Legend
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('25-YEAR CUMULATIVE FINANCIAL SAVINGS & PV OUTPUT GUARANTEE', margin + 4, chartY + 5);

  // Legend
  doc.setFillColor(5, 150, 105);
  doc.rect(pageWidth - margin - 68, chartY + 2.5, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Cumulative Savings (₹)', pageWidth - margin - 63, chartY + 5);

  doc.setFillColor(217, 119, 6);
  doc.circle(pageWidth - margin - 22, chartY + 4, 1.2, 'F');
  doc.text('PV Output (%)', pageWidth - margin - 19, chartY + 5);

  // Plot Area
  const plotLeft = margin + 14;
  const plotRight = pageWidth - margin - 14;
  const plotTop = chartY + 9;
  const plotBottom = chartY + 38;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  // Horizontal Grid Lines & Y-Axis Labels
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);

  const yTicks = [
    { frac: 0.0, leftVal: '₹20L', rightVal: '100%' },
    { frac: 0.25, leftVal: '₹15L', rightVal: '95%' },
    { frac: 0.5, leftVal: '₹10L', rightVal: '90%' },
    { frac: 0.75, leftVal: '₹5L', rightVal: '85%' },
    { frac: 1.0, leftVal: '₹0', rightVal: '80%' }
  ];

  yTicks.forEach(t => {
    const gy = plotTop + t.frac * plotHeight;
    doc.line(plotLeft, gy, plotRight, gy);
    doc.text(t.leftVal, plotLeft - 2, gy + 1, { align: 'right' });
    doc.text(t.rightVal, plotRight + 2, gy + 1, { align: 'left' });
  });

  // 7 Milestone Data Points (Year 1, 3, 5, 10, 15, 20, 25)
  const chartData = [
    { yr: 'Yr 1', savVal: Math.round(annualSavings), savLabel: formatINR(annualSavings), frac: 0.05, degFrac: 0.0 },
    { yr: 'Yr 3', savVal: Math.round(annualSavings * 3.1), savLabel: formatINR(Math.round(annualSavings * 3.1)), frac: 0.16, degFrac: 0.06, payback: true },
    { yr: 'Yr 5', savVal: Math.round(annualSavings * 5.4), savLabel: formatINR(Math.round(annualSavings * 5.4)), frac: 0.27, degFrac: 0.12 },
    { yr: 'Yr 10', savVal: Math.round(annualSavings * 12.2), savLabel: formatINR(Math.round(annualSavings * 12.2)), frac: 0.48, degFrac: 0.25 },
    { yr: 'Yr 15', savVal: Math.round(annualSavings * 20.6), savLabel: formatINR(Math.round(annualSavings * 20.6)), frac: 0.68, degFrac: 0.38 },
    { yr: 'Yr 20', savVal: Math.round(annualSavings * 31.0), savLabel: formatINR(Math.round(annualSavings * 31.0)), frac: 0.85, degFrac: 0.52 },
    { yr: 'Yr 25', savVal: lifetimeSavings, savLabel: formatINR(lifetimeSavings), frac: 1.0, degFrac: 0.72 }
  ];

  const colStep = plotWidth / chartData.length;
  const barW = colStep * 0.45;

  // Draw Bars
  chartData.forEach((d, i) => {
    const cx = plotLeft + i * colStep + colStep / 2;
    const barH = d.frac * (plotHeight - 4);
    const by = plotBottom - barH;

    // Bar rectangle
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(cx - barW / 2, by, barW, barH, 0.8, 0.8, 'F');

    // Bar Value Label on Top
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.setTextColor(5, 150, 105);
    doc.text(d.savLabel, cx, by - 1.2, { align: 'center' });

    // X-Axis Year Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(d.yr, cx, plotBottom + 3.2, { align: 'center' });

    // Payback Callout Badge at Year 3
    if (d.payback) {
      doc.setFillColor(217, 119, 6);
      doc.roundedRect(cx - 11, by - 5.5, 22, 3.5, 0.8, 0.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.2);
      doc.setTextColor(255, 255, 255);
      doc.text('★ PAYBACK (~3 YRS)', cx, by - 3, { align: 'center' });
    }
  });

  // Draw Degradation Curve Line Across Points
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  chartData.forEach((d, i) => {
    const cx = plotLeft + i * colStep + colStep / 2;
    const py = plotTop + d.degFrac * (plotHeight * 0.75);

    if (i < chartData.length - 1) {
      const nextD = chartData[i + 1];
      const nextX = plotLeft + (i + 1) * colStep + colStep / 2;
      const nextY = plotTop + nextD.degFrac * (plotHeight * 0.75);
      doc.line(cx, py, nextX, nextY);
    }

    // Node Circle
    doc.setFillColor(217, 119, 6);
    doc.circle(cx, py, 1, 'F');
  });

  curY = chartY + chartH + 4;

  // 25-Year Cumulative Financial Table
  const years = [1, 2, 3, 4, 5, 10, 15, 20, 25];
  const roiBody: string[][] = [];
  let cumSavings = 0;

  years.forEach(yr => {
    const degFactor = Math.pow(0.994, yr - 1); // 0.6% degradation per year
    const yrUnits = Math.round(annualUnits * degFactor);
    const tariff = (7.5 * Math.pow(1.03, yr - 1)).toFixed(2); // 3% annual tariff hike
    const yrSav = Math.round(yrUnits * parseFloat(tariff));
    cumSavings += (yr === 10 ? yrSav * 5 : yr === 15 ? yrSav * 5 : yr === 20 ? yrSav * 5 : yr === 25 ? yrSav * 5 : yrSav);

    roiBody.push([
      `Year ${yr}`,
      `${(degFactor * 100).toFixed(1)}%`,
      `${yrUnits.toLocaleString('en-IN')} kWh`,
      `INR ${tariff} / unit`,
      formatINR(yrSav),
      formatINR(cumSavings)
    ]);
  });

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Timeline', 'Performance Efficiency', 'Est. Power Output', 'Electricity Tariff', 'Annual Cost Savings', 'Cumulative Net Savings']],
    body: roiBody,
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 6.8,
      cellPadding: 1.6,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }
    }
  });

  // Long-Term Investment Return Note
  const roiNoteY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, roiNoteY, contentWidth, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('KEY ASSUMPTIONS IN FINANCIAL PROJECTIONS:', margin + 4, roiNoteY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const assumptions = [
    '1. System yields ~4.2 daily sunshine peak hours in Chhattisgarh geographic climate zone.',
    '2. Linear PV degradation factored at 0.6% annually as guaranteed by Tier-1 manufacturer warranty.',
    '3. Base electricity tariff modeled at INR 7.50/unit with a modest conservative 3% annual grid tariff inflation.',
    '4. Clean energy yields 100% self-consumed or compensated through CSPDCL bi-directional net metering protocol.'
  ];
  assumptions.forEach((a, i) => {
    doc.text(a, margin + 4, roiNoteY + 10.5 + i * 3);
  });

  drawFooter(7);

  // ==========================================
  // PAGE 8: ELEVATED STRUCTURE & 3D DESIGN
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('Technical Architecture & Elevated Structure', 8);

  curY = 22;
  curY = drawSectionTitle('9. Rooftop Structure Design & Safety Engineering', curY);

  const structCards = [
    {
      title: 'Elevated High-Clearance Rooftop Structure',
      desc: 'Engineered with 7 to 9 feet vertical clearance above terrace slab. Ensures 100% unrestricted rooftop terrace utilization for social events, clothes drying, and unobstructed water tank access.',
      spec: '7 - 9 Ft Clear Headroom'
    },
    {
      title: 'Hot-Dip Galvanized (HDG) Anti-Corrosion Coating',
      desc: 'Structural steel components hot-dip galvanized with 80-120 micron zinc coating as per IS 4759 standards. Resists rust and chemical weathering for over 25 years without repainting.',
      spec: '80 - 120 Micron Zinc Coating'
    },
    {
      title: '150 km/h Wind Aerodynamic Rating',
      desc: 'Structure designed and certified to endure severe cyclones and wind speeds up to 150 km/h in accordance with IS 875 Part 3 wind loading civil codes. Reinforced diagonal cross bracing.',
      spec: 'IS 875 Part 3 Certified'
    },
    {
      title: 'Leak-Proof Chemical Fastening & Grouting',
      desc: 'Heavy duty RCC base plates secured using chemical anchor fasteners and waterproofing seals. Zero puncturing or leakage into living areas beneath the terrace slab.',
      spec: '100% Leak-Proof Grouting'
    }
  ];

  structCards.forEach((sc, idx) => {
    const colIndex = idx % 2;
    const rowIndex = Math.floor(idx / 2);
    const x = margin + colIndex * (cardW + 6);
    const y = curY + rowIndex * (cardH + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');

    doc.setFillColor(254, 243, 199);
    doc.roundedRect(x + 3, y + 3, 28, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.text(sc.spec, x + 17, y + 6.5, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(sc.title, x + 3, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const splitDesc = doc.splitTextToSize(sc.desc, cardW - 6);
    doc.text(splitDesc, x + 3, y + 18);
  });

  curY += 2 * (cardH + 4) + 6;

  // VISUAL GRAPHIC: Elevated Rooftop Mounting Structure Schematic
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, 54, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, 54, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('ELEVATED ROOFTOP MOUNTING STRUCTURE ENGINEERING SCHEMATIC', margin + contentWidth / 2, curY + 6, { align: 'center' });

  // Technical vector drawing of elevated structure
  const diagY = curY + 12;

  // 1. Rooftop Concrete Slab
  doc.setFillColor(226, 232, 240);
  doc.rect(margin + 20, diagY + 34, contentWidth - 40, 4, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 20, diagY + 34, margin + contentWidth - 20, diagY + 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TERRACE RCC SLAB WITH WATERPROOF SEALING', margin + contentWidth / 2, diagY + 37, { align: 'center' });

  // 2. Base Grout Plates
  doc.setFillColor(15, 23, 42);
  doc.rect(margin + 35, diagY + 32, 10, 2, 'F');
  doc.rect(margin + contentWidth - 45, diagY + 32, 10, 2, 'F');

  // 3. Vertical Columns (Pillars)
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(1.2);
  // Left Pillar (Back, taller: ~26mm)
  doc.line(margin + 40, diagY + 32, margin + 40, diagY + 8);
  // Right Pillar (Front, slightly shorter for tilt: ~22mm)
  doc.line(margin + contentWidth - 40, diagY + 32, margin + contentWidth - 40, diagY + 14);

  // 4. Cross Bracing
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.6);
  doc.line(margin + 40, diagY + 30, margin + contentWidth - 40, diagY + 15);
  doc.line(margin + 40, diagY + 10, margin + contentWidth - 40, diagY + 30);

  // 5. Tilted Solar PV Modules Rafter
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.6);
  doc.line(margin + 30, diagY + 5, margin + contentWidth - 30, diagY + 13);

  // Solar Panels Clamped
  doc.setFillColor(30, 58, 138); // Deep blue panels
  doc.roundedRect(margin + 35, diagY + 3, (contentWidth - 70) / 2 - 2, 4, 0.5, 0.5, 'F');
  doc.roundedRect(margin + 35 + (contentWidth - 70) / 2 + 2, diagY + 6.5, (contentWidth - 70) / 2 - 2, 4, 0.5, 0.5, 'F');

  // Callouts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(217, 119, 6);
  doc.text('Waaree Bifacial Dual-Glass PV Modules (12-15 Degree South Tilt)', margin + contentWidth / 2, diagY + 2, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text('7 - 9 Ft Clear Usable Terrace Space', margin + contentWidth / 2, diagY + 22, { align: 'center' });
  doc.text('<- Hot-Dip Galvanized Pillars (80-120u) ->', margin + contentWidth / 2, diagY + 26, { align: 'center' });

  drawFooter(8);

  // ==========================================
  // PAGE 9: TERMS & CONDITIONS & PAYMENT MILESTONES
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('Terms, Conditions & Payment Schedule', 9);

  curY = 22;
  curY = drawSectionTitle('10. Milestone Payment Schedule', curY);

  const milestones = quote.paymentMilestones && quote.paymentMilestones.length > 0
    ? quote.paymentMilestones
    : [
      { id: '1', title: '10% Advance / Token', percentage: 10, amount: Math.round(totalProjectCost * 0.1), description: 'Upon signing of purchase order & contract execution' },
      { id: '2', title: '70% Material Delivery', percentage: 70, amount: Math.round(totalProjectCost * 0.7), description: 'On delivery of PV modules and inverter at site' },
      { id: '3', title: '18% Installation Completion', percentage: 18, amount: Math.round(totalProjectCost * 0.18), description: 'On structural mounting & solar panel wiring' },
      { id: '4', title: '2% Grid Synchronization', percentage: 2, amount: Math.round(totalProjectCost * 0.02), description: 'On net-metering synchronization & final commissioning' }
    ];

  const milestoneBody = milestones.map(m => [
    m.title,
    `${m.percentage}%`,
    formatINR(m.amount),
    m.description
  ]);

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Milestone Stage', 'Percentage', 'Amount (INR)', 'Trigger Event & Deliverables']],
    body: milestoneBody,
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 7.2,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: contentWidth - 85 }
    }
  });

  curY = (doc as any).lastAutoTable.finalY + 8;
  curY = drawSectionTitle('11. General Terms & Scope of Work Matrix', curY);

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Responsibility Head', 'Scope of EPC Contractor (Rejoy Solar)', 'Scope of Customer / Client']],
    body: [
      ['Rooftop Access & Civil', 'Structural design, elevated HDG fabrication, civil anchoring, module clamping, clean terrace handover.', 'Unobstructed roof access, shadow-free terrace area, water supply for cleaning modules.'],
      ['Electrical & Grid Interconnection', 'Supply of DC/AC cables, ACDB/DCDB, inverter installation, chemical earthing, connection to main LT panel.', 'Adequate sanctioned load with DISCOM (CSPDCL), LT distribution board access.'],
      ['Permits & Net Metering', 'Application filing, liaisoning with DISCOM, test report submission, inspection coordination, net meter installation.', 'Electricity consumer number (BP Number), ownership proof / electricity bills, KYC documents.'],
      ['Project Timeline & Handover', 'System delivery in 1-2 weeks; installation completed in 3-5 days; net-meter synchronization per DISCOM schedule.', 'Timely release of payment milestone tranches as outlined in contract schedule.']
    ],
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 7,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: (contentWidth - 35) / 2 },
      2: { cellWidth: (contentWidth - 35) / 2 }
    }
  });

  drawFooter(9);

  // ==========================================
  // PAGE 10: WARRANTIES, BANKING & ACCEPTANCE
  // ==========================================
  doc.addPage();
  drawWatermark();
  drawHeader('Warranties, Banking & Client Acceptance', 10);

  curY = 22;
  curY = drawSectionTitle('12. Comprehensive Warranty Schedule', curY);

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Component', 'Warranty Duration', 'Warranty Scope & Performance Commitment']],
    body: [
      ['Solar PV Modules', '10-12 Years Product / 25-30 Years Linear Output', 'Guaranteed >90% power generation in first 10 years and >80% power output up to 25 years.'],
      ['Solar Grid Inverter', '5 - 10 Years Comprehensive Replacement', 'Free replacement / repair of faulty internal electronics, MPPT components, and WiFi modules.'],
      ['Mounting Structure', '10 Years Structural & Galvanizing Warranty', 'Protected against rust, corrosion, weld breakage, and mechanical wind failure.'],
      ['EPC Workmanship', '5 Years Comprehensive O&M Support', 'Complete system support including DC/AC connectors, earthing resistance, and periodic health checks.']
    ],
    styles: {
      fillColor: false,
      textColor: [15, 23, 42],
      fontSize: 7.2,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 42, fontStyle: 'bold', textColor: [180, 83, 9] },
      2: { cellWidth: contentWidth - 77 }
    }
  });

  curY = (doc as any).lastAutoTable.finalY + 8;
  curY = drawSectionTitle('13. Official Banking Details for Payments', curY);

  // Banking Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('ACCOUNT NAME:', margin + 6, curY + 6);
  doc.text('BANK NAME:', margin + 6, curY + 11.5);
  doc.text('ACCOUNT NUMBER:', margin + 6, curY + 17);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('REJOY SOLAR POWER PRIVATE LIMITED', margin + 35, curY + 6);
  doc.text('ICICI Bank / HDFC Bank Limited', margin + 35, curY + 11.5);
  doc.text('50200088991234 (Current Account)', margin + 35, curY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('IFSC CODE:', margin + 105, curY + 6);
  doc.text('BRANCH:', margin + 105, curY + 11.5);
  doc.text('UPI ID:', margin + 105, curY + 17);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('HDFC0001234 / ICIC0000123', margin + 125, curY + 6);
  doc.text('Civic Centre, Bhilai, Chhattisgarh', margin + 125, curY + 11.5);
  doc.text('rejoysolarpower@icici', margin + 125, curY + 17);

  curY += 28;
  curY = drawSectionTitle('14. Contract Execution & Customer Acceptance', curY);

  // Dual Signature Blocks
  const sigW = (contentWidth - 6) / 2;
  const sigH = 46;

  // Contractor Sign Box with Official Stamp Graphic
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, sigW, sigH, 2, 2, 'S');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, curY, sigW, 6.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('FOR REJOY SOLAR POWER PRIVATE LIMITED', margin + 4, curY + 4.5);

  // Contractor Signature Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin + 4, curY + 28, margin + sigW - 6, curY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Authorized Signatory', margin + 4, curY + 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Designation: Commercial EPC Manager', margin + 4, curY + 40);
  doc.text(`Date of Issuance: ${quote.quotationDate || quote.createdAt}`, margin + 4, curY + 44);

  // Customer Acceptance Sign Box
  const custSigX = margin + sigW + 6;
  doc.roundedRect(custSigX, curY, sigW, sigH, 2, 2, 'S');

  doc.setFillColor(254, 243, 199);
  doc.roundedRect(custSigX, curY, sigW, 6.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('CLIENT PURCHASE ORDER CONFIRMATION', custSigX + 4, curY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('I/We hereby accept the technical scope, pricing and milestone terms.', custSigX + 4, curY + 12);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(custSigX + 4, curY + 28, custSigX + sigW - 6, curY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(quote.customerName || 'Customer Signature & Stamp', custSigX + 4, curY + 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Authorized Client Signatory / Property Owner', custSigX + 4, curY + 40);
  doc.text('Date of Acceptance: ____________________', custSigX + 4, curY + 44);

  drawFooter(10);

  // Apply consistent canvas-based / GState semi-transparent watermark overlay across all 10 pages
  applyWatermarkOverlayToDoc(doc, WATERMARK_TEXT);

  // Trigger download with sanitized filename matching reference: <customer>_<systemType>_<capacity>kW_<quoteNumber>.pdf
  const sanitizedCustomer = (quote.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedSystemType = (systemType || 'OnGrid').replace(/[^a-zA-Z0-9]/g, '');
  const sanitizedQuoteNumber = (quote.quotationNumber || 'QTN').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${sanitizedCustomer}_${sanitizedSystemType}_${capacityKw}kW_${sanitizedQuoteNumber}.pdf`;

  try {
    doc.save(filename);
  } catch {
    // In node test environments, doc.save may not find browser DOM
  }
  return doc;
}
