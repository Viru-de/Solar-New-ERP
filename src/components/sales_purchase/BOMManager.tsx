import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { BillOfMaterials, BOMItem, ProductItem, SolarProject } from '../../types/solar';
import { validateBOM, validateBOMLineItems, DuplicateRecordError } from '../../services/validation';
import {
  Layers,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Send,
  Trash2,
  Eye,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Building2,
  Sun,
  ShieldCheck,
  Check,
  Truck
} from 'lucide-react';
import { EWayBillModal } from './EWayBillModal';

export const BOMManager: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBOMForView, setSelectedBOMForView] = useState<BillOfMaterials | null>(null);
  const [selectedBOMForEWayBill, setSelectedBOMForEWayBill] = useState<BillOfMaterials | null>(null);

  // Form state for new BOM
  const [formProjectId, setFormProjectId] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<Omit<BOMItem, 'id'>[]>([]);
  const [bomError, setBOMError] = useState<string>('');
  const [lineItemError, setLineItemError] = useState<string>('');

  // Item currently being added in modal
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemRequiredQty, setItemRequiredQty] = useState<number>(1);
  const [customDescription, setCustomDescription] = useState('');

  // Fetch reactive data
  const boms = useMemo(() => storageService.getBOMs(), [refreshTrigger]);
  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);
  const products = useMemo(() => storageService.getProducts(), [refreshTrigger]);
  const warehouses = useMemo(() => storageService.getWarehouses(), [refreshTrigger]);

  const filteredBOMs = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return boms.filter(bom => {
      const matchesSearch =
        !q ||
        (bom.bomNumber || '').toLowerCase().includes(q) ||
        (bom.projectTitle || '').toLowerCase().includes(q) ||
        (bom.customerName || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || bom.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [boms, searchQuery, statusFilter]);

  // Handle adding line item to the draft form
  const handleAddLineItem = () => {
    setLineItemError('');

    if (!selectedProductId && !customDescription.trim()) {
      setLineItemError('Please select a product from catalog or enter a description.');
      showToast('Please select a product from catalog or enter a description', 'warning');
      return;
    }

    if (itemRequiredQty <= 0) {
      setLineItemError('Quantity must be greater than zero.');
      showToast('Quantity must be greater than zero', 'warning');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);

    const newItem: Omit<BOMItem, 'id'> = {
      productId: prod?.id,
      productName: prod ? prod.name : customDescription.trim(),
      sku: prod ? prod.sku : `CUSTOM-${Date.now()}`,
      category: prod ? prod.category : 'General',
      requiredQty: itemRequiredQty,
      allocatedQty: 0,
      unit: prod ? prod.unit : 'NOS',
      estimatedUnitCost: prod ? prod.unitPrice : 0,
      totalCost: (prod ? prod.unitPrice : 0) * itemRequiredQty,
      status: 'PENDING'
    };

    // Pre-validate for duplicate line item
    const dummyCandidate: BOMItem = { ...newItem, id: 'temp-new-item' };
    const dummyExisting: BOMItem[] = formItems.map((it, idx) => ({ ...it, id: `item-${idx}` }));
    const lineValidation = validateBOMLineItems([...dummyExisting, dummyCandidate]);
    if (!lineValidation.valid) {
      setLineItemError(lineValidation.message);
      showToast(lineValidation.message, 'warning');
      return;
    }

    setFormItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setItemRequiredQty(1);
    setCustomDescription('');
    setLineItemError('');
  };

  const handleRemoveLineItem = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
    setLineItemError('');
  };

  const handleSaveBOM = (e: React.FormEvent) => {
    e.preventDefault();
    setBOMError('');

    if (!formProjectId) {
      setBOMError('Please select a project for this BOM.');
      showToast('Please select a project for this BOM', 'warning');
      return;
    }

    if (formItems.length === 0) {
      setBOMError('Please add at least one line item to the BOM.');
      showToast('Please add at least one line item to the BOM', 'warning');
      return;
    }

    const project = projects.find(p => p.id === formProjectId);
    if (!project) return;

    const totalCost = formItems.reduce((acc, it) => acc + it.totalCost, 0);

    const selectedWh = warehouses.find(w => w.id === formWarehouseId) || storageService.getDefaultWarehouse();

    const newBOM: BillOfMaterials = {
      id: `bom-${Date.now()}`,
      bomNumber: `BOM-${new Date().getFullYear()}-${String(boms.length + 1).padStart(3, '0')}`,
      projectId: project.id,
      projectCode: project.projectCode,
      projectTitle: project.title,
      customerName: project.customerName,
      capacityKw: project.capacityKw || 10,
      version: formVersion.trim() || 'v1.0',
      warehouseId: selectedWh.id,
      warehouseName: selectedWh.name,
      status: 'DRAFT',
      stockAllocated: false,
      items: formItems.map((it, idx) => ({
        ...it,
        id: `bomi-${Date.now()}-${idx}`
      })),
      totalCost,
      notes: formNotes,
      createdBy: currentUser?.name || 'Project Engineer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Pre-validate duplicate BOM version for project and duplicate line items
    const bomCheck = validateBOM(newBOM, boms);
    if (!bomCheck.valid) {
      setBOMError(bomCheck.message);
      showToast(bomCheck.message, 'error');
      return;
    }

    try {
      storageService.saveBOM(newBOM);
      triggerRefresh();
      showToast(`Bill of Materials ${newBOM.bomNumber} created successfully`, 'success');
      setIsCreateModalOpen(false);

      // Reset modal form
      setFormProjectId('');
      setFormVersion('v1.0');
      setFormNotes('');
      setFormItems([]);
      setBOMError('');
      setLineItemError('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create Bill of Materials';
      setBOMError(msg);
      showToast(msg, 'error');
    }
  };

  // Stock allocation handler
  const handleAllocateStock = (bom: BillOfMaterials) => {
    const success = storageService.allocateBOMStock(bom.id, currentUser?.name || 'Project Manager');
    if (success) {
      triggerRefresh();
      showToast(`Stock successfully reserved & allocated for BOM ${bom.bomNumber}`, 'success');
    } else {
      showToast(`Could not allocate stock. Please verify product inventory.`, 'error');
    }
  };

  // Status progression
  const handleUpdateStatus = (bom: BillOfMaterials, newStatus: BillOfMaterials['status']) => {
    const updated = {
      ...bom,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    if (newStatus === 'APPROVED') {
      updated.approvedBy = currentUser?.name || 'Chief Technical Officer';
      updated.approvedAt = new Date().toISOString();
    }
    storageService.saveBOM(updated);
    triggerRefresh();
    showToast(`BOM ${bom.bomNumber} status updated to ${newStatus}`, 'info');
  };

  const handleDeleteBOM = (id: string, bomNumber: string) => {
    if (window.confirm(`Are you sure you want to delete ${bomNumber}?`)) {
      storageService.deleteBOM(id);
      triggerRefresh();
      showToast(`BOM ${bomNumber} deleted`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            Bill of Materials (BOM) Management
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Design project equipment requirements, monitor estimated costs, and synchronize stock reservations.
          </p>
        </div>

        <button
          id="btn-create-bom"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New BOM
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search BOM by code, project, client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'RELEASED_TO_SITE'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* BOM Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBOMs.map(bom => {
          const isAllocated = bom.stockAllocated;
          return (
            <div
              key={bom.id}
              id={`bom-card-${bom.id}`}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Card Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 font-mono">
                    {bom.bomNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        bom.status === 'APPROVED' || bom.status === 'RELEASED_TO_SITE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : bom.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {bom.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {bom.version}
                    </span>
                    {bom.ewayBillNumber && (
                      <span
                        className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-mono flex items-center gap-0.5"
                        title={`E-Way Bill: ${bom.ewayBillNumber}`}
                      >
                        <Truck className="w-2.5 h-2.5 text-indigo-600" />
                        EWB
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 mb-1">
                  {bom.projectTitle}
                </h4>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{bom.customerName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">{bom.capacityKw} kW</span>
                </div>

                {/* Materials Count & Total Cost */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Billable Line Items:</span>
                    <span className="font-bold text-slate-800">{bom.items.length} items</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Estimated Total Cost:</span>
                    <span className="font-bold text-amber-700 font-mono">
                      ₹{bom.totalCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Warehouse Stock:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 text-[11px] ${
                        isAllocated ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isAllocated ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Allocated & Reserved
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Allocation
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Source Facility:</span>
                    <span
                      className="font-semibold text-slate-700 truncate max-w-[150px]"
                      title={bom.warehouseName || 'Central Solar Logistics Hub'}
                    >
                      {bom.warehouseName || 'Central Solar Logistics Hub'}
                    </span>
                  </div>
                </div>

                {bom.notes && (
                  <p className="text-xs text-slate-500 italic line-clamp-2 mb-3 bg-white px-2 py-1 rounded border border-slate-100">
                    "{bom.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedBOMForView(bom)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Details
                  </button>

                  <button
                    onClick={() => handleDeleteBOM(bom.id, bom.bomNumber)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete BOM"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stock Allocation Button */}
                {!isAllocated && (
                  <button
                    onClick={() => handleAllocateStock(bom)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Allocate & Reserve Stock
                  </button>
                )}

                {/* Workflow Release */}
                {bom.status === 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus(bom, 'RELEASED_TO_SITE')}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Release BOM to Site Team
                  </button>
                )}

                {/* Generate E-Way Bill Button */}
                <button
                  onClick={() => setSelectedBOMForEWayBill(bom)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-semibold transition-colors"
                  title="Generate GST Form EWB-01 for this Bill of Materials"
                >
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  Generate E-Way Bill
                </button>

                {bom.status === 'DRAFT' && (
                  <button
                    onClick={() => handleUpdateStatus(bom, 'APPROVED')}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve BOM
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredBOMs.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-base mb-1">No Bill of Materials Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Get started by creating a new BOM for one of your ongoing solar installation projects.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First BOM
            </button>
          </div>
        )}
      </div>

      {/* Modal: Create New BOM */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Create Bill of Materials</h3>
                  <p className="text-xs text-slate-500">
                    Define technical billable items and allocate inventory.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBOM} className="flex-1 overflow-y-auto p-6 space-y-6">
              {bomError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {bomError}
                </div>
              )}

              {/* Project & Version Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Target Project *
                  </label>
                  <select
                    required
                    value={formProjectId}
                    onChange={e => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.customerName} - {p.capacityKw || 10}kW)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Drawing / Spec Version
                  </label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={e => setFormVersion(e.target.value)}
                    placeholder="e.g. v1.0"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Sourcing Warehouse Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sourcing / Allocation Warehouse *
                </label>
                <select
                  value={formWarehouseId}
                  onChange={e => setFormWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">-- Choose Warehouse (Defaults to Primary Hub) --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code}) {w.isDefault ? '— Default Primary Hub' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Material stock reservations and logistics dispatches will be allocated from this facility.
                </span>
              </div>

              {/* Line Items Builder Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Add Items to BOM
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Auto-selects from inventory catalog
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Product Catalog Item
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={e => {
                        setSelectedProductId(e.target.value);
                        setCustomDescription('');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="">-- Pick from Inventory Catalog --</option>
                      {products.map(p => {
                        const whStock = formWarehouseId
                          ? (p.warehouseStocks?.[formWarehouseId] ?? (warehouses.find(w => w.id === formWarehouseId)?.isDefault ? p.currentStock : 0))
                          : p.currentStock;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.name} ({formWarehouseId ? `Facility Stock: ${whStock} ${p.unit} | Total: ${p.currentStock}` : `Stock: ${p.currentStock} ${p.unit}`})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Required Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={itemRequiredQty}
                      onChange={e => setItemRequiredQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to List
                    </button>
                  </div>
                </div>

                {selectedProductId && (() => {
                  const selProd = products.find(p => p.id === selectedProductId);
                  const selWh = warehouses.find(w => w.id === formWarehouseId);
                  const whStock = formWarehouseId && selProd
                    ? (selProd.warehouseStocks?.[formWarehouseId] ?? (selWh?.isDefault ? selProd.currentStock : 0))
                    : selProd?.currentStock;
                  return selProd ? (
                    <div className="flex items-center gap-2 text-[11px] bg-amber-50/70 border border-amber-200/60 p-2 rounded-lg text-amber-900">
                      <span className="font-semibold">Warehouse Availability:</span>
                      <span>
                        {selWh ? selWh.name : 'Primary Logistics Hub'}: <strong>{whStock ?? 0} {selProd.unit}</strong> on-hand
                        {formWarehouseId && <span className="text-slate-500 ml-1.5">(Total across all warehouses: {selProd.currentStock} {selProd.unit})</span>}
                      </span>
                    </div>
                  ) : null;
                })()}

                {lineItemError && (
                  <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                    {lineItemError}
                  </p>
                )}

                {/* Alternatively allow manual description */}
                {!selectedProductId && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Or Custom Non-Inventory Item Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Civil Foundation Screws, Earthing Pit Drilling..."
                      value={customDescription}
                      onChange={e => setCustomDescription(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                {/* Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Est. Unit Cost</th>
                        <th className="p-2.5 text-right">Line Total</th>
                        <th className="p-2.5 text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-800">
                            <div>{it.productName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{it.sku}</span>
                          </td>
                          <td className="p-2.5 text-slate-500">{it.category}</td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            {it.requiredQty} {it.unit}
                          </td>
                          <td className="p-2.5 text-right text-slate-600 font-mono">
                            ₹{it.estimatedUnitCost.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-right font-bold text-amber-700 font-mono">
                            ₹{it.totalCost.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                            No items added yet. Select items from above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {formItems.length > 0 && (
                      <tfoot className="bg-amber-50/50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right text-slate-700">
                            Estimated Total BOM Cost:
                          </td>
                          <td className="p-2.5 text-right text-amber-800 font-mono text-sm">
                            ₹
                            {formItems
                              .reduce((acc, it) => acc + it.totalCost, 0)
                              .toLocaleString('en-IN')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Design & Site Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Notes on structure tilt angle, cable lengths, special safety clamps..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Save Bill of Materials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View BOM Details */}
      {selectedBOMForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  {selectedBOMForView.bomNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  {selectedBOMForView.projectTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBOMForView(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Client</span>
                <span className="font-semibold text-slate-800">{selectedBOMForView.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Capacity</span>
                <span className="font-semibold text-slate-800">{selectedBOMForView.capacityKw} kW</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sourcing Hub</span>
                <span className="font-semibold text-slate-800 truncate block" title={selectedBOMForView.warehouseName || 'Central Hub'}>
                  {selectedBOMForView.warehouseName || 'Central Hub'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status</span>
                <span className="font-semibold text-slate-800">{selectedBOMForView.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Stock Allocated</span>
                <span className="font-semibold text-slate-800">
                  {selectedBOMForView.stockAllocated ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">E-Way Bill</span>
                <span className="font-semibold text-indigo-700 font-mono text-[11px] truncate block">
                  {selectedBOMForView.ewayBillNumber || 'Not Generated'}
                </span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center">Required</th>
                    <th className="p-2.5 text-center">Allocated</th>
                    <th className="p-2.5 text-right">Est. Unit Cost</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedBOMForView.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-medium text-slate-800">{item.productName}</div>
                        <span className="text-[10px] text-slate-400">{item.sku}</span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-700">
                        {item.requiredQty} {item.unit}
                      </td>
                      <td className="p-2.5 text-center font-semibold text-emerald-600">
                        {item.allocatedQty} {item.unit}
                      </td>
                      <td className="p-2.5 text-right text-slate-600 font-mono">
                        ₹{item.estimatedUnitCost.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-800 font-mono">
                        ₹{item.totalCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm font-bold bg-amber-50 p-3 rounded-xl">
              <span className="text-amber-900">Total BOM Cost:</span>
              <span className="text-amber-900 font-mono">
                ₹{selectedBOMForView.totalCost.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedBOMForView;
                  setSelectedBOMForView(null);
                  setSelectedBOMForEWayBill(target);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Generate E-Way Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBOMForView(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Generate & View E-Way Bill */}
      <EWayBillModal
        isOpen={Boolean(selectedBOMForEWayBill)}
        onClose={() => setSelectedBOMForEWayBill(null)}
        bom={selectedBOMForEWayBill}
      />
    </div>
  );
};
