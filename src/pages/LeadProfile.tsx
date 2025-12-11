import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, User, FolderOpen, CreditCard, Settings } from 'lucide-react';
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge';
import { ProfileTab } from '@/components/admin/lead-profile/ProfileTab';
import { ProjectTab } from '@/components/admin/lead-profile/ProjectTab';
import { PaymentsTab } from '@/components/admin/lead-profile/PaymentsTab';
import { SettingsTab } from '@/components/admin/lead-profile/SettingsTab';
import { format } from 'date-fns';

type LeadStatus = 'new' | 'contacted' | 'booked_call' | 'sold' | 'lost';

export default function LeadProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const canEdit = userRole?.can_edit_leads ?? false;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [notes, setNotes] = useState('');
  const [dealAmount, setDealAmount] = useState('0');

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
      setStatus(data.status as LeadStatus);
      setNotes(data.notes || '');
      setDealAmount(String(data.deal_amount || 0));
      setLoading(false);
    }

    fetchLead();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!id || !canEdit) return;
    setSaving(true);

    const updates: any = {
      name,
      email,
      phone,
      business_name: businessName,
      status,
      notes,
      deal_amount: parseFloat(dealAmount) || 0,
    };

    // Set deal_closed_at when status changes to sold
    if (status === 'sold' && lead.status !== 'sold') {
      updates.deal_closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Lead updated' });
      setLead({ ...lead, ...updates });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse text-muted-foreground p-8">Loading lead...</div>
    );
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
            <h1 className="text-2xl font-bold">Lead #{lead.lead_number}</h1>
            <LeadStatusBadge status={status} />
          </div>
          <p className="text-muted-foreground">
            {lead.name || lead.email} • Created {format(new Date(lead.created_at), 'PPP')}
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="project" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Project</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab
            lead={lead}
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            businessName={businessName}
            setBusinessName={setBusinessName}
            status={status}
            setStatus={setStatus}
            notes={notes}
            setNotes={setNotes}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="project" className="mt-6">
          <ProjectTab lead={lead} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsTab 
            lead={lead} 
            dealAmount={dealAmount}
            setDealAmount={setDealAmount}
            canEdit={canEdit} 
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab lead={lead} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
