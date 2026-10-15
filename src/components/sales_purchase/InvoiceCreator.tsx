import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { SalesInvoice, InvoiceLineItem, ProductItem, Customer, SolarProject } from '../../types/solar';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Printer,
  Building2,
  DollarSign,
  PackageCheck,
  Calendar
} from 'lucide-react';

export const InvoiceCreator: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);

  // Form states
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formInvoiceType, setFormInvoiceType] = useState<SalesInvoice['invoiceType']>('TAX_INVOICE');
  const [formInvoiceDate, setFormInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  );
  const [formPaymentTerms, setFormPaymentTerms] = useState('15 Days Net');
  const [formNotes, setFormNotes] = useState('');
  const [formDeductStock, setFormDeductStock] = useState(true);

  // Dynamic items in modal
  const [lineItems, setLineItems] = useState<Omit<InvoiceLineItem, 'id'>[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [itemHsn, setItemHsn] = useState('85414011');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemTaxRate, setItemTaxRate] = useState<number>(12);

  // Storage data
  const invoices = useMemo(() => storageService.getSalesInvoices(), [refreshTrigger]);
  const customers = useMemo(() => storageService.getCustomers(), [refreshTrigger]);
  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);
  const products = useMemo(() => storageService.getProducts(), [refreshTrigger]);

  // Calculations for summary metrics
  const metrics = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPending = invoices
      .filter(inv => inv.status === 'ISSUED' || inv.status === 'DRAFT')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalTax = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

    return { totalInvoiced, totalPaid, totalPending, totalTax };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.projectTitle && inv.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // When a product is selected in line item builder
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (!prodId) return;
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCustomItemDesc(prod.name);
      setItemHsn(prod.hsnCode || '85414011');
      setItemUnitPrice(prod.sellingPrice || prod.unitPrice || 0);
    }
  };

  const handleAddLineItem = () => {
    if (!customItemDesc.trim()) {
      showToast('Please enter an item description', 'warning');
      return;
    }
    if (itemQty <= 0 || itemUnitPrice <= 0) {
      showToast('Quantity and Unit Price must be greater than 0', 'warning');
      return;
    }

    const baseAmount = itemQty * itemUnitPrice;
    const taxAmt = (baseAmount * itemTaxRate) / 100;
    const totalAmt = baseAmount + taxAmt;

    const prod = products.find(p => p.id === selectedProductId);

    const newItem: Omit<InvoiceLineItem, 'id'> = {
      productId: prod?.id,
      description: customItemDesc,
      hsnCode: itemHsn,
      quantity: itemQty,
      unit: prod?.unit || 'NOS',
      unitPrice: itemUnitPrice,
      taxRatePercent: itemTaxRate,
      taxAmount: taxAmt,
      totalAmount: totalAmt
    };

    setLineItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setCustomItemDesc('');
    setItemQty(1);
    setItemUnitPrice(0);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const formSubtotal = useMemo(() => {
    return lineItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  }, [lineItems]);

  const formTaxTotal = useMemo(() => {
    return lineItems.reduce((acc, it) => acc + it.taxAmount, 0);
  }, [lineItems]);

  const formGrandTotal = formSubtotal + formTaxTotal;

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCustomerId) {
      showToast('Please select a customer', 'warning');
      return;
    }

    if (lineItems.length === 0) {
      showToast('Please add at least one line item to the invoice', 'warning');
      return;
    }

    const customer = customers.find(c => c.id === formCustomerId);
    const project = projects.find(p => p.id === formProjectId);

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      invoiceType: formInvoiceType,
      customerId: formCustomerId,
      customerName: customer?.name || 'Valued Customer',
      customerGst: customer?.gstNumber || 'Unregistered',
      customerAddress: customer?.siteAddress || '',
      projectId: formProjectId || undefined,
      projectTitle: project?.title || undefined,
      invoiceDate: formInvoiceDate,
      dueDate: formDueDate,
      status: 'ISSUED',
      paymentTerms: formPaymentTerms,
      notes: formNotes,
      deductStock: formDeductStock,
      stockDeducted: false,
      items: lineItems.map((it, idx) => ({
        ...it,
        id: `ili-${Date.now()}-${idx}`
      })),
      subtotal: formSubtotal,
      taxAmount: formTaxTotal,
      totalAmount: formGrandTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storageService.saveSalesInvoice(
      newInvoice,
      formDeductStock,
      currentUser?.name || 'Accounts Officer'
    );
    triggerRefresh();
    showToast(`Invoice ${newInvoice.invoiceNumber} created and issued successfully`, 'success');
    setIsCreateModalOpen(false);

    // Reset Form
    setFormCustomerId('');
    setFormProjectId('');
    setLineItems([]);
    setFormNotes('');
  };

  const handleMarkAsPaid = (invoice: SalesInvoice) => {
    const updated = {
      ...invoice,
      status: 'PAID' as const,
      updatedAt: new Date().toISOString()
    };
    storageService.saveSalesInvoice(updated, false);
    triggerRefresh();
    showToast(`Invoice ${invoice.invoiceNumber} marked as PAID`, 'success');
  };

  const handleDeleteInvoice = (id: string, invNumber: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invNumber}?`)) {
      storageService.deleteSalesInvoice(id);
      triggerRefresh();
      showToast(`Invoice ${invNumber} deleted`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
            ₹{metrics.totalInvoiced.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {invoices.length} tax invoices
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Collections Paid
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2 font-mono">
            ₹{metrics.totalPaid.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Realized in bank accounts
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Receivables Due
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-700 mt-2 font-mono">
            ₹{metrics.totalPending.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Pending customer clearance
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              GST / Tax Collected
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-700 mt-2 font-mono">
            ₹{metrics.totalTax.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            CGST + SGST / IGST breakdown
          </span>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Sales Invoices & Billing
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Create milestone & supply tax invoices with automatic stock deduction and GST compliance.
          </p>
        </div>

        <button
          id="btn-create-invoice"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Sales Invoice
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice #, client, project..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {['ALL', 'ISSUED', 'PAID', 'DRAFT'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Customer & Project</th>
                <th className="p-3.5">Invoice Date</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Tax (GST)</th>
                <th className="p-3.5 text-right">Total Amount</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Inventory Sync</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-amber-600 whitespace-nowrap">
                    {inv.invoiceNumber}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800">{inv.customerName}</div>
                    {inv.projectTitle && (
                      <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                        {inv.projectTitle}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-600 whitespace-nowrap">{inv.invoiceDate}</td>
                  <td className="p-3.5 text-slate-600 whitespace-nowrap">{inv.dueDate}</td>
                  <td className="p-3.5 text-right text-slate-600 font-mono">
                    ₹{inv.taxAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.status === 'ISSUED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    {inv.stockDeducted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <PackageCheck className="w-3 h-3" />
                        Stock Deducted
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No deduction</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => handleMarkAsPaid(inv)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold border border-emerald-200 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => setViewingInvoice(inv)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Tax Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    No sales invoices found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Generate New Sales Invoice */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Create Tax Invoice</h3>
                  <p className="text-xs text-slate-500">
                    Draft a customer invoice with GST calculations and optional inventory deduction.
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
            <form onSubmit={handleSaveInvoice} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer & Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer *
                  </label>
                  <select
                    required
                    value={formCustomerId}
                    onChange={e => setFormCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gstNumber ? `GST: ${c.gstNumber}` : 'Individual'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Linked Solar Project (Optional)
                  </label>
                  <select
                    value={formProjectId}
                    onChange={e => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="">-- None / General Supply --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.customerName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={formInvoiceDate}
                    onChange={e => setFormInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={formPaymentTerms}
                    onChange={e => setFormPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Immediate">Immediate / Due on Receipt</option>
                    <option value="15 Days Net">15 Days Net</option>
                    <option value="30 Days Net">30 Days Net</option>
                    <option value="Advance Milestone">Advance Milestone</option>
                  </select>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Add Billable Line Items
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Choose Product (Optional)
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={e => handleProductSelect(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="">-- Or type manual description below --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 540W Modules Supply or Milestone 1"
                      value={customItemDesc}
                      onChange={e => setCustomItemDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      HSN / SAC
                    </label>
                    <input
                      type="text"
                      value={itemHsn}
                      onChange={e => setItemHsn(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      GST Rate %
                    </label>
                    <select
                      value={itemTaxRate}
                      onChange={e => setItemTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12% (Solar Modules)</option>
                      <option value={18}>18% (Inverters / Services)</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-4">
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

                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit Price (₹ excl. tax)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={itemUnitPrice}
                      onChange={e => setItemUnitPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Line Item
                    </button>
                  </div>
                </div>

                {/* Items List Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-center">HSN</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">GST</th>
                        <th className="p-2.5 text-right">Total</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-800">{it.description}</td>
                          <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                            {it.hsnCode}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            ₹{it.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-right font-mono text-purple-700">
                            ₹{it.taxAmount.toLocaleString('en-IN')} ({it.taxRatePercent}%)
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
                          <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                            No items added yet. Please add items using the form above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {lineItems.length > 0 && (
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                        <tr>
                          <td colSpan={5} className="p-2 text-right text-slate-600">
                            Subtotal (Excl. Tax):
                          </td>
                          <td className="p-2 text-right font-mono">
                            ₹{formSubtotal.toLocaleString('en-IN')}
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="p-2 text-right text-purple-700">
                            Total GST:
                          </td>
                          <td className="p-2 text-right font-mono text-purple-700">
                            ₹{formTaxTotal.toLocaleString('en-IN')}
                          </td>
                          <td></td>
                        </tr>
                        <tr className="border-t border-slate-300 text-sm font-bold bg-amber-50">
                          <td colSpan={5} className="p-2.5 text-right text-amber-900">
                            Grand Invoice Total:
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

              {/* Stock Synchronization Option */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-deduct-stock"
                  checked={formDeductStock}
                  onChange={e => setFormDeductStock(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="chk-deduct-stock" className="text-xs text-slate-700 select-none">
                  <span className="font-bold block text-emerald-900">
                    Deduct items from Inventory Stock upon Invoice Issuance
                  </span>
                  Automatically updates product on-hand quantities and records an INVOICE_SALE stock
                  movement in the audit ledger.
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invoice Notes & Terms
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Terms of payment, bank RTGS details, milestone clause..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Issue Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Tax Invoice Preview */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-mono">
                  {viewingInvoice.invoiceNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Tax Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Billed To</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {viewingInvoice.customerName}
                </span>
                <span className="text-slate-600 block mt-1">GSTIN: {viewingInvoice.customerGst}</span>
                {viewingInvoice.customerAddress && (
                  <span className="text-slate-500 block mt-0.5">{viewingInvoice.customerAddress}</span>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Date:</span>
                  <span className="font-semibold text-slate-800">{viewingInvoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="font-semibold text-slate-800">{viewingInvoice.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="font-bold text-emerald-700">{viewingInvoice.status}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center">HSN</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">GST</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingInvoice.items.map(item => (
                    <tr key={item.id}>
                      <td className="p-2.5 font-medium text-slate-800">{item.description}</td>
                      <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                        {item.hsnCode}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        ₹{item.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right font-mono text-purple-700">
                        ₹{item.taxAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        ₹{item.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end gap-1 text-xs bg-slate-50 p-3 rounded-xl">
              <div className="flex justify-between w-64">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono text-slate-800">
                  ₹{viewingInvoice.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between w-64 text-purple-700">
                <span>Tax Total:</span>
                <span className="font-mono">₹{viewingInvoice.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between w-64 text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono text-amber-700">
                  ₹{viewingInvoice.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
