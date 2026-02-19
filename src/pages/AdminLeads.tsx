import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLeads, ALL_STATUSES, STATUS_LABELS } from '@/hooks/useLeads';
import type { LeadStatus, Lead } from '@/hooks/useLeads';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadStatusBadge, isPartialLead, getLeadRowBackground } from '@/components/admin/LeadStatusBadge';
import { Search, Download, Eye, Calendar } from 'lucide-react';
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';

const projectTypeLabels: Record<string, string> = {
  website: 'Website', app: 'App', ai: 'AI Integration',
};

function exportToCSV(leads: Lead[]) {
  const headers = ['Lead #', 'Name', 'Email', 'Phone', 'Business', 'Project Type', 'Status', 'Created At', 'Notes'];
  const rows = leads.map(lead => [
    lead.lead_number || '', lead.name || '', lead.email, lead.phone || '',
    lead.business_name || '', lead.project_type, lead.status,
    new Date(lead.created_at).toLocaleDateString(), lead.notes || '',
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
  const navigate = useNavigate();
  const { leads, loading } = useLeads();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !search || 
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      String(lead.lead_number).includes(search);
    
    let matchesStatus = true;
    if (statusFilter === 'partial') {
      matchesStatus = isPartialLead(lead.form_data);
    } else if (statusFilter !== 'all') {
      matchesStatus = lead.status === statusFilter && !isPartialLead(lead.form_data);
    }
    
    const matchesProject = projectFilter === 'all' || lead.project_type === projectFilter;
    
    let matchesDate = true;
    if (dateFrom) matchesDate = matchesDate && isAfter(parseISO(lead.created_at), startOfDay(parseISO(dateFrom)));
    if (dateTo) matchesDate = matchesDate && isBefore(parseISO(lead.created_at), endOfDay(parseISO(dateTo)));
    
    return matchesSearch && matchesStatus && matchesProject && matchesDate;
  });

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading leads...</div>;

  return (
    <div className="space-y-6">
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

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, business, phone, or lead #..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            {ALL_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="app">App</SelectItem>
            <SelectItem value="ai">AI Integration</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[140px]" />
          <span className="text-muted-foreground">to</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[140px]" />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>

      {/* Leads Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">Lead #</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leads found</TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className={cn("cursor-pointer", getLeadRowBackground(lead.status, lead.form_data))}
                  onClick={() => navigate(`/admin/leads/${lead.id}`)}
                >
                  <TableCell className="font-mono font-medium">#{lead.lead_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.name || 'Unnamed'}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{lead.business_name || '-'}</TableCell>
                  <TableCell>
                    <span className="text-sm">{projectTypeLabels[lead.project_type] || lead.project_type}</span>
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} formData={lead.form_data} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(lead.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
