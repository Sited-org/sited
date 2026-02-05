 import { cn } from '@/lib/utils';
 
 interface StatusIndicatorProps {
   status: 'not_started' | 'in_progress' | 'complete' | 'issues' | 'pending';
   size?: 'sm' | 'md';
   showLabel?: boolean;
 }
 
 const statusConfig = {
   not_started: { color: 'bg-destructive', label: 'Not Started' },
   in_progress: { color: 'bg-yellow-500', label: 'In Progress' },
   complete: { color: 'bg-green-500', label: 'Complete' },
   issues: { color: 'bg-destructive', label: 'Issues Found' },
   pending: { color: 'bg-yellow-500', label: 'Pending' },
 };
 
 export function StatusIndicator({ status, size = 'sm', showLabel = false }: StatusIndicatorProps) {
   const config = statusConfig[status];
   
   return (
     <div className="flex items-center gap-2">
       <div 
         className={cn(
           'rounded-full',
           config.color,
           size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'
         )} 
       />
       {showLabel && (
         <span className="text-xs text-muted-foreground">{config.label}</span>
       )}
     </div>
   );
 }