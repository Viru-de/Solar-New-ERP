import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { SolarProject, Customer, ProjectStage } from '../../types/solar';
import { StageCard } from '../workflow/StageCard';
import { StatusBadge } from '../common/StatusBadge';
import { ProjectTeamPanel } from '../control_center/ProjectTeamPanel';
import { attemptTallySync, generateTallyReceiptXML } from '../../services/tally';
import {
  SunMedium,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  CreditCard,
  FileText,
  Camera,
  Wrench,
  MessageSquare,
  Download,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Users
} from 'lucide-react';

export const CustomerControlCenterView: React.FC = () => {
  const {
    selectedCustomerId,
    selectedProjectId,
    openCustomerControlCenter,
    openWhatsAppModal,
    showToast,
    settings,
    triggerRefresh,
    refreshTrigger
  } = useApp();
  const { currentUser, isCustomer } = useAuth();

  const [activeTab, setActiveTab] = useState<'STAGES' | 'TEAM' | 'FINANCES' | 'DOCS' | 'PHOTOS' | 'SERVICE'>('STAGES');
  const [expandedStageKey, setExpandedStageKey] = useState<string | null>('panel_installation');
  const [tallySyncingId, setTallySyncingId] = useState<string | null>(null);
  const [activeXmlModal, setActiveXmlModal] = useState<string | null>(null);
  const [localUpdateCounter, setLocalUpdateCounter] = useState(0);

  useEffect(() => {
    const handleStorageUpdate = () => {
      setLocalUpdateCounter(prev => prev + 1);
    };
    window.addEventListener('solarpulse_storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('solarpulse_storage_updated', handleStorageUpdate);
    };
  }, []);

  const customers = useMemo(() => {
    return storageService.getCustomers();
  }, [refreshTrigger, localUpdateCounter]);

  const projects = useMemo(() => {
    return storageService.getProjects();
  }, [refreshTrigger, localUpdateCounter]);

  // Determine active customer and project
  const currentCustomer = useMemo(() => {
    if (isCustomer) {
      const match = customers.find(c =>
        (currentUser?.email && c.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
        (currentUser?.phone && c.phone === currentUser.phone) ||
        (currentUser?.name && c.name?.toLowerCase() === currentUser.name?.toLowerCase()) ||
        (c.id === selectedCustomerId)
      );
      if (match) return match;
    }
    return customers.find(c => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId, isCustomer, currentUser]);

  const currentProject = useMemo(() => {
    if (isCustomer && currentCustomer) {
      const customerProjects = projects.filter(item => item.customerId === currentCustomer.id);
      if (selectedProjectId) {
        const matchSelected = customerProjects.find(item => item.id === selectedProjectId);
        if (matchSelected) return matchSelected;
      }
      if (customerProjects.length > 0) return customerProjects[0];
    }
    if (selectedProjectId) {
      const p = projects.find(item => item.id === selectedProjectId);
      if (p) return p;
    }
    return projects.find(item => item.customerId === currentCustomer?.id) || projects[0];
  }, [projects, selectedProjectId, currentCustomer, isCustomer]);

  // Project financials
  const payments = useMemo(() => {
    if (!currentProject?.id) return [];
    return storageService.getPayments().filter(p => p.projectId === currentProject.id);
  }, [currentProject?.id, refreshTrigger, localUpdateCounter]);

  const totalCollected = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const balanceDue = (currentProject?.totalValue || 0) - totalCollected;

  // Project documents & photos
  const allPhotos = useMemo(() => {
    if (!currentProject?.stages) return [];
    const list: any[] = [];
    currentProject.stages.forEach(s => {
      s.photos?.forEach(p => {
        list.push({ ...p, stageTitle: s.title });
      });
    });
    return list;
  }, [currentProject]);

  const allDocuments = useMemo(() => {
    if (!currentProject?.stages) return [];
    const list: any[] = [];
    currentProject.stages.forEach(s => {
      s.documents?.forEach(d => {
        list.push({ ...d, stageTitle: s.title });
      });
    });
    return list;
  }, [currentProject]);

  const handleUpdateStage = (stageKey: string, updates: Partial<ProjectStage>) => {
    storageService.updateProjectStage(
      currentProject.id,
      stageKey,
      updates,
      currentUser.name,
      currentUser.role
    );
    setLocalUpdateCounter(prev => prev + 1);
    triggerRefresh();
  };

  const handleTallySync = (paymentId: string) => {
    setTallySyncingId(paymentId);
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    setTimeout(() => {
      const res = attemptTallySync(payment.id, 'PAYMENT', payment, settings);
      setTallySyncingId(null);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        // Clear factual feedback without pretending
        showToast(res.message, 'warning');
      }
    }, 600);
  };

  const handleDownloadProjectSummary = () => {
    const summary = `
SOLARPULSE EPC - COMPREHENSIVE PROJECT BRIEF
=============================================
Project: ${currentProject?.title || 'Solar Power Project'} (${currentProject?.projectCode || 'N/A'})
Customer: ${currentCustomer?.name || 'N/A'} (${currentCustomer?.companyName || ''})
Site Address: ${currentCustomer?.siteAddress || ''}, ${currentCustomer?.city || ''}
Capacity: ${currentProject?.capacityKw || 0} kW Rooftop Solar Power Plant
Sanctioned Load: ${currentCustomer?.sanctionedLoadKw || 'N/A'} kW
Total Contract Value: INR ${(currentProject?.totalValue || 0).toLocaleString('en-IN')}
Total Collected: INR ${totalCollected.toLocaleString('en-IN')}
Balance Due: INR ${balanceDue.toLocaleString('en-IN')}
Current Stage: ${(currentProject?.currentStageKey || '').replace(/_/g, ' ')}
Progress: ${currentProject?.progressPercentage || 0}%
Key Components:
- Inverter: ${currentProject?.inverterModel || 'Sungrow SG110CX String Inverter'}
- PV Modules: ${currentProject?.panelModel || 'Waaree 540Wp Bifacial Mono PERC'}
- Structure: ${currentProject?.structureType || 'Galvanized HDG High-Rise Structure'}

15-STAGE WORKFLOW EXECUTION STATUS:
${(currentProject?.stages || []).map(s => `- [${s.order}] ${s.title}: ${s.status} (Target: ${s.plannedEndDate || 'N/A'})`).join('\n')}

Generated by SolarPulse EPC ERP on ${new Date().toLocaleString()}
`.trim();

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarPulse_${currentProject.projectCode}_Summary.txt`;
    link.click();
    showToast('Project summary downloaded', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Customer / Project Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isCustomer ? 'Account / Facility:' : 'Active Customer:'}
          </span>
          {isCustomer ? (
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {currentCustomer.name} ({currentCustomer.city})
            </span>
          ) : (
            <select
              value={currentCustomer.id}
              onChange={(e) => openCustomerControlCenter(e.target.value)}
              className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer pr-4"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCustomer && (
            <>
              <span className="text-xs text-slate-400">Total Sites: {customers.length}</span>
              <div className="h-4 w-px bg-slate-200" />
            </>
          )}
          <button
            onClick={() => handleDownloadProjectSummary()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Brief</span>
          </button>
        </div>
      </div>

      {/* Customer Summary Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-6">
        {/* Top Title & Immediate Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                {currentProject.projectCode}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {currentCustomer.customerType} Rooftop
              </span>
              <StatusBadge status={currentProject.status} size="sm" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {currentCustomer.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{currentProject.title}</span>
              <span>•</span>
              <span className="font-bold text-amber-700">{currentProject.capacityKw} kWp Grid-Tied System</span>
            </p>
          </div>

          {/* Quick Communication & Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isCustomer ? (
              <a
                href="tel:+919825012345"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                <Phone className="w-4 h-4" />
                <span>Contact Project Desk</span>
              </a>
            ) : (
              <>
                <button
                  onClick={() =>
                    openWhatsAppModal(currentCustomer.phone, currentCustomer.name, 'INSTALLATION_UPDATE', {
                      projectTitle: currentProject.title,
                      capacityKw: currentProject.capacityKw
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Client</span>
                </button>

                <a
                  href={`tel:${currentCustomer.phone}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Client</span>
                </a>
              </>
            )}

            <button
              onClick={handleDownloadProjectSummary}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Project Summary</span>
            </button>
          </div>
        </div>

        {/* Vital Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Contract Value</span>
            <div className="text-base font-black text-slate-900 mt-0.5">
              ₹{(currentProject.totalValue / 100000).toFixed(1)} <span className="text-xs font-bold text-slate-500">Lakh</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Received Inflow</span>
            <div className="text-base font-black text-emerald-700 mt-0.5">
              ₹{(totalCollected / 100000).toFixed(1)} <span className="text-xs font-bold text-emerald-600">Lakh</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Milestone Due</span>
            <div className="text-base font-black text-amber-700 mt-0.5">
              ₹{(balanceDue / 100000).toFixed(1)} <span className="text-xs font-bold text-amber-600">Lakh</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Overall Progress</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-black text-slate-900">{currentProject.progressPercentage}%</span>
              <div className="w-12 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${currentProject.progressPercentage}%` }} />
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Site Location</span>
            <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{currentCustomer.city}</p>
          </div>

          <div
            onClick={() => setActiveTab('TEAM')}
            className="cursor-pointer group"
            title="Click to view assigned project specialists"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase group-hover:text-amber-700 transition-colors">
              Assigned Team
            </span>
            <p className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5 group-hover:text-amber-700 transition-colors">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentProject.assignedUsers?.length || 0} Specialists</span>
            </p>
          </div>
        </div>

        {/* Assigned Team & Technical Specs Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Site: {currentCustomer.siteAddress}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentCustomer.email}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Inverter: Sungrow 110CX</span>
            <span>•</span>
            <span>Modules: Waaree 540Wp Bifacial</span>
            <span>•</span>
            <span>Structure: 15° HDG Fixed Tilt</span>
          </div>
        </div>
      </div>

      {/* Primary Section Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('STAGES')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'STAGES'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{currentProject.stages.length}-Stage Workflow Timeline</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
            {currentProject.stages.filter(s => s.status === 'COMPLETED' || s.status === 'APPROVED').length}/{currentProject.stages.length} Complete
          </span>
        </button>

        <button
          onClick={() => setActiveTab('TEAM')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'TEAM'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Project Team ({currentProject.assignedUsers?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('FINANCES')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'FINANCES'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Milestones & Invoices ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DOCS')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'DOCS'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Drawings & Docs ({allDocuments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PHOTOS')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'PHOTOS'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Site Photos & GPS ({allPhotos.length})</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'STAGES' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Automated Stage Engine: Unlocks downstream tasks on completion
            </span>
            <button
              onClick={() => {
                const isAllExpanded = expandedStageKey === 'ALL';
                setExpandedStageKey(isAllExpanded ? null : 'ALL');
              }}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              {expandedStageKey === 'ALL' ? 'Collapse All' : 'Expand All Stages'}
            </button>
          </div>

          <div className="space-y-3">
            {currentProject.stages.map((stage, index) => {
              const isExpanded = expandedStageKey === 'ALL' || expandedStageKey === stage.stageKey;
              const previousStage = index > 0 ? currentProject.stages[index - 1] : null;
              const isLocked = Boolean(
                previousStage &&
                previousStage.status !== 'COMPLETED' &&
                previousStage.status !== 'APPROVED'
              );

              return (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  isLocked={isLocked}
                  previousStageTitle={previousStage?.title}
                  stageIndex={index}
                  isExpanded={isExpanded}
                  onToggleExpand={() => {
                    setExpandedStageKey(isExpanded ? null : stage.stageKey);
                  }}
                  onUpdateStage={handleUpdateStage}
                  customerName={currentCustomer.name}
                  customerPhone={currentCustomer.phone}
                  projectTitle={currentProject.title}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FINANCES & TALLY SYNC */}
      {activeTab === 'FINANCES' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Payment Milestones & Invoicing</h3>
              <p className="text-xs text-slate-500">Milestone schedule aligned with solar equipment delivery and commissioning</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Tally Prime Status:</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {settings.tallyStatus === 'CONNECTED' ? 'ODBC Connected' : 'ODBC Ready / Port 9000'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Tally Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{p.milestone}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{p.dueDate}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.paymentMode || 'NEFT / RTGS'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        p.tallySyncStatus === 'SYNCED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.tallySyncStatus === 'SYNCING'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.tallySyncStatus || 'NOT SYNCED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {/* View XML */}
                      <button
                        onClick={() => {
                          const xml = generateTallyReceiptXML(p, settings);
                          setActiveXmlModal(xml);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px]"
                      >
                        XML
                      </button>

                      {/* Sync to Tally button */}
                      <button
                        onClick={() => handleTallySync(p.id)}
                        disabled={tallySyncingId === p.id}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px] transition-colors"
                      >
                        {tallySyncingId === p.id ? 'Syncing...' : 'Sync to Tally'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS & DRAWINGS */}
      {activeTab === 'DOCS' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Technical Drawings, Approvals & Warranties</h3>
              <p className="text-xs text-slate-500">Plant engineering records, DISCOM approvals, and product warranties</p>
            </div>
            <button
              onClick={() => showToast('Select document to upload to project vault', 'info')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {allDocuments.map((doc, idx) => (
              <div key={`${doc.id}-${idx}`} className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 bg-slate-50/50 hover:bg-white transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold bg-amber-100 text-amber-800 uppercase">
                      {doc.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{doc.stageTitle}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700">{doc.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Added on {doc.uploadedAt} • Verified PDF</p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500">Authorized EPC Stamp</span>
                  <a
                    href={doc.url}
                    download
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SITE GALLERY & GPS EVIDENCE */}
      {activeTab === 'PHOTOS' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Geo-Tagged Field Photo Evidence</h3>
              <p className="text-xs text-slate-500">Live camera captures with GPS coordinates, timestamps & stage categorization</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              {allPhotos.length} Verified Photos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {allPhotos.map((p, idx) => (
              <div key={`${p.id}-${idx}`} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs group flex flex-col justify-between">
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={p.url}
                    alt={p.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white p-1.5 rounded-lg text-[10px]">
                    <div className="flex items-center gap-1 text-amber-400 font-bold truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p.gpsCoordinates || 'Sanand GIDC, Gujarat (22.9868° N, 72.3789° E)'}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">{p.stageTitle}</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{p.caption}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Uploaded by {p.uploadedBy}</span>
                    <span>{new Date(p.uploadedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MULTI-USER PROJECT TEAM & WORK ROLES */}
      {activeTab === 'TEAM' && (
        <ProjectTeamPanel
          project={currentProject}
          onProjectUpdated={() => setLocalUpdateCounter(prev => prev + 1)}
        />
      )}

      {/* XML Preview Modal */}
      {activeXmlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <span className="text-xs font-mono font-bold">Tally Prime XML Voucher Payload</span>
              <button onClick={() => setActiveXmlModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
              <pre>{activeXmlModal}</pre>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeXmlModal);
                  showToast('XML payload copied to clipboard', 'success');
                }}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Copy XML
              </button>
              <button
                onClick={() => setActiveXmlModal(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
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
