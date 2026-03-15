import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, User, FolderOpen, CreditCard, Settings, Wallet, MessageSquare, Mail } from 'lucide-react';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { ProfileTab } from '@/components/admin/lead-profile/ProfileTab';
import { BuildFlowProjectTab } from '@/components/admin/lead-profile/build-flow/BuildFlowProjectTab';
import { PaymentsTab } from '@/components/admin/lead-profile/PaymentsTab';
import { CardTab } from '@/components/admin/lead-profile/CardTab';
import { SettingsTab } from '@/components/admin/lead-profile/SettingsTab';
import { RequestsTab } from '@/components/admin/lead-profile/RequestsTab';
import { CommunicationsTab } from '@/components/admin/lead-profile/CommunicationsTab';
import { format } from 'date-fns';
import type { LeadStatus } from '@/hooks/useLeads';

export default function LeadProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const canEdit = userRole?.can_edit_leads ?? false;

  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [status, setStatus] = useState<LeadStatus>('warm_lead');
  const [notes, setNotes] = useState('');
  const [dealAmount, setDealAmount] = useState('0');

  // Track original status for change detection
  const [originalStatus, setOriginalStatus] = useState<LeadStatus>('warm_lead');

  useEffect(() => {
    async function fetchLead() {
      if (!id) return;
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({ title: 'Lead not found', variant: 'destructive' });
        navigate('/admin/leads');
        return;
      }

      setLead(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setBusinessName(data.business_name || '');
      setWebsiteUrl(data.website_url || '');
      setBillingAddress(data.billing_address || '');
      setStatus(data.status as LeadStatus);
      setOriginalStatus(data.status as LeadStatus);
      setNotes(data.notes || '');
      setDealAmount(String(data.deal_amount || 0));
      setLoading(false);
    }
    fetchLead();
  }, [id, navigate, toast]);

  const hasUnsavedChanges = lead && (
    name !== (lead.name || '') ||
    email !== (lead.email || '') ||
    phone !== (lead.phone || '') ||
    businessName !== (lead.business_name || '') ||
    websiteUrl !== (lead.website_url || '') ||
    billingAddress !== (lead.billing_address || '') ||
    status !== originalStatus ||
    notes !== (lead.notes || '') ||
    dealAmount !== String(lead.deal_amount || 0)
  );

  const performSave = useCallback(async (isAuto = false) => {
    if (!id || !canEdit || !lead) return;
    if (isAuto) isAutoSavingRef.current = true;
    setSaving(true);

    const currentFormData = lead.form_data || {};
    const updatedFormData = currentFormData.partial === true
      ? { ...currentFormData, partial: false }
      : currentFormData;

    const updates: any = {
      name, email, phone,
      business_name: businessName,
      website_url: websiteUrl,
      billing_address: billingAddress,
      status,
      notes,
      deal_amount: parseFloat(dealAmount) || 0,
      form_data: updatedFormData,
    };

    if (['mbr_sold_dev', 'ot_sold_dev', 'current_mbr', 'current_ot'].includes(status) && !lead.deal_closed_at) {
      updates.deal_closed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('leads').update(updates).eq('id', id);

    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      if (status !== originalStatus) {
        await supabase.from('lead_status_history').insert({
          lead_id: id,
          from_status: originalStatus,
          to_status: status,
        });
      }
      if (isAuto) {
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      } else {
        toast({ title: 'Lead updated' });
      }
      setLead({ ...lead, ...updates });
      setOriginalStatus(status);
    }
    setSaving(false);
    if (isAuto) isAutoSavingRef.current = false;
  }, [id, canEdit, lead, name, email, phone, businessName, websiteUrl, billingAddress, status, notes, dealAmount, originalStatus, toast]);

  const handleSave = () => performSave(false);

  // Debounced auto-save
  useEffect(() => {
    if (!lead || !canEdit || !hasUnsavedChanges || isAutoSavingRef.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      performSave(true);
    }, 1500);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [name, email, phone, businessName, websiteUrl, billingAddress, status, notes, dealAmount, lead, canEdit, hasUnsavedChanges, performSave]);

  // Navigation guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground p-8">Loading lead...</div>;
  }
  if (!lead) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/leads')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{lead.name || lead.email}</h1>
            <LeadStatusBadge status={status} />
          </div>
          <p className="text-muted-foreground">
            Lead #{lead.lead_number} • Created {format(new Date(lead.created_at), 'PPP')}
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 max-w-3xl">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="project" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Project</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Requests</span>
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Comms</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="card" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Card</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab
            lead={lead}
            name={name} setName={setName}
            email={email} setEmail={setEmail}
            phone={phone} setPhone={setPhone}
            businessName={businessName} setBusinessName={setBusinessName}
            websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
            billingAddress={billingAddress} setBillingAddress={setBillingAddress}
            status={status} setStatus={setStatus}
            notes={notes} setNotes={setNotes}
            canEdit={canEdit}
            onSave={handleSave}
            saving={saving}
            hasUnsavedChanges={!!hasUnsavedChanges}
          />
        </TabsContent>

        <TabsContent value="project" className="mt-6">
          <BuildFlowProjectTab lead={lead} canEdit={canEdit} onLeadUpdate={setLead} />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <RequestsTab leadId={id!} leadName={name} leadEmail={email} />
        </TabsContent>

        <TabsContent value="communications" className="mt-6">
          <CommunicationsTab leadId={id!} leadEmail={email} lead={lead} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsTab lead={lead} dealAmount={dealAmount} setDealAmount={setDealAmount} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="card" className="mt-6">
          <CardTab lead={lead} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab lead={lead} canEdit={canEdit} onLeadUpdate={setLead} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
