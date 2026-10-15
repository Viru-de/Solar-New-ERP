import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateWhatsAppMessage, WhatsAppMessageType } from '../../services/whatsapp';
import { MessageSquare, X, ExternalLink, Copy, Check, ShieldAlert, Send } from 'lucide-react';

export const WhatsAppModal: React.FC = () => {
  const { isWhatsAppOpen, closeWhatsAppModal, whatsAppData, settings, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [selectedType, setSelectedType] = useState<WhatsAppMessageType>(whatsAppData?.type || 'LEAD_WELCOME');

  if (!isWhatsAppOpen || !whatsAppData) return null;

  const currentType = selectedType || whatsAppData.type;
  const messageData = generateWhatsAppMessage(
    currentType,
    {
      recipientName: whatsAppData.recipientName,
      recipientPhone: whatsAppData.recipientPhone,
      ...whatsAppData.data
    },
    settings
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(messageData.body);
    setCopied(true);
    showToast('Message text copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectWebOpen = () => {
    window.open(messageData.directWebUrl, '_blank', 'noopener,noreferrer');
    showToast('Opening WhatsApp Web...', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">WhatsApp Communication Hub</h3>
              <p className="text-xs text-emerald-100">Direct message template generator & dispatcher</p>
            </div>
          </div>
          <button
            onClick={closeWhatsAppModal}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Integration Status Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-semibold">WhatsApp Cloud API:</span> {settings.whatsAppStatus === 'CONNECTED' ? 'Connected' : 'Simulated Sandbox Mode (Ready for Meta Business Cloud API)'}.
            Direct Web WhatsApp link is available for live customer dispatch.
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Recipient info */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Customer Name</span>
              <p className="text-sm font-semibold text-slate-800">{whatsAppData.recipientName}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">WhatsApp Mobile</span>
              <p className="text-sm font-semibold text-slate-800">{whatsAppData.recipientPhone}</p>
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Select Message Template</label>
            <select
              value={currentType}
              onChange={(e) => setSelectedType(e.target.value as WhatsAppMessageType)}
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="LEAD_WELCOME">Solar Inquiry Confirmation / Welcome</option>
              <option value="SURVEY_SCHEDULED">Site Survey Scheduled Notification</option>
              <option value="QUOTATION_SHARE">Commercial EPC Quotation & Proposal</option>
              <option value="PAYMENT_REMINDER">Milestone Payment Update & Bank Details</option>
              <option value="INSTALLATION_UPDATE">Rooftop Solar Installation Progress</option>
              <option value="PROJECT_COMPLETION">Final Commissioning & Solar Handover</option>
              <option value="SERVICE_TICKET">Customer Service Request Update</option>
            </select>
          </div>

          {/* Message Preview Box */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Formatted Message Preview</label>
            <div className="p-3.5 bg-emerald-50/40 border border-emerald-200/80 rounded-xl text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-inner max-h-52 overflow-y-auto">
              {messageData.body}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-5 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={closeWhatsAppModal}
              className="w-1/2 sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDirectWebOpen}
              className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
