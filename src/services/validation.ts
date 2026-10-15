import {
  Customer,
  ProductItem,
  Vendor,
  Employee,
  BillOfMaterials,
  BOMItem,
  PurchaseOrder,
  PurchaseLineItem
} from '../types/solar';

export interface ValidationResult {
  valid: boolean;
  field?: string;
  message?: string;
}

export class DuplicateRecordError extends Error {
  public field: string;
  public conflictingRecordId?: string;
  public conflictingValue?: string;

  constructor(message: string, field: string, conflictingRecordId?: string, conflictingValue?: string) {
    super(message);
    this.name = 'DuplicateRecordError';
    this.field = field;
    this.conflictingRecordId = conflictingRecordId;
    this.conflictingValue = conflictingValue;
    Object.setPrototypeOf(this, DuplicateRecordError.prototype);
  }
}

// ==========================================
// Value Normalization Helpers
// ==========================================

/**
 * Collapses whitespace and trims leading/trailing spaces.
 */
export function normalizeText(str?: string | null): string {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Collapses whitespace, trims, and converts to lowercase for case-insensitive comparison.
 */
export function normalizeCaseInsensitive(str?: string | null): string {
  return normalizeText(str).toLowerCase();
}

/**
 * Retains digits only for standardized phone comparison.
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Trims and converts email to lowercase.
 */
export function normalizeEmail(email?: string | null): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Normalizes GST numbers by trimming, uppercasing, and removing spaces/hyphens.
 */
export function normalizeGst(gst?: string | null): string {
  if (!gst) return '';
  return gst.trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Standardizes codes (SKU, vendorCode, employeeCode, bomNumber) by trimming, uppercasing, and stripping whitespace.
 */
export function normalizeCode(code?: string | null): string {
  if (!code) return '';
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

// ==========================================
// 1. Customer Duplicate Validation
// ==========================================
export function validateCustomer(
  candidate: Partial<Customer>,
  existingCustomers: Customer[],
  ignoreId?: string
): ValidationResult {
  const pool = existingCustomers.filter(c => !ignoreId || c.id !== ignoreId);

  // 1. Phone number comparison (digits only)
  const candPhone = normalizePhone(candidate.phone);
  if (candPhone.length >= 7) {
    const match = pool.find(c => {
      const p = normalizePhone(c.phone);
      return p.length >= 7 && (p === candPhone || p.endsWith(candPhone) || candPhone.endsWith(p));
    });
    if (match) {
      return {
        valid: false,
        field: 'phone',
        message: `Customer with phone number "${candidate.phone}" already exists (${match.name}).`
      };
    }
  }

  // 2. Email comparison
  const candEmail = normalizeEmail(candidate.email);
  if (candEmail.length > 0) {
    const match = pool.find(c => normalizeEmail(c.email) === candEmail);
    if (match) {
      return {
        valid: false,
        field: 'email',
        message: `Customer with email "${candidate.email}" already exists (${match.name}).`
      };
    }
  }

  // 3. GST Number comparison
  const candGst = normalizeGst(candidate.gstNumber);
  if (candGst.length > 0) {
    const match = pool.find(c => normalizeGst(c.gstNumber) === candGst);
    if (match) {
      return {
        valid: false,
        field: 'gstNumber',
        message: `Customer with GST number "${candidate.gstNumber}" already exists (${match.name}).`
      };
    }
  }

  // 4. Name / Company check
  const candName = normalizeCaseInsensitive(candidate.name);
  const candCompany = normalizeCaseInsensitive(candidate.companyName);
  if (candName.length > 0) {
    const match = pool.find(c => {
      const sameName = normalizeCaseInsensitive(c.name) === candName;
      const sameCompany = candCompany && c.companyName && normalizeCaseInsensitive(c.companyName) === candCompany;
      const sameCity = candidate.city && c.city && normalizeCaseInsensitive(c.city) === normalizeCaseInsensitive(candidate.city);
      return (sameName && sameCompany) || (sameName && sameCity);
    });
    if (match) {
      return {
        valid: false,
        field: 'name',
        message: `Customer "${candidate.name}" (${candidate.companyName || match.city || 'existing record'}) is already registered.`
      };
    }
  }

  return { valid: true };
}

// ==========================================
// 2. Product Duplicate Validation
// ==========================================
export function validateProduct(
  candidate: Partial<ProductItem>,
  existingProducts: ProductItem[],
  ignoreId?: string
): ValidationResult {
  const pool = existingProducts.filter(p => !ignoreId || p.id !== ignoreId);

  // 1. SKU uniqueness (Primary inventory identifier)
  const candSku = normalizeCode(candidate.sku);
  if (candSku.length > 0) {
    const match = pool.find(p => normalizeCode(p.sku) === candSku);
    if (match) {
      return {
        valid: false,
        field: 'sku',
        message: `Product with SKU "${candidate.sku}" already exists (${match.name}).`
      };
    }
  }

  // 2. Product Name uniqueness
  const candName = normalizeCaseInsensitive(candidate.name);
  if (candName.length > 0) {
    const match = pool.find(p => normalizeCaseInsensitive(p.name) === candName);
    if (match) {
      return {
        valid: false,
        field: 'name',
        message: `Product with name "${candidate.name}" already exists (SKU: ${match.sku}).`
      };
    }
  }

  return { valid: true };
}

// ==========================================
// 3. Vendor Duplicate Validation
// ==========================================
export function validateVendor(
  candidate: Partial<Vendor>,
  existingVendors: Vendor[],
  ignoreId?: string
): ValidationResult {
  const pool = existingVendors.filter(v => !ignoreId || v.id !== ignoreId);

  // 1. Vendor Code uniqueness
  const candCode = normalizeCode(candidate.vendorCode);
  if (candCode.length > 0) {
    const match = pool.find(v => normalizeCode(v.vendorCode) === candCode);
    if (match) {
      return {
        valid: false,
        field: 'vendorCode',
        message: `Vendor with code "${candidate.vendorCode}" already exists (${match.name}).`
      };
    }
  }

  // 2. Vendor Name uniqueness
  const candName = normalizeCaseInsensitive(candidate.name);
  if (candName.length > 0) {
    const match = pool.find(v => normalizeCaseInsensitive(v.name) === candName);
    if (match) {
      return {
        valid: false,
        field: 'name',
        message: `Vendor with name "${candidate.name}" already exists (Code: ${match.vendorCode}).`
      };
    }
  }

  // 3. GST Number uniqueness
  const candGst = normalizeGst(candidate.gstNumber);
  if (candGst.length > 0) {
    const match = pool.find(v => normalizeGst(v.gstNumber) === candGst);
    if (match) {
      return {
        valid: false,
        field: 'gstNumber',
        message: `Vendor with GST number "${candidate.gstNumber}" already exists (${match.name}).`
      };
    }
  }

  // 4. Phone number uniqueness
  const candPhone = normalizePhone(candidate.phone);
  if (candPhone.length >= 7) {
    const match = pool.find(v => {
      const p = normalizePhone(v.phone);
      return p.length >= 7 && (p === candPhone || p.endsWith(candPhone) || candPhone.endsWith(p));
    });
    if (match) {
      return {
        valid: false,
        field: 'phone',
        message: `Vendor with phone number "${candidate.phone}" already exists (${match.name}).`
      };
    }
  }

  // 5. Email uniqueness
  const candEmail = normalizeEmail(candidate.email);
  if (candEmail.length > 0) {
    const match = pool.find(v => normalizeEmail(v.email) === candEmail);
    if (match) {
      return {
        valid: false,
        field: 'email',
        message: `Vendor with email "${candidate.email}" already exists (${match.name}).`
      };
    }
  }

  return { valid: true };
}

// ==========================================
// 4. Employee Duplicate Validation
// ==========================================
export function validateEmployee(
  candidate: Partial<Employee>,
  existingEmployees: Employee[],
  ignoreId?: string
): ValidationResult {
  const pool = existingEmployees.filter(e => !ignoreId || e.id !== ignoreId);

  // 1. Employee Code uniqueness
  const candCode = normalizeCode(candidate.employeeCode);
  if (candCode.length > 0) {
    const match = pool.find(e => normalizeCode(e.employeeCode) === candCode);
    if (match) {
      return {
        valid: false,
        field: 'employeeCode',
        message: `Employee with code "${candidate.employeeCode}" already exists (${match.name}).`
      };
    }
  }

  // 2. Email uniqueness
  const candEmail = normalizeEmail(candidate.email);
  if (candEmail.length > 0) {
    const match = pool.find(e => normalizeEmail(e.email) === candEmail);
    if (match) {
      return {
        valid: false,
        field: 'email',
        message: `Employee with email "${candidate.email}" already exists (${match.name}, ${match.employeeCode}).`
      };
    }
  }

  // 3. Phone number uniqueness
  const candPhone = normalizePhone(candidate.phone);
  if (candPhone.length >= 7) {
    const match = pool.find(e => {
      const p = normalizePhone(e.phone);
      return p.length >= 7 && (p === candPhone || p.endsWith(candPhone) || candPhone.endsWith(p));
    });
    if (match) {
      return {
        valid: false,
        field: 'phone',
        message: `Employee with phone number "${candidate.phone}" already exists (${match.name}, ${match.employeeCode}).`
      };
    }
  }

  return { valid: true };
}

// ==========================================
// 5. BOM & Line Item Duplicate Validation
// ==========================================

/**
 * Validates whether an entire list of BOM line items contains internal duplicates.
 */
export function validateBOMLineItems(
  items: (BOMItem | Omit<BOMItem, 'id'>)[]
): ValidationResult {
  const seenProductIds = new Set<string>();
  const seenSkus = new Set<string>();
  const seenNames = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    if (it.productId) {
      if (seenProductIds.has(it.productId)) {
        return {
          valid: false,
          field: 'productId',
          message: `Product "${it.productName}" is already included in this Bill of Materials.`
        };
      }
      seenProductIds.add(it.productId);
    }

    const sku = normalizeCode(it.sku);
    if (sku && !sku.startsWith('CUSTOM-')) {
      if (seenSkus.has(sku)) {
        return {
          valid: false,
          field: 'sku',
          message: `Item with SKU "${it.sku}" (${it.productName}) is already in this Bill of Materials.`
        };
      }
      seenSkus.add(sku);
    }

    const name = normalizeCaseInsensitive(it.productName);
    if (name && (!it.productId && (!sku || sku.startsWith('CUSTOM-')))) {
      if (seenNames.has(name)) {
        return {
          valid: false,
          field: 'productName',
          message: `Line item "${it.productName}" is already included in this Bill of Materials.`
        };
      }
      seenNames.add(name);
    }
  }

  return { valid: true };
}

/**
 * Validates whether a single line item being added or updated is a duplicate within a BOM's line item list.
 */
export function validateBOMLineItem(
  candidate: Partial<BOMItem>,
  existingItems: (BOMItem | Omit<BOMItem, 'id'>)[],
  ignoreIndex?: number
): ValidationResult {
  const pool = existingItems.filter((_, idx) => ignoreIndex === undefined || idx !== ignoreIndex);

  // 1. Check matching productId
  if (candidate.productId) {
    const match = pool.find(it => it.productId === candidate.productId);
    if (match) {
      return {
        valid: false,
        field: 'productId',
        message: `Product "${candidate.productName || match.productName}" is already included in this Bill of Materials. Update the quantity instead of adding duplicate line items.`
      };
    }
  }

  // 2. Check matching SKU (if not a generic custom item)
  const candSku = normalizeCode(candidate.sku);
  if (candSku.length > 0 && !candSku.startsWith('CUSTOM-')) {
    const match = pool.find(it => normalizeCode(it.sku) === candSku);
    if (match) {
      return {
        valid: false,
        field: 'sku',
        message: `Item with SKU "${candidate.sku}" (${candidate.productName || match.productName}) is already in this Bill of Materials.`
      };
    }
  }

  // 3. Check custom product name match
  const candName = normalizeCaseInsensitive(candidate.productName);
  if (candName.length > 0 && (!candidate.productId && (!candSku || candSku.startsWith('CUSTOM-')))) {
    const match = pool.find(it => normalizeCaseInsensitive(it.productName) === candName);
    if (match) {
      return {
        valid: false,
        field: 'productName',
        message: `Line item "${candidate.productName}" is already included in this Bill of Materials.`
      };
    }
  }

  return { valid: true };
}

/**
 * Validates an entire Bill of Materials before persistence:
 * - Checks BOM number uniqueness across all BOMs
 * - Checks that line items within the BOM contain no internal duplicates
 */
export function validateBOM(
  candidate: Partial<BillOfMaterials>,
  existingBoms: BillOfMaterials[],
  ignoreId?: string
): ValidationResult {
  const pool = existingBoms.filter(b => !ignoreId || b.id !== ignoreId);

  // 1. BOM Number uniqueness
  const candBomNum = normalizeCode(candidate.bomNumber);
  if (candBomNum.length > 0) {
    const match = pool.find(b => normalizeCode(b.bomNumber) === candBomNum);
    if (match) {
      return {
        valid: false,
        field: 'bomNumber',
        message: `Bill of Materials with number "${candidate.bomNumber}" already exists (${match.projectTitle}).`
      };
    }
  }

  // 2. Check for internal duplicate items inside candidate.items
  if (candidate.items && candidate.items.length > 0) {
    const seenProductIds = new Set<string>();
    const seenSkus = new Set<string>();
    const seenNames = new Set<string>();

    for (let i = 0; i < candidate.items.length; i++) {
      const it = candidate.items[i];

      // Check product ID
      if (it.productId) {
        if (seenProductIds.has(it.productId)) {
          return {
            valid: false,
            field: 'items',
            message: `Duplicate line item detected: Product "${it.productName}" is listed multiple times in this Bill of Materials.`
          };
        }
        seenProductIds.add(it.productId);
      }

      // Check SKU
      const sku = normalizeCode(it.sku);
      if (sku && !sku.startsWith('CUSTOM-')) {
        if (seenSkus.has(sku)) {
          return {
            valid: false,
            field: 'items',
            message: `Duplicate line item detected: Item SKU "${it.sku}" (${it.productName}) is listed multiple times in this Bill of Materials.`
          };
        }
        seenSkus.add(sku);
      }

      // Check custom name if no product ID or SKU
      const name = normalizeCaseInsensitive(it.productName);
      if (name && !it.productId && (!sku || sku.startsWith('CUSTOM-'))) {
        if (seenNames.has(name)) {
          return {
            valid: false,
            field: 'items',
            message: `Duplicate line item detected: "${it.productName}" is listed multiple times in this Bill of Materials.`
          };
        }
        seenNames.add(name);
      }
    }
  }

  return { valid: true };
}

// ==========================================
// 6. Purchase Order & Line Item Duplicate Validation
// ==========================================

/**
 * Validates whether an array of Purchase Order line items contains duplicate products.
 * The same product must not be added more than once in a single Purchase Order.
 */
export function validatePOLineItems(
  items: (PurchaseLineItem | Partial<PurchaseLineItem>)[]
): ValidationResult {
  const seenProductIds = new Map<string, string>(); // id -> display name
  const seenSkus = new Map<string, string>(); // sku -> display name
  const seenNames = new Map<string, string>(); // normalized name -> display name

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const displayName = it.productName || it.sku || `Line Item #${i + 1}`;

    // 1. Check matching Product ID
    if (it.productId && it.productId.trim()) {
      const pid = it.productId.trim();
      if (seenProductIds.has(pid)) {
        return {
          valid: false,
          field: 'productId',
          message: `Duplicate product detected: "${displayName}" is already included in this Purchase Order. Please update the quantity of the existing line item instead of adding it again.`
        };
      }
      seenProductIds.set(pid, displayName);
    }

    // 2. Check matching SKU (normalized)
    const sku = normalizeCode(it.sku);
    if (sku.length > 0 && !sku.startsWith('CUSTOM-')) {
      if (seenSkus.has(sku)) {
        return {
          valid: false,
          field: 'sku',
          message: `Duplicate product detected: Product with SKU "${it.sku}" (${displayName}) is already added in this Purchase Order. Combine quantities into a single line item.`
        };
      }
      seenSkus.set(sku, displayName);
    }

    // 3. Check matching Product Name (case-insensitive)
    const normName = normalizeCaseInsensitive(it.productName);
    if (normName.length > 0) {
      if (seenNames.has(normName)) {
        return {
          valid: false,
          field: 'productName',
          message: `Duplicate product detected: "${it.productName}" is already present in this Purchase Order. Update the quantity of the existing line item.`
        };
      }
      seenNames.set(normName, displayName);
    }
  }

  return { valid: true };
}

/**
 * Validates whether a candidate purchase line item being added or modified is already in the line items list.
 */
export function validatePOLineItem(
  candidate: Partial<PurchaseLineItem>,
  existingItems: (PurchaseLineItem | Partial<PurchaseLineItem>)[],
  ignoreIndex?: number
): ValidationResult {
  const pool = existingItems.filter((_, idx) => ignoreIndex === undefined || idx !== ignoreIndex);
  const displayName = candidate.productName || candidate.sku || 'Selected product';

  // 1. Check Product ID match
  if (candidate.productId && candidate.productId.trim()) {
    const candPid = candidate.productId.trim();
    const match = pool.find(it => it.productId && it.productId.trim() === candPid);
    if (match) {
      return {
        valid: false,
        field: 'productId',
        message: `Product "${displayName}" is already included in this Purchase Order. Please update the quantity of the existing line item instead of adding a duplicate.`
      };
    }
  }

  // 2. Check SKU match
  const candSku = normalizeCode(candidate.sku);
  if (candSku.length > 0 && !candSku.startsWith('CUSTOM-')) {
    const match = pool.find(it => normalizeCode(it.sku) === candSku);
    if (match) {
      return {
        valid: false,
        field: 'sku',
        message: `Product with SKU "${candidate.sku}" (${displayName}) is already included in this Purchase Order. Update the existing item's quantity.`
      };
    }
  }

  // 3. Check Product Name match (case-insensitive)
  const candName = normalizeCaseInsensitive(candidate.productName);
  if (candName.length > 0) {
    const match = pool.find(it => normalizeCaseInsensitive(it.productName) === candName);
    if (match) {
      return {
        valid: false,
        field: 'productName',
        message: `Product "${candidate.productName}" is already included in this Purchase Order. Increase its quantity instead of adding a duplicate line.`
      };
    }
  }

  return { valid: true };
}

/**
 * Validates an entire Purchase Order before persistence:
 * - Checks that line items contain strictly no duplicate products.
 * - Checks PO Number uniqueness if provided and comparing against existing orders.
 */
export function validatePurchaseOrder(
  candidate: Partial<PurchaseOrder>,
  existingOrders?: PurchaseOrder[],
  ignoreId?: string
): ValidationResult {
  // 1. Strict Duplicate Product Validation on Line Items
  if (candidate.items && candidate.items.length > 0) {
    const itemsValidation = validatePOLineItems(candidate.items);
    if (!itemsValidation.valid) {
      return itemsValidation;
    }
  }

  // 2. PO Number uniqueness (if existingOrders provided)
  if (existingOrders && candidate.purchaseNumber) {
    const candPoNum = normalizeCode(candidate.purchaseNumber);
    const pool = existingOrders.filter(o => !ignoreId || o.id !== ignoreId);
    const match = pool.find(o => normalizeCode(o.purchaseNumber) === candPoNum);
    if (match) {
      return {
        valid: false,
        field: 'purchaseNumber',
        message: `Purchase Order number "${candidate.purchaseNumber}" already exists.`
      };
    }
  }

  return { valid: true };
}

/**
 * Helper to throw a DuplicateRecordError if validation fails.
 */
export function assertValid(result: ValidationResult): void {
  if (!result.valid) {
    throw new DuplicateRecordError(result.message || 'Duplicate entry detected', result.field || 'general');
  }
}
