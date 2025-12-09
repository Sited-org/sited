import { useState } from 'react';
import { useLeads, LeadStatus } from '@/hooks/useLeads';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

const allStatuses: LeadStatus[] = ['new', 'cold', 'warm', 'hot', 'contacted', 'proposal_sent', 'paid', 'lost'];

export default function AdminLeads() {
  const { leads, loading, updateLeadStatus, updateLeadNotes, deleteLead, markAsContacted } = useLeads();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !search || 
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.business_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading leads...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Leads</h1><p className="text-muted-foreground">Manage and track all your leads</p></div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <LeadsTable leads={filteredLeads} onUpdateStatus={updateLeadStatus} onUpdateNotes={updateLeadNotes} onDelete={deleteLead} onMarkContacted={markAsContacted} />
    </div>
  );
}
