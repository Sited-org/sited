import { useMemo } from 'react';
import { useLeads, LeadStatus, Lead } from '@/hooks/useLeads';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Mail, Phone, GripVertical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const funnelStages: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New Lead', color: 'border-t-blue-500' },
  { status: 'contacted', label: 'Contacted', color: 'border-t-purple-500' },
  { status: 'booked_call', label: 'Booked Call', color: 'border-t-amber-500' },
  { status: 'sold', label: 'Sold', color: 'border-t-green-500' },
  { status: 'lost', label: 'Lost', color: 'border-t-red-500' },
];

interface LeadCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  canEdit: boolean;
}

function LeadCard({ lead, onDragStart, canEdit }: LeadCardProps) {
  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, lead.id)}
      className={cn(
        "bg-card border border-border rounded-lg p-4 space-y-3 transition-all",
        canEdit && "cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{lead.name || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground truncate">{lead.business_name || '-'}</p>
        </div>
        {canEdit && <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />}
      </div>
      
      <div className="flex items-center gap-2">
        <a 
          href={`mailto:${lead.email}`} 
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="h-4 w-4" />
        </a>
        {lead.phone && (
          <a 
            href={`tel:${lead.phone}`} 
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {format(new Date(lead.created_at), 'MMM d')}
        </span>
      </div>
    </div>
  );
}

export default function AdminFunnel() {
  const { leads, loading, updateLeadStatus } = useLeads();
  const { canEditLeads } = useAuth();

  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      booked_call: [],
      sold: [],
      lost: [],
    };
    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });
    return grouped;
  }, [leads]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId && canEditLeads) {
      await updateLeadStatus(leadId, status);
    }
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading funnel...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Funnel</h1>
        <p className="text-muted-foreground">Drag and drop leads between stages</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 min-h-[600px]">
        {funnelStages.map(stage => (
          <div
            key={stage.status}
            className={cn(
              "bg-muted/30 rounded-xl border-t-4 flex flex-col",
              stage.color
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.status)}
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{stage.label}</h3>
                <span className="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                  {leadsByStage[stage.status].length}
                </span>
              </div>
            </div>
            
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {leadsByStage[stage.status].map(lead => (
                <LeadCard 
                  key={lead.id} 
                  lead={lead} 
                  onDragStart={handleDragStart}
                  canEdit={canEditLeads}
                />
              ))}
              {leadsByStage[stage.status].length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No leads
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
