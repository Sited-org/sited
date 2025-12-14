import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { Mail, Phone, Building2, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { FormResponsesCard } from './FormResponsesCard';

type LeadStatus = 'new' | 'contacted' | 'booked_call' | 'sold' | 'lost';

const allStatuses: LeadStatus[] = ['new', 'contacted', 'booked_call', 'sold', 'lost'];
const statusLabels: Record<LeadStatus, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  booked_call: 'Booked Call',
  sold: 'Sold',
  lost: 'Lost',
};

interface ProfileTabProps {
  lead: any;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  businessName: string;
  setBusinessName: (v: string) => void;
  status: LeadStatus;
  setStatus: (v: LeadStatus) => void;
  notes: string;
  setNotes: (v: string) => void;
  canEdit: boolean;
  onSaveFormData: (formData: Record<string, any>) => Promise<void>;
}

export function ProfileTab({
  lead,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  businessName,
  setBusinessName,
  status,
  setStatus,
  notes,
  setNotes,
  canEdit,
  onSaveFormData,
}: ProfileTabProps) {
  const { updates } = useProjectUpdates(lead.id);
  const recentUpdates = updates.slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  disabled={!canEdit}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={!canEdit}
                  />
                  <Button variant="outline" size="icon" asChild>
                    <a href={`mailto:${email}`}><Mail className="h-4 w-4" /></a>
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    disabled={!canEdit}
                  />
                  {phone && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={`tel:${phone}`}><Phone className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={businessName} 
                    onChange={(e) => setBusinessName(e.target.value)} 
                    disabled={!canEdit}
                  />
                  <Building2 className="h-9 w-9 p-2 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Project Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Project Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No project updates yet. Add updates in the Project tab.</p>
            ) : (
              <div className="space-y-3">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{update.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(update.created_at), 'PPp')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canEdit}
              placeholder="Add notes about this lead..."
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Form Responses */}
        <FormResponsesCard 
          formData={lead.form_data || {}}
          onSave={onSaveFormData}
          canEdit={canEdit}
        />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Status</label>
              <div className="mt-2">
                <LeadStatusBadge status={status} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Change Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)} disabled={!canEdit}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Progress */}
            <div className="space-y-2 pt-2">
              {allStatuses.map((s, idx) => {
                const currentIdx = allStatuses.indexOf(status);
                const isComplete = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-primary' : 'bg-muted'} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                    <span className={`text-sm ${isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {statusLabels[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{format(new Date(lead.created_at), 'PP')}</span>
            </div>
            {lead.last_contacted_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Contacted</span>
                <span>{format(new Date(lead.last_contacted_at), 'PP')}</span>
              </div>
            )}
            {lead.deal_closed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deal Closed</span>
                <span>{format(new Date(lead.deal_closed_at), 'PP')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
