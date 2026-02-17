import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AnalysisType = 'seo' | 'infrastructure' | 'marketing';
export type SelectionMode = 'all' | 'tier' | 'custom';

export interface AnalysisResult {
  clientId: string;
  businessName: string;
  domain: string | null;
  analysis: string | null;
  status: 'success' | 'failed';
  error?: string;
}

export interface ClientForAnalysis {
  id: string;
  name: string | null;
  email: string;
  business_name: string | null;
  website_url: string | null;
  membership_tier: string | null;
  industry: string | null;
  location: string | null;
}

export function useAnalysisAI() {
  const [clients, setClients] = useState<ClientForAnalysis[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0, currentDomain: '' });
  const [sending, setSending] = useState(false);
  const [editedAnalyses, setEditedAnalyses] = useState<Record<string, string>>({});

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, name, email, business_name, website_url, membership_tier, industry, location')
        .order('business_name');
      if (leadsError) throw leadsError;

      // Fetch active recurring transactions to derive actual membership tiers
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('lead_id, item')
        .eq('is_recurring', true)
        .eq('status', 'completed');
      if (txError) throw txError;

      // Build a map of lead_id -> membership item name from billing
      const tierMap: Record<string, string> = {};
      for (const tx of txData || []) {
        tierMap[tx.lead_id] = tx.item;
      }

      // Merge: use the billing-derived tier, falling back to the leads column
      const merged = (leadsData || []).map(lead => ({
        ...lead,
        membership_tier: tierMap[lead.id] || lead.membership_tier || null,
      })) as ClientForAnalysis[];

      setClients(merged);
    } catch (e: any) {
      toast.error('Failed to load clients');
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  const getSelectedClients = useCallback((): ClientForAnalysis[] => {
    if (selectionMode === 'all') return clients;
    if (selectionMode === 'tier') return clients.filter(c => c.membership_tier === selectedTier);
    return clients.filter(c => selectedClientIds.includes(c.id));
  }, [clients, selectionMode, selectedTier, selectedClientIds]);

  const getAnalyzableClients = useCallback((): ClientForAnalysis[] => {
    return getSelectedClients().filter(c => !!c.website_url);
  }, [getSelectedClients]);

  const runAnalysis = useCallback(async () => {
    if (!analysisType) return;
    const analyzable = getAnalyzableClients();
    if (!analyzable.length) {
      toast.error('No clients with website domains to analyze');
      return;
    }

    setAnalyzing(true);
    setResults([]);
    setAnalyzeProgress({ current: 0, total: analyzable.length, currentDomain: '' });

    try {
      // Process in batches of 3 to avoid timeouts
      const batchSize = 3;
      const allResults: AnalysisResult[] = [];

      for (let i = 0; i < analyzable.length; i += batchSize) {
        const batch = analyzable.slice(i, i + batchSize);
        setAnalyzeProgress({
          current: i,
          total: analyzable.length,
          currentDomain: batch[0]?.website_url || '',
        });

        const { data, error } = await supabase.functions.invoke('run-website-analysis', {
          body: {
            clientIds: batch.map(c => c.id),
            analysisType,
          },
        });

        if (error) throw error;
        if (data?.results) {
          allResults.push(...data.results);
          setResults([...allResults]);
        }

        setAnalyzeProgress({
          current: Math.min(i + batchSize, analyzable.length),
          total: analyzable.length,
          currentDomain: '',
        });
      }

      const successCount = allResults.filter(r => r.status === 'success').length;
      const failCount = allResults.filter(r => r.status === 'failed').length;
      toast.success(`Analysis complete — ${successCount} successful, ${failCount} failed`);
    } catch (e: any) {
      toast.error(`Analysis failed: ${e.message}`);
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  }, [analysisType, getAnalyzableClients]);

  const sendEmails = useCallback(async () => {
    const successResults = results.filter(r => r.status === 'success');
    if (!successResults.length) {
      toast.error('No successful analyses to send');
      return;
    }

    setSending(true);
    try {
      const reports = successResults.map(r => {
        const client = clients.find(c => c.id === r.clientId);
        return {
          clientId: r.clientId,
          email: client?.email,
          businessName: r.businessName,
          clientName: client?.name || r.businessName,
          domain: r.domain,
          analysis: editedAnalyses[r.clientId] || r.analysis,
          analysisType,
        };
      });

      const { data, error } = await supabase.functions.invoke('send-analysis-emails', {
        body: { reports },
      });

      if (error) throw error;
      toast.success(`${data.sent} reports sent successfully${data.failed ? `, ${data.failed} failed` : ''}`);
    } catch (e: any) {
      toast.error(`Failed to send emails: ${e.message}`);
    } finally {
      setSending(false);
    }
  }, [results, clients, editedAnalyses, analysisType]);

  const updateAnalysis = useCallback((clientId: string, newContent: string) => {
    setEditedAnalyses(prev => ({ ...prev, [clientId]: newContent }));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedClientIds([]);
    setSelectionMode('all');
    setSelectedTier('');
    setAnalysisType(null);
    setResults([]);
    setEditedAnalyses({});
  }, []);

  return {
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
  };
}
