 import { useState, useEffect } from 'react';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Progress } from '@/components/ui/progress';
 import { Badge } from '@/components/ui/badge';
import { 
  Settings2, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Monitor,
  Server,
  Plug,
  Bot,
  Save,
  Database,
  Mail,
  Eye
} from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 
 // Stage definitions
 const STAGE_DEFINITIONS = {
   frontend: {
     name: 'Customer-Facing Website',
     icon: Monitor,
     steps: ['Started', 'V1 Complete', 'Revision', 'Complete'],
   },
   backend: {
     name: 'Back End',
     icon: Server,
     steps: ['Started', 'V1 Complete', 'Shared', 'V2', 'Complete'],
   },
   crm_setup: {
     name: 'CRM Setup',
     icon: Database,
     steps: ['Planning', 'Configuration', 'Testing', 'Live'],
   },
   email_automation: {
     name: 'Email Automation',
     icon: Mail,
     steps: ['Template Design', 'Flow Setup', 'Testing', 'Active'],
   },
   integrations: {
     name: 'Integrations',
     icon: Plug,
     options: ['Emails', 'Stripe', 'Google Calendar'],
     stepsPerOption: ['Started', 'Integrated', 'Tested', 'Approved'],
   },
   ai: {
     name: 'AI Automations',
     icon: Bot,
     options: ['Chat-Bot', 'Assistant', 'Emails'],
     stepsPerOption: ['Started', 'Built', 'Tested', 'V1', 'Shared', 'Confirmed', 'Complete'],
   },
 };
 
 interface WorkflowData {
   configured: boolean;
   stages: {
     frontend?: { enabled: boolean; currentStep: number };
     backend?: { enabled: boolean; currentStep: number };
     crm_setup?: { enabled: boolean; currentStep: number };
     email_automation?: { enabled: boolean; currentStep: number };
     integrations?: { 
       enabled: boolean; 
       selectedOptions: string[];
       progress: Record<string, number>;
     };
     ai?: { 
       enabled: boolean; 
       selectedOptions: string[];
       progress: Record<string, number>;
     };
   };
   stage_notes?: Record<string, string>;
   review_requested?: Record<string, boolean>;
 }
 
 interface WorkflowTrackerProps {
   lead: any;
   canEdit: boolean;
   onLeadUpdate?: (updatedLead: any) => void;
 }
 
 export function WorkflowTracker({ lead, canEdit, onLeadUpdate }: WorkflowTrackerProps) {
   const { toast } = useToast();
   const [isConfiguring, setIsConfiguring] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
   
   // Initialize workflow data from lead or default
   const [workflowData, setWorkflowData] = useState<WorkflowData>(() => {
     const saved = lead.workflow_data as WorkflowData | null;
     if (saved?.configured) return saved;
     return {
       configured: false,
       stages: {
         frontend: { enabled: false, currentStep: 0 },
         backend: { enabled: false, currentStep: 0 },
         crm_setup: { enabled: false, currentStep: 0 },
         email_automation: { enabled: false, currentStep: 0 },
         integrations: { enabled: false, selectedOptions: [], progress: {} },
         ai: { enabled: false, selectedOptions: [], progress: {} },
       },
       stage_notes: {},
       review_requested: {},
     };
   });
 
   // Calculate overall progress
   const calculateProgress = (): number => {
     if (!workflowData.configured) return 0;
     let totalSteps = 0;
     let completedSteps = 0;
     
     // Simple stages (frontend, backend, crm_setup, email_automation)
     for (const key of ['frontend', 'backend', 'crm_setup', 'email_automation'] as const) {
       const stage = workflowData.stages[key];
       const def = STAGE_DEFINITIONS[key];
       if (stage?.enabled && def.steps) {
         totalSteps += def.steps.length;
         completedSteps += stage.currentStep;
       }
     }
     
     // Multi-option stages (integrations, ai)
     for (const key of ['integrations', 'ai'] as const) {
       const stage = workflowData.stages[key];
       const def = STAGE_DEFINITIONS[key];
       if (stage?.enabled && def.stepsPerOption) {
         const options = stage.selectedOptions;
         totalSteps += options.length * def.stepsPerOption.length;
         options.forEach(opt => {
           completedSteps += stage.progress[opt] || 0;
         });
       }
     }
     
     return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
   };

    // Calculate progress for a given workflow data object
    const calcProgressForData = (d: WorkflowData): number => {
      if (!d.configured) return 0;
      let totalSteps = 0, completedSteps = 0;
      
      for (const key of ['frontend', 'backend', 'crm_setup', 'email_automation'] as const) {
        const stage = d.stages[key];
        const def = STAGE_DEFINITIONS[key];
        if (stage?.enabled && def.steps) {
          totalSteps += def.steps.length;
          completedSteps += stage.currentStep;
        }
      }
      for (const key of ['integrations', 'ai'] as const) {
        const stage = d.stages[key];
        const def = STAGE_DEFINITIONS[key];
        if (stage?.enabled && def.stepsPerOption) {
          const opts = stage.selectedOptions;
          totalSteps += opts.length * def.stepsPerOption.length;
          opts.forEach(opt => { completedSteps += stage.progress[opt] || 0; });
        }
      }
      return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    };

    const saveWorkflow = async (data: WorkflowData) => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('leads')
         .update({ workflow_data: JSON.parse(JSON.stringify(data)) })
          .eq('id', lead.id);
        
        if (error) throw error;
        
        onLeadUpdate?.({ ...lead, workflow_data: data });
        toast({ title: 'Workflow saved' });

        // Trigger milestone email check
        const newProgress = calcProgressForData(data);
        if (newProgress > 0) {
          supabase.functions.invoke('send-milestone-email', {
            body: { lead_id: lead.id, progress: newProgress },
          }).catch(err => console.error('Milestone email error:', err));
        }
      } catch (error: any) {
        toast({ title: 'Error saving workflow', description: error.message, variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    };
 
   const handleToggleStage = (stageKey: string, enabled: boolean) => {
     setWorkflowData(prev => ({
       ...prev,
       stages: {
         ...prev.stages,
         [stageKey]: { ...prev.stages[stageKey as keyof typeof prev.stages], enabled },
       },
     }));
   };
 
   const handleToggleOption = (stageKey: 'integrations' | 'ai', option: string) => {
     setWorkflowData(prev => {
       const stage = prev.stages[stageKey];
       if (!stage) return prev;
       
       const selectedOptions = stage.selectedOptions.includes(option)
         ? stage.selectedOptions.filter(o => o !== option)
         : [...stage.selectedOptions, option];
       
       return {
         ...prev,
         stages: {
           ...prev.stages,
           [stageKey]: { ...stage, selectedOptions, enabled: selectedOptions.length > 0 },
         },
       };
     });
   };
 
   const handleStepProgress = (stageKey: string, stepIndex: number, optionKey?: string) => {
     setWorkflowData(prev => {
       const newData = { ...prev };
       
       if (stageKey === 'frontend' || stageKey === 'backend') {
         const stage = newData.stages[stageKey];
         if (stage) {
           stage.currentStep = stepIndex + 1;
         }
       } else if ((stageKey === 'integrations' || stageKey === 'ai') && optionKey) {
         const stage = newData.stages[stageKey];
         if (stage) {
           stage.progress[optionKey] = stepIndex + 1;
         }
       }
       
       return newData;
     });
   };
 
   const handleSaveConfiguration = async () => {
     const configuredData = { ...workflowData, configured: true };
     setWorkflowData(configuredData);
     await saveWorkflow(configuredData);
     setIsConfiguring(false);
   };
 
   const handleSaveProgress = () => {
     saveWorkflow(workflowData);
   };
 
   const toggleExpand = (key: string) => {
     setExpandedStages(prev => ({ ...prev, [key]: !prev[key] }));
   };
 
   const progress = calculateProgress();
 
   // Configuration mode
   if (!workflowData.configured || isConfiguring) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="text-lg flex items-center gap-2">
             <Settings2 className="h-5 w-5" />
             Configure Workflow
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           <p className="text-sm text-muted-foreground">
             Select which stages apply to this project. Progress will be calculated based on your selections.
           </p>
 
           {/* Stage 1: Front End */}
           <div className="space-y-2">
             <div className="flex items-center gap-3">
               <Checkbox
                 id="frontend"
                 checked={workflowData.stages.frontend?.enabled}
                 onCheckedChange={(checked) => handleToggleStage('frontend', !!checked)}
               />
               <label htmlFor="frontend" className="flex items-center gap-2 font-medium cursor-pointer">
                 <Monitor className="h-4 w-4 text-blue-500" />
                 Stage 1: Front End
               </label>
             </div>
             {workflowData.stages.frontend?.enabled && (
               <p className="text-xs text-muted-foreground ml-7">
                 Steps: {STAGE_DEFINITIONS.frontend.steps.join(' → ')}
               </p>
             )}
           </div>
 
           {/* Stage 2: Back End */}
           <div className="space-y-2">
             <div className="flex items-center gap-3">
               <Checkbox
                 id="backend"
                 checked={workflowData.stages.backend?.enabled}
                 onCheckedChange={(checked) => handleToggleStage('backend', !!checked)}
               />
               <label htmlFor="backend" className="flex items-center gap-2 font-medium cursor-pointer">
                 <Server className="h-4 w-4 text-green-500" />
                 Stage 2: Back End
               </label>
             </div>
             {workflowData.stages.backend?.enabled && (
               <p className="text-xs text-muted-foreground ml-7">
                 Steps: {STAGE_DEFINITIONS.backend.steps.join(' → ')}
               </p>
             )}
           </div>
 
           {/* Stage 3: CRM Setup */}
           <div className="space-y-2">
             <div className="flex items-center gap-3">
               <Checkbox
                 id="crm_setup"
                 checked={workflowData.stages.crm_setup?.enabled}
                 onCheckedChange={(checked) => handleToggleStage('crm_setup', !!checked)}
               />
               <label htmlFor="crm_setup" className="flex items-center gap-2 font-medium cursor-pointer">
                 <Database className="h-4 w-4 text-primary" />
                 Stage 3: CRM Setup
               </label>
             </div>
             {workflowData.stages.crm_setup?.enabled && (
               <p className="text-xs text-muted-foreground ml-7">
                 Steps: {STAGE_DEFINITIONS.crm_setup.steps.join(' → ')}
               </p>
             )}
           </div>
 
           {/* Stage 4: Email Automation */}
           <div className="space-y-2">
             <div className="flex items-center gap-3">
               <Checkbox
                 id="email_automation"
                 checked={workflowData.stages.email_automation?.enabled}
                 onCheckedChange={(checked) => handleToggleStage('email_automation', !!checked)}
               />
               <label htmlFor="email_automation" className="flex items-center gap-2 font-medium cursor-pointer">
                 <Mail className="h-4 w-4 text-primary" />
                 Stage 4: Email Automation
               </label>
             </div>
             {workflowData.stages.email_automation?.enabled && (
               <p className="text-xs text-muted-foreground ml-7">
                 Steps: {STAGE_DEFINITIONS.email_automation.steps.join(' → ')}
               </p>
             )}
           </div>

           {/* Stage 5: Integrations */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 font-medium">
               <Plug className="h-4 w-4 text-primary" />
               Stage 5: Integrations
             </div>
             <div className="ml-6 space-y-2">
               <p className="text-xs text-muted-foreground">Select all that apply:</p>
               <div className="flex flex-wrap gap-3">
                 {STAGE_DEFINITIONS.integrations.options.map(option => (
                   <div key={option} className="flex items-center gap-2">
                     <Checkbox
                       id={`integration-${option}`}
                       checked={workflowData.stages.integrations?.selectedOptions.includes(option)}
                       onCheckedChange={() => handleToggleOption('integrations', option)}
                     />
                     <label htmlFor={`integration-${option}`} className="text-sm cursor-pointer">
                       {option}
                     </label>
                   </div>
                 ))}
               </div>
               {(workflowData.stages.integrations?.selectedOptions.length ?? 0) > 0 && (
                 <p className="text-xs text-muted-foreground">
                   Each: {STAGE_DEFINITIONS.integrations.stepsPerOption.join(' → ')}
                 </p>
               )}
             </div>
           </div>
 
           {/* Stage 4: AI Automations */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 font-medium">
               <Bot className="h-4 w-4 text-primary" />
               Stage 6: AI Automations
             </div>
             <div className="ml-6 space-y-2">
               <p className="text-xs text-muted-foreground">Select all that apply:</p>
               <div className="flex flex-wrap gap-3">
                 {STAGE_DEFINITIONS.ai.options.map(option => (
                   <div key={option} className="flex items-center gap-2">
                     <Checkbox
                       id={`ai-${option}`}
                       checked={workflowData.stages.ai?.selectedOptions.includes(option)}
                       onCheckedChange={() => handleToggleOption('ai', option)}
                     />
                     <label htmlFor={`ai-${option}`} className="text-sm cursor-pointer">
                       {option}
                     </label>
                   </div>
                 ))}
               </div>
               {(workflowData.stages.ai?.selectedOptions.length ?? 0) > 0 && (
                 <p className="text-xs text-muted-foreground">
                   Each: {STAGE_DEFINITIONS.ai.stepsPerOption.join(' → ')}
                 </p>
               )}
             </div>
           </div>
 
           <div className="flex gap-2 pt-4">
             <Button onClick={handleSaveConfiguration} disabled={isSaving}>
               {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
               Save & Start Workflow
             </Button>
             {workflowData.configured && (
               <Button variant="outline" onClick={() => setIsConfiguring(false)}>
                 Cancel
               </Button>
             )}
           </div>
         </CardContent>
       </Card>
     );
   }
 
   // Progress tracking mode
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="text-lg flex items-center gap-2">
             <Settings2 className="h-5 w-5" />
             Project Workflow
           </CardTitle>
           <div className="flex items-center gap-2">
             <Badge variant="secondary" className="text-sm">
               {progress}% Complete
             </Badge>
             {canEdit && (
               <Button variant="ghost" size="sm" onClick={() => setIsConfiguring(true)}>
                 <Settings2 className="h-4 w-4" />
               </Button>
             )}
           </div>
         </div>
         <Progress value={progress} className="mt-3" />
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Frontend */}
         {workflowData.stages.frontend?.enabled && (
           <>
             <StageProgress
               title="Customer-Facing Website"
               icon={<Monitor className="h-4 w-4 text-primary" />}
               steps={STAGE_DEFINITIONS.frontend.steps}
               currentStep={workflowData.stages.frontend.currentStep}
               onStepClick={canEdit ? (idx) => handleStepProgress('frontend', idx) : undefined}
               expanded={expandedStages.frontend}
               onToggle={() => toggleExpand('frontend')}
               reviewRequested={workflowData.review_requested?.frontend}
               stageNote={workflowData.stage_notes?.frontend}
             />
           </>
         )}

         {/* Backend */}
         {workflowData.stages.backend?.enabled && (
           <StageProgress
             title="Back End"
             icon={<Server className="h-4 w-4 text-primary" />}
             steps={STAGE_DEFINITIONS.backend.steps}
             currentStep={workflowData.stages.backend.currentStep}
             onStepClick={canEdit ? (idx) => handleStepProgress('backend', idx) : undefined}
             expanded={expandedStages.backend}
             onToggle={() => toggleExpand('backend')}
             reviewRequested={workflowData.review_requested?.backend}
             stageNote={workflowData.stage_notes?.backend}
           />
         )}

         {/* CRM Setup */}
         {workflowData.stages.crm_setup?.enabled && (
           <StageProgress
             title="CRM Setup"
             icon={<Database className="h-4 w-4 text-primary" />}
             steps={STAGE_DEFINITIONS.crm_setup.steps}
             currentStep={workflowData.stages.crm_setup.currentStep}
             onStepClick={canEdit ? (idx) => handleStepProgress('crm_setup', idx) : undefined}
             expanded={expandedStages.crm_setup}
             onToggle={() => toggleExpand('crm_setup')}
             reviewRequested={workflowData.review_requested?.crm_setup}
             stageNote={workflowData.stage_notes?.crm_setup}
           />
         )}

         {/* Email Automation */}
         {workflowData.stages.email_automation?.enabled && (
           <StageProgress
             title="Email Automation"
             icon={<Mail className="h-4 w-4 text-primary" />}
             steps={STAGE_DEFINITIONS.email_automation.steps}
             currentStep={workflowData.stages.email_automation.currentStep}
             onStepClick={canEdit ? (idx) => handleStepProgress('email_automation', idx) : undefined}
             expanded={expandedStages.email_automation}
             onToggle={() => toggleExpand('email_automation')}
             reviewRequested={workflowData.review_requested?.email_automation}
             stageNote={workflowData.stage_notes?.email_automation}
           />
         )}
 
         {/* Integrations */}
         {workflowData.stages.integrations?.enabled && workflowData.stages.integrations.selectedOptions.length > 0 && (
           <Collapsible open={expandedStages.integrations} onOpenChange={() => toggleExpand('integrations')}>
             <CollapsibleTrigger className="w-full">
               <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                 <div className="flex items-center gap-2">
                   <Plug className="h-4 w-4 text-purple-500" />
                   <span className="font-medium text-sm">Integrations</span>
                   <Badge variant="outline" className="text-xs">
                     {workflowData.stages.integrations.selectedOptions.length} items
                   </Badge>
                 </div>
                 {expandedStages.integrations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </div>
             </CollapsibleTrigger>
             <CollapsibleContent className="space-y-2 mt-2">
               {workflowData.stages.integrations.selectedOptions.map(option => (
                 <div key={option} className="ml-4">
                   <p className="text-xs text-muted-foreground mb-1">{option}</p>
                   <StepIndicator
                     steps={STAGE_DEFINITIONS.integrations.stepsPerOption}
                     currentStep={workflowData.stages.integrations?.progress[option] || 0}
                     onStepClick={canEdit ? (idx) => handleStepProgress('integrations', idx, option) : undefined}
                   />
                 </div>
               ))}
             </CollapsibleContent>
           </Collapsible>
         )}
 
         {/* AI */}
         {workflowData.stages.ai?.enabled && workflowData.stages.ai.selectedOptions.length > 0 && (
           <Collapsible open={expandedStages.ai} onOpenChange={() => toggleExpand('ai')}>
             <CollapsibleTrigger className="w-full">
               <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                 <div className="flex items-center gap-2">
                   <Bot className="h-4 w-4 text-orange-500" />
                   <span className="font-medium text-sm">AI Automations</span>
                   <Badge variant="outline" className="text-xs">
                     {workflowData.stages.ai.selectedOptions.length} items
                   </Badge>
                 </div>
                 {expandedStages.ai ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </div>
             </CollapsibleTrigger>
             <CollapsibleContent className="space-y-2 mt-2">
               {workflowData.stages.ai.selectedOptions.map(option => (
                 <div key={option} className="ml-4">
                   <p className="text-xs text-muted-foreground mb-1">{option}</p>
                   <StepIndicator
                     steps={STAGE_DEFINITIONS.ai.stepsPerOption}
                     currentStep={workflowData.stages.ai?.progress[option] || 0}
                     onStepClick={canEdit ? (idx) => handleStepProgress('ai', idx, option) : undefined}
                   />
                 </div>
               ))}
             </CollapsibleContent>
           </Collapsible>
         )}
 
         {canEdit && (
           <Button onClick={handleSaveProgress} disabled={isSaving} className="w-full mt-4">
             {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
             Save Progress
           </Button>
         )}
       </CardContent>
     </Card>
   );
 }
 
 // Helper component for stage progress
 function StageProgress({ 
   title, 
   icon, 
   steps, 
   currentStep, 
   onStepClick,
   expanded,
   onToggle,
   reviewRequested,
   stageNote
 }: {
   title: string;
   icon: React.ReactNode;
   steps: string[];
   currentStep: number;
   onStepClick?: (idx: number) => void;
   expanded?: boolean;
   onToggle?: () => void;
   reviewRequested?: boolean;
   stageNote?: string;
 }) {
   return (
     <Collapsible open={expanded} onOpenChange={onToggle}>
       <CollapsibleTrigger className="w-full">
         <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
           <div className="flex items-center gap-2">
             {icon}
             <span className="font-medium text-sm">{title}</span>
             <Badge variant={currentStep >= steps.length ? "default" : "outline"} className="text-xs">
               {currentStep}/{steps.length}
             </Badge>
             {reviewRequested && (
               <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400">
                 <Eye className="h-3 w-3 mr-1" /> Review
               </Badge>
             )}
           </div>
           {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
         </div>
       </CollapsibleTrigger>
       <CollapsibleContent className="mt-2 space-y-2">
         <StepIndicator steps={steps} currentStep={currentStep} onStepClick={onStepClick} />
         {stageNote && (
           <div className="mx-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
             <span className="font-medium">Dev Notes:</span> {stageNote}
           </div>
         )}
       </CollapsibleContent>
     </Collapsible>
   );
 }
 
 // Helper component for step indicators
 function StepIndicator({ 
   steps, 
   currentStep, 
   onStepClick 
 }: { 
   steps: string[]; 
   currentStep: number; 
   onStepClick?: (idx: number) => void;
 }) {
   return (
     <div className="flex flex-wrap gap-2 p-2">
       {steps.map((step, idx) => {
         const isComplete = idx < currentStep;
         const isCurrent = idx === currentStep;
         
         return (
           <button
             key={step}
             onClick={() => onStepClick?.(idx)}
             disabled={!onStepClick}
             className={`
               flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors
               ${isComplete ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''}
               ${isCurrent ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/50' : ''}
               ${!isComplete && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
               ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
             `}
           >
             {isComplete && <Check className="h-3 w-3" />}
             {step}
           </button>
         );
       })}
     </div>
   );
 }