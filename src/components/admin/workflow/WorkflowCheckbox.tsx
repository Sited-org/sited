 import { Checkbox } from '@/components/ui/checkbox';
 import { cn } from '@/lib/utils';
 
 interface WorkflowCheckboxProps {
   id: string;
   label: string;
   checked: boolean;
   onCheckedChange: (checked: boolean) => void;
   description?: string;
   className?: string;
 }
 
 export function WorkflowCheckbox({ 
   id, 
   label, 
   checked, 
   onCheckedChange,
   description,
   className 
 }: WorkflowCheckboxProps) {
   return (
     <div className={cn('flex items-start gap-3', className)}>
       <Checkbox 
         id={id} 
         checked={checked} 
         onCheckedChange={onCheckedChange}
         className="mt-0.5"
       />
       <div className="grid gap-0.5">
         <label 
           htmlFor={id} 
           className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
         >
           {label}
         </label>
         {description && (
           <span className="text-xs text-muted-foreground">{description}</span>
         )}
       </div>
     </div>
   );
 }