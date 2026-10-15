import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { ServiceTicket, Priority } from '../../types/solar';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import {
  Wrench,
  Plus,
  Search,
  MessageSquare,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  X
} from 'lucide-react';

export const ServiceView: React.FC = () => {
  const { openWhatsAppModal, openImportExportModal, showToast, triggerRefresh } = useApp();
  const { currentUser, isCustomer } = useAuth();

  const customers = useMemo(() => storageService.getCustomers(), []);
  const currentCustomer = useMemo(() => {
    if (isCustomer) {
      return (
        customers.find(
          c =>
            (currentUser?.email && c.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
            (currentUser?.phone && c.phone === currentUser.phone) ||
            (currentUser?.name && c.name?.toLowerCase() === currentUser.name?.toLowerCase())
        ) || customers[0]
      );
    }
    return null;
  }, [customers, isCustomer, currentUser]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    customerName: 'ABC Industries Ltd.',
    projectId: 'proj-1',
    category: 'Inverter Error / Offline' as const,
    issue: 'Inverter #2 tripping with Error 302 grid over-voltage during peak sunshine hours.',
    priority: 'HIGH' as Priority
  });

  const tickets = useMemo(() => {
    const all = storageService.getServiceTickets();
    if (isCustomer && currentCustomer) {
      return all.filter(
        t =>
          t.customerId === currentCustomer.id ||
          t.customerName.toLowerCase() === currentCustomer.name.toLowerCase()
      );
    }
    return all;
  }, [isCustomer, currentCustomer]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t =>
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCustName = isCustomer && currentCustomer ? currentCustomer.name : ticketForm.customerName;
    const activeCustId = isCustomer && currentCustomer ? currentCustomer.id : 'cust-1';
    const activeProjId = isCustomer && currentCustomer?.activeProjectId ? currentCustomer.activeProjectId : ticketForm.projectId;

    const newTicket: ServiceTicket = {
      id: `srv-${Date.now()}`,
      ticketId: `SRV-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: activeCustId,
      customerName: activeCustName,
      projectId: activeProjId,
      category: ticketForm.category,
      issue: ticketForm.issue,
      priority: ticketForm.priority,
      status: 'OPEN',
      assignedToName: 'Unassigned',
      assignedTechnicianName: 'To be assigned',
      createdAt: new Date().toISOString().slice(0, 10),
      visitScheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    };

    storageService.saveServiceTicket(newTicket);
    setIsNewTicketOpen(false);
    showToast(`Service ticket ${newTicket.ticketId} logged successfully`, 'success');
    triggerRefresh();
  };

  const handleResolveTicket = (ticketId: string) => {
    storageService.resolveServiceTicket(ticketId, 'Inverter grid voltage parameters re-tuned and string fuses verified.');
    showToast('Service ticket marked as RESOLVED', 'success');
    triggerRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Post-Commissioning Care
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Solar Plant AMC & Breakdown Support</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Service & AMC Ticketing
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Service Ticket</span>
          </button>

          <button
            onClick={() => openImportExportModal('Service')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Excel Hub</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="text-xs font-bold text-slate-600">
          Total Tickets: {tickets.length} • Open: {tickets.filter(t => t.status !== 'RESOLVED').length}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ticket, customer, issue..."
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map(t => (
          <div
            key={t.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  {t.ticketId}
                </span>
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} size="sm" />
                </div>
              </div>

              <h3 className="font-bold text-sm text-slate-900 mt-1">{t.customerName}</h3>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block mt-0.5">
                {t.category}
              </span>

              <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {t.issue}
              </p>

              <div className="space-y-1.5 mt-3 text-xs text-slate-500">
                <p className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Technician: <strong>{t.assignedToName || t.assignedTechnicianName || 'Unassigned'}</strong></span>
                </p>
                {t.visitScheduledDate && (
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Site Visit: {t.visitScheduledDate}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() =>
                  openWhatsAppModal('919879544321', t.customerName, 'SERVICE_TICKET', {
                    ticketId: t.ticketId
                  })
                }
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Send WhatsApp Update"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {t.status !== 'RESOLVED' ? (
                <button
                  onClick={() => handleResolveTicket(t.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve Ticket</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">Log Service / AMC Ticket</h3>
              <button onClick={() => setIsNewTicketOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Plant</label>
                <input
                  type="text"
                  required
                  value={isCustomer && currentCustomer ? currentCustomer.name : ticketForm.customerName}
                  disabled={Boolean(isCustomer && currentCustomer)}
                  onChange={e => setTicketForm({ ...ticketForm, customerName: e.target.value })}
                  className={`w-full text-xs border border-slate-200 rounded-xl p-2.5 ${
                    isCustomer && currentCustomer ? 'bg-slate-50 text-slate-600 font-medium cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={e => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="Inverter Error / Offline">Inverter Error / Offline</option>
                    <option value="Generation Drop">Generation Drop</option>
                    <option value="Panel Cleaning / Soiling">Panel Cleaning / Soiling</option>
                    <option value="Structure Inspection">Structure Inspection</option>
                    <option value="Electrical & Earth Pit">Electrical & Earth Pit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Description *</label>
                <textarea
                  required
                  rows={3}
                  value={ticketForm.issue}
                  onChange={e => setTicketForm({ ...ticketForm, issue: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  placeholder="Describe alarm code, tripping behavior, or physical damage..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-2xs"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
