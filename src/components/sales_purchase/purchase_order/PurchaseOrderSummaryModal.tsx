import React, { useState } from 'react';
import { PurchaseOrder } from '../../../types/solar';
import {
  FileText,
  X,
  Edit3,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  History,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  Percent
} from 'lucide-react';

interface PurchaseOrderSummaryModalProps {
  order: PurchaseOrder;
  onClose: () => void;
  onEditPO: (order: PurchaseOrder) => void;
  onReceiveGoods: (order: PurchaseOrder) => void;
}

export const PurchaseOrderSummaryModal: React.FC<PurchaseOrderSummaryModalProps> = ({
  order,
  onClose,
  onEditPO,
  onReceiveGoods
}) => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'RECEIPTS'>('ITEMS');

  const totalOrdered = order.items.reduce((sum, it) => sum + it.orderedQuantity, 0);
  const totalReceived = order.items.reduce((sum, it) => sum + it.receivedQuantity, 0);
  const totalPending = order.items.reduce((sum, it) => sum + it.pendingQuantity, 0);
  const fulfillmentPercent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  const receipts = order.deliveryReceipts || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  {order.purchaseNumber}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    order.status === 'RECEIVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : order.status === 'PARTIALLY_RECEIVED'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : order.status === 'ORDERED'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {order.status === 'PARTIALLY_RECEIVED'
                    ? `PARTIALLY RECEIVED (${fulfillmentPercent}%)`
                    : order.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Purchase Order Summary & Delivery Tracking
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Info Cards */}
        <div className="p-6 pb-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Vendor</span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">{order.vendorName}</span>
              {order.invoiceReference && (
                <span className="text-slate-600 block mt-1 font-mono text-[11px]">
                  Ref: {order.invoiceReference}
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Allocation & Hub</span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {order.projectTitle || <span className="text-slate-700">General Stock</span>}
              </span>
              <span className="text-amber-800 font-semibold text-[11px] block mt-0.5 truncate" title={order.warehouseName || 'Central Hub'}>
                Hub: {order.warehouseName || 'Central Solar Logistics Hub'}
              </span>
              <span className="text-slate-400 text-[11px] block mt-0.5">PO Date: {order.purchaseDate}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Fulfillment Status</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {totalReceived} / {totalOrdered} Units
                </span>
                <span className="text-xs font-bold text-amber-700 font-mono">{fulfillmentPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    fulfillmentPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, fulfillmentPercent)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment & Terms</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.paymentDueDate && (
                <span className="text-slate-400 text-[11px] block mt-1">
                  Due: {order.paymentDueDate}
                </span>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 pt-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('ITEMS')}
                className={`pb-2 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'ITEMS'
                    ? 'text-amber-600 border-b-2 border-amber-500'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Line Items & Receiving Status ({order.items.length})
              </button>

              <button
                onClick={() => setActiveTab('RECEIPTS')}
                className={`pb-2 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'RECEIPTS'
                    ? 'text-amber-600 border-b-2 border-amber-500'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Delivery Receipts History ({receipts.length})
              </button>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => onEditPO(order)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Edit PO Summary
              </button>

              {totalPending > 0 && (
                <button
                  onClick={() => onReceiveGoods(order)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Receive Goods
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          {activeTab === 'ITEMS' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Product Description</th>
                      <th className="p-3 text-center">Ordered</th>
                      <th className="p-3 text-center">Received (Stocked)</th>
                      <th className="p-3 text-center">Pending</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">GST</th>
                      <th className="p-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map(it => {
                      const itemFulfillment =
                        it.orderedQuantity > 0
                          ? Math.round((it.receivedQuantity / it.orderedQuantity) * 100)
                          : 0;

                      return (
                        <tr key={it.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{it.productName}</div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                              <span>{it.sku}</span>
                              {it.category && <span>• {it.category}</span>}
                            </div>
                            {it.notes && (
                              <p className="text-[11px] text-slate-500 italic mt-1">{it.notes}</p>
                            )}
                          </td>

                          <td className="p-3 text-center font-bold text-slate-800">
                            {it.orderedQuantity} {it.unit}
                          </td>

                          <td className="p-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  it.receivedQuantity >= it.orderedQuantity
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : it.receivedQuantity > 0
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'text-slate-400'
                                }`}
                              >
                                {it.receivedQuantity} {it.unit}
                              </span>
                              {it.orderedQuantity > 0 && it.receivedQuantity > 0 && (
                                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {itemFulfillment}%
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                it.pendingQuantity > 0
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {it.pendingQuantity} {it.unit}
                            </span>
                            {it.rejectedQuantity ? (
                              <span className="block text-[10px] text-rose-600 font-semibold mt-0.5">
                                ({it.rejectedQuantity} rejected)
                              </span>
                            ) : null}
                          </td>

                          <td className="p-3 text-right font-mono text-slate-600">
                            ₹{it.unitPrice.toLocaleString('en-IN')}
                          </td>

                          <td className="p-3 text-right font-mono text-purple-700">
                            ₹{it.taxAmount.toLocaleString('en-IN')} ({it.taxPercent}%)
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ₹{it.totalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                    <tr>
                      <td colSpan={6} className="p-2.5 text-right text-slate-600">
                        Subtotal:
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        ₹{order.subtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="p-2 text-right text-slate-600">
                        GST Tax:
                      </td>
                      <td className="p-2 text-right font-mono text-purple-700">
                        ₹{order.taxAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-300 text-sm font-bold bg-amber-50">
                      <td colSpan={6} className="p-3 text-right text-amber-950">
                        Total Purchase Order Value:
                      </td>
                      <td className="p-3 text-right font-mono text-amber-950 text-base">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {order.notes && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                    Procurement Notes / Instructions:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'RECEIPTS' && (
            <div className="space-y-4">
              {receipts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Truck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No Delivery Receipts Recorded Yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    When products arrive from the vendor (partial or complete shipment), record a goods receipt to synchronize physical inventory.
                  </p>
                  {totalPending > 0 && (
                    <button
                      onClick={() => onReceiveGoods(order)}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <Truck className="w-4 h-4" />
                      Record First Goods Receipt
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((grn, idx) => (
                    <div
                      key={grn.id || idx}
                      className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 font-mono text-xs font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {grn.receiptNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            Received on: {grn.receiptDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {grn.deliveryChallanNo && (
                            <span className="font-mono">Challan: {grn.deliveryChallanNo}</span>
                          )}
                          {grn.receivedBy && <span>By: {grn.receivedBy}</span>}
                        </div>
                      </div>

                      {/* Items received in this GRN */}
                      <div className="border border-slate-100 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold">
                            <tr>
                              <th className="p-2">Item</th>
                              <th className="p-2 text-center">Received Qty</th>
                              <th className="p-2 text-center">Damaged / Rejected</th>
                              <th className="p-2">Excess Delivery Authorization</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {grn.items.map((it, i) => (
                              <tr key={i}>
                                <td className="p-2 font-medium text-slate-800">
                                  {it.productName}{' '}
                                  <span className="text-[10px] text-slate-400 font-mono">({it.sku})</span>
                                </td>
                                <td className="p-2 text-center font-bold text-emerald-700">
                                  +{it.receivedQuantity} {it.unit}
                                </td>
                                <td className="p-2 text-center">
                                  {it.rejectedQuantity ? (
                                    <span className="text-rose-600 font-semibold">
                                      {it.rejectedQuantity} {it.unit}{' '}
                                      {it.rejectionReason && `(${it.rejectionReason})`}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="p-2 text-[11px]">
                                  {it.isExcessApproved ? (
                                    <span className="inline-flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                                      Approved: {it.excessApprovalReason || 'Authorized by Store Incharge'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {grn.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                          {grn.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {totalPending === 0 ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                All {totalOrdered} ordered units fully received into stock.
              </span>
            ) : (
              <span className="text-amber-800 font-semibold">
                {totalPending} units currently pending delivery.
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
