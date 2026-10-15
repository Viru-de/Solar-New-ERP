import React, { useState, useMemo } from 'react';
import { PurchaseOrder, PurchaseLineItem, Vendor, ProductItem, SolarProject } from '../../../types/solar';
import { storageService } from '../../../services/storage';
import { validatePOLineItem, validatePOLineItems } from '../../../services/validation';
import {
  Edit3,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

interface EditPurchaseOrderModalProps {
  order: PurchaseOrder;
  vendors: Vendor[];
  products: ProductItem[];
  projects: SolarProject[];
  onClose: () => void;
  onOrderSaved: (updatedOrder: PurchaseOrder) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const EditPurchaseOrderModal: React.FC<EditPurchaseOrderModalProps> = ({
  order,
  vendors,
  products,
  projects,
  onClose,
  onOrderSaved,
  showToast
}) => {
  // Header state
  const [vendorId, setVendorId] = useState(order.vendorId);
  const [projectId, setProjectId] = useState(order.projectId || '');
  const [warehouseId, setWarehouseId] = useState(order.warehouseId || '');
  const [purchaseDate, setPurchaseDate] = useState(order.purchaseDate);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(order.expectedDeliveryDate || '');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [paymentDueDate, setPaymentDueDate] = useState(order.paymentDueDate || '');
  const [invoiceReference, setInvoiceReference] = useState(order.invoiceReference || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [orderStatus, setOrderStatus] = useState(order.status);

  // Line items state
  const [items, setItems] = useState<PurchaseLineItem[]>(() => {
    return (order.items || []).map(it => ({ ...it }));
  });

  // Adding new item state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newItemQty, setNewItemQty] = useState<number>(10);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<number>(0);
  const [newItemTaxPercent, setNewItemTaxPercent] = useState<number>(12);
  const [lineItemError, setLineItemError] = useState('');
  const [formError, setFormError] = useState('');

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    setLineItemError('');
    if (!prodId) return;

    // Check if product is already in line items
    const existing = items.find(it => it.productId === prodId);
    if (existing) {
      const prod = products.find(p => p.id === prodId);
      const msg = `Product "${prod?.name || prodId}" is already included in this Purchase Order (Ordered: ${existing.orderedQuantity} ${existing.unit}). Please adjust its quantity above instead of adding it again.`;
      setLineItemError(msg);
      showToast(msg, 'warning');
      return;
    }

    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setNewItemUnitPrice(prod.unitPrice);
    }
  };

  const handleAddNewItem = () => {
    setLineItemError('');
    if (!selectedProductId) {
      setLineItemError('Please select a product from catalog.');
      showToast('Please select a product from catalog', 'warning');
      return;
    }
    if (newItemQty <= 0 || newItemUnitPrice <= 0) {
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
    const duplicateValidation = validatePOLineItem(candidateItem, items);
    if (!duplicateValidation.valid) {
      const msg = duplicateValidation.message || `Product "${prod.name}" is already included in this Purchase Order.`;
      setLineItemError(msg);
      showToast(msg, 'warning');
      return;
    }

    const baseAmount = newItemQty * newItemUnitPrice;
    const taxAmt = Math.round((baseAmount * newItemTaxPercent) / 100);
    const totalAmt = baseAmount + taxAmt;

    const newLineItem: PurchaseLineItem = {
      id: `poi-${Date.now()}-${items.length}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      category: prod.category,
      unit: prod.unit,
      orderedQuantity: newItemQty,
      receivedQuantity: 0,
      pendingQuantity: newItemQty,
      rejectedQuantity: 0,
      unitPrice: newItemUnitPrice,
      taxPercent: newItemTaxPercent,
      taxAmount: taxAmt,
      totalAmount: totalAmt,
      quantity: newItemQty,
      taxRatePercent: newItemTaxPercent,
      totalPrice: totalAmt
    };

    setItems(prev => [...prev, newLineItem]);
    setSelectedProductId('');
    setNewItemQty(10);
    setNewItemUnitPrice(0);
    setLineItemError('');
  };

  const handleUpdateItem = (index: number, field: keyof PurchaseLineItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };

      if (field === 'orderedQuantity' || field === 'unitPrice' || field === 'taxPercent') {
        const orderedQty = Math.max(0, Number(item.orderedQuantity || 0));
        const unitPrice = Math.max(0, Number(item.unitPrice || 0));
        const taxPercent = Math.max(0, Number(item.taxPercent || 0));
        const base = orderedQty * unitPrice;
        const taxAmt = Math.round((base * taxPercent) / 100);
        const total = base + taxAmt;

        item.orderedQuantity = orderedQty;
        item.unitPrice = unitPrice;
        item.taxPercent = taxPercent;
        item.taxAmount = taxAmt;
        item.totalAmount = total;
        item.pendingQuantity = Math.max(0, orderedQty - (item.receivedQuantity || 0));

        // Backward compatibility
        item.quantity = orderedQty;
        item.taxRatePercent = taxPercent;
        item.totalPrice = total;
      }

      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    const item = items[index];
    if (item.receivedQuantity > 0) {
      showToast(
        `Cannot remove item "${item.productName}" because ${item.receivedQuantity} units have already been received into inventory.`,
        'error'
      );
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
    setLineItemError('');
    setFormError('');
  };

  // Totals calculations
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + (it.orderedQuantity * it.unitPrice), 0);
    const taxAmount = items.reduce((sum, it) => sum + it.taxAmount, 0);
    const grandTotal = subtotal + taxAmount;
    const hasOrderedLessThanReceived = items.some(it => it.orderedQuantity < it.receivedQuantity);

    const duplicateValidation = validatePOLineItems(items);
    const hasDuplicateProducts = !duplicateValidation.valid;
    const duplicateError = duplicateValidation.message || '';

    return {
      subtotal,
      taxAmount,
      grandTotal,
      hasOrderedLessThanReceived,
      hasDuplicateProducts,
      duplicateError
    };
  }, [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (items.length === 0) {
      setFormError('Purchase order must have at least one line item.');
      showToast('Purchase order must have at least one line item', 'warning');
      return;
    }

    if (totals.hasOrderedLessThanReceived) {
      setFormError('One or more line items have ordered quantity less than already received quantity. Please adjust.');
      showToast(
        'One or more line items have ordered quantity less than already received quantity. Please adjust.',
        'error'
      );
      return;
    }

    // Strict duplicate check on line items before saving
    const duplicateValidation = validatePOLineItems(items);
    if (!duplicateValidation.valid) {
      const msg = duplicateValidation.message || 'Duplicate products detected in Purchase Order.';
      setFormError(msg);
      showToast(msg, 'error');
      return;
    }

    const vendor = vendors.find(v => v.id === vendorId);
    const project = projects.find(p => p.id === projectId);
    const warehouses = storageService.getWarehouses();
    const selectedWh = warehouses.find(w => w.id === warehouseId) || storageService.getDefaultWarehouse();

    const updatedOrder: PurchaseOrder = {
      ...order,
      vendorId,
      vendorName: vendor?.name || order.vendorName,
      projectId: projectId || undefined,
      projectTitle: project?.title || undefined,
      warehouseId: selectedWh.id,
      warehouseName: selectedWh.name,
      purchaseDate,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      paymentStatus,
      paymentDueDate: paymentDueDate || undefined,
      invoiceReference: invoiceReference.trim() || undefined,
      notes: notes.trim() || undefined,
      status: orderStatus,
      items,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.grandTotal,
      updatedAt: new Date().toISOString()
    };

    try {
      storageService.savePurchaseOrder(updatedOrder, false);
      showToast(`Purchase Order ${order.purchaseNumber} updated successfully`, 'success');
      onOrderSaved(updatedOrder);
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to update purchase order.';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-white shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Edit Purchase Order Summary</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  {order.purchaseNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Update procurement terms, expected dates, and line item quantities. Inventory is updated only upon delivery receipt.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Order Header & Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vendor *</label>
              <select
                required
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              >
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination Warehouse *
              </label>
              <select
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 font-medium"
              >
                {storageService.getWarehouses().map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) {w.isDefault ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Allocation (Optional)
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">-- General Warehouse Stock --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.customerName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Order Status</label>
              <select
                value={orderStatus}
                onChange={e => setOrderStatus(e.target.value as PurchaseOrder['status'])}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 font-semibold"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ORDERED">ORDERED</option>
                <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={e => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice / Challan Reference</label>
              <input
                type="text"
                value={invoiceReference}
                onChange={e => setInvoiceReference(e.target.value)}
                placeholder="e.g. WAA-INV-88910"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as PurchaseOrder['paymentStatus'])}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                <option value="PAID">PAID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date</label>
              <input
                type="date"
                value={paymentDueDate}
                onChange={e => setPaymentDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Section 2: Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                Line Items & Quantities
              </h4>
              <span className="text-[11px] text-slate-500">
                Adjust ordered quantities, unit rates, or add additional items.
              </span>
            </div>

            {/* Existing Duplicate Products Warning Banner */}
            {totals.hasDuplicateProducts && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold">Duplicate Product Detected:</span> {totals.duplicateError}
                  <span className="block mt-0.5 text-amber-800">
                    The same product must not appear more than once in a Purchase Order. Please consolidate quantities and remove the duplicate item before saving.
                  </span>
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Product Description</th>
                    <th className="p-3 text-center w-28">Ordered Qty</th>
                    <th className="p-3 text-center">Received</th>
                    <th className="p-3 text-center">Pending</th>
                    <th className="p-3 text-right w-28">Unit Price (₹)</th>
                    <th className="p-3 text-right w-20">GST %</th>
                    <th className="p-3 text-right">Total (₹)</th>
                    <th className="p-3 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const isLess = it.orderedQuantity < it.receivedQuantity;
                    return (
                      <tr key={it.id || idx} className={isLess ? 'bg-rose-50/50' : 'hover:bg-slate-50/70'}>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{it.productName}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{it.sku}</span>
                            <span>Unit: {it.unit}</span>
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={it.orderedQuantity}
                            onChange={e => handleUpdateItem(idx, 'orderedQuantity', Number(e.target.value))}
                            className={`w-20 px-2 py-1 text-center font-bold text-xs bg-white border rounded-lg focus:ring-2 ${
                              isLess ? 'border-rose-400 text-rose-800 focus:ring-rose-500/20' : 'border-slate-300'
                            }`}
                          />
                          {isLess && (
                            <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                              &lt; {it.receivedQuantity} received
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center font-semibold text-slate-600">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${it.receivedQuantity > 0 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            {it.receivedQuantity} {it.unit}
                          </span>
                        </td>

                        <td className="p-3 text-center font-bold text-blue-700">
                          {it.pendingQuantity} {it.unit}
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={it.unitPrice}
                            onChange={e => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                            className="w-24 px-2 py-1 text-right font-mono text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <select
                            value={it.taxPercent}
                            onChange={e => handleUpdateItem(idx, 'taxPercent', Number(e.target.value))}
                            className="px-1.5 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ₹{it.totalAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={it.receivedQuantity > 0}
                            title={it.receivedQuantity > 0 ? 'Cannot remove: goods already received' : 'Remove item'}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                  <tr>
                    <td colSpan={6} className="p-2.5 text-right text-slate-600">Subtotal:</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                      ₹{totals.subtotal.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="p-2 text-right text-slate-600">Total GST Tax:</td>
                    <td className="p-2 text-right font-mono text-purple-700">
                      ₹{totals.taxAmount.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="border-t border-slate-300 text-sm font-bold bg-amber-50/70">
                    <td colSpan={6} className="p-3 text-right text-amber-950">Revised Grand Total:</td>
                    <td className="p-3 text-right font-mono text-amber-950 text-base">
                      ₹{totals.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Add another product row */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Add Product to Purchase Order
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-5">
                  <select
                    value={selectedProductId}
                    onChange={e => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">-- Choose Product to Append --</option>
                    {products.map(p => {
                      const isAlreadyInPO = items.some(
                        it => it.productId === p.id || (p.sku && it.sku === p.sku)
                      );
                      return (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={isAlreadyInPO}
                          className={isAlreadyInPO ? 'text-slate-400 bg-slate-50' : ''}
                        >
                          {isAlreadyInPO ? `[Already in PO] ${p.sku} - ${p.name}` : `${p.sku} - ${p.name}`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newItemQty}
                    onChange={e => setNewItemQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="Unit Price"
                    value={newItemUnitPrice}
                    onChange={e => setNewItemUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Line item error banner */}
              {lineItemError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{lineItemError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Procurement Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Procurement & Dispatch Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Delivery instructions, site survey notes, logistics remarks..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Form error banner */}
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={totals.hasOrderedLessThanReceived || totals.hasDuplicateProducts}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              Save PO Summary Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
