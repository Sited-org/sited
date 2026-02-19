import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/hooks/useLeads';
import { STATUS_LABELS } from '@/hooks/useLeads';

const statusConfig: Record<string, { label: string; className: string }> = {
  warm_lead: { label: 'Warm Lead', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  discovery_call_booked: { label: 'DCB', className: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  new_lead: { label: 'New Lead', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  new_client: { label: 'New Client', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  no_show: { label: 'No Show', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  mbr_sold_dev: { label: 'MBR Sold (Dev)', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  current_mbr: { label: 'Current MBR', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  ot_sold_dev: { label: 'OT Sold (Dev)', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  current_ot: { label: 'Current OT', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  lost: { label: 'Lost', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  // Legacy fallbacks
  new: { label: 'Warm Lead', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  contacted: { label: 'Warm Lead', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  booked_call: { label: 'New Client', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  sold: { label: 'OT Sold (Dev)', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
};

const partialConfig = { label: 'Partial', className: 'bg-sky-500/10 text-sky-600 border-sky-500/20' };

export const rowBackgroundConfig: Record<string, string> = {
  partial: 'bg-sky-500/5 hover:bg-sky-500/10',
  warm_lead: 'bg-amber-500/5 hover:bg-amber-500/10',
  discovery_call_booked: 'bg-sky-500/5 hover:bg-sky-500/10',
  new_lead: 'bg-blue-500/5 hover:bg-blue-500/10',
  new_client: 'bg-indigo-500/5 hover:bg-indigo-500/10',
  no_show: 'bg-orange-500/5 hover:bg-orange-500/10',
  mbr_sold_dev: 'bg-purple-500/5 hover:bg-purple-500/10',
  current_mbr: 'bg-green-500/5 hover:bg-green-500/10',
  ot_sold_dev: 'bg-cyan-500/5 hover:bg-cyan-500/10',
  current_ot: 'bg-emerald-500/5 hover:bg-emerald-500/10',
  lost: 'bg-red-500/5 hover:bg-red-500/10',
  // Legacy
  new: 'bg-amber-500/5 hover:bg-amber-500/10',
  contacted: 'bg-amber-500/5 hover:bg-amber-500/10',
  booked_call: 'bg-indigo-500/5 hover:bg-indigo-500/10',
  sold: 'bg-cyan-500/5 hover:bg-cyan-500/10',
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  formData?: Record<string, unknown>;
  className?: string;
}

export function isPartialLead(formData?: Record<string, unknown>): boolean {
  if (!formData) return false;
  return formData.partial === true;
}

export function getLeadRowBackground(status: LeadStatus, formData?: Record<string, unknown>): string {
  if (isPartialLead(formData)) return rowBackgroundConfig.partial;
  return rowBackgroundConfig[status] || '';
}

export function LeadStatusBadge({ status, formData, className }: LeadStatusBadgeProps) {
  const isPartial = isPartialLead(formData);
  const config = isPartial ? partialConfig : (statusConfig[status] || statusConfig.warm_lead);
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
