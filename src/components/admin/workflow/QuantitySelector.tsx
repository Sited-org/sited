 import { Button } from '@/components/ui/button';
 import { Minus, Plus } from 'lucide-react';
 
 interface QuantitySelectorProps {
   value: number;
   onChange: (value: number) => void;
   min?: number;
   max?: number;
   label?: string;
 }
 
 export function QuantitySelector({ 
   value, 
   onChange, 
   min = 0, 
   max = 50,
   label 
 }: QuantitySelectorProps) {
   return (
     <div className="flex items-center gap-3">
       {label && <span className="text-sm text-muted-foreground">{label}</span>}
       <div className="flex items-center gap-1">
         <Button
           variant="outline"
           size="icon"
           className="h-8 w-8"
           onClick={() => onChange(Math.max(min, value - 1))}
           disabled={value <= min}
         >
           <Minus className="h-4 w-4" />
         </Button>
         <div className="w-12 text-center font-medium">{value}</div>
         <Button
           variant="outline"
           size="icon"
           className="h-8 w-8"
           onClick={() => onChange(Math.min(max, value + 1))}
           disabled={value >= max}
         >
           <Plus className="h-4 w-4" />
         </Button>
       </div>
     </div>
   );
 }