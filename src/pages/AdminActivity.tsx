import { useFormSessions } from '@/hooks/useFormSessions';
import { LiveSessionCard } from '@/components/admin/LiveSessionCard';
import { Activity } from 'lucide-react';

export default function AdminActivity() {
  const { activeSessions, sessions, loading } = useFormSessions();

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Live Activity</h1><p className="text-muted-foreground">Real-time view of forms being filled</p></div>
      <div className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-green-500 animate-pulse" /><span>{activeSessions.length} active sessions</span></div>
      {activeSessions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center"><p className="text-muted-foreground">No one is filling out a form right now</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{activeSessions.map(s => <LiveSessionCard key={s.id} session={s} />)}</div>
      )}
    </div>
  );
}
