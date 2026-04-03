import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hammer, Image, Shield } from 'lucide-react';
import { useBuildFlow } from '@/hooks/useBuildFlow';
import { useAuth } from '@/hooks/useAuth';
import { DiscoveryForm, type DiscoveryData } from './DiscoveryForm';
import { BuildFlowView } from './BuildFlowView';
import { ClientAssetsPanel } from './ClientAssetsPanel';
import { CredentialVault } from './CredentialVault';

interface BuildFlowProjectTabProps {
  lead: any;
  canEdit: boolean;
  onLeadUpdate?: (updatedLead: any) => void;
}

// Map discovery form selections to feature keys for the edge function
function mapFeatureKeys(data: DiscoveryData): { features: string[]; integrations: string[] } {
  const featureMap: Record<string, string> = {
    'User Sign Up & Login': 'user_signup_login',
    'Google OAuth': 'google_oauth',
    'Role-based access': 'role_based_access',
    'Password reset flow': 'password_reset',
    'Contact form to database': 'contact_form_db',
    'User data storage': 'user_data_storage',
    'Content management': 'content_management',
    'File / image uploads': 'file_uploads',
  };
  const integrationMap: Record<string, string> = {
    'Stripe': 'stripe',
    'Slack': 'slack',
    'Resend': 'resend',
    'Zapier': 'zapier',
    'Google Analytics': 'ga4',
    'Blog / CMS': 'blog_cms',
    'Service M8': 'service_m8',
    'Xero': 'xero',
    'HubSpot': 'hubspot',
    'Mailchimp': 'mailchimp',
    'Salesforce': 'salesforce',
    'GHL': 'ghl',
    'Calendar / Booking': 'calendar_booking',
    'Google Maps': 'google_maps',
    'Social Media Feed': 'social_feed',
    'AI Chatbot': 'ai_chatbot',
    'Reviews Widget': 'reviews_widget',
    'Payments': 'payments',
    'GitHub': 'github',
    'Figma': 'figma',
    'Jira': 'jira',
    'Notion': 'notion',
    'Linear': 'linear',
  };

  return {
    features: data.selectedFeatures.map(f => featureMap[f] || f).filter(Boolean),
    integrations: data.selectedIntegrations.map(i => integrationMap[i] || i).filter(Boolean),
  };
}

export function BuildFlowProjectTab({ lead, canEdit, onLeadUpdate }: BuildFlowProjectTabProps) {
  const { user } = useAuth();
  const {
    buildFlow,
    phases,
    loading,
    clientAssets,
    brandColours,
    brandFonts,
    credentials,
    markStepComplete,
    skipStep,
    toggleClientView,
    createBuildFlow,
    restartBuildFlow,
    refetch,
  } = useBuildFlow(lead.id);

  const handleDiscoverySubmit = async (data: DiscoveryData) => {
    const { features, integrations } = mapFeatureKeys(data);
    // Pass full discovery data + userId so edge function can auto-complete P1S1
    await createBuildFlow(
      data.projectType,
      features,
      data.selectedPages,
      integrations,
      data.businessName,
      data,
    );
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground p-8">Loading build flow...</div>;
  }

  // No build flow — show discovery form
  if (!buildFlow) {
    return (
      <DiscoveryForm
        leadId={lead.id}
        leadName={lead.name || lead.email}
        leadBusinessName={lead.business_name || ''}
        onSubmit={handleDiscoverySubmit}
      />
    );
  }

  // Build flow exists — show the main UI
  return (
    <Tabs defaultValue="build" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="build" className="flex items-center gap-2">
          <Hammer className="h-4 w-4" />
          <span className="hidden sm:inline">Build Flow</span>
        </TabsTrigger>
        <TabsTrigger value="assets" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          <span className="hidden sm:inline">Assets</span>
        </TabsTrigger>
        <TabsTrigger value="vault" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Vault</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="build" className="mt-4">
        <BuildFlowView
          buildFlow={buildFlow}
          phases={phases}
          canEdit={canEdit}
          userId={user?.id}
          onMarkComplete={markStepComplete}
          onSkipStep={skipStep}
          onRestartFlow={restartBuildFlow}
          refetch={refetch}
        />
      </TabsContent>

      <TabsContent value="assets" className="mt-4">
        <ClientAssetsPanel
          clientAssets={clientAssets}
          brandColours={brandColours}
          brandFonts={brandFonts}
          buildFlowId={buildFlow.id}
          leadId={lead.id}
          canEdit={canEdit}
          onUpdate={refetch}
        />
      </TabsContent>

      <TabsContent value="vault" className="mt-4">
        <CredentialVault
          credentials={credentials}
          buildFlowId={buildFlow.id}
          leadId={lead.id}
          userId={user?.id || ''}
          canEdit={canEdit}
          onUpdate={refetch}
        />
      </TabsContent>
    </Tabs>
  );
}
