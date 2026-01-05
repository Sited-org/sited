import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/hooks/useLeads';

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New Lead', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  contacted: { label: 'New Lead', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  booked_call: { label: 'Call Booked', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  sold: { label: 'Sold', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  lost: { label: 'Lost', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

const partialConfig = { label: 'Partial', className: 'bg-sky-500/10 text-sky-600 border-sky-500/20' };

export const rowBackgroundConfig: Record<string, string> = {
  partial: 'bg-sky-500/5 hover:bg-sky-500/10',
  new: 'bg-amber-500/5 hover:bg-amber-500/10',
  contacted: 'bg-amber-500/5 hover:bg-amber-500/10',
  booked_call: 'bg-amber-500/5 hover:bg-amber-500/10',
  sold: 'bg-green-500/5 hover:bg-green-500/10',
  lost: 'bg-red-500/5 hover:bg-red-500/10',
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
  const config = isPartial ? partialConfig : statusConfig[status];
  
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
