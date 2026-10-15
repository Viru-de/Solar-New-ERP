import { SystemSettings } from '../types/solar';

export type WhatsAppMessageType =
  | 'LEAD_WELCOME'
  | 'SURVEY_SCHEDULED'
  | 'QUOTATION_SHARE'
  | 'PAYMENT_REMINDER'
  | 'INSTALLATION_UPDATE'
  | 'PROJECT_COMPLETION'
  | 'SERVICE_TICKET';

export interface WhatsAppMessagePayload {
  recipientPhone: string;
  recipientName: string;
  messageType: WhatsAppMessageType;
  title: string;
  body: string;
  directWebUrl: string;
}

export function generateWhatsAppMessage(
  type: WhatsAppMessageType,
  data: {
    recipientName: string;
    recipientPhone: string;
    projectTitle?: string;
    capacityKw?: number;
    amount?: number;
    quotationNumber?: string;
    stageTitle?: string;
    ticketId?: string;
    surveyDate?: string;
    dueDate?: string;
  },
  settings: SystemSettings
): WhatsAppMessagePayload {
  const cleanPhone = data.recipientPhone.replace(/[^0-9]/g, '');
  let body = '';
  let title = '';

  switch (type) {
    case 'LEAD_WELCOME':
      title = 'Solar Inquiry Confirmation';
      body = `Hello ${data.recipientName},\n\nThank you for choosing *${settings.companyName}* for your solar transition. We have received your inquiry for a ${data.capacityKw || ''} kW Solar Rooftop System.\n\nOur Senior Solar Consultant will contact you shortly to schedule a free technical site survey.\n\nSolarPulse EPC Team\n📞 ${settings.companyPhone}`;
      break;

    case 'SURVEY_SCHEDULED':
      title = 'Site Survey Scheduled';
      body = `Dear ${data.recipientName},\n\nYour Solar Technical Site Survey has been scheduled for *${data.surveyDate || 'tomorrow'}*.\n\nOur Site Survey Engineer will evaluate roof orientation, structural integrity, and shadow profiles to size your optimum solar plant.\n\nLocation: Your premises.\n*${settings.companyName}*`;
      break;

    case 'QUOTATION_SHARE':
      title = 'Commercial Solar Proposal';
      body = `Dear ${data.recipientName},\n\nWe are pleased to present the official Turnkey Solar EPC Proposal (*${data.quotationNumber || 'QTN-2026'}*) for your *${data.capacityKw} kW* Rooftop System.\n\nTotal Estimated Investment: *₹${data.amount?.toLocaleString('en-IN')}* (including Tier-1 Bifacial PV modules, grid inverter, and CEIG approvals).\n\nBest Regards,\n*${settings.companyName}*`;
      break;

    case 'PAYMENT_REMINDER':
      title = 'Payment Milestone Update';
      body = `Dear ${data.recipientName},\n\nThis is a gentle update regarding your solar project (*${data.projectTitle}*).\n\nMilestone Amount: *₹${data.amount?.toLocaleString('en-IN')}*\nDue Date: *${data.dueDate || 'Immediate'}*\n\nKindly process via NEFT/RTGS to facilitate uninterrupted site execution.\n\nAccounts Desk,\n*${settings.companyName}*`;
      break;

    case 'INSTALLATION_UPDATE':
      title = 'Live Site Progress Update';
      body = `Dear ${data.recipientName},\n\nExciting progress on your solar plant (*${data.projectTitle}*)! Stage: *${data.stageTitle || 'Solar Installation'}* is now underway by our certified installation engineers.\n\nYou can track live milestones on your SolarPulse Client Portal.\n\n*${settings.companyName}*`;
      break;

    case 'PROJECT_COMPLETION':
      title = 'Solar Plant Commissioning & Handover';
      body = `Congratulations ${data.recipientName}!\n\nYour *${data.capacityKw || ''} kW Solar Power Plant* at ${data.projectTitle} has been successfully synchronized and commissioned!\n\nYou are now generating clean, green power and saving electricity costs every day.\n\n*${settings.companyName}*`;
      break;

    case 'SERVICE_TICKET':
      title = 'Service Ticket Update';
      body = `Dear ${data.recipientName},\n\nYour Service Request (*${data.ticketId}*) has been assigned to our field solar technician. We will resolve your inquiry with priority.\n\nSupport Helpline: ${settings.companyPhone}\n*${settings.companyName}*`;
      break;
  }

  const encodedText = encodeURIComponent(body);
  const directWebUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  return {
    recipientPhone: data.recipientPhone,
    recipientName: data.recipientName,
    messageType: type,
    title,
    body,
    directWebUrl
  };
}
