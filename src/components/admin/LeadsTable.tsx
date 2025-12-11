import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LeadStatusBadge } from './LeadStatusBadge';
import { LeadDetailSheet } from './LeadDetailSheet';
import type { Lead, LeadStatus } from '@/hooks/useLeads';
import { MoreHorizontal, Eye, Phone, Trash2, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const allStatuses: LeadStatus[] = ['new', 'contacted', 'booked_call', 'sold', 'lost'];

const statusLabels: Record<LeadStatus, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  booked_call: 'Booked Call',
  sold: 'Sold',
  lost: 'Lost',
};

interface LeadsTableProps {
  leads: Lead[];
  onUpdateStatus: (leadId: string, status: LeadStatus) => Promise<boolean>;
  onUpdateNotes: (leadId: string, notes: string) => Promise<boolean>;
  onDelete: (leadId: string) => Promise<boolean>;
  onMarkContacted: (leadId: string) => Promise<boolean>;
}

export function LeadsTable({ 
  leads, 
  onUpdateStatus, 
  onUpdateNotes,
  onDelete,
  onMarkContacted
}: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { canEditLeads } = useAuth();

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      website: 'Website',
      app: 'App',
      ai: 'AI Integration',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Contact</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No leads yet
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{lead.business_name || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{getProjectTypeLabel(lead.project_type)}</p>
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`mailto:${lead.email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </a>
                        </DropdownMenuItem>
                        {lead.phone && (
                          <DropdownMenuItem asChild>
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </a>
                          </DropdownMenuItem>
                        )}
                        {canEditLeads && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onMarkContacted(lead.id)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Mark Contacted
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {allStatuses.map((status) => (
                              <DropdownMenuItem 
                                key={status}
                                onClick={() => onUpdateStatus(lead.id, status)}
                              >
                                Set as {statusLabels[status]}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => onDelete(lead.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <LeadDetailSheet 
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdateStatus={onUpdateStatus}
        onUpdateNotes={onUpdateNotes}
        canEdit={canEditLeads}
      />
    </>
  );
}
