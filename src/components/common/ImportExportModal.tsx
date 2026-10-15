import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  exportToCSV,
  getSampleTemplate,
  parseAndValidateCSV,
  ImportValidationReport
} from '../../services/exportImport';
import { storageService } from '../../services/storage';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';

export const ImportExportModal: React.FC = () => {
  const { isImportExportOpen, closeImportExportModal, importExportModule, showToast, triggerRefresh } = useApp();
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');
  const [uploadText, setUploadText] = useState('');
  const [report, setReport] = useState<ImportValidationReport | null>(null);

  if (!isImportExportOpen) return null;

  const handleDownloadTemplate = () => {
    const tmpl = getSampleTemplate(importExportModule);
    exportToCSV(`${importExportModule}_Template`, tmpl.headers, [tmpl.sampleRow]);
    showToast(`Sample CSV template downloaded for ${importExportModule}`, 'success');
  };

  const handleExportCurrent = () => {
    const tmpl = getSampleTemplate(importExportModule);
    let rows: (string | number)[][] = [];

    switch (importExportModule) {
      case 'Leads':
        rows = storageService.getLeads().map(l => [
          l.customerName,
          l.companyName || '',
          l.phone,
          l.email,
          l.address,
          l.city,
          l.solarCapacityKw,
          l.estimatedValue,
          l.source,
          l.status
        ]);
        break;
      case 'Customers':
        rows = storageService.getCustomers().map(c => [
          c.name,
          c.companyName || '',
          c.customerType,
          c.phone,
          c.email,
          c.siteAddress,
          c.city,
          c.gstNumber || '',
          c.sanctionedLoadKw || 0
        ]);
        break;
      case 'Employees':
        rows = storageService.getEmployees().map(e => [
          e.employeeCode,
          e.name,
          e.department,
          e.designation,
          e.phone,
          e.email,
          e.joiningDate,
          e.salaryMonthly
        ]);
        break;
      case 'Payments':
        rows = storageService.getPayments().map(p => [
          p.receiptNumber,
          p.customerName,
          p.milestone,
          p.amount,
          p.status,
          p.dueDate,
          p.paidDate || '',
          p.paymentMode || ''
        ]);
        break;
      case 'Expenses':
        rows = storageService.getExpenses().map(e => [
          e.expenseNumber,
          e.vendorName,
          e.category,
          e.amount,
          e.date,
          e.paymentMode,
          e.referenceNo,
          e.notes
        ]);
        break;
      case 'Projects':
        rows = storageService.getProjects().map(p => [
          p.projectCode,
          p.customerName,
          p.title,
          p.capacityKw,
          p.totalValue,
          p.status,
          p.startDate,
          p.expectedCompletionDate
        ]);
        break;
      default:
        rows = [tmpl.sampleRow];
    }

    exportToCSV(`${importExportModule}_Export_${new Date().toISOString().slice(0, 10)}`, tmpl.headers, rows);
    showToast(`Exported ${rows.length} rows of ${importExportModule}`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadText(content);
      const validationReport = parseAndValidateCSV(content, importExportModule);
      setReport(validationReport);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!report || report.successful === 0) return;
    showToast(`Successfully validated and imported ${report.successful} ${importExportModule} records`, 'success');
    triggerRefresh();
    closeImportExportModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Excel / CSV Hub: {importExportModule}</h3>
              <p className="text-xs text-slate-500">Import with schema validation or export full records</p>
            </div>
          </div>
          <button
            onClick={closeImportExportModal}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`pb-2.5 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'EXPORT'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Export to Excel / CSV
          </button>
          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`pb-2.5 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'IMPORT'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Import CSV with Validation
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'EXPORT' ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                Download a complete, formatted spreadsheet of all {importExportModule} registered in the system.
                The CSV file is fully compatible with Microsoft Excel, Google Sheets, and LibreOffice.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleExportCurrent}
                  className="flex items-center justify-center gap-2 p-4 border border-amber-300 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full {importExportModule} (.CSV)</span>
                </button>

                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center gap-2 p-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-colors shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Download Blank Template</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">1. Download sample template first to ensure correct column order:</span>
                <button
                  onClick={handleDownloadTemplate}
                  className="text-amber-700 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Template
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">Choose a CSV file to validate</p>
                <p className="text-[11px] text-slate-400 mt-0.5">UTF-8 encoded comma separated values</p>
                <label className="mt-3 inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
                  Browse File
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Validation Report */}
              {report && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Validation Results</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 font-bold">
                        {report.successful} Valid
                      </span>
                      {report.failed > 0 && (
                        <span className="px-2 py-0.5 rounded-sm bg-rose-100 text-rose-800 font-bold">
                          {report.failed} Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {report.errors.length > 0 ? (
                    <div className="max-h-28 overflow-y-auto space-y-1 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                      {report.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      All {report.totalRows} rows passed schema verification!
                    </div>
                  )}

                  {report.successful > 0 && (
                    <button
                      onClick={handleApplyImport}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                      Import {report.successful} Valid Rows
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
