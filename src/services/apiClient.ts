/**
 * SolarPulse EPC ERP & CRM - Production MySQL Backend API Client
 * Provides unified async communication with authenticated /api/* endpoints
 */

export interface DbStatusResponse {
  success: boolean;
  connected: boolean;
  host: string;
  database: string;
  port: number;
  mode: string;
  dumpAvailable: boolean;
  dumpPath: string;
  message: string;
  tables?: string[];
}

const AUTH_TOKEN_KEY = 'solarpulse_session_jwt_token';

class ApiClient {
  private baseUrl: string = '/api';

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  public setToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Database Management & Migration ---

  async getDbStatus(): Promise<DbStatusResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/db/status`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        connected: false,
        host: 'localhost',
        database: 'solarpulse_erp',
        port: 3306,
        mode: 'STANDBY_LOCAL_SYNC',
        dumpAvailable: true,
        dumpPath: '/database.sql',
        message: 'Could not contact backend API: ' + e.message
      };
    }
  }

  async testDbConnection(config: { host: string; port?: number; user: string; password?: string; database: string }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/db/test-connection`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection test failed.' };
    }
  }

  async runMigration(config?: any): Promise<{ success: boolean; message: string; tablesCount?: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/db/migrate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config || {})
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'Migration request failed.' };
    }
  }

  getSqlDumpDownloadUrl(): string {
    return `${this.baseUrl}/db/dump.sql`;
  }

  // --- Auth & Customer Portal ---

  async login(email: string, pass: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders()
      });
    } catch {
      // Ignore
    } finally {
      this.setToken(null);
    }
  }

  async requestPasswordReset(email: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async updateCustomerPassword(customerId: string, newPassword: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/customers/${encodeURIComponent(customerId)}/password`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  // --- Document Numbering Sequencer ---
  async getNextDocNumber(type: 'quotation' | 'invoice' | 'po' | 'project' | 'customer' | 'lead'): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/doc-numbers/next?type=${encodeURIComponent(type)}`, {
        headers: this.getHeaders()
      });
      const data = await res.json();
      return data.nextNumber || '';
    } catch {
      return '';
    }
  }

  // --- Unified API Request Helper ---
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      ...this.getHeaders(),
      ...(options.headers as Record<string, string> || {})
    };
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Non-JSON or empty
    }
    if (!res.ok) {
      throw new Error(json?.message || json?.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    if (json && json.success === false) {
      throw new Error(json.message || json.error || 'API operation failed');
    }
    return json;
  }

  // --- Customers ---
  async getCustomers(): Promise<any[]> {
    const json = await this.request<any>('/customers');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveCustomer(cust: any): Promise<any> {
    const json = await this.request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(cust)
    });
    return json?.data || cust;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const json = await this.request<any>(`/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Leads ---
  async getLeads(): Promise<any[]> {
    const json = await this.request<any>('/leads');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveLead(lead: any): Promise<any> {
    const json = await this.request<any>('/leads', {
      method: 'POST',
      body: JSON.stringify(lead)
    });
    return json?.data || lead;
  }

  async deleteLead(id: string): Promise<boolean> {
    const json = await this.request<any>(`/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Projects ---
  async getProjects(): Promise<any[]> {
    const json = await this.request<any>('/projects');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveProject(proj: any): Promise<any> {
    const json = await this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(proj)
    });
    return json?.data || proj;
  }

  async deleteProject(id: string): Promise<boolean> {
    const json = await this.request<any>(`/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Quotations ---
  async getQuotations(): Promise<any[]> {
    const json = await this.request<any>('/quotations');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveQuotation(quote: any): Promise<any> {
    const json = await this.request<any>('/quotations', {
      method: 'POST',
      body: JSON.stringify(quote)
    });
    return json?.data || quote;
  }

  async deleteQuotation(id: string): Promise<boolean> {
    const json = await this.request<any>(`/quotations/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Invoices ---
  async getSalesInvoices(): Promise<any[]> {
    const json = await this.request<any>('/sales-invoices');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveSalesInvoice(inv: any): Promise<any> {
    const json = await this.request<any>('/sales-invoices', {
      method: 'POST',
      body: JSON.stringify(inv)
    });
    return json?.data || inv;
  }

  async deleteSalesInvoice(id: string): Promise<boolean> {
    const json = await this.request<any>(`/sales-invoices/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Payments & Expenses ---
  async getPayments(): Promise<any[]> {
    const json = await this.request<any>('/payments');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async savePayment(pay: any): Promise<any> {
    const json = await this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(pay)
    });
    return json?.data || pay;
  }

  async deletePayment(id: string): Promise<boolean> {
    const json = await this.request<any>(`/payments/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  async getExpenses(): Promise<any[]> {
    const json = await this.request<any>('/expenses');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveExpense(exp: any): Promise<any> {
    const json = await this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(exp)
    });
    return json?.data || exp;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const json = await this.request<any>(`/expenses/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Inventory & Stock ---
  async getProducts(): Promise<any[]> {
    const json = await this.request<any>('/products');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveProduct(prod: any): Promise<any> {
    const json = await this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(prod)
    });
    return json?.data || prod;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const json = await this.request<any>(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  async getVendors(): Promise<any[]> {
    const json = await this.request<any>('/vendors');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveVendor(ven: any): Promise<any> {
    const json = await this.request<any>('/vendors', {
      method: 'POST',
      body: JSON.stringify(ven)
    });
    return json?.data || ven;
  }

  async deleteVendor(id: string): Promise<boolean> {
    const json = await this.request<any>(`/vendors/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  async getPurchaseOrders(): Promise<any[]> {
    const json = await this.request<any>('/purchase-orders');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async savePurchaseOrder(po: any): Promise<any> {
    const json = await this.request<any>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(po)
    });
    return json?.data || po;
  }

  async deletePurchaseOrder(id: string): Promise<boolean> {
    const json = await this.request<any>(`/purchase-orders/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  async recordStockMovement(sm: any): Promise<any> {
    return this.request<any>('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(sm)
    });
  }

  async getStockMovements(): Promise<any[]> {
    const json = await this.request<any>('/stock-movements');
    return Array.isArray(json?.data) ? json.data : [];
  }

  // --- HRMS ---
  async getEmployees(): Promise<any[]> {
    const json = await this.request<any>('/employees');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveEmployee(emp: any): Promise<any> {
    const json = await this.request<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(emp)
    });
    return json?.data || emp;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const json = await this.request<any>(`/employees/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  async getAttendance(): Promise<any[]> {
    const json = await this.request<any>('/attendance');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveAttendance(att: any): Promise<any> {
    const json = await this.request<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(att)
    });
    return json?.data || att;
  }

  async deleteAttendance(id: string): Promise<boolean> {
    const json = await this.request<any>(`/attendance/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  async getPayslips(): Promise<any[]> {
    const json = await this.request<any>('/payslips');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async savePayslip(slip: any): Promise<any> {
    const json = await this.request<any>('/payslips', {
      method: 'POST',
      body: JSON.stringify(slip)
    });
    return json?.data || slip;
  }

  async deletePayslip(id: string): Promise<boolean> {
    const json = await this.request<any>(`/payslips/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Service & AMC ---
  async getServiceTickets(): Promise<any[]> {
    const json = await this.request<any>('/service-tickets');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveServiceTicket(ticket: any): Promise<any> {
    const json = await this.request<any>('/service-tickets', {
      method: 'POST',
      body: JSON.stringify(ticket)
    });
    return json?.data || ticket;
  }

  async deleteServiceTicket(id: string): Promise<boolean> {
    const json = await this.request<any>(`/service-tickets/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  async getAmcContracts(): Promise<any[]> {
    const json = await this.request<any>('/amc-contracts');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveAmcContract(contract: any): Promise<any> {
    const json = await this.request<any>('/amc-contracts', {
      method: 'POST',
      body: JSON.stringify(contract)
    });
    return json?.data || contract;
  }

  async deleteAmcContract(id: string): Promise<boolean> {
    const json = await this.request<any>(`/amc-contracts/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Bill of Materials (BOM) ---
  async getBoms(): Promise<any[]> {
    const json = await this.request<any>('/boms');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveBom(bom: any): Promise<any> {
    const json = await this.request<any>('/boms', {
      method: 'POST',
      body: JSON.stringify(bom)
    });
    return json?.data || bom;
  }

  async deleteBom(id: string): Promise<boolean> {
    const json = await this.request<any>(`/boms/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- Warehouses ---
  async getWarehouses(): Promise<any[]> {
    const json = await this.request<any>('/warehouses');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveWarehouse(wh: any): Promise<any> {
    const json = await this.request<any>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(wh)
    });
    return json?.data || wh;
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    const json = await this.request<any>(`/warehouses/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return Boolean(json?.success);
  }

  // --- System Settings & Notifications ---
  async getSettings(): Promise<any> {
    const json = await this.request<any>('/settings');
    return json?.data || null;
  }

  async saveSettings(settings: any): Promise<any> {
    const json = await this.request<any>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    return json?.data || settings;
  }

  async getNotifications(): Promise<any[]> {
    const json = await this.request<any>('/notifications');
    return Array.isArray(json?.data) ? json.data : [];
  }

  async saveNotification(notif: any): Promise<any> {
    const json = await this.request<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notif)
    });
    return json?.data || notif;
  }
}

export const apiClient = new ApiClient();
