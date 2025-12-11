import { useState } from 'react';
import { useLeads, LeadStatus, Lead } from '@/hooks/useLeads';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download } from 'lucide-react';

const allStatuses: LeadStatus[] = ['new', 'contacted', 'booked_call', 'sold', 'lost'];

const statusLabels: Record<LeadStatus, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  booked_call: 'Booked Call',
  sold: 'Sold',
  lost: 'Lost',
};

function exportToCSV(leads: Lead[]) {
  const headers = ['Name', 'Email', 'Phone', 'Business', 'Project Type', 'Status', 'Created At', 'Notes'];
  const rows = leads.map(lead => [
    lead.name || '',
    lead.email,
    lead.phone || '',
    lead.business_name || '',
    lead.project_type,
    lead.status,
    new Date(lead.created_at).toLocaleDateString(),
    lead.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminLeads() {
  const { leads, loading, updateLeadStatus, updateLeadNotes, deleteLead, markAsContacted } = useLeads();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !search || 
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesProject = projectFilter === 'all' || lead.project_type === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading leads...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage and track all your leads</p>
        </div>
        <Button onClick={() => exportToCSV(filteredLeads)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, business, or phone..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map(s => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="app">App</SelectItem>
            <SelectItem value="ai">AI Integration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>

      <LeadsTable 
        leads={filteredLeads} 
        onUpdateStatus={updateLeadStatus} 
        onUpdateNotes={updateLeadNotes} 
        onDelete={deleteLead} 
        onMarkContacted={markAsContacted} 
      />
    </div>
  );
}
