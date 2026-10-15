import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { PurchaseOrder, PurchaseLineItem, Vendor, ProductItem, SolarProject } from '../../types/solar';
import { validatePOLineItem, validatePOLineItems, validatePurchaseOrder } from '../../services/validation';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Truck,
  Trash2,
  Eye,
  AlertTriangle,
  X,
  PackagePlus,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  Edit3,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { GoodsReceiptModal } from './purchase_order/GoodsReceiptModal';
import { EditPurchaseOrderModal } from './purchase_order/EditPurchaseOrderModal';
import { PurchaseOrderSummaryModal } from './purchase_order/PurchaseOrderSummaryModal';

export const PurchaseOrderEntry: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  // Form states for creating new PO
  const [formVendorId, setFormVendorId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [formExpectedDate, setFormExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [formPaymentStatus, setFormPaymentStatus] = useState<PurchaseOrder['paymentStatus']>('UNPAID');
  const [formPaymentDueDate, setFormPaymentDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [lineItemError, setLineItemError] = useState('');
  const [formError, setFormError] = useState('');

  // Line items state for creating new PO
  const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemTaxRate, setItemTaxRate] = useState<number>(12);

  const orders = useMemo(() => storageService.getPurchaseOrders(), [refreshTrigger]);
  const vendors = useMemo(() => storageService.getVendors(), [refreshTrigger]);
  const products = useMemo(() => storageService.getProducts(), [refreshTrigger]);
  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);
  const warehouses = useMemo(() => storageService.getWarehouses(), [refreshTrigger]);

  const metrics = useMemo(() => {
    const totalPurchases = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingDeliveries = orders.filter(o => o.status === 'ORDERED' || o.status === 'PARTIALLY_RECEIVED').length;
    const partialDeliveries = orders.filter(o => o.status === 'PARTIALLY_RECEIVED').length;
    const receivedOrders = orders.filter(o => o.status === 'RECEIVED').length;
    const totalPendingPayment = orders
      .filter(o => o.paymentStatus !== 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { totalPurchases, pendingDeliveries, partialDeliveries, receivedOrders, totalPendingPayment };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return orders.filter(o => {
      const matchesSearch =
        !q ||
        (o.purchaseNumber || '').toLowerCase().includes(q) ||
        (o.vendorName || '').toLowerCase().includes(q) ||
        ((o.projectTitle || '').toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // When a product is chosen in line items builder
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    setLineItemError('');
    if (!prodId) return;

    // Check if product is already in line items
    const existing = lineItems.find(it => it.productId === prodId);
    if (existing) {
      const prod = products.find(p => p.id === prodId);
      const msg = `Product "${prod?.name || prodId}" is already added to this Purchase Order (Ordered: ${existing.orderedQuantity} ${existing.unit}). Please adjust the existing item quantity instead of adding it again.`;
      setLineItemError(msg);
      showToast(msg, 'warning');
      return;
    }

    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setItemUnitPrice(prod.unitPrice);
      if (prod.preferredVendorId && !formVendorId) {
        setFormVendorId(prod.preferredVendorId);
      }
    }
  };

  const handleAddLineItem = () => {
    setLineItemError('');
    if (!selectedProductId) {
      setLineItemError('Please select a product from catalog.');
      showToast('Please select a product from catalog', 'warning');
      return;
    }
    if (itemQty <= 0 || itemUnitPrice <= 0) {
      setLineItemError('Quantity and Unit Price must be greater than 0.');
      showToast('Quantity and Unit Price must be greater than 0', 'warning');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Strict duplicate check before adding
    const candidateItem: Partial<PurchaseLineItem> = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku
    };
    const duplicateValidation = validatePOLineItem(candidateItem, lineItems);
    if (!duplicateValidation.valid) {
      const msg = duplicateValidation.message || `Product "${prod.name}" is already included in this Purchase Order.`;
      setLineItemError(msg);
      showToast(msg, 'warning');
      return;
    }

    const baseAmount = itemQty * itemUnitPrice;
    const taxAmt = Math.round((baseAmount * itemTaxRate) / 100);
    const totalAmt = baseAmount + taxAmt;

    const newItem: PurchaseLineItem = {
      id: `poi-${Date.now()}-${lineItems.length}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      category: prod.category,
      orderedQuantity: itemQty,
      receivedQuantity: 0,
      pendingQuantity: itemQty,
      rejectedQuantity: 0,
      unit: prod.unit,
      unitPrice: itemUnitPrice,
      taxPercent: itemTaxRate,
      taxAmount: taxAmt,
      totalAmount: totalAmt,
      quantity: itemQty,
      taxRatePercent: itemTaxRate,
      totalPrice: totalAmt
    };

    setLineItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setItemQty(10);
    setItemUnitPrice(0);
    setLineItemError('');
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
    setLineItemError('');
    setFormError('');
  };

  const formSubtotal = useMemo(() => {
    return lineItems.reduce((acc, it) => acc + it.orderedQuantity * it.unitPrice, 0);
  }, [lineItems]);

  const formTaxTotal = useMemo(() => {
    return lineItems.reduce((acc, it) => acc + it.taxAmount, 0);
  }, [lineItems]);

  const formGrandTotal = formSubtotal + formTaxTotal;

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formVendorId) {
      setFormError('Please select a vendor.');
      showToast('Please select a vendor', 'warning');
      return;
    }

    if (lineItems.length === 0) {
      setFormError('Please add at least one line item to the purchase order.');
      showToast('Please add at least one line item to the purchase order', 'warning');
      return;
    }

    // Strict duplicate check on line items before creating PO
    const duplicateValidation = validatePOLineItems(lineItems);
    if (!duplicateValidation.valid) {
      const msg = duplicateValidation.message || 'Duplicate products found in Purchase Order.';
      setFormError(msg);
      showToast(msg, 'error');
      return;
    }

    const vendor = vendors.find(v => v.id === formVendorId);
    const project = projects.find(p => p.id === formProjectId);
    const selectedWh = warehouses.find(w => w.id === formWarehouseId) || storageService.getDefaultWarehouse();

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      purchaseNumber: `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      vendorId: formVendorId,
      vendorName: vendor?.name || 'Authorized Supplier',
      purchaseDate: formPurchaseDate,
      expectedDeliveryDate: formExpectedDate,
      projectId: formProjectId || undefined,
      projectTitle: project?.title || undefined,
      warehouseId: selectedWh.id,
      warehouseName: selectedWh.name,
      items: lineItems,
      subtotal: formSubtotal,
      taxAmount: formTaxTotal,
      totalAmount: formGrandTotal,
      status: 'ORDERED',
      paymentStatus: formPaymentStatus,
      paymentDueDate: formPaymentDueDate,
      invoiceReference: formInvoiceRef.trim() || undefined,
      notes: formNotes.trim() || undefined,
      stockUpdated: false,
      deliveryReceipts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      storageService.savePurchaseOrder(newPO, false);
      triggerRefresh();
      showToast(`Purchase Order ${newPO.purchaseNumber} submitted to ${newPO.vendorName}`, 'success');
      setIsCreateModalOpen(false);

      // Reset form
      setFormVendorId('');
      setFormProjectId('');
      setLineItems([]);
      setFormNotes('');
      setFormInvoiceRef('');
      setLineItemError('');
      setFormError('');
    } catch (err: any) {
      const msg = err.message || 'Failed to save purchase order.';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDeletePO = (id: string, poNum: string) => {
    if (window.confirm(`Are you sure you want to delete purchase order ${poNum}?`)) {
      storageService.deletePurchaseOrder(id);
      triggerRefresh();
      showToast(`Purchase Order ${poNum} deleted`, 'info');
    }
  };

  const handleOrderSavedFromModal = (updated: PurchaseOrder) => {
    triggerRefresh();
    if (viewingPO?.id === updated.id) {
      setViewingPO(updated);
    }
  };

  const handleReceiptRecordedFromModal = (updated: PurchaseOrder) => {
    triggerRefresh();
    if (viewingPO?.id === updated.id) {
      setViewingPO(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Purchase Value
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
            ₹{metrics.totalPurchases.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {orders.length} orders
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Deliveries In Inflow
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-700 mt-2 font-mono">
            {metrics.pendingDeliveries} Orders
          </div>
          <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
            {metrics.partialDeliveries > 0 ? `${metrics.partialDeliveries} partially delivered` : 'Awaiting physical delivery'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stock Synchronized
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2 font-mono">
            {metrics.receivedOrders} Fully Received
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Physical stock updated on delivery
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Vendor Payables
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-700 mt-2 font-mono">
            ₹{metrics.totalPendingPayment.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Unpaid vendor balances
          </span>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            Purchase Entry & Orders
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Editable purchase order summaries with multi-stage partial product receipt and inventory tracking.
          </p>
        </div>

        <button
          id="btn-create-po"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Purchase Entry
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PO #, vendor, project..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {['ALL', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'DRAFT'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'PARTIALLY_RECEIVED' ? 'PARTIALLY RECEIVED' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">Linked Project</th>
                <th className="p-3.5">PO Date</th>
                <th className="p-3.5">Delivery Progress</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Physical Receipt Action</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => {
                const totalOrdered = order.items.reduce((sum, it) => sum + it.orderedQuantity, 0);
                const totalReceived = order.items.reduce((sum, it) => sum + it.receivedQuantity, 0);
                const totalPending = order.items.reduce((sum, it) => sum + it.pendingQuantity, 0);
                const percent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-amber-600 whitespace-nowrap">
                      <button
                        onClick={() => setViewingPO(order)}
                        className="hover:underline text-left cursor-pointer"
                        title="View PO Summary"
                      >
                        {order.purchaseNumber}
                      </button>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {order.vendorName}
                      {order.invoiceReference && (
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          Ref: {order.invoiceReference}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      <span className="block font-medium text-slate-850">
                        {order.projectTitle || 'Central Stock'}
                      </span>
                      <span className="block text-[10px] text-amber-700 font-semibold truncate" title={order.warehouseName || 'Central Hub'}>
                        Hub: {order.warehouseName || 'Central Solar Logistics Hub'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">{order.purchaseDate}</td>
                    
                    {/* Delivery Progress Column */}
                    <td className="p-3.5 whitespace-nowrap min-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-800 font-mono">
                          {totalReceived} / {totalOrdered} Units
                        </span>
                        <span className="font-semibold text-slate-500 font-mono text-[10px]">
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent === 100
                              ? 'bg-emerald-500'
                              : percent > 0
                              ? 'bg-amber-500'
                              : 'bg-slate-200'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          order.status === 'RECEIVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.status === 'PARTIALLY_RECEIVED'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : order.status === 'ORDERED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {order.status === 'PARTIALLY_RECEIVED' ? 'PARTIALLY RECEIVED' : order.status}
                      </span>
                    </td>

                    {/* Inflow Action */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {order.status === 'RECEIVED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          Stock Fully Added
                        </span>
                      ) : order.status === 'PARTIALLY_RECEIVED' ? (
                        <button
                          onClick={() => setReceivingPO(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] rounded-lg border border-amber-200 transition-colors shadow-2xs"
                          title="Record arrival of next delivery batch"
                        >
                          <Truck className="w-3 h-3 text-amber-600" />
                          Receive Balance ({totalPending} left)
                        </button>
                      ) : (
                        <button
                          onClick={() => setReceivingPO(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg border border-blue-200 transition-colors shadow-2xs"
                        >
                          <PackagePlus className="w-3 h-3" />
                          Receive Goods (GRN)
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingPO(order)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View PO Summary & Receipts"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingPO(order)}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit PO Summary & Quantities"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {totalPending > 0 && (
                          <button
                            onClick={() => setReceivingPO(order)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Record Delivery Receipt"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePO(order.id, order.purchaseNumber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete PO"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    No purchase orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Purchase Entry Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Create Purchase Order Entry</h3>
                  <p className="text-xs text-slate-500">
                    Procure equipment and solar components from authorized manufacturers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePO} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Vendor, Warehouse & Project */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Vendor *
                  </label>
                  <select
                    required
                    value={formVendorId}
                    onChange={e => setFormVendorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.category} - {v.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destination Warehouse *
                  </label>
                  <select
                    value={formWarehouseId}
                    onChange={e => setFormWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="">-- Primary Logistics Hub --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code}) {w.isDefault ? '★' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Direct Site Project Allocation (Optional)
                  </label>
                  <select
                    value={formProjectId}
                    onChange={e => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="">-- General Warehouse Stock --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.customerName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={formPurchaseDate}
                    onChange={e => setFormPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpectedDate}
                    onChange={e => setFormExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vendor Invoice / Challan Ref
                  </label>
                  <input
                    type="text"
                    value={formInvoiceRef}
                    onChange={e => setFormInvoiceRef(e.target.value)}
                    placeholder="e.g. WAA-INV-998"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Purchase Order Line Items
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Product Catalog Item *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={e => handleProductSelect(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="">-- Select Product to Order --</option>
                      {products.map(p => {
                        const isAlreadyAdded = lineItems.some(
                          it => it.productId === p.id || (p.sku && it.sku === p.sku)
                        );
                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={isAlreadyAdded}
                            className={isAlreadyAdded ? 'text-slate-400 bg-slate-50' : ''}
                          >
                            {isAlreadyAdded
                              ? `[Already in PO] ${p.sku} - ${p.name}`
                              : `${p.sku} - ${p.name} (Stock: ${p.currentStock})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={e => setItemQty(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit Purchase Cost (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={itemUnitPrice}
                      onChange={e => setItemUnitPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Line Item Validation Error Banner */}
                {lineItemError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{lineItemError}</span>
                  </div>
                )}

                {/* Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">GST (12/18%)</th>
                        <th className="p-2.5 text-right">Total</th>
                        <th className="p-2.5 text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-800">
                            <div>{it.productName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{it.sku}</span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            {it.orderedQuantity} {it.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            ₹{it.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-right font-mono text-purple-700">
                            ₹{it.taxAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                            ₹{it.totalAmount.toLocaleString('en-IN')}
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
                      {lineItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                            No items added. Select a product above to add to PO.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {lineItems.length > 0 && (
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                        <tr>
                          <td colSpan={4} className="p-2 text-right text-slate-600">
                            Subtotal:
                          </td>
                          <td className="p-2 text-right font-mono">
                            ₹{formSubtotal.toLocaleString('en-IN')}
                          </td>
                          <td></td>
                        </tr>
                        <tr className="border-t border-slate-300 text-sm font-bold bg-amber-50">
                          <td colSpan={4} className="p-2.5 text-right text-amber-900">
                            Grand Total (with Tax):
                          </td>
                          <td className="p-2.5 text-right font-mono text-amber-900">
                            ₹{formGrandTotal.toLocaleString('en-IN')}
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
                  Procurement Notes / Dispatch Instructions
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Delivery address, unloading crane requirement, test certificates..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              {/* Form Validation Error */}
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setLineItemError('');
                    setFormError('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lineItems.length === 0 || !validatePOLineItems(lineItems).valid}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Confirm & Place PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View PO Summary & Delivery Receipts */}
      {viewingPO && (
        <PurchaseOrderSummaryModal
          order={viewingPO}
          onClose={() => setViewingPO(null)}
          onEditPO={order => {
            setViewingPO(null);
            setEditingPO(order);
          }}
          onReceiveGoods={order => {
            setViewingPO(null);
            setReceivingPO(order);
          }}
        />
      )}

      {/* Modal: Edit PO Summary & Quantities */}
      {editingPO && (
        <EditPurchaseOrderModal
          order={editingPO}
          vendors={vendors}
          products={products}
          projects={projects}
          onClose={() => setEditingPO(null)}
          onOrderSaved={handleOrderSavedFromModal}
          showToast={showToast}
        />
      )}

      {/* Modal: Record Delivery Receipt (GRN) */}
      {receivingPO && (
        <GoodsReceiptModal
          order={receivingPO}
          currentUser={currentUser}
          onClose={() => setReceivingPO(null)}
          onReceiptRecorded={handleReceiptRecordedFromModal}
          showToast={showToast}
        />
      )}
    </div>
  );
};
