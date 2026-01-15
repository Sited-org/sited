import { Card, CardContent } from '@/components/ui/card';
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
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'New Client';
      case 'contacted': return 'In Discussion';
      case 'booked_call': return 'Call Scheduled';
      case 'sold': return 'Active Client';
      default: return status;
    }
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Your account information</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{lead.name || lead.business_name || 'Client'}</p>
              <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
            </div>
            <Badge variant="outline" className="shrink-0">{getStatusLabel(lead.status)}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Contact</p>
          {lead.name && <InfoRow icon={User} label="Name" value={lead.name} />}
          <InfoRow icon={Mail} label="Email" value={lead.email} />
          {lead.phone && <InfoRow icon={Phone} label="Phone" value={lead.phone} />}
          {lead.business_name && <InfoRow icon={Building2} label="Business" value={lead.business_name} />}
        </CardContent>
      </Card>

      {/* Website & Billing */}
      {(lead.website_url || lead.billing_address) && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Website & Billing</p>
            {lead.website_url && (
              <InfoRow 
                icon={Globe} 
                label="Website" 
                value={
                  <a 
                    href={lead.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline"
                  >
                    {lead.website_url}
                  </a>
                } 
              />
            )}
            {lead.billing_address && (
              <InfoRow icon={MapPin} label="Billing Address" value={lead.billing_address} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Status */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Account</p>
          <InfoRow 
            icon={Calendar} 
            label="Client Since" 
            value={format(new Date(lead.created_at), 'MMMM d, yyyy')} 
          />
          <InfoRow 
            icon={Globe} 
            label="Project Type" 
            value={lead.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
          />
          <div className="flex items-start gap-3 py-3">
            <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${hasPaymentMethod ? 'text-green-600' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className={`text-sm font-medium ${hasPaymentMethod ? 'text-green-600' : ''}`}>
                {hasPaymentMethod ? 'Active' : 'Not Set Up'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
