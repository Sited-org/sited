 import { Progress } from '@/components/ui/progress';
 import { cn } from '@/lib/utils';
 
 interface WorkflowProgressProps {
   value: number;
   className?: string;
   showLabel?: boolean;
   size?: 'sm' | 'md';
 }
 
 export function WorkflowProgress({ value, className, showLabel = true, size = 'md' }: WorkflowProgressProps) {
   return (
     <div className={cn('flex items-center gap-3', className)}>
       <Progress 
         value={value} 
         className={cn(
           size === 'sm' ? 'h-1.5' : 'h-2',
           'flex-1'
         )} 
       />
       {showLabel && (
         <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
           {value}%
         </span>
       )}
     </div>
   );
 }