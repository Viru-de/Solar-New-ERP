import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Code,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Layers,
  HardDrive
} from 'lucide-react';
import { apiClient, DbStatusResponse } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';

export const DatabaseSettingsPanel: React.FC = () => {
  const { showToast } = useApp();
  const [status, setStatus] = useState<DbStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

  // Custom connection testing state
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'solarpulse_erp'
  });

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getDbStatus();
      setStatus(res);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await apiClient.testDbConnection(dbConfig);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(`Connection failed: ${res.message}`, 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Connection test error', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunMigration = async () => {
    if (!window.confirm('Push complete MySQL schema and all existing records (Customers, Projects, Leads, HRMS, Inventory, Sales & Purchase ERP) to the database?')) {
      return;
    }
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await apiClient.runMigration(showConfigModal ? dbConfig : undefined);
      if (res.success) {
        setMigrationResult(res.message);
        showToast(res.message, 'success');
        await loadStatus();
      } else {
        setMigrationResult(`Error: ${res.message}`);
        showToast(res.message, 'error');
      }
    } catch (e: any) {
      const msg = e.message || 'Migration failed';
      setMigrationResult(`Error: ${msg}`);
      showToast(msg, 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDownloadDump = () => {
    window.location.href = apiClient.getSqlDumpDownloadUrl();
    showToast('Downloading complete SolarPulse MySQL database dump (.sql)...', 'info');
  };

  const apiEndpoints = [
    { method: 'POST', path: '/api/auth/login', module: 'Authentication', desc: 'Secure staff & employee portal login via MySQL' },
    { method: 'POST', path: '/api/auth/customer-login', module: 'Customer Portal', desc: 'Commercial/industrial customer login with password' },
    { method: 'GET / POST', path: '/api/customers', module: 'Customer Directory', desc: 'Query all accounts, create new commercial customer' },
    { method: 'PUT', path: '/api/customers/:id/password', module: 'Customer Security', desc: 'Update portal password for customer account' },
    { method: 'GET / POST', path: '/api/leads', module: 'CRM Pipeline', desc: 'Commercial lead intake, estimations & salesperson routing' },
    { method: 'GET / POST', path: '/api/projects', module: 'EPC Projects', desc: 'Project lifecycle, 14 workflow stages & completion %' },
    { method: 'GET / POST', path: '/api/products', module: 'Inventory ERP', desc: 'PV modules, inverters, structures, stock levels & HSN' },
    { method: 'GET / POST', path: '/api/vendors', module: 'Procurement', desc: 'Tier-1 vendors, payment terms & supplier ratings' },
    { method: 'GET / POST', path: '/api/purchase-orders', module: 'Purchase ERP', desc: 'Purchase orders, GST calculation & delivery receipts' },
    { method: 'GET / POST', path: '/api/boms', module: 'Engineering BOM', desc: 'Bill of Materials allocation & system capacity sizing' },
    { method: 'GET / POST', path: '/api/sales-invoices', module: 'Sales & Invoicing', desc: 'GST invoices, e-Way bill details & warehouse address' },
    { method: 'GET / POST', path: '/api/warehouses', module: 'Logistics Depot', desc: 'Depots in Bhilai, Ahmedabad, Jaipur & Raipur' },
    { method: 'GET', path: '/api/stock-movements', module: 'Inventory Ledger', desc: 'BOM allocation & purchase receipt tracking' },
    { method: 'GET / POST', path: '/api/employees', module: 'HRMS Operations', desc: 'Technicians, engineers, wage brackets & login toggle' },
    { method: 'GET / POST', path: '/api/attendance', module: 'Field Attendance', desc: 'GPS-verified check-in stamps & project site tags' },
    { method: 'GET / POST', path: '/api/payments', module: 'Financials', desc: 'Milestone billing receipts & Tally Prime sync status' },
    { method: 'GET / POST', path: '/api/service-tickets', module: 'O&M Service', desc: 'Preventive maintenance tickets & technician dispatch' },
    { method: 'GET', path: '/api/db/status', module: 'System Database', desc: 'MySQL connection status, table list & health' },
    { method: 'POST', path: '/api/db/migrate', module: 'Data Migration', desc: 'Create all 28 tables & push all data into MySQL' },
    { method: 'GET', path: '/api/db/dump.sql', module: 'Export Database', desc: 'Direct download of production MySQL SQL dump file' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-950 rounded-2xl p-6 text-white shadow-md border border-amber-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Production MySQL Database & REST APIs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              MySQL Data Migration & Server APIs
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
              Standalone MySQL database engine without Firebase. All 28 modules, tables, customer passwords,
              and existing data records can be pushed directly to your MySQL server or imported via phpMyAdmin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadDump}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download SQL Dump</span>
            </button>
            <button
              onClick={handleRunMigration}
              disabled={isMigrating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all disabled:opacity-50"
            >
              <UploadCloud className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
              <span>{isMigrating ? 'Pushing Data...' : 'Push All Data to MySQL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Migration Notice / Success Banner */}
      {migrationResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          migrationResult.startsWith('Error')
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {migrationResult.startsWith('Error') ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <p className="font-bold">{migrationResult.startsWith('Error') ? 'Migration Alert' : 'Migration Completed'}</p>
            <p>{migrationResult}</p>
          </div>
        </div>
      )}

      {/* Database Connection & Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Connection Status Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Database Engine</h3>
            </div>
            <button
              onClick={loadStatus}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-700 p-1"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Engine</span>
              <span className="font-mono font-bold text-slate-800">MySQL 8.0+ / MariaDB</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Connection State</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                status?.connected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {status?.connected ? 'LIVE POOL ACTIVE' : 'LOCAL SYNC / READY'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Target Database</span>
              <span className="font-mono font-bold text-slate-800">{status?.database || 'solarpulse_erp'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Host : Port</span>
              <span className="font-mono font-bold text-slate-800">{status?.host || 'localhost'}:{status?.port || 3306}</span>
            </div>
          </div>

          <button
            onClick={() => setShowConfigModal(!showConfigModal)}
            className="w-full mt-2 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
          >
            {showConfigModal ? 'Hide Connection Tester' : 'Test Custom MySQL Credentials'}
          </button>
        </div>

        {/* Database Tables & Dump Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Schema & Tables</h3>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Total Tables</span>
              <span className="font-bold text-slate-900">28 Relational Tables</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Encoding</span>
              <span className="font-mono text-slate-800">utf8mb4_unicode_ci</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Dump File</span>
              <span className="font-mono text-emerald-700 font-bold">database.sql (245 KB)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Pre-populated Data</span>
              <span className="text-emerald-700 font-bold">100% All Initial Records</span>
            </div>
          </div>

          <button
            onClick={handleDownloadDump}
            className="w-full mt-2 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SQL File</span>
          </button>
        </div>

        {/* Deployment Steps Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Production Deployment</h3>
          </div>

          <ol className="text-xs text-slate-600 space-y-2.5 pt-1 list-decimal list-inside">
            <li>
              <span className="font-semibold text-slate-800">Create MySQL DB:</span> In cPanel or phpMyAdmin create <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">solarpulse_erp</code>.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Import Dump:</span> Click <em>Import</em> in phpMyAdmin and choose <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">database.sql</code>.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Set .env:</span> Set <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">DB_HOST, DB_USER, DB_PASS, DB_NAME</code> on your server.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Deploy:</span> Run <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">npm run build</code> or upload files to Hostinger <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">public_html</code>.
            </li>
          </ol>
        </div>
      </div>

      {/* Custom Connection Tester Modal / Panel */}
      {showConfigModal && (
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Custom MySQL Connection Tester</h3>
              <p className="text-xs text-slate-500">Test credentials against any external or remote MySQL database</p>
            </div>
            <button
              onClick={() => setShowConfigModal(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Host</label>
              <input
                type="text"
                value={dbConfig.host}
                onChange={e => setDbConfig({ ...dbConfig, host: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
                placeholder="localhost or IP"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Port</label>
              <input
                type="number"
                value={dbConfig.port}
                onChange={e => setDbConfig({ ...dbConfig, port: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Database Name</label>
              <input
                type="text"
                value={dbConfig.database}
                onChange={e => setDbConfig({ ...dbConfig, database: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={dbConfig.user}
                onChange={e => setDbConfig({ ...dbConfig, user: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={dbConfig.password}
                onChange={e => setDbConfig({ ...dbConfig, password: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
                placeholder="Database password"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleRunMigration}
                disabled={isMigrating}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
              >
                {isMigrating ? 'Pushing...' : 'Push Data Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REST API Endpoints Directory */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Module REST APIs Directory</h3>
            <p className="text-xs text-slate-500">
              Live server routes providing direct JSON operations for every ERP module
            </p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            20+ REST Endpoints Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint Route</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Operation Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {apiEndpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-amber-700">
                    <span className="px-2 py-0.5 rounded bg-amber-100/70 border border-amber-200">
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {ep.path}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">
                    {ep.module}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-500">
                    {ep.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
