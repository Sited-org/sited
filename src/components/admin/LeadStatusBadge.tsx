import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/hooks/useLeads';

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New Lead', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  contacted: { label: 'Contacted', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  booked_call: { label: 'Booked Call', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  sold: { label: 'Sold', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  lost: { label: 'Lost', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = statusConfig[status];
  
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
