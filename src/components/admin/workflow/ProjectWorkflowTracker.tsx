 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { Badge } from '@/components/ui/badge';
 import { ChevronDown, Check, Code2, Server, Search, Sparkles } from 'lucide-react';
 import { WorkflowProgress } from './WorkflowProgress';
 import { FrontEndStage } from './stages/FrontEndStage';
 import { BackEndStage } from './stages/BackEndStage';
 import { SEOStage } from './stages/SEOStage';
 import { AIIntegrationsStage } from './stages/AIIntegrationsStage';
 import { TestingLaunchStage } from './stages/TestingLaunchStage';
 import { cn } from '@/lib/utils';
 
 interface StageConfig {
   id: string;
   title: string;
   icon: React.ElementType;
   progress: number;
   enabled: boolean;
 }
 
 export function ProjectWorkflowTracker() {
   const [isExpanded, setIsExpanded] = useState(false);
   const [activeStages, setActiveStages] = useState<string[]>([]);
   const [expandedStages, setExpandedStages] = useState<string[]>([]);
 
   const stages: StageConfig[] = [
     { id: 'frontend', title: 'Front End Development', icon: Code2, progress: 0, enabled: activeStages.includes('frontend') },
     { id: 'backend', title: 'Back End Development', icon: Server, progress: 0, enabled: activeStages.includes('backend') },
     { id: 'seo', title: 'SEO / AEO Optimization', icon: Search, progress: 0, enabled: activeStages.includes('seo') },
     { id: 'ai', title: 'AI Integrations', icon: Sparkles, progress: 0, enabled: activeStages.includes('ai') },
   ];
 
   const toggleStage = (stageId: string) => {
     setActiveStages(prev => 
       prev.includes(stageId) ? prev.filter(s => s !== stageId) : [...prev, stageId]
     );
   };
 
   const toggleStageExpanded = (stageId: string) => {
     setExpandedStages(prev => 
       prev.includes(stageId) ? prev.filter(s => s !== stageId) : [...prev, stageId]
     );
   };
 
   const renderStageContent = (stageId: string) => {
     switch (stageId) {
       case 'frontend':
         return <FrontEndStage />;
       case 'backend':
         return <BackEndStage />;
       case 'seo':
         return <SEOStage />;
       case 'ai':
         return <AIIntegrationsStage />;
       default:
         return null;
     }
   };
 
   return (
     <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
       <Card className="mb-6">
         <CollapsibleTrigger asChild>
           <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <CardTitle className="text-lg">Project Workflow</CardTitle>
                 {activeStages.length > 0 && (
                   <Badge variant="secondary" className="text-xs">
                     {activeStages.length} active
                   </Badge>
                 )}
               </div>
               <ChevronDown className={cn(
                 'h-5 w-5 text-muted-foreground transition-transform',
                 isExpanded && 'rotate-180'
               )} />
             </div>
           </CardHeader>
         </CollapsibleTrigger>
 
         <CollapsibleContent>
           <CardContent className="pt-0 space-y-6">
             {/* Stage Selection Cards */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
               {stages.map((stage) => (
                 <Card
                   key={stage.id}
                   className={cn(
                     'cursor-pointer transition-all hover:shadow-md',
                     stage.enabled 
                       ? 'border-primary bg-primary/5' 
                       : 'hover:border-muted-foreground/30'
                   )}
                   onClick={() => toggleStage(stage.id)}
                 >
                   <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                     <div className={cn(
                       'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                       stage.enabled 
                         ? 'bg-primary text-primary-foreground' 
                         : 'bg-muted text-muted-foreground'
                     )}>
                       {stage.enabled ? (
                         <Check className="h-5 w-5" />
                       ) : (
                         <stage.icon className="h-5 w-5" />
                       )}
                     </div>
                     <span className="text-sm font-medium">{stage.title}</span>
                     {stage.enabled && (
                       <WorkflowProgress value={stage.progress} size="sm" showLabel={false} className="w-full" />
                     )}
                   </CardContent>
                 </Card>
               ))}
             </div>
 
             {/* Expanded Stage Content */}
             {activeStages.length > 0 && (
               <div className="space-y-4">
                 {stages.filter(s => s.enabled).map((stage) => (
                   <Collapsible
                     key={stage.id}
                     open={expandedStages.includes(stage.id)}
                     onOpenChange={() => toggleStageExpanded(stage.id)}
                   >
                     <Card>
                       <CollapsibleTrigger asChild>
                         <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                 <stage.icon className="h-4 w-4 text-primary" />
                               </div>
                               <CardTitle className="text-base">{stage.title}</CardTitle>
                             </div>
                             <ChevronDown className={cn(
                               'h-4 w-4 text-muted-foreground transition-transform',
                               expandedStages.includes(stage.id) && 'rotate-180'
                             )} />
                           </div>
                         </CardHeader>
                       </CollapsibleTrigger>
                       <CollapsibleContent>
                         <CardContent className="pt-0">
                           {renderStageContent(stage.id)}
                         </CardContent>
                       </CollapsibleContent>
                     </Card>
                   </Collapsible>
                 ))}
 
                 {/* Testing & Launch - Always visible when any stage is active */}
                 <Collapsible
                   open={expandedStages.includes('testing')}
                   onOpenChange={() => toggleStageExpanded('testing')}
                 >
                   <Card className="border-dashed">
                     <CollapsibleTrigger asChild>
                       <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <CardTitle className="text-base">Testing & Launch</CardTitle>
                             <Badge variant="outline" className="text-xs">Always Visible</Badge>
                           </div>
                           <ChevronDown className={cn(
                             'h-4 w-4 text-muted-foreground transition-transform',
                             expandedStages.includes('testing') && 'rotate-180'
                           )} />
                         </div>
                       </CardHeader>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                       <CardContent className="pt-0">
                         <TestingLaunchStage />
                       </CardContent>
                     </CollapsibleContent>
                   </Card>
                 </Collapsible>
               </div>
             )}
 
             {activeStages.length === 0 && (
               <p className="text-sm text-muted-foreground text-center py-4">
                 Click on a stage above to enable and configure it for this project.
               </p>
             )}
           </CardContent>
         </CollapsibleContent>
       </Card>
     </Collapsible>
   );
 }