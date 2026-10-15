import React, { useState, useMemo } from 'react';
import { ProductItem, StockMovement, StockAuditRecord, Warehouse } from '../../types/solar';
import { ReportFilterState, ReportCategoryMeta } from '../../types/reports';
import { exportToCSV } from '../../services/exportImport';
import { storageService } from '../../services/storage';
import { ReportFilterBar } from './ReportFilterBar';
import {
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Boxes,
  Warehouse as WarehouseIcon,
  History,
  ClipboardCheck,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface ProductStockReportProps {
  products: ProductItem[];
  filters: ReportFilterState;
  onFilterChange: (updated: Partial<ReportFilterState>) => void;
  onFilterReset: () => void;
  meta: ReportCategoryMeta;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const ProductStockReport: React.FC<ProductStockReportProps> = ({
  products,
  filters,
  onFilterChange,
  onFilterReset,
  meta,
  showToast
}) => {
  const [activeReportSubTab, setActiveReportSubTab] = useState<'LEVELS' | 'MOVEMENTS' | 'AUDITS'>('LEVELS');

  const warehouses = useMemo(() => storageService.getWarehouses(), []);
  const allMovements = useMemo(() => storageService.getStockMovements(), []);
  const allAudits = useMemo(() => storageService.getStockAudits(), []);

  // Helper to get warehouse-specific stock
  const getProductStock = (p: ProductItem, whId?: string) => {
    if (!whId || whId === 'ALL') return p.currentStock;
    const targetWh = warehouses.find(w => w.id === whId);
    if (p.warehouseStocks && p.warehouseStocks[whId] !== undefined) {
      return p.warehouseStocks[whId];
    }
    return targetWh?.isDefault ? p.currentStock : 0;
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Date filter (if product has createdAt)
      if (p.createdAt) {
        if (filters.fromDate && p.createdAt < filters.fromDate) return false;
        if (filters.toDate && p.createdAt > filters.toDate) return false;
      }

      // Name / SKU / Category filter
      if (filters.name.trim()) {
        const query = filters.name.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesHsn = (p.hsnCode || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesCategory && !matchesHsn) return false;
      }

      // Status filter based on stock in the selected warehouse (or global)
      const stock = getProductStock(p, filters.warehouseId);
      if (filters.status && filters.status !== 'ALL') {
        const threshold = p.minStockThreshold ?? 10;
        const isOut = stock <= 0;
        const isLow = stock > 0 && stock <= threshold;
        const isIn = stock > threshold;

        if (filters.status === 'OUT_OF_STOCK' && !isOut) return false;
        if (filters.status === 'LOW_STOCK' && !isLow) return false;
        if (filters.status === 'IN_STOCK' && !isIn) return false;
      }

      return true;
    });
  }, [products, filters, warehouses]);

  // Filtered Stock Movements
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      // Date filter
      if (filters.fromDate && m.timestamp.slice(0, 10) < filters.fromDate) return false;
      if (filters.toDate && m.timestamp.slice(0, 10) > filters.toDate) return false;

      // Search keyword filter
      if (filters.name.trim()) {
        const q = filters.name.toLowerCase();
        const matchesProd = m.productName.toLowerCase().includes(q);
        const matchesSku = m.sku.toLowerCase().includes(q);
        const matchesRef = (m.referenceNumber || '').toLowerCase().includes(q);
        const matchesWh = (m.warehouseName || '').toLowerCase().includes(q);
        if (!matchesProd && !matchesSku && !matchesRef && !matchesWh) return false;
      }

      // Warehouse facility filter
      if (filters.warehouseId && filters.warehouseId !== 'ALL') {
        const matchesWh =
          m.warehouseId === filters.warehouseId ||
          m.targetWarehouseId === filters.warehouseId;
        if (!matchesWh) return false;
      }

      return true;
    });
  }, [allMovements, filters]);

  // Filtered Stock Audits
  const filteredAudits = useMemo(() => {
    return allAudits.filter(a => {
      // Date filter
      if (filters.fromDate && a.auditDate < filters.fromDate) return false;
      if (filters.toDate && a.auditDate > filters.toDate) return false;

      // Search keyword filter
      if (filters.name.trim()) {
        const q = filters.name.toLowerCase();
        const matchesNum = a.auditNumber.toLowerCase().includes(q);
        const matchesWh = a.warehouseName.toLowerCase().includes(q);
        const matchesAuditor = a.auditedBy.toLowerCase().includes(q);
        if (!matchesNum && !matchesWh && !matchesAuditor) return false;
      }

      // Warehouse facility filter
      if (filters.warehouseId && filters.warehouseId !== 'ALL') {
        if (a.warehouseId !== filters.warehouseId) return false;
      }

      return true;
    });
  }, [allAudits, filters]);

  // Aggregate KPIs
  const totalCostValuation = filteredProducts.reduce((sum, p) => {
    const stock = getProductStock(p, filters.warehouseId);
    return sum + Math.max(0, stock) * (p.unitPrice || 0);
  }, 0);

  const totalRetailValuation = filteredProducts.reduce((sum, p) => {
    const stock = getProductStock(p, filters.warehouseId);
    return sum + Math.max(0, stock) * (p.sellingPrice || 0);
  }, 0);

  const lowStockCount = filteredProducts.filter(p => {
    const stock = getProductStock(p, filters.warehouseId);
    return stock > 0 && stock <= (p.minStockThreshold ?? 10);
  }).length;

  const outOfStockCount = filteredProducts.filter(p => {
    const stock = getProductStock(p, filters.warehouseId);
    return stock <= 0;
  }).length;

  const inStockCount = filteredProducts.filter(p => {
    const stock = getProductStock(p, filters.warehouseId);
    return stock > (p.minStockThreshold ?? 10);
  }).length;

  // Category breakdown for chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number }> = {};
    filteredProducts.forEach(p => {
      const cat = p.category || 'Other';
      if (!map[cat]) map[cat] = { name: cat, value: 0, count: 0 };
      const stock = getProductStock(p, filters.warehouseId);
      map[cat].value += Math.max(0, stock) * (p.unitPrice || 0);
      map[cat].count += 1;
    });
    return Object.values(map);
  }, [filteredProducts, filters.warehouseId, warehouses]);

  const selectedWarehouse = useMemo(() => {
    if (!filters.warehouseId || filters.warehouseId === 'ALL') return null;
    return warehouses.find(w => w.id === filters.warehouseId) || null;
  }, [warehouses, filters.warehouseId]);

  // Dynamic CSV Export
  const handleExportCSV = () => {
    if (activeReportSubTab === 'LEVELS') {
      const headers = [
        'SKU',
        'Product Name',
        'Category',
        'HSN Code',
        'Unit',
        'Warehouse Hub',
        'Available Stock',
        'Min Alert Level',
        'Cost Price (INR)',
        'Selling Price (INR)',
        'Total Cost Valuation (INR)',
        'Stock Status'
      ];
      const rows = filteredProducts.map(p => {
        const stock = getProductStock(p, filters.warehouseId);
        const threshold = p.minStockThreshold ?? 10;
        let status = 'In Stock';
        if (stock <= 0) status = 'Out of Stock';
        else if (stock <= threshold) status = 'Low Stock';

        return [
          p.sku,
          p.name,
          p.category,
          p.hsnCode || 'N/A',
          p.unit,
          selectedWarehouse ? selectedWarehouse.name : 'All Facilities',
          stock,
          threshold,
          p.unitPrice,
          p.sellingPrice,
          Math.max(0, stock) * (p.unitPrice || 0),
          status
        ];
      });
      exportToCSV(
        `SolarPulse_Stock_Valuation_${selectedWarehouse ? selectedWarehouse.code : 'All_Hubs'}_${new Date().toISOString().slice(0, 10)}`,
        headers,
        rows
      );
      showToast('Warehouse stock report exported to CSV', 'success');
    } else if (activeReportSubTab === 'MOVEMENTS') {
      const headers = [
        'Timestamp',
        'Transaction Type',
        'SKU',
        'Product Name',
        'Facility / Route',
        'Change Quantity',
        'Balance After',
        'Reference Document',
        'Performed By',
        'Notes'
      ];
      const rows = filteredMovements.map(m => [
        m.timestamp,
        m.movementType,
        m.sku,
        m.productName,
        m.movementType === 'WAREHOUSE_TRANSFER'
          ? `${m.warehouseName || 'Hub'} -> ${m.targetWarehouseName || 'Hub'}`
          : (m.warehouseName || 'Central Solar Logistics Hub'),
        m.quantity,
        m.balanceAfter,
        m.referenceNumber || 'N/A',
        m.performedBy || 'System',
        m.notes || ''
      ]);
      exportToCSV(
        `SolarPulse_Stock_Movements_Ledger_${new Date().toISOString().slice(0, 10)}`,
        headers,
        rows
      );
      showToast('Stock movements ledger exported to CSV', 'success');
    } else {
      const headers = [
        'Audit Number',
        'Facility Name',
        'Audit Date',
        'Audited By',
        'Status',
        'Items Audited',
        'Discrepancies Found',
        'Net Value Adjustment (INR)',
        'Notes'
      ];
      const rows = filteredAudits.map(a => [
        a.auditNumber,
        a.warehouseName,
        a.auditDate,
        a.auditedBy,
        a.status,
        a.itemsAudited,
        a.discrepanciesFound,
        a.netAdjustmentValue,
        a.notes
      ]);
      exportToCSV(
        `SolarPulse_Physical_Audits_Register_${new Date().toISOString().slice(0, 10)}`,
        headers,
        rows
      );
      showToast('Physical audits register exported to CSV', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar
        filters={filters}
        onChange={onFilterChange}
        onReset={onFilterReset}
        onExportCSV={handleExportCSV}
        onPrint={() => window.print()}
        categoryMeta={meta}
        totalCount={products.length}
        filteredCount={filteredProducts.length}
        showWarehouseFilter={true}
        warehouses={warehouses}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {selectedWarehouse ? `${selectedWarehouse.code} Valuation` : 'Inventory Valuation'}
            </span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{totalCostValuation.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Retail potential: ₹{totalRetailValuation.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Healthy Stock</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            {inStockCount} SKUs
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Stock comfortably above threshold</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Low Stock Alerts</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
            {lowStockCount} SKUs
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Below re-order safety threshold</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Out of Stock</span>
            <span className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2 font-mono">
            {outOfStockCount} SKUs
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Requires immediate procurement</p>
        </div>
      </div>

      {/* Donut Chart: Stock Asset Valuation by Category */}
      {categoryChartData.length > 0 && categoryChartData.some(d => d.value > 0) && activeReportSubTab === 'LEVELS' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Stock Asset Valuation by Category {selectedWarehouse ? `(${selectedWarehouse.name})` : '(All Hubs)'}
              </h3>
              <p className="text-xs text-slate-500">Category stock-value share in panels, inverters, and BOS hardware</p>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.filter(d => d.value > 0).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Stock Value']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sub-tab Navigation for Multi-Warehouse Reports */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReportSubTab('LEVELS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeReportSubTab === 'LEVELS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Warehouse Stock Levels ({filteredProducts.length})
        </button>
        <button
          onClick={() => setActiveReportSubTab('MOVEMENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeReportSubTab === 'MOVEMENTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          BOM & Stock Movement Ledger ({filteredMovements.length})
        </button>
        <button
          onClick={() => setActiveReportSubTab('AUDITS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeReportSubTab === 'AUDITS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Warehouse Physical Audits ({filteredAudits.length})
        </button>
      </div>

      {/* View 1: Equipment Stock Valuation Register */}
      {activeReportSubTab === 'LEVELS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Equipment Stock Valuation Register {selectedWarehouse ? `— ${selectedWarehouse.name}` : ''}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time inventory levels, unit costs, and valuations</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {filteredProducts.length} Products
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Facility Distribution</th>
                  <th className="py-3 px-4 text-right">
                    {selectedWarehouse ? `${selectedWarehouse.code} Qty` : 'Available Qty'}
                  </th>
                  <th className="py-3 px-4 text-right">Min Alert</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Total Valuation</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No products found matching filters</p>
                      <p className="text-[11px] text-slate-400 mt-1">Adjust your filters to inspect more stock items</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const currentStockInScope = getProductStock(p, filters.warehouseId);
                    const valuation = Math.max(0, currentStockInScope) * (p.unitPrice || 0);
                    const isOut = currentStockInScope <= 0;
                    const threshold = p.minStockThreshold ?? 10;
                    const isLow = currentStockInScope > 0 && currentStockInScope <= threshold;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {p.sku}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {p.name}
                          {(p.specification || p.brand) && (
                            <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[200px]">
                              {p.specification || p.brand}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          {selectedWarehouse ? (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <WarehouseIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{selectedWarehouse.name}</span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {warehouses.map(w => {
                                const stockInWh = getProductStock(p, w.id);
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
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap font-mono">
                          {currentStockInScope}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                          {threshold} {p.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          ₹{p.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{valuation.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: BOM & Stock Movement Ledger */}
      {activeReportSubTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                BOM & Inventory Movements Audit Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological movements: BOM allocation, receipts, transfers, and reconciliations
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {filteredMovements.length} Transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Facility / Route</th>
                  <th className="py-3 px-4 text-center">Change Qty</th>
                  <th className="py-3 px-4 text-center">Balance</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Performed By & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No stock movement transactions found</p>
                      <p className="text-[11px] text-slate-400 mt-1">Try relaxing date or warehouse filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(m.timestamp).toLocaleDateString()}{' '}
                          <span className="text-[10px] text-slate-400">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
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
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{m.productName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{m.sku}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {m.movementType === 'WAREHOUSE_TRANSFER' ? (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span>{m.warehouseName || 'Hub'}</span>
                              <ArrowRightLeft className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{m.targetWarehouseName || 'Hub'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <WarehouseIcon className="w-3.5 h-3.5 text-amber-600" />
                              <span>{m.warehouseName || 'Central Solar Logistics Hub'}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">
                          {m.balanceAfter}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700 whitespace-nowrap">
                          {m.referenceNumber || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          <div>{m.notes}</div>
                          {m.performedBy && <span className="text-[10px] text-slate-400">by {m.performedBy}</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Warehouse Physical Audits Register */}
      {activeReportSubTab === 'AUDITS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Warehouse Physical Audits & Reconciliations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical count verifications, auditor logs, variance reconciliations, and net valuation adjustments
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {filteredAudits.length} Audits
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Warehouse Facility</th>
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4">Audited By</th>
                  <th className="py-3 px-4 text-center">Items Checked</th>
                  <th className="py-3 px-4 text-center">Variances</th>
                  <th className="py-3 px-4 text-right">Net Adjustment (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Notes & Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No physical audit records found</p>
                      <p className="text-[11px] text-slate-400 mt-1">Execute a physical count audit in Warehouse Management</p>
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map(audit => (
                    <tr key={audit.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {audit.auditNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <WarehouseIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>{audit.warehouseName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{audit.auditDate}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{audit.auditedBy}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                        {audit.itemsAudited} SKUs
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            audit.discrepanciesFound > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {audit.discrepanciesFound} items
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {audit.netAdjustmentValue >= 0 ? '+' : ''}
                        ₹{audit.netAdjustmentValue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {audit.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={audit.notes}>
                        {audit.notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
