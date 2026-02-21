import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Save, ChevronDown, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { LeadStatus } from '@/hooks/useLeads';

const FUNNEL_NODES: {
  id: LeadStatus;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  { id: 'warm_lead', label: 'Warm Lead', shortLabel: 'WL', description: 'Form filled, no deposit', color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { id: 'discovery_call_booked', label: 'Discovery Call Booked', shortLabel: 'DCB', description: 'Discovery call booked, no deposit', color: 'text-sky-500', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/30' },
  { id: 'new_lead', label: 'New Lead', shortLabel: 'NL', description: 'Deposit paid', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: 'new_client', label: 'New Client', shortLabel: 'NC', description: 'Call booked', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
  { id: 'no_show', label: 'No Show', shortLabel: 'NS', description: 'Call booked, no show', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { id: 'mbr_sold_dev', label: 'MBR Sold (Dev)', shortLabel: 'MBR-D', description: 'Sold + maintenance', color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { id: 'current_mbr', label: 'Current MBR', shortLabel: 'MBR', description: 'Delivered, maintaining', color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { id: 'ot_sold_dev', label: 'OT Sold (Dev)', shortLabel: 'OT-D', description: 'Sold, no maintenance', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
  { id: 'current_ot', label: 'Current OT', shortLabel: 'OT', description: 'Delivered one-time', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { id: 'lost', label: 'Lost', shortLabel: 'LST', description: 'Cancelled / refunded', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
];

const getNodeConfig = (id: LeadStatus) => FUNNEL_NODES.find(n => n.id === id)!;

interface StatusHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  created_at: string;
  notes: string | null;
}

interface LeadFunnelTreeProps {
  leadId: string;
  currentStatus: LeadStatus;
  onStatusChange: (status: LeadStatus) => void;
  canEdit: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  saving: boolean;
}

export function LeadFunnelTree({
  leadId,
  currentStatus,
  onStatusChange,
  canEdit,
  hasUnsavedChanges,
  onSave,
  saving,
}: LeadFunnelTreeProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    supabase
      .from('lead_status_history')
      .select('id, from_status, to_status, created_at, notes')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setHistory(data as StatusHistoryEntry[]);
      });
  }, [leadId, currentStatus]);

  const selectedNode = getNodeConfig(currentStatus);

  const renderNode = (nodeId: LeadStatus, isActive: boolean, onClick?: () => void) => {
    const node = getNodeConfig(nodeId);
    const isSelected = currentStatus === nodeId;
    
    return (
      <button
        key={nodeId}
        onClick={() => canEdit && onClick?.()}
        disabled={!canEdit}
        className={cn(
          "relative px-2.5 py-2 rounded-lg border-2 transition-all text-left w-full min-w-0",
          isSelected
            ? `${node.bgColor} ${node.borderColor} ring-2 ring-offset-1 ring-offset-background ${node.borderColor.replace('border-', 'ring-')}`
            : isActive
              ? `${node.bgColor} ${node.borderColor}`
              : "bg-muted/30 border-border/40 opacity-50",
          canEdit && !isSelected && "hover:opacity-80 cursor-pointer",
          !canEdit && "cursor-default"
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold uppercase tracking-wider", isSelected || isActive ? node.color : "text-muted-foreground")}>
            {node.shortLabel}
          </span>
        </div>
        <p className={cn("text-sm font-medium mt-0.5", isSelected || isActive ? "text-foreground" : "text-muted-foreground")}>
          {node.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{node.description}</p>
      </button>
    );
  };

  // Both WL and DCB are entry-level, leading to NL
  const entryStatuses: LeadStatus[] = ['warm_lead', 'discovery_call_booked'];
  const mainTrunk: LeadStatus[] = ['new_lead', 'new_client'];
  const isEntryStatus = entryStatuses.includes(currentStatus);
  const trunkIndex = mainTrunk.indexOf(currentStatus);
  const isPastEntry = !isEntryStatus && !mainTrunk.includes(currentStatus) ? true : trunkIndex >= 0;

  const isNodeActive = (nodeId: LeadStatus): boolean => {
    if (nodeId === currentStatus) return true;
    // Entry nodes are active if current is entry or past entry
    if (entryStatuses.includes(nodeId)) {
      return nodeId === currentStatus || isPastEntry;
    }
    const ti = mainTrunk.indexOf(nodeId);
    if (ti >= 0) {
      if (trunkIndex >= 0) return ti <= trunkIndex;
      if (isEntryStatus) return false;
      return true; // past trunk (in branch)
    }
    return false;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Lead Funnel</CardTitle>
        {hasUnsavedChanges && canEdit && (
          <Button onClick={onSave} disabled={saving} size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Current status badge */}
        <div className={cn("flex items-center gap-2 p-2 rounded-lg mb-4", selectedNode.bgColor)}>
          <div className={cn("w-2.5 h-2.5 rounded-full", selectedNode.color.replace('text-', 'bg-'))} />
          <span className={cn("text-sm font-semibold", selectedNode.color)}>{selectedNode.label}</span>
          <span className="text-xs text-muted-foreground ml-auto">{selectedNode.description}</span>
        </div>

        {/* Tree visualization */}
        <div className="flex flex-col items-center gap-0">
          {/* Level 0: WL and DCB side by side */}
          <div className="flex items-start gap-3">
            {renderNode('warm_lead', isNodeActive('warm_lead'), () => onStatusChange('warm_lead'))}
            {renderNode('discovery_call_booked', isNodeActive('discovery_call_booked'), () => onStatusChange('discovery_call_booked'))}
          </div>
          
          {/* Converging connector */}
          <div className="relative w-[260px] h-6">
            <div className="absolute top-0 left-1/4 w-0.5 h-3 bg-border" />
            <div className="absolute top-0 right-1/4 w-0.5 h-3 bg-border" />
            <div className="absolute top-3 left-1/4 right-1/4 h-0.5 bg-border" />
            <div className="absolute top-3 left-1/2 -translate-x-px w-0.5 h-3 bg-border" />
          </div>
          
          {/* Level 1: New Lead */}
          {renderNode('new_lead', isNodeActive('new_lead'), () => onStatusChange('new_lead'))}
          <div className="w-0.5 h-6 bg-border mx-auto" />
          
          {/* Level 2: New Client */}
          {renderNode('new_client', isNodeActive('new_client'), () => onStatusChange('new_client'))}
          
          {/* Branch connector */}
          <div className="w-0.5 h-4 bg-border mx-auto" />
          <div className="relative w-full max-w-[480px]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-0.5 bg-border" />
          </div>
          
          {/* Level 3: Branch split */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-[560px] mt-2">
            <div className="flex flex-col items-center gap-2">
              {renderNode('no_show', isNodeActive('no_show'), () => onStatusChange('no_show'))}
            </div>
            <div className="flex flex-col items-center gap-2">
              {renderNode('mbr_sold_dev', isNodeActive('mbr_sold_dev'), () => onStatusChange('mbr_sold_dev'))}
              <div className="w-0.5 h-3 bg-border" />
              {renderNode('current_mbr', isNodeActive('current_mbr'), () => onStatusChange('current_mbr'))}
            </div>
            <div className="flex flex-col items-center gap-2">
              {renderNode('ot_sold_dev', isNodeActive('ot_sold_dev'), () => onStatusChange('ot_sold_dev'))}
              <div className="w-0.5 h-3 bg-border" />
              {renderNode('current_ot', isNodeActive('current_ot'), () => onStatusChange('current_ot'))}
            </div>
            <div className="flex flex-col items-center gap-2">
              {renderNode('lost', isNodeActive('lost'), () => onStatusChange('lost'))}
            </div>
          </div>
        </div>

        {/* Status Change History */}
        <div className="pt-4 mt-4 border-t border-border/40">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <Clock className="h-4 w-4" />
            Status History ({history.length})
            <ChevronDown className={cn("h-4 w-4 ml-auto transition-transform", showHistory && "rotate-180")} />
          </button>
          
          {showHistory && (
            <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No status changes recorded yet</p>
              ) : (
                history.map((entry) => {
                  const toNode = FUNNEL_NODES.find(n => n.id === entry.to_status);
                  const fromNode = FUNNEL_NODES.find(n => n.id === entry.from_status);
                  return (
                    <div key={entry.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-muted-foreground shrink-0">
                        {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                      </span>
                      {fromNode && (
                        <>
                          <span className={cn("font-medium", fromNode.color)}>{fromNode.shortLabel}</span>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <span className={cn("font-medium", toNode?.color)}>{toNode?.shortLabel || entry.to_status}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
