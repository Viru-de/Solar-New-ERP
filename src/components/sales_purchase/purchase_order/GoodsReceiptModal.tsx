import React, { useState, useMemo } from 'react';
import { PurchaseOrder } from '../../../types/solar';
import { storageService } from '../../../services/storage';
import {
  Truck,
  X,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Building2,
  FileText,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface GoodsReceiptModalProps {
  order: PurchaseOrder;
  currentUser?: { name: string; role?: string } | null;
  onClose: () => void;
  onReceiptRecorded: (updatedOrder: PurchaseOrder) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

interface ItemReceiptState {
  lineItemId: string;
  arrivingQuantity: number;
  rejectedQuantity: number;
  rejectionReason: string;
  isExcessApproved: boolean;
  excessApprovalReason: string;
}

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({
  order,
  currentUser,
  onClose,
  onReceiptRecorded,
  showToast
}) => {
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryChallanNo, setDeliveryChallanNo] = useState(order.invoiceReference || '');
  const [transporterName, setTransporterName] = useState('');
  const [receivedBy, setReceivedBy] = useState(currentUser?.name || 'Store Incharge');
  const [receiptNotes, setReceiptNotes] = useState('');

  // Initial receipt state per line item: default arrivingQuantity to remaining pending
  const [receiptItems, setReceiptItems] = useState<Record<string, ItemReceiptState>>(() => {
    const initial: Record<string, ItemReceiptState> = {};
    order.items.forEach(it => {
      initial[it.id] = {
        lineItemId: it.id,
        arrivingQuantity: it.pendingQuantity > 0 ? it.pendingQuantity : 0,
        rejectedQuantity: 0,
        rejectionReason: '',
        isExcessApproved: false,
        excessApprovalReason: ''
      };
    });
    return initial;
  });

  const handleArrivingQtyChange = (lineItemId: string, val: number) => {
    const qty = Math.max(0, val);
    setReceiptItems(prev => ({
      ...prev,
      [lineItemId]: {
        ...prev[lineItemId],
        arrivingQuantity: qty
      }
    }));
  };

  const handleRejectedQtyChange = (lineItemId: string, val: number) => {
    const qty = Math.max(0, val);
    setReceiptItems(prev => ({
      ...prev,
      [lineItemId]: {
        ...prev[lineItemId],
        rejectedQuantity: qty
      }
    }));
  };

  const handleRejectionReasonChange = (lineItemId: string, reason: string) => {
    setReceiptItems(prev => ({
      ...prev,
      [lineItemId]: {
        ...prev[lineItemId],
        rejectionReason: reason
      }
    }));
  };

  const handleExcessApprovalToggle = (lineItemId: string, checked: boolean) => {
    setReceiptItems(prev => ({
      ...prev,
      [lineItemId]: {
        ...prev[lineItemId],
        isExcessApproved: checked
      }
    }));
  };

  const handleExcessReasonChange = (lineItemId: string, reason: string) => {
    setReceiptItems(prev => ({
      ...prev,
      [lineItemId]: {
        ...prev[lineItemId],
        excessApprovalReason: reason
      }
    }));
  };

  // Shortcut helpers
  const handleReceiveAllPending = () => {
    setReceiptItems(prev => {
      const next = { ...prev };
      order.items.forEach(it => {
        if (next[it.id]) {
          next[it.id] = {
            ...next[it.id],
            arrivingQuantity: it.pendingQuantity
          };
        }
      });
      return next;
    });
  };

  const handleClearAll = () => {
    setReceiptItems(prev => {
      const next = { ...prev };
      order.items.forEach(it => {
        if (next[it.id]) {
          next[it.id] = {
            ...next[it.id],
            arrivingQuantity: 0,
            rejectedQuantity: 0
          };
        }
      });
      return next;
    });
  };

  // Calculations & Validation
  const summary = useMemo(() => {
    let totalArriving = 0;
    let totalRejected = 0;
    let hasExcessWithoutApproval = false;
    let excessWarningCount = 0;

    order.items.forEach(it => {
      const state = receiptItems[it.id];
      if (!state) return;
      totalArriving += state.arrivingQuantity;
      totalRejected += state.rejectedQuantity;

      const isExcess = state.arrivingQuantity > it.pendingQuantity;
      if (isExcess) {
        excessWarningCount++;
        if (!state.isExcessApproved || !state.excessApprovalReason.trim()) {
          hasExcessWithoutApproval = true;
        }
      }
    });

    const totalRemainingPendingAfter = order.items.reduce((sum, it) => {
      const state = receiptItems[it.id];
      const arriving = state ? state.arrivingQuantity : 0;
      return sum + Math.max(0, it.pendingQuantity - arriving);
    }, 0);

    const willBeFullyReceived = totalRemainingPendingAfter === 0 && totalArriving > 0;

    return {
      totalArriving,
      totalRejected,
      hasExcessWithoutApproval,
      excessWarningCount,
      totalRemainingPendingAfter,
      willBeFullyReceived
    };
  }, [order.items, receiptItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (summary.totalArriving === 0 && summary.totalRejected === 0) {
      showToast('Please enter arriving or rejected quantities for at least one item', 'warning');
      return;
    }

    if (summary.hasExcessWithoutApproval) {
      showToast(
        'One or more items exceed ordered quantity. You must approve the excess delivery and provide an authorization reason.',
        'warning'
      );
      return;
    }

    const payloadItems = order.items
      .map(it => {
        const state = receiptItems[it.id];
        if (!state) return null;
        if (state.arrivingQuantity === 0 && state.rejectedQuantity === 0) return null;
        return {
          lineItemId: it.id,
          receivedQuantity: state.arrivingQuantity,
          rejectedQuantity: state.rejectedQuantity,
          rejectionReason: state.rejectionReason.trim() || undefined,
          isExcessApproved: state.isExcessApproved,
          excessApprovalReason: state.excessApprovalReason.trim() || undefined
        };
      })
      .filter((it): it is NonNullable<typeof it> => it !== null);

    const updated = storageService.recordPurchaseReceipt(
      order.id,
      {
        receiptDate,
        deliveryChallanNo: deliveryChallanNo.trim() || undefined,
        transporterName: transporterName.trim() || undefined,
        receivedBy: receivedBy.trim() || 'Store Incharge',
        notes: receiptNotes.trim() || undefined,
        items: payloadItems
      },
      currentUser?.name || 'Store Incharge'
    );

    if (updated) {
      showToast(
        `Goods Receipt recorded! Added ${summary.totalArriving} units into warehouse inventory.`,
        'success'
      );
      onReceiptRecorded(updated);
      onClose();
    } else {
      showToast('Failed to record delivery receipt', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Receive Goods & Inspection (GRN)</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  {order.purchaseNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor: <strong className="text-slate-700">{order.vendorName}</strong>
                {order.projectTitle && ` • Site: ${order.projectTitle}`}
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

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Instructions banner */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <PackageCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">
                Receiving into: <span className="text-amber-800 font-bold">{order.warehouseName || 'Central Solar Logistics Hub'}</span>
              </p>
              <p className="text-blue-700 leading-relaxed">
                Warehouse inventory increases <strong>only</strong> for the quantities confirmed arriving in this delivery batch.
                Enter <span className="font-mono font-bold">0</span> for products that have not arrived yet. Remaining units stay pending for future dispatches.
              </p>
            </div>
          </div>

          {/* Delivery Details Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Receipt Date *
              </label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={e => setReceiptDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Delivery Challan / LR No.
              </label>
              <input
                type="text"
                value={deliveryChallanNo}
                onChange={e => setDeliveryChallanNo(e.target.value)}
                placeholder="e.g. DC-WAA-1049"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                Transporter / Vehicle No.
              </label>
              <input
                type="text"
                value={transporterName}
                onChange={e => setTransporterName(e.target.value)}
                placeholder="e.g. VRL / GJ-01-AX-9912"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Received By *
              </label>
              <input
                type="text"
                required
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                placeholder="Store Incharge / Ramesh"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Line Items Receiving Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Delivery Verification & Quantity Breakdown
                </h4>
                <p className="text-[11px] text-slate-500">
                  Specify received quantities arriving at warehouse/site for each line item.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReceiveAllPending}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  Quick-Fill All Pending
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Set All to 0
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Product Description</th>
                    <th className="p-3 text-center">Ordered</th>
                    <th className="p-3 text-center">Prev. Received</th>
                    <th className="p-3 text-center">Remaining Pending</th>
                    <th className="p-3 text-center w-36 bg-amber-50/70 border-x border-amber-200/60">
                      Current Arriving (Good) *
                    </th>
                    <th className="p-3 text-center w-32">Damaged / Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map(it => {
                    const itemState = receiptItems[it.id] || {
                      lineItemId: it.id,
                      arrivingQuantity: 0,
                      rejectedQuantity: 0,
                      rejectionReason: '',
                      isExcessApproved: false,
                      excessApprovalReason: ''
                    };

                    const isExcess = itemState.arrivingQuantity > it.pendingQuantity;
                    const excessDiff = itemState.arrivingQuantity - it.pendingQuantity;
                    const remainingAfterThis = Math.max(0, it.pendingQuantity - itemState.arrivingQuantity);

                    return (
                      <React.Fragment key={it.id}>
                        <tr className={`hover:bg-slate-50/80 transition-colors ${isExcess ? 'bg-amber-50/40' : ''}`}>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{it.productName}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {it.sku}
                              </span>
                              <span className="text-[10px] text-slate-400">Unit: {it.unit}</span>
                            </div>
                          </td>

                          <td className="p-3 text-center font-bold text-slate-800">
                            {it.orderedQuantity} {it.unit}
                          </td>

                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                it.receivedQuantity > 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {it.receivedQuantity} {it.unit}
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                it.pendingQuantity > 0
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {it.pendingQuantity} {it.unit}
                            </span>
                          </td>

                          {/* Arriving Quantity Input */}
                          <td className="p-3 bg-amber-50/50 border-x border-amber-200/50">
                            <div className="flex flex-col items-center">
                              <input
                                type="number"
                                min="0"
                                value={itemState.arrivingQuantity}
                                onChange={e => handleArrivingQtyChange(it.id, Number(e.target.value))}
                                className={`w-24 px-2.5 py-1 text-center font-mono font-bold text-xs bg-white rounded-lg border focus:ring-2 ${
                                  isExcess
                                    ? 'border-amber-500 text-amber-900 focus:ring-amber-500/20'
                                    : 'border-slate-300 text-slate-900 focus:ring-amber-500/20'
                                }`}
                              />
                              <span className="text-[10px] text-slate-500 mt-1">
                                {remainingAfterThis === 0 && itemState.arrivingQuantity > 0 ? (
                                  <span className="text-emerald-700 font-semibold">Fully cleared</span>
                                ) : (
                                  `${remainingAfterThis} ${it.unit} will remain pending`
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Damaged / Rejected Input */}
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={itemState.rejectedQuantity}
                              onChange={e => handleRejectedQtyChange(it.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 text-center font-mono text-xs bg-white border border-slate-300 rounded-lg text-rose-700 focus:ring-2 focus:ring-rose-500/20"
                            />
                            {itemState.rejectedQuantity > 0 && (
                              <input
                                type="text"
                                placeholder="Damage reason..."
                                value={itemState.rejectionReason}
                                onChange={e => handleRejectionReasonChange(it.id, e.target.value)}
                                className="w-full mt-1 px-2 py-0.5 text-[10px] bg-rose-50/50 border border-rose-200 rounded text-rose-800 placeholder-rose-300"
                              />
                            )}
                          </td>
                        </tr>

                        {/* Excess Delivery Warning & Explicit Approval Row */}
                        {isExcess && (
                          <tr className="bg-amber-100/60 border-b border-amber-200">
                            <td colSpan={6} className="p-3">
                              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 space-y-2">
                                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>
                                    Excess Delivery Warning: Arriving quantity ({itemState.arrivingQuantity} {it.unit})
                                    exceeds remaining pending order by +{excessDiff} {it.unit}.
                                  </span>
                                </div>
                                <p className="text-[11px] text-amber-800">
                                  Under company procurement policies, higher product quantities can only be accepted into warehouse inventory with explicit approval.
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-950">
                                    <input
                                      type="checkbox"
                                      checked={itemState.isExcessApproved}
                                      onChange={e => handleExcessApprovalToggle(it.id, e.target.checked)}
                                      className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
                                    />
                                    <span>Approve Excess Quantity Delivery (+{excessDiff} {it.unit})</span>
                                  </label>

                                  <input
                                    type="text"
                                    required={itemState.isExcessApproved}
                                    disabled={!itemState.isExcessApproved}
                                    value={itemState.excessApprovalReason}
                                    onChange={e => handleExcessReasonChange(it.id, e.target.value)}
                                    placeholder="Approval Reason / Authorized by (e.g. Authorized by Project Manager)"
                                    className="flex-1 px-3 py-1 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Inspection Notes / Package Condition / Unloading Remarks
            </label>
            <textarea
              rows={2}
              value={receiptNotes}
              onChange={e => setReceiptNotes(e.target.value)}
              placeholder="e.g. Received in good order, manufacturer barcode serial numbers verified against packing slip..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Inflow Summary Banner */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Units to Add to Stock</span>
              <span className="text-base font-bold text-emerald-700 font-mono block mt-0.5">
                +{summary.totalArriving} Units
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Damaged / Rejected</span>
              <span className="text-base font-bold text-rose-700 font-mono block mt-0.5">
                {summary.totalRejected} Units
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Remaining Pending on PO</span>
              <span className="text-base font-bold text-blue-700 font-mono block mt-0.5">
                {summary.totalRemainingPendingAfter} Units
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Resulting Order Status</span>
              <span
                className={`inline-block px-2.5 py-1 rounded text-xs font-bold mt-0.5 ${
                  summary.willBeFullyReceived
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {summary.willBeFullyReceived ? 'RECEIVED (Fulfilled)' : 'PARTIALLY_RECEIVED'}
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={summary.hasExcessWithoutApproval || (summary.totalArriving === 0 && summary.totalRejected === 0)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Delivery & Update Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
