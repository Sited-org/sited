import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/hooks/useLeads';

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New Lead', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  contacted: { label: 'Contacted', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  booked_call: { label: 'Booked Call', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  sold: { label: 'Sold', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  lost: { label: 'Lost', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

const partialConfig = { label: 'Partial', className: 'bg-sky-500/10 text-sky-500 border-sky-500/20' };

interface LeadStatusBadgeProps {
  status: LeadStatus;
  formData?: Record<string, unknown>;
  className?: string;
}

export function isPartialLead(formData?: Record<string, unknown>): boolean {
  if (!formData) return false;
  return formData.partial === true;
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
