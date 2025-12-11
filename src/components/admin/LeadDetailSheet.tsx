import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LeadStatusBadge } from './LeadStatusBadge';
import type { Lead, LeadStatus } from '@/hooks/useLeads';
import { Mail, Phone, Building, Calendar, FileText } from 'lucide-react';

const allStatuses: LeadStatus[] = ['new', 'contacted', 'booked_call', 'sold', 'lost'];

const statusLabels: Record<LeadStatus, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  booked_call: 'Booked Call',
  sold: 'Sold',
  lost: 'Lost',
};

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => Promise<boolean>;
  onUpdateNotes: (leadId: string, notes: string) => Promise<boolean>;
  canEdit: boolean;
}

export function LeadDetailSheet({ 
  lead, 
  open, 
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  canEdit
}: LeadDetailSheetProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
    }
  }, [lead]);

  if (!lead) return null;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await onUpdateNotes(lead.id, notes);
    setIsSaving(false);
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      website: 'Website',
      app: 'App',
      ai: 'AI Integration',
    };
    return labels[type] || type;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span>{lead.name || 'Unknown'}</span>
            <LeadStatusBadge status={lead.status} />
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="text-sm hover:underline">
                  {lead.email}
                </a>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-sm hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.business_name && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.business_name}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{getProjectTypeLabel(lead.project_type)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Submitted {format(new Date(lead.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          {canEdit && (
            <div className="space-y-3">
              <Label>Status</Label>
              <Select 
                value={lead.status} 
                onValueChange={(value) => onUpdateStatus(lead.id, value as LeadStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={4}
              disabled={!canEdit}
            />
            {canEdit && (
              <Button 
                size="sm" 
                onClick={handleSaveNotes}
                disabled={isSaving || notes === (lead.notes || '')}
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </Button>
            )}
          </div>

          {/* Form Data */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Form Responses
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              {Object.entries(lead.form_data).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>{' '}
                  <span className="font-medium">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
