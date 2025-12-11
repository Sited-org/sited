import { useMemo } from 'react';
import type { Lead, LeadStatus } from '@/hooks/useLeads';
import { cn } from '@/lib/utils';

interface ConversionFunnelProps {
  leads: Lead[];
}

const funnelStages: { status: LeadStatus[]; label: string; color: string }[] = [
  { status: ['new'], label: 'New Leads', color: 'bg-blue-500' },
  { status: ['contacted'], label: 'Contacted', color: 'bg-purple-500' },
  { status: ['booked_call'], label: 'Booked Call', color: 'bg-amber-500' },
  { status: ['sold'], label: 'Sold', color: 'bg-green-500' },
  { status: ['lost'], label: 'Lost', color: 'bg-red-500' },
];

export function ConversionFunnel({ leads }: ConversionFunnelProps) {
  const funnelData = useMemo(() => {
    const total = leads.length || 1;
    
    return funnelStages.map(stage => {
      const count = leads.filter(lead => stage.status.includes(lead.status)).length;
      const percentage = (count / total) * 100;
      
      return {
        ...stage,
        count,
        percentage: Math.round(percentage),
      };
    });
  }, [leads]);

  const maxCount = Math.max(...funnelData.map(d => d.count), 1);

  return (
    <div className="space-y-4">
      {funnelData.map((stage, index) => {
        const width = Math.max((stage.count / maxCount) * 100, 10);
        
        return (
          <div key={stage.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.label}</span>
              <span className="text-muted-foreground">
                {stage.count} ({stage.percentage}%)
              </span>
            </div>
            <div className="h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className={cn("h-full rounded-lg transition-all duration-500", stage.color)}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
