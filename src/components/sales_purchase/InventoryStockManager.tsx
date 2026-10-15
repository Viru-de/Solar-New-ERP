import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { ProductItem, StockMovement, Warehouse } from '../../types/solar';
import {
  Boxes,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  SlidersHorizontal,
  X,
  History,
  CheckCircle,
  Package,
  Layers,
  FileText,
  DollarSign,
  Warehouse as WarehouseIcon,
  ArrowRightLeft,
  Building2
} from 'lucide-react';

export const InventoryStockManager: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'LEVELS' | 'MOVEMENTS'>('LEVELS');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');
  const [movementWarehouseFilter, setMovementWarehouseFilter] = useState<string>('ALL');

  // Modal for Stock Adjustment
  const [adjustingProduct, setAdjustingProduct] = useState<ProductItem | null>(null);
  const [adjustWarehouseId, setAdjustWarehouseId] = useState<string>('');
  const [newCount, setNewCount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Quarterly Physical Count Audit');

  // Modal for Inter-Warehouse Transfer
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferProductId, setTransferProductId] = useState('');
  const [transferFromWhId, setTransferFromWhId] = useState('');
  const [transferToWhId, setTransferToWhId] = useState('');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');

  const products = useMemo(() => storageService.getProducts(), [refreshTrigger]);
  const movements = useMemo(() => storageService.getStockMovements(), [refreshTrigger]);
  const warehouses = useMemo(() => storageService.getWarehouses(), [refreshTrigger]);
  const defaultWarehouse = useMemo(() => storageService.getDefaultWarehouse(), [warehouses]);

  // Helper to get stock for a specific warehouse
  const getProductStockInWarehouse = (p: ProductItem, whId: string) => {
    if (whId === 'ALL') return p.currentStock;
    const targetWh = warehouses.find(w => w.id === whId);
    if (p.warehouseStocks && p.warehouseStocks[whId] !== undefined) {
      return p.warehouseStocks[whId];
    }
    // Fallback if no explicit breakdown exists yet: default warehouse holds the balance
    return targetWh?.isDefault ? p.currentStock : 0;
  };

  // Inventory valuation & health metrics
  const inventoryMetrics = useMemo(() => {
    let totalValuation = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      const stock = getProductStockInWarehouse(p, selectedWarehouseId);
      totalUnits += stock;
      totalValuation += stock * (p.unitPrice || 0);
      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= p.minStockThreshold) {
        lowStockCount++;
      }
    });

    return { totalValuation, totalUnits, lowStockCount, outOfStockCount };
  }, [products, selectedWarehouseId, warehouses]);

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return products;

    return products.filter(p => {
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  const filteredMovements = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return movements.filter(m => {
      const matchesSearch =
        !q ||
        (m.productName || '').toLowerCase().includes(q) ||
        (m.sku || '').toLowerCase().includes(q) ||
        (m.referenceNumber && (m.referenceNumber || '').toLowerCase().includes(q));
      const matchesType = movementFilter === 'ALL' || m.movementType === movementFilter;
      const matchesWarehouse =
        movementWarehouseFilter === 'ALL' ||
        m.warehouseId === movementWarehouseFilter ||
        m.targetWarehouseId === movementWarehouseFilter;
      return matchesSearch && matchesType && matchesWarehouse;
    });
  }, [movements, searchQuery, movementFilter, movementWarehouseFilter]);

  const handleOpenAdjust = (p: ProductItem) => {
    const initialWhId = selectedWarehouseId !== 'ALL' ? selectedWarehouseId : (defaultWarehouse?.id || warehouses[0]?.id || '');
    setAdjustingProduct(p);
    setAdjustWarehouseId(initialWhId);
    setNewCount(getProductStockInWarehouse(p, initialWhId));
    setAdjustReason('Physical Inventory Audit');
  };

  const handleAdjustWarehouseChange = (whId: string) => {
    setAdjustWarehouseId(whId);
    if (adjustingProduct) {
      setNewCount(getProductStockInWarehouse(adjustingProduct, whId));
    }
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const targetWh = warehouses.find(w => w.id === adjustWarehouseId) || defaultWarehouse;

    storageService.adjustStock(
      adjustingProduct.id,
      newCount,
      adjustReason,
      currentUser?.name || 'Operations Supervisor',
      targetWh.id,
      targetWh.name
    );
    triggerRefresh();
    showToast(`Inventory count updated for ${adjustingProduct.sku} at ${targetWh.name}`, 'success');
    setAdjustingProduct(null);
  };

  // Open Transfer Modal
  const handleOpenTransfer = (initialProduct?: ProductItem) => {
    setTransferProductId(initialProduct ? initialProduct.id : (products[0]?.id || ''));
    setTransferFromWhId(warehouses[0]?.id || '');
    setTransferToWhId(warehouses[1]?.id || warehouses[0]?.id || '');
    setTransferQty(1);
    setTransferNotes('Inter-hub stock replenishment');
    setTransferError('');
    setIsTransferModalOpen(true);
  };

  // Submit Inter-Warehouse Transfer
  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (!transferProductId) {
      setTransferError('Please select a product to transfer');
      return;
    }
    if (transferFromWhId === transferToWhId) {
      setTransferError('Source and destination warehouse must be different');
      return;
    }
    if (transferQty <= 0) {
      setTransferError('Transfer quantity must be greater than 0');
      return;
    }

    const prod = products.find(p => p.id === transferProductId);
    if (!prod) return;

    const fromWh = warehouses.find(w => w.id === transferFromWhId);
    const toWh = warehouses.find(w => w.id === transferToWhId);
    if (!fromWh || !toWh) return;

    const availableStock = getProductStockInWarehouse(prod, transferFromWhId);
    if (availableStock < transferQty) {
      setTransferError(`Insufficient stock in ${fromWh.name}. Available: ${availableStock} ${prod.unit}`);
      return;
    }

    const result = storageService.transferStock(
      prod.id,
      fromWh.id,
      toWh.id,
      transferQty,
      transferNotes,
      currentUser?.name || 'Logistics Coordinator'
    );

    if (!result.success) {
      setTransferError(result.message || 'Transfer failed');
      return;
    }

    triggerRefresh();
    showToast(`Transferred ${transferQty} ${prod.unit} from ${fromWh.name} to ${toWh.name}`, 'success');
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Valuation Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Stock Valuation
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
            ₹{inventoryMetrics.totalValuation.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            At purchase cost across {products.length} SKUs
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Units On-Hand
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-700 mt-2 font-mono">
            {inventoryMetrics.totalUnits.toLocaleString('en-IN')} Units
          </div>
          <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
            Modules, inverters, cables & hardware
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Reorders
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-700 mt-2 font-mono">
            {inventoryMetrics.lowStockCount} Items
          </div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
            Below safe minimum threshold
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stock Audit Logs
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2 font-mono">
            {movements.length} Transactions
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Automated synchronization history
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('LEVELS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeSubTab === 'LEVELS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Live Stock Levels & Adjustments
          </button>
          <button
            onClick={() => setActiveSubTab('MOVEMENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeSubTab === 'MOVEMENTS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Stock Movements & Audit Ledger ({filteredMovements.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Facility / Warehouse Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <WarehouseIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-500 text-[11px]">Warehouse:</span>
            <select
              value={activeSubTab === 'LEVELS' ? selectedWarehouseId : movementWarehouseFilter}
              onChange={e => {
                if (activeSubTab === 'LEVELS') {
                  setSelectedWarehouseId(e.target.value);
                } else {
                  setMovementWarehouseFilter(e.target.value);
                }
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Facilities (Global Balance)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Stock Button */}
          <button
            onClick={() => handleOpenTransfer()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer Stock
          </button>

          {/* Search */}
          <div className="relative w-52 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items or logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Live Stock Levels Table */}
      {activeSubTab === 'LEVELS' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">SKU & Item Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Facility / Location</th>
                  <th className="p-3.5 text-center">
                    {selectedWarehouseId === 'ALL' ? 'Total On-Hand' : 'Warehouse Stock'}
                  </th>
                  <th className="p-3.5 text-center">Safety Min</th>
                  <th className="p-3.5 text-right">Valuation (₹)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => {
                  const currentStockInTarget = getProductStockInWarehouse(p, selectedWarehouseId);
                  const isLow = currentStockInTarget <= p.minStockThreshold;
                  const itemValuation = currentStockInTarget * (p.unitPrice || 0);
                  const ratio = Math.min(100, Math.round((currentStockInTarget / (p.minStockThreshold * 2.5)) * 100));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>{p.sku}</span>
                          <span>•</span>
                          <span>{p.brand}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">{p.category}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs">
                        {selectedWarehouseId !== 'ALL' ? (
                          <div>
                            <span className="font-medium text-slate-800">
                              {warehouses.find(w => w.id === selectedWarehouseId)?.name || 'Specified Hub'}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              Bin / Bay: {p.location || 'Aisle 1'}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-500 font-medium">Distributed:</span>
                            <div className="flex flex-wrap gap-1">
                              {warehouses.map(w => {
                                const stockInWh = getProductStockInWarehouse(p, w.id);
                                if (stockInWh <= 0) return null;
                                return (
                                  <span
                                    key={w.id}
                                    className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono"
                                    title={`${w.name}: ${stockInWh} ${p.unit}`}
                                  >
                                    {w.code}: {stockInWh}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isLow ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {currentStockInTarget} {p.unit}
                        </span>
                        {/* Mini visual gauge */}
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isLow ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, ratio)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-500">
                        {p.minStockThreshold} {p.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        ₹{itemValuation.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            currentStockInTarget <= 0
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {currentStockInTarget <= 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => handleOpenTransfer(p)}
                            className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-semibold transition-colors"
                            title="Transfer to another warehouse"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movements Audit Ledger */}
      {activeSubTab === 'MOVEMENTS' && (
        <div className="space-y-4">
          {/* Movement Type Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'PURCHASE_RECEIPT', 'BOM_ALLOCATION', 'WAREHOUSE_TRANSFER', 'AUDIT_RECONCILIATION', 'INVOICE_SALE', 'ADJUSTMENT'].map(
              type => (
                <button
                  key={type}
                  onClick={() => setMovementFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    movementFilter === type
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              )
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Transaction Type</th>
                    <th className="p-3.5">Item & SKU</th>
                    <th className="p-3.5">Warehouse / Facility</th>
                    <th className="p-3.5 text-center">Change Qty</th>
                    <th className="p-3.5 text-center">Balance After</th>
                    <th className="p-3.5">Reference Document</th>
                    <th className="p-3.5">Notes & Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.map(m => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(m.timestamp).toLocaleDateString()}{' '}
                          <span className="text-[10px] text-slate-400">
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                              m.movementType === 'PURCHASE_RECEIPT'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : m.movementType === 'BOM_ALLOCATION'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : m.movementType === 'WAREHOUSE_TRANSFER'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : m.movementType === 'AUDIT_RECONCILIATION'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : m.movementType === 'INVOICE_SALE'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            )}
                            {m.movementType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{m.productName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{m.sku}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700">
                          {m.movementType === 'WAREHOUSE_TRANSFER' ? (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span>{m.warehouseName || 'Hub'}</span>
                              <ArrowRightLeft className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{m.targetWarehouseName || 'Hub'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <WarehouseIcon className="w-3 h-3 text-slate-400" />
                              <span>{m.warehouseName || 'Central Solar Logistics Hub'}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono font-semibold text-slate-800">
                          {m.balanceAfter}
                        </td>
                        <td className="p-3.5 font-mono text-amber-700 font-bold whitespace-nowrap">
                          {m.referenceNumber || 'MANUAL-ADJ'}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <div>{m.notes}</div>
                          {m.performedBy && (
                            <span className="text-[10px] text-slate-400">by {m.performedBy}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        No stock movement records found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Stock Adjustment */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-mono">
                  {adjustingProduct.sku}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Manual Stock Count Adjustment</h3>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Product:</span>
                <span className="font-semibold text-slate-800 text-sm block">
                  {adjustingProduct.name}
                </span>
              </div>

              {/* Target Warehouse Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reconcile for Warehouse Facility *
                </label>
                <select
                  value={adjustWarehouseId}
                  onChange={e => handleAdjustWarehouseChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code}) {w.isDefault ? '— Default Primary' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Current Stock at this facility: <strong>{getProductStockInWarehouse(adjustingProduct, adjustWarehouseId)} {adjustingProduct.unit}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Physical On-Hand Count ({adjustingProduct.unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCount}
                  onChange={e => setNewCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="Quarterly Physical Count Audit">Quarterly Physical Count Audit</option>
                  <option value="Damaged / Scrapped during transport">
                    Damaged / Scrapped during transport
                  </option>
                  <option value="Returned from Project Site">Returned from Project Site</option>
                  <option value="Supplier Replacement Delivery">Supplier Replacement Delivery</option>
                  <option value="Inventory Reconciliation Correction">
                    Inventory Reconciliation Correction
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inter-Warehouse Stock Transfer */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Inter-Warehouse Stock Transfer</h3>
                  <p className="text-xs text-slate-500">Relocate solar inventory items between registered hubs</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {transferError}
              </div>
            )}

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              {/* Product */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Product Item *
                </label>
                <select
                  required
                  value={transferProductId}
                  onChange={e => setTransferProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="">-- Choose Equipment SKU --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} (Total: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source & Destination Warehouses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    From Warehouse (Source) *
                  </label>
                  <select
                    required
                    value={transferFromWhId}
                    onChange={e => setTransferFromWhId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  {transferProductId && (
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Available: <strong>{getProductStockInWarehouse(products.find(p => p.id === transferProductId)!, transferFromWhId)} units</strong>
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To Warehouse (Destination) *
                  </label>
                  <select
                    required
                    value={transferToWhId}
                    onChange={e => setTransferToWhId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} disabled={w.id === transferFromWhId}>
                        {w.name} {w.id === transferFromWhId ? '(Source)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transfer Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferQty}
                  onChange={e => setTransferQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              {/* Transfer Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internal Transfer Notes & Dispatch Challan Ref
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  placeholder="e.g. DC-2026-081, Transferred for Project Alpha site readiness"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Execute Stock Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
