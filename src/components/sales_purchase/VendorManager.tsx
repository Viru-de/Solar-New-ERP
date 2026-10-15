import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storage';
import { Vendor } from '../../types/solar';
import { validateVendor, DuplicateRecordError } from '../../services/validation';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Star,
  Trash2,
  Edit,
  X,
  CreditCard,
  ShieldCheck
} from 'lucide-react';

export const VendorManager: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form states
  const [formName, setFormName] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState<Vendor['category']>('Solar Modules');
  const [formGst, setFormGst] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('30 Days Credit');
  const [formRating, setFormRating] = useState<number>(5);
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNo, setFormAccountNo] = useState('');
  const [formIfsc, setFormIfsc] = useState('');

  const vendors = useMemo(() => storageService.getVendors(), [refreshTrigger]);

  const categories: Vendor['category'][] = [
    'Solar Modules',
    'Inverters',
    'Structures',
    'Cables & Switchgear',
    'Civil & Mechanical',
    'Logistics & Services'
  ];

  const filteredVendors = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return vendors.filter(v => {
      const matchesSearch =
        !q ||
        (v.name || '').toLowerCase().includes(q) ||
        (v.vendorCode || '').toLowerCase().includes(q) ||
        (v.contactPerson || '').toLowerCase().includes(q) ||
        (v.city || '').toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [vendors, searchQuery, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormErrors({});
    setFormName('');
    setFormContactPerson('');
    setFormEmail('');
    setFormPhone('');
    setFormCategory('Solar Modules');
    setFormGst('');
    setFormAddress('');
    setFormCity('');
    setFormState('');
    setFormPaymentTerms('30 Days Credit');
    setFormRating(5);
    setFormBankName('');
    setFormAccountNo('');
    setFormIfsc('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormErrors({});
    setFormName(vendor.name);
    setFormContactPerson(vendor.contactPerson);
    setFormEmail(vendor.email);
    setFormPhone(vendor.phone);
    setFormCategory(vendor.category);
    setFormGst(vendor.gstNumber);
    setFormAddress(vendor.address);
    setFormCity(vendor.city);
    setFormState(vendor.state);
    setFormPaymentTerms(vendor.paymentTerms);
    setFormRating(vendor.rating);
    setFormBankName(vendor.bankDetails?.bankName || '');
    setFormAccountNo(vendor.bankDetails?.accountNo || '');
    setFormIfsc(vendor.bankDetails?.ifsc || '');
    setIsModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errs: Record<string, string> = {};
    if (!formName.trim()) errs.name = 'Vendor name is required';
    if (!formContactPerson.trim()) errs.contactPerson = 'Contact person is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      showToast('Vendor name and contact person are required', 'warning');
      return;
    }

    const vendorToSave: Vendor = {
      id: editingVendor ? editingVendor.id : `vnd-${Date.now()}`,
      vendorCode: editingVendor
        ? editingVendor.vendorCode
        : `VND-${String(vendors.length + 1).padStart(3, '0')}`,
      name: formName,
      contactPerson: formContactPerson,
      email: formEmail,
      phone: formPhone,
      category: formCategory,
      gstNumber: formGst,
      address: formAddress,
      city: formCity,
      state: formState,
      bankDetails: formBankName
        ? {
            bankName: formBankName,
            accountNo: formAccountNo,
            ifsc: formIfsc
          }
        : undefined,
      paymentTerms: formPaymentTerms,
      rating: formRating,
      status: 'ACTIVE',
      createdAt: editingVendor ? editingVendor.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Duplicate validation
    const dupCheck = validateVendor(vendorToSave, vendors, editingVendor?.id);
    if (!dupCheck.valid) {
      setFormErrors({ [dupCheck.field || 'general']: dupCheck.message });
      showToast(dupCheck.message, 'error');
      return;
    }

    try {
      storageService.saveVendor(vendorToSave);
      triggerRefresh();
      showToast(
        `Vendor ${vendorToSave.name} ${editingVendor ? 'updated' : 'added'} successfully`,
        'success'
      );
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save vendor';
      showToast(msg, 'error');
      if (err instanceof DuplicateRecordError) {
        setFormErrors({ [err.field]: err.message });
      }
    }
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove vendor ${name}?`)) {
      storageService.deleteVendor(id);
      triggerRefresh();
      showToast(`Vendor ${name} deleted`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            Vendor Management Directory
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Maintain authorized OEM manufacturers, distributors, and supply-chain partners with payment terms & GST records.
          </p>
        </div>

        <button
          id="btn-add-vendor"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Vendor
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendors by name, city, contact..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Categories ({vendors.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVendors.map(vendor => (
          <div
            key={vendor.id}
            id={`vendor-card-${vendor.id}`}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
                  {vendor.vendorCode}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < vendor.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200 fill-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-base leading-snug mb-1">
                {vendor.name}
              </h4>

              <div className="inline-block bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-3">
                {vendor.category}
              </div>

              {/* Details List */}
              <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Contact:</span>
                  <span className="font-semibold text-slate-800">{vendor.contactPerson}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <a
                    href={`tel:${vendor.phone}`}
                    className="text-amber-600 hover:underline font-mono"
                  >
                    {vendor.phone}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">GSTIN:</span>
                  <span className="font-mono text-slate-700">{vendor.gstNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-700">
                    {vendor.city}, {vendor.state}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Payment Terms:</span>
                  <span className="font-bold text-slate-700">{vendor.paymentTerms}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${vendor.phone}`}
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Call Vendor"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`mailto:${vendor.email}`}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Email Vendor"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(vendor)}
                  className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Edit Vendor"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Vendor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredVendors.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-base mb-1">No Vendors Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Add your equipment suppliers and service vendors to manage purchasing.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600"
            >
              <Plus className="w-4 h-4" />
              Add First Vendor
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingVendor ? 'Edit Vendor Details' : 'Register New Vendor'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter supplier information, GSTIN, and credit terms.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveVendor} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {formErrors.general}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => {
                      setFormName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Waaree Energies Limited"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-xl ${
                      formErrors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as Vendor['category'])}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formContactPerson}
                    onChange={e => {
                      setFormContactPerson(e.target.value);
                      if (formErrors.contactPerson) setFormErrors(prev => ({ ...prev, contactPerson: '' }));
                    }}
                    placeholder="e.g. Ramesh Joshi"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                  {formErrors.contactPerson && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.contactPerson}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => {
                      setFormPhone(e.target.value);
                      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="+91 98200 12345"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-xl ${
                      formErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => {
                      setFormEmail(e.target.value);
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="sales@vendor.com"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-xl ${
                      formErrors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formGst}
                    onChange={e => {
                      setFormGst(e.target.value.toUpperCase());
                      if (formErrors.gstNumber) setFormErrors(prev => ({ ...prev, gstNumber: '' }));
                    }}
                    placeholder="27AAACW1234F1Z5"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-xl font-mono ${
                      formErrors.gstNumber ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.gstNumber && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.gstNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={formPaymentTerms}
                    onChange={e => setFormPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Immediate Cheque">Immediate Cheque</option>
                    <option value="15 Days Net">15 Days Net</option>
                    <option value="30 Days Credit">30 Days Credit</option>
                    <option value="Advance 20%, Balance on Delivery">
                      Advance 20%, Balance on Delivery
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rating (1-5 Stars)
                  </label>
                  <select
                    value={formRating}
                    onChange={e => setFormRating(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                    <option value={2}>2 Stars (Needs Review)</option>
                    <option value={1}>1 Star (Poor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    placeholder="Ahmedabad"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={e => setFormState(e.target.value)}
                    placeholder="Gujarat"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    placeholder="Plot / Industrial Estate"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                  <CreditCard className="w-3.5 h-3.5" />
                  Bank Account / Settlement Details (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formBankName}
                      onChange={e => setFormBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formAccountNo}
                      onChange={e => setFormAccountNo(e.target.value)}
                      placeholder="502000..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={formIfsc}
                      onChange={e => setFormIfsc(e.target.value.toUpperCase())}
                      placeholder="HDFC0000123"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
