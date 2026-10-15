import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storage';
import { ProductItem, Vendor } from '../../types/solar';
import { validateProduct, DuplicateRecordError } from '../../services/validation';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  X,
  Building2,
  Tag,
  DollarSign,
  Boxes,
  MapPin
} from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form states
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductItem['category']>('Solar Panels');
  const [formBrand, setFormBrand] = useState('');
  const [formSpec, setFormSpec] = useState('');
  const [formUnit, setFormUnit] = useState<ProductItem['unit']>('NOS');
  const [formHsn, setFormHsn] = useState('85414011');
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinThreshold, setFormMinThreshold] = useState<number>(10);
  const [formLocation, setFormLocation] = useState('Warehouse A - Bay 1');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formVendorId, setFormVendorId] = useState('');

  const products = useMemo(() => storageService.getProducts(), [refreshTrigger]);
  const vendors = useMemo(() => storageService.getVendors(), [refreshTrigger]);
  const warehouses = useMemo(() => storageService.getWarehouses(), [refreshTrigger]);

  const categories: ProductItem['category'][] = [
    'Solar Panels',
    'Inverters',
    'Mounting Structures',
    'Electrical & Cables',
    'Civil & Fasteners',
    'Safety & Accessories',
    'Monitoring & Sensors'
  ];

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return products.filter(p => {
      const matchesSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormErrors({});
    setFormSku(`PRD-${Date.now().toString().slice(-4)}`);
    setFormName('');
    setFormCategory('Solar Panels');
    setFormBrand('');
    setFormSpec('');
    setFormUnit('NOS');
    setFormHsn('85414011');
    setFormUnitPrice(0);
    setFormSellingPrice(0);
    setFormStock(50);
    setFormMinThreshold(10);
    setFormLocation('Warehouse A - Bay 1');
    setFormWarehouseId(warehouses[0]?.id || 'wh-1');
    setFormVendorId(vendors[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setFormErrors({});
    setFormSku(p.sku);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormBrand(p.brand);
    setFormSpec(p.specification);
    setFormUnit(p.unit);
    setFormHsn(p.hsnCode);
    setFormUnitPrice(p.unitPrice);
    setFormSellingPrice(p.sellingPrice);
    setFormStock(p.currentStock);
    setFormMinThreshold(p.minStockThreshold);
    setFormLocation(p.location);
    setFormWarehouseId(p.warehouseId || warehouses[0]?.id || 'wh-1');
    setFormVendorId(p.preferredVendorId || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errs: Record<string, string> = {};
    if (!formSku.trim()) errs.sku = 'SKU code is required';
    if (!formName.trim()) errs.name = 'Product name is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      showToast('SKU and Product Name are required', 'warning');
      return;
    }

    const preferredVendor = vendors.find(v => v.id === formVendorId);
    const selectedWh = warehouses.find(w => w.id === formWarehouseId) || storageService.getDefaultWarehouse();

    const productToSave: ProductItem = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      sku: formSku.toUpperCase(),
      name: formName,
      category: formCategory,
      brand: formBrand,
      specification: formSpec,
      unit: formUnit,
      hsnCode: formHsn,
      unitPrice: formUnitPrice,
      sellingPrice: formSellingPrice,
      currentStock: formStock,
      minStockThreshold: formMinThreshold,
      location: formLocation,
      warehouseId: selectedWh.id,
      warehouseName: selectedWh.name,
      preferredVendorId: formVendorId || undefined,
      preferredVendorName: preferredVendor?.name || undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Pre-validate for duplicates
    const dupCheck = validateProduct(productToSave, products, editingProduct?.id);
    if (!dupCheck.valid) {
      setFormErrors({ [dupCheck.field || 'general']: dupCheck.message });
      showToast(dupCheck.message, 'error');
      return;
    }

    try {
      storageService.saveProduct(productToSave);
      triggerRefresh();
      showToast(
        `Product ${productToSave.sku} ${editingProduct ? 'updated' : 'added'} to catalog`,
        'success'
      );
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      showToast(msg, 'error');
      if (err instanceof DuplicateRecordError) {
        setFormErrors({ [err.field]: err.message });
      }
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      storageService.deleteProduct(id);
      triggerRefresh();
      showToast(`Product deleted`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Purchased Products & Master Catalog
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Complete inventory catalog of solar PV modules, string inverters, HDG structures, and balance of system (BOS) materials.
          </p>
        </div>

        <button
          id="btn-add-product"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU, product name, brand..."
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
            All Products ({products.length})
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

      {/* Product Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(product => {
          const isLowStock = product.currentStock <= product.minStockThreshold;
          return (
            <div
              key={product.id}
              id={`product-card-${product.id}`}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
                    {product.sku}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isLowStock
                        ? 'bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isLowStock ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock Alert
                      </>
                    ) : (
                      'In Stock'
                    )}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-base leading-snug mb-1 line-clamp-2">
                  {product.name}
                </h4>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span className="font-medium text-slate-700">{product.brand}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{product.category}</span>
                </div>

                {product.specification && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {product.specification}
                  </p>
                )}

                {/* Stock & Valuation Stats */}
                <div className="space-y-1.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Available Stock:</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        isLowStock ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {product.currentStock} {product.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Purchase Cost (Excl. Tax):</span>
                    <span className="font-mono text-slate-700">
                      ₹{product.unitPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Selling Price:</span>
                    <span className="font-mono font-bold text-amber-700">
                      ₹{product.sellingPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400">Warehouse Location:</span>
                    <span className="text-slate-600 truncate max-w-[140px]">
                      {product.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-mono">
                  HSN: {product.hsnCode}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-base mb-1">No Products Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Add products to your catalog to link with BOMs and purchase entries.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600"
            >
              <Plus className="w-4 h-4" />
              Add First Product
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingProduct ? 'Edit Product Item' : 'New Product Item'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define specifications, units, HSN codes, and warehouse threshold.
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

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {formErrors.general}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={e => {
                      setFormSku(e.target.value.toUpperCase());
                      if (formErrors.sku) setFormErrors(prev => ({ ...prev, sku: '' }));
                    }}
                    placeholder="MOD-WAA-540"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-xl font-mono ${
                      formErrors.sku ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.sku && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.sku}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => {
                      setFormName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Waaree 540Wp Bifacial Solar Module"
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-xl ${
                      formErrors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as ProductItem['category'])}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand / OEM</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                    placeholder="e.g. Waaree / Sungrow / Polycab"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value as ProductItem['unit'])}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="NOS">NOS (Numbers)</option>
                    <option value="SETS">SETS</option>
                    <option value="METERS">METERS</option>
                    <option value="PACKS">PACKS</option>
                    <option value="KG">KG (Kilograms)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technical Specifications
                </label>
                <textarea
                  rows={2}
                  value={formSpec}
                  onChange={e => setFormSpec(e.target.value)}
                  placeholder="540Wp Bifacial Dual Glass, 144 Half-cut Cells, IP68 Junction Box..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    value={formHsn}
                    onChange={e => setFormHsn(e.target.value)}
                    placeholder="85414011"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formUnitPrice}
                    onChange={e => setFormUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formSellingPrice}
                    onChange={e => setFormSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={e => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Stock Reorder Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinThreshold}
                    onChange={e => setFormMinThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Warehouse Bin / Rack
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="Warehouse A - Bay 1"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Vendor
                  </label>
                  <select
                    value={formVendorId}
                    onChange={e => setFormVendorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="">-- None / Multiple --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
