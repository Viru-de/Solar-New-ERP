import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { Warehouse, ProductItem, StockAuditRecord } from '../../types/solar';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Star,
  Layers,
  History,
  ClipboardCheck,
  X,
  TrendingUp,
  Package,
  ArrowRight
} from 'lucide-react';

export const WarehouseManager: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast, setActiveView } = useApp();
  const { currentUser, currentRole } = useAuth();
  const isAdmin = currentRole === 'Admin' || currentUser?.role === 'Admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [activeTab, setActiveTab] = useState<'WAREHOUSES' | 'AUDIT_LOGS'>('WAREHOUSES');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [capacitySqFt, setCapacitySqFt] = useState<number>(15000);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Physical Audit Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditWarehouse, setAuditWarehouse] = useState<Warehouse | null>(null);
  const [auditAuditor, setAuditAuditor] = useState(currentUser?.name || 'Quality & Inventory Auditor');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});

  // Data Loading
  const warehouses = useMemo(() => storageService.getWarehouses(), [refreshTrigger]);
  const products = useMemo(() => storageService.getProducts(), [refreshTrigger]);
  const audits = useMemo(() => storageService.getStockAudits(), [refreshTrigger]);

  // Overall KPIs
  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter(w => w.status === 'ACTIVE').length;
  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock * (p.unitPrice || 0), 0);
  }, [products]);
  const totalUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock, 0);
  }, [products]);

  // Warehouse-wise Stock Calculation Helper
  const getWarehouseStockSummary = (warehouseId: string, isDef: boolean) => {
    let skus = 0;
    let units = 0;
    let valuation = 0;

    products.forEach(p => {
      // If product has explicit warehouseStocks, check it
      const whStock = p.warehouseStocks?.[warehouseId];
      if (whStock !== undefined) {
        if (whStock > 0) {
          skus++;
          units += whStock;
          valuation += whStock * (p.unitPrice || 0);
        }
      } else if (isDef && !p.warehouseStocks) {
        // Fallback: items default to default warehouse
        if (p.currentStock > 0) {
          skus++;
          units += p.currentStock;
          valuation += p.currentStock * (p.unitPrice || 0);
        }
      }
    });

    return { skus, units, valuation };
  };

  // Filtered Warehouses
  const filteredWarehouses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return warehouses.filter(w => {
      const matchesSearch =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q) ||
        w.state.toLowerCase().includes(q) ||
        w.contactPerson.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [warehouses, searchQuery, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setName('');
    setCode(`WH-LOC-0${warehouses.length + 1}`);
    setAddress('');
    setCity('');
    setState('');
    setPincode('');
    setContactPerson(currentUser?.name || '');
    setContactPhone('');
    setEmail('');
    setCapacitySqFt(15000);
    setStatus('ACTIVE');
    setIsDefault(warehouses.length === 0);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setName(w.name);
    setCode(w.code);
    setAddress(w.address);
    setCity(w.city);
    setState(w.state);
    setPincode(w.pincode);
    setContactPerson(w.contactPerson);
    setContactPhone(w.contactPhone);
    setEmail(w.email || '');
    setCapacitySqFt(w.capacitySqFt || 15000);
    setStatus(w.status);
    setIsDefault(Boolean(w.isDefault));
    setNotes(w.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Warehouse
  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Warehouse name is required');
      return;
    }
    if (!code.trim()) {
      setFormError('Warehouse code is required');
      return;
    }

    // Check duplicate code
    const isCodeTaken = warehouses.some(
      w => w.code.toLowerCase() === code.trim().toLowerCase() && w.id !== editingWarehouse?.id
    );
    if (isCodeTaken) {
      setFormError(`Warehouse code "${code}" is already in use.`);
      return;
    }

    const warehouseData: Warehouse = {
      id: editingWarehouse ? editingWarehouse.id : `wh-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      email: email.trim(),
      capacitySqFt: Number(capacitySqFt) || 0,
      status,
      isDefault,
      notes: notes.trim(),
      createdAt: editingWarehouse ? editingWarehouse.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storageService.saveWarehouse(warehouseData);
    triggerRefresh();
    showToast(
      editingWarehouse
        ? `Warehouse "${warehouseData.name}" updated successfully.`
        : `New warehouse "${warehouseData.name}" created successfully.`,
      'success'
    );
    setIsModalOpen(false);
  };

  // Delete Warehouse
  const handleDeleteWarehouse = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove warehouse "${name}"?`)) {
      return;
    }
    const res = storageService.deleteWarehouse(id);
    if (!res.success) {
      showToast(res.message || 'Failed to delete warehouse', 'error');
      return;
    }
    triggerRefresh();
    showToast(`Warehouse "${name}" deleted successfully.`, 'info');
  };

  // Set Default
  const handleSetDefault = (w: Warehouse) => {
    storageService.saveWarehouse({
      ...w,
      isDefault: true,
      status: 'ACTIVE'
    });
    triggerRefresh();
    showToast(`"${w.name}" set as default distribution warehouse.`, 'success');
  };

  // Open Physical Audit Modal
  const handleOpenAuditModal = (w: Warehouse) => {
    setAuditWarehouse(w);
    setAuditAuditor(currentUser?.name || 'Quality & Inventory Auditor');
    setAuditNotes(`Physical quarterly count verification for ${w.name}`);
    // Pre-populate actual count with current stock
    const initialCounts: Record<string, number> = {};
    products.forEach(p => {
      const stock = p.warehouseStocks?.[w.id] ?? (w.isDefault ? p.currentStock : 0);
      initialCounts[p.id] = stock;
    });
    setAuditCounts(initialCounts);
    setIsAuditModalOpen(true);
  };

  // Submit Physical Audit Reconciliation
  const handleSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditWarehouse) return;

    let discrepancies = 0;
    let netAdjustmentVal = 0;
    let auditedCount = 0;

    products.forEach(p => {
      const expectedStock = p.warehouseStocks?.[auditWarehouse.id] ?? (auditWarehouse.isDefault ? p.currentStock : 0);
      const countedStock = auditCounts[p.id] !== undefined ? Number(auditCounts[p.id]) : expectedStock;
      auditedCount++;

      if (countedStock !== expectedStock) {
        discrepancies++;
        const diff = countedStock - expectedStock;
        netAdjustmentVal += diff * (p.unitPrice || 0);

        // Adjust stock in this warehouse
        storageService.adjustStock(
          p.id,
          countedStock,
          `Physical Audit Reconciliation: ${auditWarehouse.name} (${auditAuditor})`,
          auditAuditor,
          auditWarehouse.id,
          auditWarehouse.name
        );
      }
    });

    const newAuditRecord: StockAuditRecord = {
      id: `audit-${Date.now()}`,
      auditNumber: `AUD-${new Date().getFullYear()}-${String(audits.length + 1).padStart(3, '0')}`,
      warehouseId: auditWarehouse.id,
      warehouseName: auditWarehouse.name,
      auditDate: new Date().toISOString().slice(0, 10),
      auditedBy: auditAuditor,
      status: 'COMPLETED',
      notes: auditNotes || 'Physical count verified and discrepancies reconciled.',
      itemsAudited: auditedCount,
      discrepanciesFound: discrepancies,
      netAdjustmentValue: netAdjustmentVal,
      createdAt: new Date().toISOString()
    };

    storageService.saveStockAudit(newAuditRecord);
    triggerRefresh();
    showToast(
      `Audit completed for ${auditWarehouse.name}. Reconciled ${discrepancies} item variance(s).`,
      'success'
    );
    setIsAuditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Permissions notice if not admin */}
      {!isAdmin && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-800 font-medium">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>View-Only Access:</strong> You are viewing registered warehouse facilities. Only System Administrators have permission to create, edit, or decommission warehouses.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Facilities
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
            {totalWarehouses} <span className="text-xs font-normal text-slate-400">Warehouses</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {activeWarehouses} Active & operational
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Stock Units
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-700 mt-2 font-mono">
            {totalUnits.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">Units</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Distributed across all hubs
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Inventory Valuation
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2 font-mono">
            ₹{totalValuation.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            At purchase cost basis
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Physical Audits
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-700 mt-2 font-mono">
            {audits.length} Records
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Stock audit reconciliations logged
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('WAREHOUSES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'WAREHOUSES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Warehouses Directory ({filteredWarehouses.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Warehouse Audit Logs ({audits.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          {activeTab === 'WAREHOUSES' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Facilities</option>
              <option value="INACTIVE">Inactive / Closed</option>
            </select>
          )}

          {/* Search */}
          <div className="relative w-56 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search warehouses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
            />
          </div>

          {/* Add Warehouse Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Warehouse</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Warehouses Directory */}
      {activeTab === 'WAREHOUSES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWarehouses.map(w => {
            const stockSummary = getWarehouseStockSummary(w.id, Boolean(w.isDefault));

            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {w.code}
                        </span>
                        {w.isDefault && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                            Default Hub
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{w.name}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        w.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>

                  {/* Location Info */}
                  <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        {w.address ? `${w.address}, ` : ''}
                        {w.city}, {w.state} {w.pincode ? `- ${w.pincode}` : ''}
                      </span>
                    </div>

                    {w.contactPerson && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-[11px] font-semibold text-slate-700">Manager:</span>
                        <span>{w.contactPerson}</span>
                        {w.contactPhone && (
                          <span className="text-slate-400">({w.contactPhone})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Metrics Bar */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Active SKUs
                    </span>
                    <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                      {stockSummary.skus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Stock Units
                    </span>
                    <span className="text-xs font-bold text-blue-700 font-mono mt-0.5 block">
                      {stockSummary.units.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Est. Value
                    </span>
                    <span className="text-xs font-bold text-emerald-700 font-mono mt-0.5 block">
                      ₹{(stockSummary.valuation / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-white flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenAuditModal(w)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                    title="Conduct physical inventory count audit"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Physical Audit</span>
                  </button>

                  {isAdmin && (
                    <>
                      {!w.isDefault && (
                        <button
                          onClick={() => handleSetDefault(w)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Make Default Warehouse"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(w)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Facility"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {!w.isDefault && (
                        <button
                          onClick={() => handleDeleteWarehouse(w.id, w.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Facility"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filteredWarehouses.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-base mb-1">No Warehouses Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                No storage facilities match your search criteria. Add a new solar equipment hub to start managing multi-location stock.
              </p>
              {isAdmin && (
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Warehouse
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Warehouse Audit Logs */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Audit #</th>
                  <th className="p-3.5">Warehouse Location</th>
                  <th className="p-3.5">Audit Date</th>
                  <th className="p-3.5">Auditor / Quality Lead</th>
                  <th className="p-3.5 text-center">Items Audited</th>
                  <th className="p-3.5 text-center">Discrepancies</th>
                  <th className="p-3.5 text-right">Net Value Adj</th>
                  <th className="p-3.5">Audit Findings & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {audits.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{a.auditNumber}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{a.warehouseName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">{a.auditDate}</td>
                    <td className="p-3.5 font-medium">{a.auditedBy}</td>
                    <td className="p-3.5 text-center font-bold">{a.itemsAudited} SKUs</td>
                    <td className="p-3.5 text-center">
                      {a.discrepanciesFound > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          {a.discrepanciesFound} Variances
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          100% Match
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold">
                      {a.netAdjustmentValue === 0 ? (
                        <span className="text-slate-400">₹0</span>
                      ) : a.netAdjustmentValue > 0 ? (
                        <span className="text-emerald-600">+₹{a.netAdjustmentValue.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-rose-600">-₹{Math.abs(a.netAdjustmentValue).toLocaleString('en-IN')}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px] max-w-xs truncate">{a.notes}</td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No stock audits recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Warehouse */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingWarehouse ? 'Edit Warehouse Facility' : 'Create New Warehouse'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure multi-location solar hardware storage & distribution.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Warehouse Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. West Regional Logistics Hub"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Facility Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WH-AMD-04"
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Plot/Shed number, Industrial Estate or Road"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="State"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="Warehouse Manager"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+91 98xxx xxxxx"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="depot@rejoysolar.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usable Storage Area (Sq Ft)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={capacitySqFt}
                    onChange={e => setCapacitySqFt(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Facility Operational Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="ACTIVE">ACTIVE - Receiving & Dispatching Stock</option>
                    <option value="INACTIVE">INACTIVE - Maintenance / Decommissioned</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <input
                  type="checkbox"
                  id="defaultWarehouseCheck"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label
                  htmlFor="defaultWarehouseCheck"
                  className="text-xs font-bold text-amber-900 cursor-pointer select-none"
                >
                  Mark as Default Primary Warehouse
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Facility Notes & Logistics Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Loading bay access, crane facility, high-value inverter vault..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingWarehouse ? 'Save Changes' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Physical Stock Audit & Reconciliation */}
      {isAuditModalOpen && auditWarehouse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Physical Stock Audit & Count Reconciliation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify physical inventory counts for <strong className="text-slate-700">{auditWarehouse.name}</strong> ({auditWarehouse.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAudit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Auditor / Quality Lead Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={auditAuditor}
                    onChange={e => setAuditAuditor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Audit Notes & Reference
                  </label>
                  <input
                    type="text"
                    value={auditNotes}
                    onChange={e => setAuditNotes(e.target.value)}
                    placeholder="e.g. Q3 Physical Stock Count Verification"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Items Count Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Product Catalog Item</span>
                  <div className="flex items-center gap-8 pr-2">
                    <span className="w-20 text-center">System Stock</span>
                    <span className="w-28 text-center">Physical Count</span>
                    <span className="w-20 text-right">Variance</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
                  {products.map(p => {
                    const expectedStock = p.warehouseStocks?.[auditWarehouse.id] ?? (auditWarehouse.isDefault ? p.currentStock : 0);
                    const currentCount = auditCounts[p.id] !== undefined ? auditCounts[p.id] : expectedStock;
                    const diff = currentCount - expectedStock;

                    return (
                      <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div className="min-w-0 pr-4">
                          <span className="font-bold text-slate-800 block truncate">{p.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {p.sku} • {p.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-8 shrink-0">
                          <span className="w-20 text-center font-mono font-bold text-slate-600">
                            {expectedStock} {p.unit}
                          </span>

                          <div className="w-28 flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              value={currentCount}
                              onChange={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setAuditCounts(prev => ({ ...prev, [p.id]: val }));
                              }}
                              className="w-24 px-2 py-1 text-xs text-center font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                          </div>

                          <span className="w-20 text-right font-mono font-bold">
                            {diff === 0 ? (
                              <span className="text-slate-400">0</span>
                            ) : diff > 0 ? (
                              <span className="text-emerald-600">+{diff}</span>
                            ) : (
                              <span className="text-rose-600">{diff}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-xl text-xs text-purple-900 space-y-1">
                <span className="font-bold block">Automatic Stock Ledger Reconciliation:</span>
                <p className="text-[11px] text-purple-800">
                  Submitting will create an official <strong>AUDIT_RECONCILIATION</strong> stock movement ledger entry for any detected discrepancies and update the live stock for {auditWarehouse.name}.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirm & Apply Audit Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
