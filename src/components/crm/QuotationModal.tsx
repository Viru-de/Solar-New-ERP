import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  Building2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Package,
  PackagePlus,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  CheckCircle2,
  Zap,
  SlidersHorizontal,
  ClipboardCopy,
  Info
} from 'lucide-react';
import { Customer, Quotation, QuotationItem, QuotationPaymentMilestone, ProductItem } from '../../types/solar';
import { numberToIndianWords, formatINR } from '../../utils/indianNumberWords';
import {
  REFERENCE_5KW_BOM,
  REFERENCE_3KW_BOM,
  REFERENCE_10KW_BOM,
  BOM_PRESET_TEMPLATES,
  DEFAULT_PAYMENT_MILESTONES
} from '../../utils/quotationDefaults';
import { storageService } from '../../services/storage';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quotation: Quotation, previewNow?: boolean) => void;
  editQuotation?: Quotation | null;
  customers: Customer[];
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editQuotation,
  customers
}) => {
  // Active Form Section Tab
  const [activeTab, setActiveTab] = useState<'details' | 'bom' | 'cost' | 'milestones'>('details');

  // Customer & System State
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [siteAddress, setSiteAddress] = useState<string>('');
  const [city, setCity] = useState<string>('Raipur, Chhattisgarh');
  const [customerGst, setCustomerGst] = useState<string>('');

  const [quotationNumber, setQuotationNumber] = useState<string>('');
  const [quotationDate, setQuotationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState<number>(15);
  const [status, setStatus] = useState<Quotation['status']>('DRAFT');

  // System Technical Details
  const [capacityKw, setCapacityKw] = useState<number>(5);
  const [systemType, setSystemType] = useState<'On-Grid' | 'Off-Grid' | 'Hybrid'>('On-Grid');
  const [panelType, setPanelType] = useState<string>('DCR Bifacial Mono PERC');
  const [panelBrand, setPanelBrand] = useState<string>('Waaree 545W');
  const [inverterBrand, setInverterBrand] = useState<string>('Waaree 5KW 3PH Grid Tie');
  const [structureType, setStructureType] = useState<string>('Elevated Rooftop HDG / Pre-GI Structure');

  // Dynamic Bill of Materials (BOM)
  const [items, setItems] = useState<QuotationItem[]>([]);

  // Inventory / Product Catalog Picker State
  const [isInventoryPickerOpen, setIsInventoryPickerOpen] = useState<boolean>(false);
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('ALL');
  const [inventoryQtyMap, setInventoryQtyMap] = useState<Record<string, number>>({});

  // In-table BOM search & filter state
  const [bomCategoryFilter, setBomCategoryFilter] = useState<string>('ALL');
  const [bomSearchQuery, setBomSearchQuery] = useState<string>('');
  const [bomFeedback, setBomFeedback] = useState<string | null>(null);
  const [copiedBom, setCopiedBom] = useState<boolean>(false);

  // Commercial Charges & Discounts
  const [installationCharges, setInstallationCharges] = useState<number>(20000);
  const [transportationCharges, setTransportationCharges] = useState<number>(5500);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Dynamic GST Configuration
  const [gstEquipmentPercent, setGstEquipmentPercent] = useState<number>(70);
  const [gstEquipmentRate, setGstEquipmentRate] = useState<number>(5);
  const [gstServicesPercent, setGstServicesPercent] = useState<number>(30);
  const [gstServicesRate, setGstServicesRate] = useState<number>(18);

  // Subsidies
  const [centralSubsidy, setCentralSubsidy] = useState<number>(78000);
  const [stateSubsidy, setStateSubsidy] = useState<number>(30000);

  // Payment Milestones
  const [milestones, setMilestones] = useState<QuotationPaymentMilestone[]>(DEFAULT_PAYMENT_MILESTONES);

  // Populate or Reset form on Open
  useEffect(() => {
    if (!isOpen) return;

    if (editQuotation) {
      setCustomerId(editQuotation.customerId || '');
      setCustomerName(editQuotation.customerName || '');
      setCompanyName(editQuotation.companyName || '');
      setCustomerPhone(editQuotation.customerPhone || '');
      setCustomerEmail(editQuotation.customerEmail || '');
      setSiteAddress(editQuotation.siteAddress || '');
      setCity(editQuotation.city || 'Raipur, Chhattisgarh');
      setCustomerGst(editQuotation.customerGst || '');

      setQuotationNumber(editQuotation.quotationNumber || storageService.getNextQuotationNumber());
      setQuotationDate(editQuotation.quotationDate || editQuotation.createdAt || new Date().toISOString().split('T')[0]);
      setValidityDays(editQuotation.validityDays || 15);
      setStatus(editQuotation.status || 'DRAFT');

      setCapacityKw(editQuotation.capacityKw || 5);
      setSystemType(editQuotation.systemType || 'On-Grid');
      setPanelType(editQuotation.panelType || 'DCR Bifacial Mono PERC');
      setPanelBrand(editQuotation.panelBrand || 'Waaree 545W');
      setInverterBrand(editQuotation.inverterBrand || 'Waaree 5KW 3PH Grid Tie');
      setStructureType(editQuotation.structureType || 'Elevated Rooftop HDG / Pre-GI Structure');

      setItems(editQuotation.items && editQuotation.items.length > 0 ? editQuotation.items : REFERENCE_5KW_BOM);
      setInstallationCharges(editQuotation.installationCharges !== undefined ? editQuotation.installationCharges : 20000);
      setTransportationCharges(editQuotation.transportationCharges !== undefined ? editQuotation.transportationCharges : 5500);
      setOtherCharges(editQuotation.otherCharges || 0);
      setDiscountAmount(editQuotation.discountAmount || 0);

      setGstEquipmentPercent(editQuotation.gstEquipmentPercent || 70);
      setGstEquipmentRate(editQuotation.gstEquipmentRate || 5);
      setGstServicesPercent(editQuotation.gstServicesPercent || 30);
      setGstServicesRate(editQuotation.gstServicesRate || 18);

      setCentralSubsidy(editQuotation.centralSubsidy !== undefined ? editQuotation.centralSubsidy : 78000);
      setStateSubsidy(editQuotation.stateSubsidy !== undefined ? editQuotation.stateSubsidy : 30000);

      setMilestones(editQuotation.paymentMilestones && editQuotation.paymentMilestones.length > 0
        ? editQuotation.paymentMilestones
        : DEFAULT_PAYMENT_MILESTONES);
    } else {
      // New Quotation defaults
      const nextNum = storageService.getNextQuotationNumber();
      setQuotationNumber(nextNum);
      setQuotationDate(new Date().toISOString().split('T')[0]);
      setValidityDays(15);
      setStatus('DRAFT');
      setCapacityKw(5);
      setSystemType('On-Grid');
      setPanelType('DCR Bifacial Mono PERC');
      setPanelBrand('Waaree 545W');
      setInverterBrand('Waaree 5KW 3PH Grid Tie');
      setStructureType('Elevated Rooftop HDG / Pre-GI Structure');

      // Pre-populate with first customer if available
      if (customers.length > 0) {
        const firstCust = customers[0];
        setCustomerId(firstCust.id);
        setCustomerName(firstCust.name);
        setCompanyName(firstCust.companyName || '');
        setCustomerPhone(firstCust.phone || '');
        setCustomerEmail(firstCust.email || '');
        setSiteAddress(firstCust.siteAddress || '');
        setCity(firstCust.city || 'Raipur, Chhattisgarh');
        setCustomerGst(firstCust.gstNumber || '');
      } else {
        setCustomerId('');
        setCustomerName('');
        setCompanyName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setSiteAddress('');
        setCity('Raipur, Chhattisgarh');
        setCustomerGst('');
      }

      setItems(REFERENCE_5KW_BOM);
      setInstallationCharges(20000);
      setTransportationCharges(5500);
      setOtherCharges(0);
      setDiscountAmount(0);
      setGstEquipmentPercent(70);
      setGstEquipmentRate(5);
      setGstServicesPercent(30);
      setGstServicesRate(18);
      setCentralSubsidy(78000);
      setStateSubsidy(30000);
      setMilestones(DEFAULT_PAYMENT_MILESTONES);
    }
  }, [isOpen, editQuotation, customers]);

  // Handle Customer Selection Dropdown
  const handleSelectCustomer = (selectedId: string) => {
    setCustomerId(selectedId);
    const matched = customers.find(c => c.id === selectedId);
    if (matched) {
      setCustomerName(matched.name);
      setCompanyName(matched.companyName || '');
      setCustomerPhone(matched.phone || '');
      setCustomerEmail(matched.email || '');
      setSiteAddress(matched.siteAddress || '');
      setCity(matched.city || 'Raipur, Chhattisgarh');
      setCustomerGst(matched.gstNumber || '');
    }
  };

  // Available Products from Warehouse / Inventory
  const availableProducts = useMemo(() => {
    return storageService.getProducts();
  }, [isOpen]);

  // BOM Item Manipulations
  const handleAddItem = (initialCategory: QuotationItem['category'] = 'Other') => {
    const newItem: QuotationItem = {
      id: `bom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productName: '',
      make: '',
      specification: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      category: initialCategory
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          const q = field === 'quantity' ? Number(value) : item.quantity;
          const r = field === 'rate' ? Number(value) : item.rate;
          updated.amount = Math.round((q || 0) * (r || 0));
        }
        return updated;
      }
      return item;
    }));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleDuplicateItem = (id: string) => {
    const idx = items.findIndex(it => it.id === id);
    if (idx < 0) return;
    const orig = items[idx];
    const duplicate: QuotationItem = {
      ...orig,
      id: `bom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productName: `${orig.productName} (Copy)`
    };
    const next = [...items];
    next.splice(idx + 1, 0, duplicate);
    setItems(next);
    setBomFeedback(`Duplicated "${orig.productName}"`);
    setTimeout(() => setBomFeedback(null), 3000);
  };

  const handleMoveItem = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const temp = next[currentIndex];
    next[currentIndex] = next[targetIndex];
    next[targetIndex] = temp;
    setItems(next);
  };

  const handleAddProductFromInventory = (product: ProductItem, qty: number = 1) => {
    let cat: QuotationItem['category'] = 'Other';
    const c = (product.category || '').toLowerCase();
    if (c.includes('panel') || c.includes('module')) cat = 'Panels';
    else if (c.includes('inverter')) cat = 'Inverter';
    else if (c.includes('structure')) cat = 'Structure';
    else if (c.includes('cable') || c.includes('electrical') || c.includes('box')) cat = 'Electrical';
    else if (c.includes('meter')) cat = 'Net Metering';
    else if (c.includes('civil')) cat = 'Civil Work';
    else if (c.includes('install')) cat = 'Installation';

    const rate = product.sellingPrice || product.unitPrice || 0;
    const newItem: QuotationItem = {
      id: `bom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productName: product.name,
      make: product.brand || '',
      specification: product.specification || '',
      quantity: qty,
      unit: product.unit === 'NOS' ? 'Nos' : product.unit === 'SETS' ? 'Set' : product.unit === 'METERS' ? 'Mtr' : 'Nos',
      rate: rate,
      amount: rate * qty,
      category: cat,
      inventoryRef: product.id
    };

    setItems(prev => [...prev, newItem]);
    setBomFeedback(`Added "${product.name}" (${qty} ${newItem.unit}) from warehouse inventory`);
    setTimeout(() => setBomFeedback(null), 3500);
  };

  const handleLoadPresetTemplate = (templateId: string) => {
    const tpl = BOM_PRESET_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setItems(tpl.items.map(it => ({ ...it, id: `bom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })));
    setCapacityKw(tpl.capacityKw);
    setSystemType(tpl.systemType);
    if (tpl.id === 'tpl-5kw') {
      setInstallationCharges(20000);
      setTransportationCharges(5500);
      setCentralSubsidy(78000);
      setStateSubsidy(30000);
    } else if (tpl.id === 'tpl-3kw') {
      setInstallationCharges(14000);
      setTransportationCharges(4000);
      setCentralSubsidy(78000);
      setStateSubsidy(0);
    } else if (tpl.id === 'tpl-10kw') {
      setInstallationCharges(38000);
      setTransportationCharges(9500);
      setCentralSubsidy(78000);
      setStateSubsidy(50000);
    }
    setBomFeedback(`Loaded "${tpl.name}" preset template successfully!`);
    setTimeout(() => setBomFeedback(null), 3500);
  };

  const handleLoadReferenceBOM = () => {
    handleLoadPresetTemplate('tpl-5kw');
  };

  const handleAutoScaleForCapacity = () => {
    const cap = Number(capacityKw) || 5;
    if (items.length === 0) {
      handleLoadPresetTemplate('tpl-5kw');
      return;
    }

    const panelWatts = 545;
    const neededPanels = Math.max(1, Math.ceil((cap * 1000) / panelWatts));

    const updated = items.map(item => {
      const pName = (item.productName || '').toLowerCase();
      const isPanel = item.category === 'Panels' || pName.includes('module') || pName.includes('panel');
      const isInverter = item.category === 'Inverter' || pName.includes('inverter');
      const isStructure = item.category === 'Structure' || pName.includes('structure');

      if (isPanel) {
        return {
          ...item,
          quantity: neededPanels,
          amount: Math.round(neededPanels * (item.rate || 0))
        };
      } else if (isInverter) {
        return {
          ...item,
          quantity: 1,
          specification: `${cap} kW On-Grid String Inverter with remote WiFi monitoring`,
          amount: Math.round(1 * (item.rate || 0))
        };
      } else if (isStructure) {
        return {
          ...item,
          specification: `${cap} kW Elevated Rooftop HDG / Pre-GI Mounting Structure`,
          amount: Math.round((item.quantity || 1) * (item.rate || 0))
        };
      }
      return item;
    });

    setItems(updated);
    setBomFeedback(`⚡ Scaled BOM for ${cap} kW: ${neededPanels} panels (${((neededPanels * panelWatts) / 1000).toFixed(2)} kWp DC), Inverter & Structure`);
    setTimeout(() => setBomFeedback(null), 4000);
  };

  const handleCopyBomToClipboard = () => {
    if (items.length === 0) return;
    const header = `ITEM\tMAKE\tQTY\tUNIT\tRATE (INR)\tAMOUNT (INR)\tCATEGORY\n`;
    const rows = items.map(it => `${it.productName}\t${it.make}\t${it.quantity}\t${it.unit}\t${it.rate}\t${it.amount}\t${it.category || 'Other'}`).join('\n');
    const summary = `\nTOTAL BOM SUBTOTAL:\t${bomSubtotal}\nSYSTEM CAPACITY:\t${capacityKw} kW`;
    navigator.clipboard.writeText(header + rows + summary).then(() => {
      setCopiedBom(true);
      setBomFeedback('BOM table copied to clipboard!');
      setTimeout(() => {
        setCopiedBom(false);
        setBomFeedback(null);
      }, 3000);
    });
  };

  // Financial Calculations
  const bomSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.amount || 0), 0);
  }, [items]);

  const baseProjectPrice = useMemo(() => {
    const total = bomSubtotal + Number(installationCharges || 0) + Number(transportationCharges || 0) + Number(otherCharges || 0) - Number(discountAmount || 0);
    return Math.max(0, total);
  }, [bomSubtotal, installationCharges, transportationCharges, otherCharges, discountAmount]);

  const costPerKw = useMemo(() => {
    const cap = Number(capacityKw) || 1;
    return Math.round(baseProjectPrice / cap);
  }, [baseProjectPrice, capacityKw]);

  const eqTax = useMemo(() => {
    return Math.round((baseProjectPrice * (Number(gstEquipmentPercent) / 100) * Number(gstEquipmentRate)) / 100);
  }, [baseProjectPrice, gstEquipmentPercent, gstEquipmentRate]);

  const srvTax = useMemo(() => {
    return Math.round((baseProjectPrice * (Number(gstServicesPercent) / 100) * Number(gstServicesRate)) / 100);
  }, [baseProjectPrice, gstServicesPercent, gstServicesRate]);

  const totalGst = useMemo(() => eqTax + srvTax, [eqTax, srvTax]);

  const totalProjectCost = useMemo(() => baseProjectPrice + totalGst, [baseProjectPrice, totalGst]);

  const totalSubsidy = useMemo(() => {
    return Number(centralSubsidy || 0) + Number(stateSubsidy || 0);
  }, [centralSubsidy, stateSubsidy]);

  const finalProjectInvestment = useMemo(() => {
    return Math.max(0, totalProjectCost - totalSubsidy);
  }, [totalProjectCost, totalSubsidy]);

  const amountInWords = useMemo(() => {
    return numberToIndianWords(totalProjectCost);
  }, [totalProjectCost]);

  // Comprehensive BOM Technical & Commercial Metrics
  const bomMetrics = useMemo(() => {
    let moduleCount = 0;
    let moduleWattage = 545;
    let panelSubtotal = 0;
    let inverterSubtotal = 0;
    let structureSubtotal = 0;
    let electricalSubtotal = 0;
    let otherSubtotal = 0;

    items.forEach(it => {
      const amt = it.amount || 0;
      const cat = it.category || 'Other';
      const itName = (it.productName || '').toLowerCase();
      if (cat === 'Panels' || itName.includes('module') || itName.includes('panel')) {
        moduleCount += Number(it.quantity || 0);
        panelSubtotal += amt;
        const match = ((it.productName || '') + ' ' + (it.specification || '')).match(/(\d{3})\s*W/i);
        if (match && Number(match[1]) > 300 && Number(match[1]) < 800) {
          moduleWattage = Number(match[1]);
        }
      } else if (cat === 'Inverter' || itName.includes('inverter')) {
        inverterSubtotal += amt;
      } else if (cat === 'Structure' || itName.includes('structure')) {
        structureSubtotal += amt;
      } else if (cat === 'Electrical' || cat === 'Net Metering' || itName.includes('cable') || itName.includes('box')) {
        electricalSubtotal += amt;
      } else {
        otherSubtotal += amt;
      }
    });

    const totalDcWp = moduleCount * moduleWattage;
    const totalDcKw = totalDcWp / 1000;
    const acKw = Number(capacityKw) || 5;
    const dcAcRatio = acKw > 0 ? Number((totalDcKw / acKw).toFixed(2)) : 1;
    const ratePerWp = totalDcWp > 0 ? Number((bomSubtotal / totalDcWp).toFixed(2)) : (acKw > 0 ? Number((bomSubtotal / (acKw * 1000)).toFixed(2)) : 0);

    const totalCost = Math.max(1, bomSubtotal);
    const panelPct = Math.round((panelSubtotal / totalCost) * 100);
    const inverterPct = Math.round((inverterSubtotal / totalCost) * 100);
    const structurePct = Math.round((structureSubtotal / totalCost) * 100);
    const electricalPct = Math.round((electricalSubtotal / totalCost) * 100);
    const otherPct = Math.max(0, 100 - (panelPct + inverterPct + structurePct + electricalPct));

    return {
      moduleCount,
      moduleWattage,
      totalDcWp,
      totalDcKw,
      dcAcRatio,
      ratePerWp,
      panelSubtotal,
      inverterSubtotal,
      structureSubtotal,
      electricalSubtotal,
      otherSubtotal,
      panelPct,
      inverterPct,
      structurePct,
      electricalPct,
      otherPct
    };
  }, [items, capacityKw, bomSubtotal]);

  // Filtered BOM Items for Table Search and Category Chips
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (bomCategoryFilter !== 'ALL') {
        const itemCat = item.category || 'Other';
        if (itemCat !== bomCategoryFilter) return false;
      }
      if (bomSearchQuery.trim()) {
        const q = bomSearchQuery.toLowerCase();
        const match =
          (item.productName || '').toLowerCase().includes(q) ||
          (item.make || '').toLowerCase().includes(q) ||
          (item.specification || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [items, bomCategoryFilter, bomSearchQuery]);

  const getCategoryBadgeColor = (category?: string) => {
    switch (category) {
      case 'Panels':
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Inverter':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Structure':
        return 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800';
      case 'Electrical':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Net Metering':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'Civil Work':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      case 'Installation':
        return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  // Milestone updates & auto amount computation
  const handleUpdateMilestone = (id: string, field: 'title' | 'percentage' | 'description', value: any) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };
        if (field === 'percentage') {
          const pct = Number(value) || 0;
          updated.percentage = pct;
          updated.amount = Math.round((totalProjectCost * pct) / 100);
        }
        return updated;
      }
      return m;
    }));
  };

  // Re-calculate milestone rupee amounts when totalProjectCost changes
  useEffect(() => {
    setMilestones(prev => prev.map(m => ({
      ...m,
      amount: Math.round((totalProjectCost * (m.percentage || 0)) / 100)
    })));
  }, [totalProjectCost]);

  const milestoneTotalPercentage = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
  }, [milestones]);

  const isMilestoneValid = milestoneTotalPercentage === 100;

  // Calculate Valid Till Date
  const validTillDate = useMemo(() => {
    try {
      const d = new Date(quotationDate);
      d.setDate(d.getDate() + Number(validityDays || 15));
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, [quotationDate, validityDays]);

  // Submission Handler
  const handleSubmit = (previewNow: boolean = false) => {
    if (!customerName.trim()) {
      alert('Please enter or select a customer name.');
      setActiveTab('details');
      return;
    }

    if (!isMilestoneValid) {
      alert(`Milestone percentages must equal exactly 100%! Current sum is ${milestoneTotalPercentage}%.`);
      setActiveTab('milestones');
      return;
    }

    const compiledQuotation: Quotation = {
      id: editQuotation?.id || `quote-${Date.now()}`,
      quotationNumber: quotationNumber || storageService.getNextQuotationNumber(),
      quotationDate,
      customerId: customerId || `cust-${Date.now()}`,
      customerName,
      companyName,
      customerPhone,
      customerEmail,
      siteAddress,
      city,
      customerGst,

      capacityKw: Number(capacityKw) || 5,
      systemType,
      panelType,
      panelBrand,
      inverterBrand,
      structureType,

      items,
      bomSubtotal,
      installationCharges: Number(installationCharges) || 0,
      transportationCharges: Number(transportationCharges) || 0,
      otherCharges: Number(otherCharges) || 0,
      discountAmount: Number(discountAmount) || 0,
      baseProjectPrice,
      costPerKw,

      gstEquipmentPercent: Number(gstEquipmentPercent) || 70,
      gstEquipmentRate: Number(gstEquipmentRate) || 5,
      gstServicesPercent: Number(gstServicesPercent) || 30,
      gstServicesRate: Number(gstServicesRate) || 18,
      gstAmount: totalGst,
      totalProjectCost,

      centralSubsidy: Number(centralSubsidy) || 0,
      stateSubsidy: Number(stateSubsidy) || 0,
      totalSubsidy,
      finalProjectInvestment,

      amountInWords,
      validityDays: Number(validityDays) || 15,
      validTill: validTillDate,
      paymentMilestones: milestones,

      status,
      validUntil: validTillDate,
      createdAt: editQuotation?.createdAt || quotationDate,
      updatedAt: new Date().toISOString(),

      // Legacy fallback fields
      totalAmount: totalProjectCost,
      baseAmount: baseProjectPrice,
      taxAmount: totalGst,
      ratePerWp: Math.round((costPerKw / 1000) * 100) / 100
    };

    onSave(compiledQuotation, previewNow);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-0 sm:p-3 md:p-6 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-5xl md:max-w-6xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0 hidden xs:block">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                {editQuotation ? 'Edit Solar EPC Quotation' : 'Generate Dynamic Solar Quotation & Proposal'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {customerName ? `${customerName} • ` : ''}{capacityKw} kW • Turnkey Proposal with Dynamic BOM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleLoadReferenceBOM}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl flex items-center gap-1.5 transition-colors"
              title="Reset values to the 5 KW Waaree reference template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load 5KW Reference</span>
              <span className="sm:hidden text-[11px]">5KW Preset</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto text-xs font-semibold scrollbar-none">
          {[
            { id: 'details', label: '1. Specs & Client', mobileLabel: '1. Specs', icon: Building2 },
            { id: 'bom', label: `2. Dynamic BOM (${items.length})`, mobileLabel: `2. BOM (${items.length})`, icon: Layers },
            { id: 'cost', label: '3. Cost, GST & Subsidy', mobileLabel: '3. Cost & GST', icon: DollarSign },
            { id: 'milestones', label: '4. Milestones & Terms', mobileLabel: '4. Terms', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.mobileLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 overscroll-contain">
          {/* TAB 1: CLIENT & SYSTEM DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Proposal Identifiers */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Proposal Identifiers & Status</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quotation Number *
                    </label>
                    <input
                      type="text"
                      value={quotationNumber}
                      onChange={e => setQuotationNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date of Issue *
                    </label>
                    <input
                      type="date"
                      value={quotationDate}
                      onChange={e => setQuotationDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Validity Period (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={validityDays}
                      onChange={e => setValidityDays(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quotation Status
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="SENT">SENT</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>Client / Customer Details</span>
                  </h3>

                  {customers.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-500 shrink-0">Pick existing:</span>
                      <select
                        value={customerId}
                        onChange={e => handleSelectCustomer(e.target.value)}
                        className="flex-1 sm:flex-initial px-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold max-w-full sm:max-w-xs truncate"
                      >
                        <option value="">-- Select Registered Client --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.companyName ? `(${c.companyName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Customer / Contact Person Name *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Shri Rameshwar Patel"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Enterprise Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Patel Agro Industries"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+91 98795 44321"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Site Address
                    </label>
                    <input
                      type="text"
                      value={siteAddress}
                      onChange={e => setSiteAddress(e.target.value)}
                      placeholder="Plot No, Industrial Area"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City & State
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Raipur, Chhattisgarh"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Client GSTIN
                    </label>
                    <input
                      type="text"
                      value={customerGst}
                      onChange={e => setCustomerGst(e.target.value)}
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Solar Plant Technical Configuration</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Plant Capacity (kW) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={capacityKw}
                      onChange={e => setCapacityKw(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      System Topology
                    </label>
                    <select
                      value={systemType}
                      onChange={e => setSystemType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="On-Grid">On-Grid (Grid-Tied with Net Metering)</option>
                      <option value="Off-Grid">Off-Grid (With Battery Storage)</option>
                      <option value="Hybrid">Hybrid (Grid-Tied + Battery Backup)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Solar PV Module Spec
                    </label>
                    <input
                      type="text"
                      value={panelType}
                      onChange={e => setPanelType(e.target.value)}
                      placeholder="DCR Bifacial Mono PERC"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Module Make & Wattage
                    </label>
                    <input
                      type="text"
                      value={panelBrand}
                      onChange={e => setPanelBrand(e.target.value)}
                      placeholder="Waaree 545W"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Inverter Make & Specification
                    </label>
                    <input
                      type="text"
                      value={inverterBrand}
                      onChange={e => setInverterBrand(e.target.value)}
                      placeholder="Waaree 5KW 3PH Grid Tie"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mounting Structure Architecture
                    </label>
                    <input
                      type="text"
                      value={structureType}
                      onChange={e => setStructureType(e.target.value)}
                      placeholder="Elevated Rooftop HDG / Pre-GI Structure"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENHANCED DYNAMIC BILL OF MATERIALS */}
          {activeTab === 'bom' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Feedback Banner */}
              {bomFeedback && (
                <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{bomFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBomFeedback(null)}
                    className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 text-xs font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Top Controls Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Dynamic Bill of Materials (BOM) & Technical Sizing
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {items.length} Items
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure every hardware module and BoS component. Rates and quantities dynamically calculate total material cost.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsInventoryPickerOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>Add from Inventory</span>
                  </button>

                  {/* Quick Add Product Dropdown */}
                  {availableProducts.length > 0 && (
                    <select
                      onChange={e => {
                        if (e.target.value) {
                          const prod = availableProducts.find(p => p.id === e.target.value);
                          if (prod) handleAddProductFromInventory(prod, 1);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      aria-label="Quick Add from Inventory"
                      className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 max-w-[170px] sm:max-w-[190px] truncate"
                    >
                      <option value="" disabled>+ Quick Add Product...</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) &bull; Stock: {p.currentStock}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => handleAddItem('Other')}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add Blank Item</span>
                    <span className="sm:hidden">Blank Item</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoScaleForCapacity}
                    title="Recalculate panel quantity and inverter specs to match system capacity"
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Scale {capacityKw} kW</span>
                  </button>

                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleLoadPresetTemplate(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 max-w-[150px] sm:max-w-[180px] truncate"
                  >
                    <option value="" disabled>Load Preset BOM...</option>
                    {BOM_PRESET_TEMPLATES.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleCopyBomToClipboard}
                    title="Copy BOM table as formatted text"
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shrink-0"
                  >
                    {copiedBom ? <Check className="w-4 h-4 text-emerald-500" /> : <ClipboardCopy className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (items.length === 0) return;
                      if (confirm('Are you sure you want to clear all BOM line items?')) {
                        setItems([]);
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 transition-colors shrink-0"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Engineering & Commercial Analytics Banner */}
              {items.length > 0 && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Solar PV DC Capacity
                      </div>
                      <div className="text-base font-black text-amber-400 mt-0.5">
                        {bomMetrics.totalDcKw.toFixed(2)} kWp
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {bomMetrics.moduleCount} modules ({bomMetrics.moduleWattage}W)
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        DC / AC Loading Ratio
                      </div>
                      <div className="text-base font-black text-white mt-0.5">
                        {bomMetrics.dcAcRatio}x
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        {bomMetrics.dcAcRatio >= 1 && bomMetrics.dcAcRatio <= 1.3 ? 'Optimal Loading' : 'Custom Sizing'}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        BOM Subtotal
                      </div>
                      <div className="text-base font-black text-amber-400 mt-0.5">
                        {formatINR(bomSubtotal)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {items.length} billable items
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Material Cost / Watt
                      </div>
                      <div className="text-base font-black text-white mt-0.5">
                        ₹{bomMetrics.ratePerWp} <span className="text-xs font-normal text-slate-400">/ Wp</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Excluding services & taxes
                      </div>
                    </div>
                  </div>

                  {/* Cost Distribution Progress Bar */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                      <span>Category Cost Distribution</span>
                      <span>Total: {formatINR(bomSubtotal)}</span>
                    </div>

                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      {bomMetrics.panelPct > 0 && (
                        <div
                          style={{ width: `${bomMetrics.panelPct}%` }}
                          className="bg-amber-400 h-full transition-all"
                          title={`Panels: ${bomMetrics.panelPct}% (${formatINR(bomMetrics.panelSubtotal)})`}
                        />
                      )}
                      {bomMetrics.inverterPct > 0 && (
                        <div
                          style={{ width: `${bomMetrics.inverterPct}%` }}
                          className="bg-blue-400 h-full transition-all"
                          title={`Inverter: ${bomMetrics.inverterPct}% (${formatINR(bomMetrics.inverterSubtotal)})`}
                        />
                      )}
                      {bomMetrics.structurePct > 0 && (
                        <div
                          style={{ width: `${bomMetrics.structurePct}%` }}
                          className="bg-cyan-400 h-full transition-all"
                          title={`Structure: ${bomMetrics.structurePct}% (${formatINR(bomMetrics.structureSubtotal)})`}
                        />
                      )}
                      {bomMetrics.electricalPct > 0 && (
                        <div
                          style={{ width: `${bomMetrics.electricalPct}%` }}
                          className="bg-emerald-400 h-full transition-all"
                          title={`Electrical: ${bomMetrics.electricalPct}% (${formatINR(bomMetrics.electricalSubtotal)})`}
                        />
                      )}
                      {bomMetrics.otherPct > 0 && (
                        <div
                          style={{ width: `${bomMetrics.otherPct}%` }}
                          className="bg-slate-500 h-full transition-all"
                          title={`Other: ${bomMetrics.otherPct}% (${formatINR(bomMetrics.otherSubtotal)})`}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Panels: {bomMetrics.panelPct}% ({formatINR(bomMetrics.panelSubtotal)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span>Inverter: {bomMetrics.inverterPct}% ({formatINR(bomMetrics.inverterSubtotal)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>Structure: {bomMetrics.structurePct}% ({formatINR(bomMetrics.structureSubtotal)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Electrical: {bomMetrics.electricalPct}% ({formatINR(bomMetrics.electricalSubtotal)})</span>
                      </div>
                      {bomMetrics.otherPct > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          <span>Other: {bomMetrics.otherPct}% ({formatINR(bomMetrics.otherSubtotal)})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Category Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none sm:flex-wrap">
                  {(['ALL', 'Panels', 'Inverter', 'Structure', 'Electrical', 'Net Metering', 'Other'] as const).map(cat => {
                    const count = cat === 'ALL'
                      ? items.length
                      : items.filter(it => (it.category || 'Other') === cat).length;
                    const isActive = bomCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setBomCategoryFilter(cat)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="ml-1 opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={bomSearchQuery}
                    onChange={e => setBomSearchQuery(e.target.value)}
                    placeholder="Search BOM items..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500"
                  />
                  {bomSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBomSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table / Empty View */}
              {items.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                  <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No BOM Items in Quotation</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a preset template or add components from warehouse inventory.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadPresetTemplate('tpl-5kw')}
                      className="px-4 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl shadow-xs"
                    >
                      Load 5 kW Reference BOM
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInventoryPickerOpen(true)}
                      className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl shadow-xs"
                    >
                      Pick from Inventory
                    </button>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <Filter className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No items match current filter or search</p>
                  <button
                    type="button"
                    onClick={() => {
                      setBomCategoryFilter('ALL');
                      setBomSearchQuery('');
                    }}
                    className="mt-2 text-xs font-bold text-amber-600 hover:underline"
                  >
                    Clear Filter and Search
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Inventory Autocomplete Suggestions (Shared) */}
                  <datalist id="bom-inventory-suggestions">
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.brand ? `${p.brand} | ` : ''}{p.specification || ''} ({p.currentStock} {p.unit} in stock)
                      </option>
                    ))}
                  </datalist>

                  {/* 1. DESKTOP / TABLET DATA TABLE VIEW (hidden on mobile) */}
                  <div className="hidden md:block border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-2 text-center w-12"># / Order</th>
                            <th className="py-2.5 px-3 min-w-[280px]">Product / Material & Specification</th>
                            <th className="py-2.5 px-2 text-center w-16">Qty</th>
                            <th className="py-2.5 px-2 text-center w-20">Unit</th>
                            <th className="py-2.5 px-3 text-right w-28">Rate (₹)</th>
                            <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
                            <th className="py-2.5 px-2 text-center w-16">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {filteredItems.map(item => {
                            const realIdx = items.findIndex(it => it.id === item.id);
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                {/* Index & Order Movers */}
                                <td className="py-2 px-2 text-center">
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span className="font-bold text-slate-400 text-[11px] w-4 text-right mr-1">
                                      {realIdx + 1}
                                    </span>
                                    <div className="flex flex-col">
                                      <button
                                        type="button"
                                        disabled={realIdx === 0}
                                        onClick={() => handleMoveItem(realIdx, 'up')}
                                        title="Move item up"
                                        className="text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 transition-colors"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={realIdx === items.length - 1}
                                        onClick={() => handleMoveItem(realIdx, 'down')}
                                        title="Move item down"
                                        className="text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 transition-colors"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* Product Name & Specs */}
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      list="bom-inventory-suggestions"
                                      value={item.productName}
                                      onChange={e => {
                                        const val = e.target.value;
                                        handleUpdateItem(item.id, 'productName', val);
                                        const matched = availableProducts.find(
                                          p => (p.name || '').toLowerCase() === (val || '').toLowerCase()
                                        );
                                        if (matched) {
                                          const rate = matched.sellingPrice || matched.unitPrice || 0;
                                          if (rate > 0) handleUpdateItem(item.id, 'rate', rate);
                                          if (matched.specification) handleUpdateItem(item.id, 'specification', matched.specification);
                                          if (matched.unit) {
                                            const mappedUnit = matched.unit === 'NOS' ? 'Nos' : matched.unit === 'SETS' ? 'Set' : matched.unit === 'METERS' ? 'Mtr' : 'Nos';
                                            handleUpdateItem(item.id, 'unit', mappedUnit);
                                          }
                                          handleUpdateItem(item.id, 'inventoryRef', matched.id);
                                        }
                                      }}
                                      placeholder="Component / Material name (type to search inventory)"
                                      className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                                    />
                                    {item.category && item.category !== 'Other' && (
                                      <span
                                        className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border shrink-0 ${getCategoryBadgeColor(item.category)}`}
                                      >
                                        {item.category}
                                      </span>
                                    )}
                                    {item.inventoryRef && (
                                      <span
                                        title="Linked to warehouse product catalog"
                                        className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0"
                                      >
                                        Warehouse
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    value={item.specification || ''}
                                    onChange={e => handleUpdateItem(item.id, 'specification', e.target.value)}
                                    placeholder="Detailed technical specification (optional)"
                                    className="w-full mt-1 px-2.5 py-0.5 text-[10px] text-slate-500 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500"
                                  />
                                </td>

                                {/* Quantity */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                                    className="w-14 px-1 py-1 text-xs text-center font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                                  />
                                </td>

                                {/* Unit */}
                                <td className="py-2 px-2 text-center">
                                  <select
                                    value={item.unit}
                                    onChange={e => handleUpdateItem(item.id, 'unit', e.target.value)}
                                    className="w-full px-1 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                  >
                                    <option value="Nos">Nos</option>
                                    <option value="No">No</option>
                                    <option value="Set">Set</option>
                                    <option value="Pair">Pair</option>
                                    <option value="Lot">Lot</option>
                                    <option value="kW">kW</option>
                                    <option value="Mtr">Mtr</option>
                                    <option value="Kg">Kg</option>
                                  </select>
                                </td>

                                {/* Rate */}
                                <td className="py-2 px-3 text-right">
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.rate}
                                    onChange={e => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                                    className="w-24 px-2 py-1 text-xs text-right font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                                  />
                                </td>

                                {/* Amount */}
                                <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                  {formatINR(item.amount)}
                                </td>

                                {/* Actions */}
                                <td className="py-2 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateItem(item.id)}
                                      title="Duplicate line item"
                                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(item.id)}
                                      title="Delete line item"
                                      className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-amber-50 dark:bg-amber-950/30 border-t-2 border-amber-300 dark:border-amber-800/60 font-bold text-xs">
                          <tr>
                            <td colSpan={5} className="py-2.5 px-3 text-right text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                              Total Material Cost (BOM Subtotal):
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-900 dark:text-amber-200 font-black text-sm whitespace-nowrap">
                              {formatINR(bomSubtotal)}
                            </td>
                            <td className="py-2.5 px-2 text-center text-[10px] text-amber-700 dark:text-amber-400">
                              {items.length} items
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 2. MOBILE / TABLET TOUCH-OPTIMIZED CARD VIEW (visible on < md screens) */}
                  <div className="md:hidden space-y-3">
                    {filteredItems.map(item => {
                      const realIdx = items.findIndex(it => it.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5"
                        >
                          {/* Card Header: Index, Badge & Quick Reorder / Actions */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                                {realIdx + 1}
                              </span>
                              {item.category && item.category !== 'Other' && (
                                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border shrink-0 ${getCategoryBadgeColor(item.category)}`}>
                                  {item.category}
                                </span>
                              )}
                              {item.inventoryRef && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                                  Warehouse Stock
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={realIdx === 0}
                                onClick={() => handleMoveItem(realIdx, 'up')}
                                title="Move up"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={realIdx === items.length - 1}
                                onClick={() => handleMoveItem(realIdx, 'down')}
                                title="Move down"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(item.id)}
                                title="Duplicate item"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                title="Delete item"
                                className="p-1 text-slate-400 hover:text-red-500 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Component / Product Name */}
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              Component / Product Name
                            </label>
                            <input
                              type="text"
                              list="bom-inventory-suggestions"
                              value={item.productName}
                              onChange={e => {
                                const val = e.target.value;
                                handleUpdateItem(item.id, 'productName', val);
                                const matched = availableProducts.find(
                                  p => (p.name || '').toLowerCase() === (val || '').toLowerCase()
                                );
                                if (matched) {
                                  const rate = matched.sellingPrice || matched.unitPrice || 0;
                                  if (rate > 0) handleUpdateItem(item.id, 'rate', rate);
                                  if (matched.specification) handleUpdateItem(item.id, 'specification', matched.specification);
                                  if (matched.unit) {
                                    const mappedUnit = matched.unit === 'NOS' ? 'Nos' : matched.unit === 'SETS' ? 'Set' : matched.unit === 'METERS' ? 'Mtr' : 'Nos';
                                    handleUpdateItem(item.id, 'unit', mappedUnit);
                                  }
                                  handleUpdateItem(item.id, 'inventoryRef', matched.id);
                                }
                              }}
                              placeholder="Component name (type to search inventory)"
                              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          {/* Specification */}
                          <div>
                            <input
                              type="text"
                              value={item.specification || ''}
                              onChange={e => handleUpdateItem(item.id, 'specification', e.target.value)}
                              placeholder="Technical specifications (optional)..."
                              className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          {/* Quantities, Unit & Rate Inputs */}
                          <div className="grid grid-cols-3 gap-2 pt-1 items-end">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                                Qty
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-xs text-center font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                                Unit
                              </label>
                              <select
                                value={item.unit}
                                onChange={e => handleUpdateItem(item.id, 'unit', e.target.value)}
                                className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                              >
                                <option value="Nos">Nos</option>
                                <option value="No">No</option>
                                <option value="Set">Set</option>
                                <option value="Pair">Pair</option>
                                <option value="Lot">Lot</option>
                                <option value="kW">kW</option>
                                <option value="Mtr">Mtr</option>
                                <option value="Kg">Kg</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                                Rate (₹)
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={item.rate}
                                onChange={e => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-xs text-right font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>

                          {/* Line Total */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Line Amount:</span>
                            <span className="font-black text-amber-700 dark:text-amber-300 text-sm">
                              {formatINR(item.amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Mobile Summary Card */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-300 dark:border-amber-800/60 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                          Total Material Cost
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-400">
                          {items.length} items configured
                        </div>
                      </div>
                      <div className="text-base font-black text-amber-950 dark:text-amber-200">
                        {formatINR(bomSubtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COST, GST & SUBSIDY */}
          {activeTab === 'cost' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Direct EPC Charges */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Direct Charges & Project Base Price</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">BOM Material Subtotal</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatINR(bomSubtotal)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Installation & Commissioning Charges (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={installationCharges}
                        onChange={e => setInstallationCharges(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Transportation & Logistics Charges (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={transportationCharges}
                        onChange={e => setTransportationCharges(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Other Incidental Charges (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={otherCharges}
                        onChange={e => setOtherCharges(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Special EPC Discount (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={discountAmount}
                        onChange={e => setDiscountAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold text-red-600 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Base Project Price (Excl. GST):</span>
                      <span className="text-amber-800 dark:text-amber-400 text-sm font-black">{formatINR(baseProjectPrice)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Effective Cost Per kW:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatINR(costPerKw)} / kW</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Dynamic GST Configuration & Subsidies */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Dynamic GST & PM Surya Ghar Subsidy</span>
                  </h3>

                  {/* GST Split Scheme */}
                  <div className="space-y-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase">
                      Composite Solar GST Configuration
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500">Equipment Share (%)</label>
                        <input
                          type="number"
                          value={gstEquipmentPercent}
                          onChange={e => setGstEquipmentPercent(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-transparent font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Equipment GST Rate (%)</label>
                        <input
                          type="number"
                          value={gstEquipmentRate}
                          onChange={e => setGstEquipmentRate(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-transparent font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Services Share (%)</label>
                        <input
                          type="number"
                          value={gstServicesPercent}
                          onChange={e => setGstServicesPercent(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-transparent font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Services GST Rate (%)</label>
                        <input
                          type="number"
                          value={gstServicesRate}
                          onChange={e => setGstServicesRate(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-transparent font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500">
                        <span>Equipment Tax ({gstEquipmentPercent}% @ {gstEquipmentRate}%):</span>
                        <span className="font-semibold">{formatINR(eqTax)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Services Tax ({gstServicesPercent}% @ {gstServicesRate}%):</span>
                        <span className="font-semibold">{formatINR(srvTax)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>Total GST Amount:</span>
                        <span>{formatINR(totalGst)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subsidies */}
                  <div className="space-y-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-[11px] uppercase">
                      Subsidies & Direct Financial Assistance
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-600 dark:text-slate-400">Central Subsidy (PM Surya Ghar)</label>
                        <input
                          type="number"
                          value={centralSubsidy}
                          onChange={e => setCentralSubsidy(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs rounded border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 font-bold text-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 dark:text-slate-400">Chhattisgarh State Subsidy</label>
                        <input
                          type="number"
                          value={stateSubsidy}
                          onChange={e => setStateSubsidy(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs rounded border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-300 text-xs pt-1 border-t border-emerald-200 dark:border-emerald-900/40">
                      <span>Total Subsidy Assistance:</span>
                      <span>{formatINR(totalSubsidy)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Executive Summary Box */}
              <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/90 rounded-2xl border-2 border-amber-300 dark:border-amber-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Project Cost (With GST)</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{formatINR(totalProjectCost)}</span>
                    <p className="text-[10px] text-slate-500 mt-1">{amountInWords}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Total Applicable Subsidy</span>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">- {formatINR(totalSubsidy)}</span>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 mt-1">PM Surya Ghar + Chhattisgarh Policy</p>
                  </div>

                  <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
                    <span className="text-[10px] uppercase font-black tracking-wider block opacity-90">Net Final Investment</span>
                    <span className="text-2xl font-black block mt-0.5">{formatINR(finalProjectInvestment)}</span>
                    <span className="text-[10px] font-semibold block opacity-85 mt-1">Payable by Customer</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT MILESTONES & VALIDITY */}
          {activeTab === 'milestones' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Milestone Payment Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define stage payments. Sum of percentages must equal exactly 100%.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isMilestoneValid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                  }`}>
                    Total: {milestoneTotalPercentage}% {isMilestoneValid ? '✓' : '(Must be 100%)'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setMilestones(DEFAULT_PAYMENT_MILESTONES)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
                  >
                    Reset to 10/70/18/2
                  </button>
                </div>
              </div>

              {!isMilestoneValid && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Validation Error: The milestone percentages currently total <strong>{milestoneTotalPercentage}%</strong>. Please adjust values until they equal exactly <strong>100%</strong> before saving.
                  </span>
                </div>
              )}

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                    <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 w-48">Milestone Title</th>
                        <th className="py-2.5 px-3">Condition / Trigger</th>
                        <th className="py-2.5 px-3 text-center w-24">Share (%)</th>
                        <th className="py-2.5 px-3 text-right w-36">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {milestones.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">Stage 0{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={m.title}
                              onChange={e => handleUpdateMilestone(m.id, 'title', e.target.value)}
                              className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={m.description || ''}
                              onChange={e => handleUpdateMilestone(m.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={m.percentage}
                              onChange={e => handleUpdateMilestone(m.id, 'percentage', Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs text-center font-bold text-amber-800 dark:text-amber-400 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                            {formatINR(m.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-xs border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider">
                          Total Contractual Payment:
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-amber-800 dark:text-amber-400">
                          {milestoneTotalPercentage}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-black">
                          {formatINR(totalProjectCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Validity & Terms */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block uppercase text-[11px]">
                  Contractual Validity Summary
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  This quotation is issued on <strong>{quotationDate}</strong> and remains strictly valid for <strong>{validityDays} days</strong> until <strong>{validTillDate}</strong>. All material rates are guaranteed for this validity window.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <div className="sm:hidden text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Payable</span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">{formatINR(finalProjectInvestment)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <Eye className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Save & View PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors text-center"
            >
              {editQuotation ? 'Update Quotation' : 'Save Quotation'}
            </button>
          </div>
        </div>
      </div>

      {/* Warehouse Product Catalog Picker Modal */}
      {isInventoryPickerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-5">
          <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 w-full sm:max-w-4xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Warehouse Inventory & Product Catalog
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pick verified components from enterprise stock to import directly into the quotation BOM
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInventoryPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  placeholder="Search products by SKU, title, brand, or technical specifications..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500"
                />
                {inventorySearch && (
                  <button
                    type="button"
                    onClick={() => setInventorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none sm:flex-wrap">
                {[
                  { key: 'ALL', label: 'All Catalog' },
                  { key: 'Solar Panels', label: 'Solar Panels' },
                  { key: 'Inverters', label: 'Inverters' },
                  { key: 'Mounting Structures', label: 'Structures' },
                  { key: 'Electrical & Cables', label: 'Electrical & Cables' },
                  { key: 'Other', label: 'Other Components' }
                ].map(tab => {
                  const isActive = inventoryCategoryFilter === tab.key;
                  const count = tab.key === 'ALL'
                    ? availableProducts.length
                    : availableProducts.filter(p => {
                        if (tab.key === 'Other') {
                          return !['Solar Panels', 'Inverters', 'Mounting Structures', 'Electrical & Cables'].includes(p.category);
                        }
                        return p.category === tab.key;
                      }).length;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setInventoryCategoryFilter(tab.key)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border whitespace-nowrap shrink-0 transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="ml-1.5 opacity-75 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {availableProducts
                .filter(p => {
                  // Category match
                  if (inventoryCategoryFilter !== 'ALL') {
                    if (inventoryCategoryFilter === 'Other') {
                      if (['Solar Panels', 'Inverters', 'Mounting Structures', 'Electrical & Cables'].includes(p.category)) {
                        return false;
                      }
                    } else if (p.category !== inventoryCategoryFilter) {
                      return false;
                    }
                  }
                  // Search query
                  if (inventorySearch.trim()) {
                    const q = inventorySearch.toLowerCase();
                    const match =
                      (p.name || '').toLowerCase().includes(q) ||
                      (p.sku || '').toLowerCase().includes(q) ||
                      (p.brand || '').toLowerCase().includes(q) ||
                      (p.specification || '').toLowerCase().includes(q) ||
                      (p.category || '').toLowerCase().includes(q);
                    if (!match) return false;
                  }
                  return true;
                })
                .map(product => {
                  const chosenQty = inventoryQtyMap[product.id] || 1;
                  const price = product.sellingPrice || product.unitPrice || 0;
                  const isLowStock = product.currentStock <= product.minStockThreshold;

                  return (
                    <div
                      key={product.id}
                      className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {product.sku}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            {product.category}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            isLowStock
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            Stock: {product.currentStock} {product.unit}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {product.name}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          Make: <strong className="text-slate-700 dark:text-slate-300">{product.brand}</strong> &bull; {product.specification}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {formatINR(price)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            per {product.unit}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Quantity Stepper */}
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                            <button
                              type="button"
                              onClick={() => setInventoryQtyMap(prev => ({
                                ...prev,
                                [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                              }))}
                              className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={chosenQty}
                              onChange={e => setInventoryQtyMap(prev => ({
                                ...prev,
                                [product.id]: Math.max(1, Number(e.target.value) || 1)
                              }))}
                              className="w-12 text-center text-xs font-bold bg-transparent border-0 focus:ring-0 p-0 text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setInventoryQtyMap(prev => ({
                                ...prev,
                                [product.id]: (prev[product.id] || 1) + 1
                              }))}
                              className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddProductFromInventory(product, chosenQty)}
                            className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {items.length} total components currently in quotation BOM
              </span>

              <button
                type="button"
                onClick={() => setIsInventoryPickerOpen(false)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
