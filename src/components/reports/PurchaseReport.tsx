import React, { useMemo } from 'react';
import { PurchaseOrder } from '../../types/solar';
import { ReportFilterState, ReportCategoryMeta } from '../../types/reports';
import { exportToCSV } from '../../services/exportImport';
import { storageService } from '../../services/storage';
import { ReportFilterBar } from './ReportFilterBar';
import { ShoppingCart, PackageCheck, Clock, Percent, Building2, Warehouse as WarehouseIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const CHART_COLORS = [
  '#3b82f6',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#e11d48'
];

interface PurchaseReportProps {
  orders: PurchaseOrder[];
  filters: ReportFilterState;
  onFilterChange: (updated: Partial<ReportFilterState>) => void;
  onFilterReset: () => void;
  meta: ReportCategoryMeta;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PurchaseReport: React.FC<PurchaseReportProps> = ({
  orders,
  filters,
  onFilterChange,
  onFilterReset,
  meta,
  showToast
}) => {
  const warehouses = useMemo(() => storageService.getWarehouses(), []);

  const filteredOrders = useMemo(() => {
    return orders.filter(po => {
      // Date filter
      if (filters.fromDate && po.purchaseDate < filters.fromDate) return false;
      if (filters.toDate && po.purchaseDate > filters.toDate) return false;

      // Name filter
      if (filters.name.trim()) {
        const query = filters.name.toLowerCase();
        const matchesVendor = po.vendorName.toLowerCase().includes(query);
        const matchesNumber = po.purchaseNumber.toLowerCase().includes(query);
        const matchesProject = (po.projectTitle || '').toLowerCase().includes(query);
        const matchesWarehouse = (po.warehouseName || '').toLowerCase().includes(query);
        if (!matchesVendor && !matchesNumber && !matchesProject && !matchesWarehouse) return false;
      }

      // Warehouse facility filter
      if (filters.warehouseId && filters.warehouseId !== 'ALL') {
        if (po.warehouseId !== filters.warehouseId) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        if (po.status !== filters.status && po.paymentStatus !== filters.status) return false;
      }

      return true;
    });
  }, [orders, filters]);

  // Aggregate KPIs
  const totalPurchaseValue = filteredOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
  const totalInputTaxCredit = filteredOrders.reduce((sum, po) => sum + (po.taxAmount || 0), 0);
  const receivedOrders = filteredOrders.filter(po => po.status === 'RECEIVED').length;
  const pendingDelivery = filteredOrders.filter(po => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED' || po.status === 'DRAFT').length;

  // Chart data by Vendor: Vendor Spend Share
  const vendorSpendShare = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(po => {
      const v = po.vendorName || 'General Vendor';
      map[v] = (map[v] || 0) + (po.totalAmount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  const handleExportCSV = () => {
    const headers = [
      'PO Number',
      'Order Date',
      'Vendor Name',
      'Destination Warehouse',
      'Linked Project',
      'Item Count',
      'Subtotal (INR)',
      'GST Tax (INR)',
      'Total Amount (INR)',
      'PO Status',
      'Payment Status',
      'Delivery Date'
    ];
    const rows = filteredOrders.map(po => [
      po.purchaseNumber,
      po.purchaseDate,
      po.vendorName,
      po.warehouseName || 'Central Solar Logistics Hub',
      po.projectTitle || 'General Inventory',
      po.items ? po.items.length : 0,
      po.subtotal,
      po.taxAmount,
      po.totalAmount,
      po.status,
      po.paymentStatus,
      po.expectedDeliveryDate || po.receivedDate || 'N/A'
    ]);
    exportToCSV(`SolarPulse_Purchase_Report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('Purchase report exported to CSV', 'success');
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PARTIALLY_RECEIVED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ORDERED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
        totalCount={orders.length}
        filteredCount={filteredOrders.length}
        showWarehouseFilter={true}
        warehouses={warehouses}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Purchases</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalPurchaseValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {filteredOrders.length} purchase orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Received / Fulfilled</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {receivedOrders} Orders
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Stock successfully added to warehouse</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Inbound</span>
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {pendingDelivery} Orders
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Drafted or issued to manufacturers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">GST Input Tax Credit</span>
            <span className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            ₹{totalInputTaxCredit.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Eligible for GST portal set-off</p>
        </div>
      </div>

      {/* Donut Chart: Vendor Spend Share */}
      {vendorSpendShare.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Vendor Procurement Spend Share</h3>
          <p className="text-xs text-slate-500 mb-4">Proportion of procurement spend allocated across equipment and service vendors</p>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vendorSpendShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {vendorSpendShare.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spend Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Purchase Orders Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">Procurement transactions with manufacturers & suppliers</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {filteredOrders.length} Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-4">PO #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vendor Name</th>
                <th className="py-3 px-4">Destination Facility</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">GST (Tax)</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Order Status</th>
                <th className="py-3 px-4 text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No purchase orders found matching your filters</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try clearing or relaxing your filter parameters</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {po.purchaseNumber}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{po.purchaseDate}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{po.vendorName}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <WarehouseIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{po.warehouseName || 'Central Solar Logistics Hub'}</span>
                      </div>
                      {po.projectTitle && (
                        <span className="block text-[10px] text-slate-400 truncate max-w-[160px]">
                          Proj: {po.projectTitle}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {po.items ? po.items.length : 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      ₹{po.subtotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      ₹{po.taxAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{po.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(
                          po.status
                        )}`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                          po.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {po.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
