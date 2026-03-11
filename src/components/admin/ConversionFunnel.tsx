import { useMemo } from 'react';
import type { Lead } from '@/hooks/useLeads';
import { ALL_STATUSES, STATUS_LABELS } from '@/hooks/useLeads';
import { cn } from '@/lib/utils';

interface ConversionFunnelProps {
  leads: Lead[];
}

const funnelStages: { statuses: string[]; label: string; color: string }[] = [
  { statuses: ['warm_lead', 'new', 'contacted'], label: 'Warm Leads', color: 'bg-amber-500' },
  { statuses: ['discovery_call_booked'], label: 'Discovery Call Booked', color: 'bg-sky-500' },
  { statuses: ['new_lead'], label: 'New Leads', color: 'bg-blue-500' },
  { statuses: ['new_client', 'booked_call'], label: 'New Clients', color: 'bg-indigo-500' },
  { statuses: ['mbr_sold_dev', 'ot_sold_dev', 'sold'], label: 'Sold', color: 'bg-purple-500' },
  { statuses: ['current_mbr', 'current_ot'], label: 'Delivered', color: 'bg-green-500' },
  { statuses: ['no_show'], label: 'No Show', color: 'bg-orange-500' },
  { statuses: ['lost'], label: 'Lost', color: 'bg-red-500' },
];

export function ConversionFunnel({ leads }: ConversionFunnelProps) {
  const funnelData = useMemo(() => {
    const total = leads.length || 1;
    return funnelStages.map(stage => {
      const count = leads.filter(lead => stage.statuses.includes(lead.status)).length;
      const percentage = (count / total) * 100;
      return { ...stage, count, percentage: Math.round(percentage) };
    });
  }, [leads]);

  const maxCount = Math.max(...funnelData.map(d => d.count), 1);

  return (
    <div className="space-y-4">
      {funnelData.map((stage) => {
        const width = Math.max((stage.count / maxCount) * 100, 10);
        return (
          <div key={stage.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.label}</span>
              <span className="text-muted-foreground">{stage.count} ({stage.percentage}%)</span>
            </div>
            <div className="h-8 bg-muted rounded-lg overflow-hidden">
              <div className={cn("h-full rounded-lg transition-all duration-500", stage.color)} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
