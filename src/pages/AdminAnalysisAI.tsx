import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Building2,
  BarChart3,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  Send,
  Loader2,
  X,
  Eye,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { useAnalysisAI, AnalysisType, SelectionMode, ClientForAnalysis } from '@/hooks/useAnalysisAI';

const MEMBERSHIP_TIERS = [
  { value: 'Blue', label: 'Blue' },
  { value: 'Gold Package', label: 'Gold' },
  { value: 'Platinum', label: 'Platinum' },
  { value: '50% Off', label: '50% Off' },
];

const ANALYSIS_TYPES: { value: AnalysisType; icon: React.ElementType; title: string; description: string }[] = [
  {
    value: 'seo',
    icon: Search,
    title: 'SEO Analysis',
    description: 'Site structure, meta tags, page speed, mobile compatibility, and search optimisation opportunities.',
  },
  {
    value: 'infrastructure',
    icon: Building2,
    title: 'Infrastructure Analysis',
    description: 'Technical health check — hosting performance, security, broken links, outdated dependencies, and site integrity.',
  },
  {
    value: 'marketing',
    icon: BarChart3,
    title: 'Marketing Strategy',
    description: 'Conversion opportunities, messaging clarity, CTA effectiveness, and competitive positioning.',
  },
];

export default function AdminAnalysisAI() {
  const {
    clients,
    loadingClients,
    fetchClients,
    selectedClientIds,
    setSelectedClientIds,
    selectionMode,
    setSelectionMode,
    selectedTier,
    setSelectedTier,
    analysisType,
    setAnalysisType,
    results,
    analyzing,
    analyzeProgress,
    sending,
    editedAnalyses,
    getSelectedClients,
    getAnalyzableClients,
    runAnalysis,
    sendEmails,
    updateAnalysis,
    clearAll,
  } = useAnalysisAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewReport, setViewReport] = useState<{ businessName: string; content: string } | null>(null);
  const [editReport, setEditReport] = useState<{ clientId: string; businessName: string; content: string } | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const selectedClients = getSelectedClients();
  const analyzableClients = getAnalyzableClients();
  const step1Complete = selectedClients.length > 0;
  const step2Complete = !!analysisType;
  const step3Complete = results.length > 0 && !analyzing;
  const successResults = results.filter(r => r.status === 'success');
  const failedResults = results.filter(r => r.status === 'failed');

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(q) || '') ||
      (c.email?.toLowerCase().includes(q) || '') ||
      (c.business_name?.toLowerCase().includes(q) || '')
    );
  });

  const handleToggleClient = (id: string) => {
    setSelectedClientIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Analysis AI
        </h1>
        <p className="text-muted-foreground mt-1">Automated Website Analysis & Client Reporting</p>
      </div>

      {/* Step 1: Select Clients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Step 1: Select Clients</CardTitle>
              <CardDescription>Choose which clients to analyze</CardDescription>
            </div>
            {step1Complete && <Badge variant="outline" className="text-green-600 border-green-600"><Check className="h-3 w-3 mr-1" />{selectedClients.length} selected</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection mode radio */}
          <div className="flex flex-wrap gap-3">
            {(['all', 'tier', 'custom'] as SelectionMode[]).map(mode => (
              <Button
                key={mode}
                variant={selectionMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSelectionMode(mode); setSelectedClientIds([]); setSelectedTier(''); }}
              >
                {mode === 'all' && `All Clients (${clients.length})`}
                {mode === 'tier' && 'By Membership Tier'}
                {mode === 'custom' && 'Custom Selection'}
              </Button>
            ))}
          </div>

          {/* Tier selector */}
          {selectionMode === 'tier' && (
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a tier..." />
              </SelectTrigger>
              <SelectContent>
                {MEMBERSHIP_TIERS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Custom search & select */}
          {selectionMode === 'custom' && (
            <div className="space-y-3">
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              {selectedClientIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedClientIds.map(id => {
                    const c = clients.find(x => x.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        {c?.business_name || c?.name || c?.email}
                        <button onClick={() => handleToggleClient(id)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Client preview table */}
          {(selectionMode !== 'custom' || selectedClientIds.length > 0 || searchQuery) && (() => {
            const displayClients = selectionMode === 'custom' ? filteredClients : selectedClients;
            const visibleClients = displayClients.slice(0, visibleCount);
            const hasMore = displayClients.length > visibleCount;
            return (
              <div className="space-y-2">
                <ScrollArea className="max-h-[400px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectionMode === 'custom' && <TableHead className="w-10" />}
                        <TableHead>Client</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Tier</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleClients.map(c => (
                        <TableRow key={c.id}>
                          {selectionMode === 'custom' && (
                            <TableCell>
                              <Checkbox
                                checked={selectedClientIds.includes(c.id)}
                                onCheckedChange={() => handleToggleClient(c.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{c.name || c.email}</TableCell>
                          <TableCell>{c.business_name || '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {c.website_url || <span className="text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" />Missing</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">{c.membership_tier || 'None'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {displayClients.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={selectionMode === 'custom' ? 5 : 4} className="text-center text-muted-foreground py-8">
                            {loadingClients ? 'Loading clients...' : 'No clients found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {hasMore && (
                  <div className="flex justify-center pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVisibleCount(prev => prev + 15)}
                    >
                      Load More ({displayClients.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          {step1Complete && (
            <Button variant="ghost" size="sm" onClick={clearAll}>Clear Selection</Button>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Choose Analysis Type */}
      <Card className={!step1Complete ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Step 2: Choose Analysis Type</CardTitle>
              <CardDescription>Select the type of analysis to perform</CardDescription>
            </div>
            {step2Complete && <Badge variant="outline" className="text-green-600 border-green-600"><Check className="h-3 w-3 mr-1" />{ANALYSIS_TYPES.find(a => a.value === analysisType)?.title}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ANALYSIS_TYPES.map(a => {
              const Icon = a.icon;
              const isSelected = analysisType === a.value;
              return (
                <button
                  key={a.value}
                  onClick={() => setAnalysisType(a.value)}
                  className={`p-5 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-accent/50'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="font-semibold mb-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Run Analysis */}
      <Card className={!step1Complete || !step2Complete ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Step 3: Run Analysis</CardTitle>
          <CardDescription>
            {analyzableClients.length} of {selectedClients.length} clients have a website domain
            {selectedClients.length - analyzableClients.length > 0 && (
              <span className="text-amber-600 ml-1">
                ({selectedClients.length - analyzableClients.length} excluded — missing domain)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!step3Complete && !analyzing && (
            <Button
              size="lg"
              onClick={runAnalysis}
              disabled={!analyzableClients.length}
              className="w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze {analyzableClients.length} websites — {ANALYSIS_TYPES.find(a => a.value === analysisType)?.title}
            </Button>
          )}

          {analyzing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing… ({analyzeProgress.current} of {analyzeProgress.total} complete)
              </div>
              <Progress value={(analyzeProgress.current / analyzeProgress.total) * 100} className="h-2" />
              {analyzeProgress.currentDomain && (
                <p className="text-xs text-muted-foreground">Currently analysing: {analyzeProgress.currentDomain}</p>
              )}
            </div>
          )}

          {step3Complete && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-medium">Analysis complete — {successResults.length} successful, {failedResults.length} failed</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 4: Review & Send */}
      {step3Complete && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Step 4: Review & Send</CardTitle>
            <CardDescription>Review generated analyses and send reports to clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success results */}
            {successResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">Successful Analyses ({successResults.length})</h3>
                {successResults.map(r => {
                  const content = editedAnalyses[r.clientId] || r.analysis || '';
                  const preview = content.slice(0, 150) + (content.length > 150 ? '...' : '');
                  return (
                    <Collapsible key={r.clientId}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 text-left">
                            <Check className="h-4 w-4 text-green-600 shrink-0" />
                            <div>
                              <span className="font-medium">{r.businessName}</span>
                              <span className="text-sm text-muted-foreground ml-2">({r.domain})</span>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 border border-t-0 rounded-b-lg bg-muted/30">
                          <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{preview}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewReport({ businessName: r.businessName, content })}
                            >
                              <Eye className="h-3 w-3 mr-1" /> View Full Report
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditReport({ clientId: r.clientId, businessName: r.businessName, content })}
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Edit Report
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}

            {/* Failed results */}
            {failedResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-destructive">Failed Analyses ({failedResults.length})</h3>
                {failedResults.map(r => (
                  <div key={r.clientId} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="font-medium">{r.businessName}</span>
                    <span className="text-muted-foreground">— {r.error}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Send section */}
            {successResults.length > 0 && (
              <div className="p-5 rounded-lg border bg-muted/30 space-y-3">
                <h3 className="font-semibold">Ready to Send</h3>
                <p className="text-sm text-muted-foreground">
                  {successResults.length} client reports ready to send
                  {failedResults.length > 0 && ` · ${failedResults.length} analyses failed (excluded)`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Each client will receive a branded email with their analysis and a "Request Implementation" CTA.
                </p>
                <Button
                  size="lg"
                  onClick={() => setConfirmSend(true)}
                  disabled={sending}
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Send All Reports Now</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Report Modal */}
      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewReport?.businessName} — Full Report</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {viewReport?.content}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Report Modal */}
      <Dialog open={!!editReport} onOpenChange={() => setEditReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Report — {editReport?.businessName}</DialogTitle>
            <DialogDescription>Make changes to the analysis before sending.</DialogDescription>
          </DialogHeader>
          <Textarea
            className="min-h-[300px] text-sm"
            value={editReport?.content || ''}
            onChange={e => {
              if (editReport) setEditReport({ ...editReport, content: e.target.value });
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditReport(null)}>Cancel</Button>
            <Button onClick={() => {
              if (editReport) {
                updateAnalysis(editReport.clientId, editReport.content);
                setEditReport(null);
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Analysis Reports?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send {successResults.length} analysis reports to your clients. Each will receive a branded email with their website analysis and an option to request implementation. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmSend(false); sendEmails(); }}>
              Send {successResults.length} Reports
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
