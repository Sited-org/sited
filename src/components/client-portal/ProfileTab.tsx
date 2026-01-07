import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Globe,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface ProfileTabProps {
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    business_name?: string;
    project_type: string;
    status: string;
    form_data: any;
    created_at: string;
    website_url?: string;
    billing_address?: string;
  };
  hasPaymentMethod: boolean;
}

export function ProfileTab({ lead, hasPaymentMethod }: ProfileTabProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new':
        return { label: 'New Client', color: 'bg-blue-500/10 text-blue-600' };
      case 'contacted':
        return { label: 'In Discussion', color: 'bg-yellow-500/10 text-yellow-600' };
      case 'booked_call':
        return { label: 'Call Scheduled', color: 'bg-purple-500/10 text-purple-600' };
      case 'sold':
        return { label: 'Active Client', color: 'bg-green-500/10 text-green-600' };
      default:
        return { label: status, color: 'bg-muted' };
    }
  };

  const statusInfo = getStatusInfo(lead.status);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{lead.name || lead.business_name || 'Client'}</h2>
              <p className="text-muted-foreground">{lead.email}</p>
            </div>
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
          <CardDescription>Your contact details on file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lead.name && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{lead.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{lead.email}</p>
              </div>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{lead.phone}</p>
                </div>
              </div>
            )}

            {lead.business_name && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Business</p>
                  <p className="font-medium">{lead.business_name}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Website & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Website & Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {lead.website_url && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Website URL</p>
                  <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {lead.website_url}
                  </a>
                </div>
              </div>
            )}

            {lead.billing_address && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Billing Address</p>
                  <p className="font-medium whitespace-pre-line">{lead.billing_address}</p>
                </div>
              </div>
            )}

            {!lead.website_url && !lead.billing_address && (
              <p className="text-muted-foreground text-sm text-center py-4">
                No website or billing information on file
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Client Since</p>
                  <p className="font-medium">{format(new Date(lead.created_at), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Project Type</p>
                  <p className="font-medium">{lead.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${hasPaymentMethod ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`h-5 w-5 ${hasPaymentMethod ? 'text-green-600' : 'text-yellow-600'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className={`font-medium ${hasPaymentMethod ? 'text-green-700' : 'text-yellow-700'}`}>
                    {hasPaymentMethod ? 'Active' : 'Not Set Up'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
