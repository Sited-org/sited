import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Building2, Calendar, CreditCard, MapPin, ExternalLink, Code, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { useMemberships } from '@/hooks/useMemberships';
import { supabase } from '@/integrations/supabase/client';
import { LeadFunnelTree } from './LeadFunnelTree';
import { UpcomingCallsSection } from './UpcomingCallsSection';
import type { LeadStatus } from '@/hooks/useLeads';

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
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  billingAddress: string;
  setBillingAddress: (v: string) => void;
  status: LeadStatus;
  setStatus: (v: LeadStatus) => void;
  notes: string;
  setNotes: (v: string) => void;
  canEdit: boolean;
  onSave: () => void;
  saving: boolean;
  hasUnsavedChanges: boolean;
}

export function ProfileTab({
  lead,
  name, setName,
  email, setEmail,
  phone, setPhone,
  businessName, setBusinessName,
  websiteUrl, setWebsiteUrl,
  billingAddress, setBillingAddress,
  status, setStatus,
  notes, setNotes,
  canEdit,
  onSave,
  saving,
  hasUnsavedChanges,
}: ProfileTabProps) {
  const { rawTransactions } = useTransactions(lead.id);
  const { memberships } = useMemberships();
  const [assignedDevName, setAssignedDevName] = useState<string | null>(null);

  const activeMembershipTransaction = rawTransactions.find(t => t.is_recurring);
  const activeMembership = activeMembershipTransaction 
    ? memberships.find(m => m.name === activeMembershipTransaction.item)
    : null;

  useEffect(() => {
    if (!lead.assigned_to) { setAssignedDevName(null); return; }
    supabase
      .from('admin_profiles')
      .select('display_name')
      .eq('user_id', lead.assigned_to)
      .maybeSingle()
      .then(({ data }) => setAssignedDevName(data?.display_name || null));
  }, [lead.assigned_to]);

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
                <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex gap-2 mt-1">
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEdit} />
                  <Button variant="outline" size="icon" asChild>
                    <a href={`mailto:${email}`}><Mail className="h-4 w-4" /></a>
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <div className="flex gap-2 mt-1">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} />
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
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} disabled={!canEdit} />
                  <Building2 className="h-9 w-9 p-2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Website & Billing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Website URL</label>
                <div className="flex gap-2 mt-1">
                  <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={!canEdit} placeholder="https://example.com" />
                  {websiteUrl && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Billing Address</label>
                <div className="flex gap-2 mt-1">
                  <Input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} disabled={!canEdit} placeholder="123 Main St, City, State" />
                  <MapPin className="h-9 w-9 p-2 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            {/* Product (Purchased Tier) */}
            {lead.membership_tier && (
              <div className="pt-4 border-t border-border/40">
                <label className="text-sm font-medium text-muted-foreground">Product</label>
                <div className="flex items-center gap-2 mt-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lead.membership_tier}</span>
                </div>
              </div>
            )}

            {/* Membership Info */}
            <div className="pt-4 border-t border-border/40">
              <label className="text-sm font-medium text-muted-foreground">Membership</label>
              <div className="flex items-center gap-2 mt-1">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {activeMembership ? (
                  <span className="font-medium">
                    {activeMembership.name} - ${activeMembership.price}/{activeMembership.billing_interval}
                  </span>
                ) : activeMembershipTransaction ? (
                  <span className="font-medium">{activeMembershipTransaction.item} (Custom)</span>
                ) : (
                  <span className="text-muted-foreground">No active membership</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canEdit} placeholder="Add notes about this lead..." rows={6} />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Lead Funnel Tree (replaces Progress Overview) */}
        <LeadFunnelTree
          leadId={lead.id}
          currentStatus={status}
          onStatusChange={setStatus}
          canEdit={canEdit}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={onSave}
          saving={saving}
        />

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

        {/* Assigned Developer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5" />
              Assigned Developer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedDevName ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                  {assignedDevName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{assignedDevName}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No developer assigned. Assign one in the Settings tab.</p>
            )}
          </CardContent>
        </Card>

        {/* Booking Card */}
        <BookingCard leadEmail={email} />
      </div>
    </div>
  );
}
