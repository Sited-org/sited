import { formatDistanceToNow } from 'date-fns';
import type { FormSession } from '@/hooks/useFormSessions';
import { cn } from '@/lib/utils';
import { Monitor, Smartphone, Activity } from 'lucide-react';

interface LiveSessionCardProps {
  session: FormSession;
}

export function LiveSessionCard({ session }: LiveSessionCardProps) {
  const isMobile = session.user_agent?.toLowerCase().includes('mobile');
  const progress = (session.current_step / session.total_steps) * 100;
  
  const formTypeLabels: Record<string, string> = {
    website: 'Website Enquiry',
    app: 'App Enquiry',
    ai: 'AI Integration',
  };

  const partialName = (session.partial_data as Record<string, unknown>)?.name as string | undefined;
  const partialEmail = (session.partial_data as Record<string, unknown>)?.email as string | undefined;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMobile ? (
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Monitor className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {formTypeLabels[session.form_type] || session.form_type}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Step {session.current_step} of {session.total_steps}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Partial data preview */}
      {(partialName || partialEmail) && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          {partialName && <p>Name: {partialName}</p>}
          {partialEmail && <p>Email: {partialEmail}</p>}
        </div>
      )}
    </div>
  );
}
