 import { useState } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Slider } from '@/components/ui/slider';
 import { ChevronDown, Plus, Trash2 } from 'lucide-react';
 import { QuantitySelector } from '../QuantitySelector';
 import { WorkflowCheckbox } from '../WorkflowCheckbox';
 import { WorkflowProgress } from '../WorkflowProgress';
 import { cn } from '@/lib/utils';
 
 interface ConversationFlow {
   id: string;
   name: string;
   built: boolean;
   tested: boolean;
   live: boolean;
 }
 
 interface PersonalizationRule {
   id: string;
   name: string;
   segment: string;
   configured: boolean;
   tested: boolean;
   live: boolean;
 }
 
 export function AIIntegrationsStage() {
   const [openSections, setOpenSections] = useState<string[]>([]);
   
   // AI Chatbot
   const [aiChatbot, setAiChatbot] = useState(false);
   const [chatbotPlatform, setChatbotPlatform] = useState('');
   const [chatbotPersonality, setChatbotPersonality] = useState([50]);
   const [trainingProgress, setTrainingProgress] = useState(0);
   const [conversationFlows, setConversationFlows] = useState<ConversationFlow[]>([]);
   
   // AI Email
   const [aiEmail, setAiEmail] = useState(false);
   
   // AI Content
   const [aiContent, setAiContent] = useState(false);
   const [contentTools, setContentTools] = useState({
     productDescriptions: false,
     blogArticles: false,
     metaDescriptions: false,
     socialMedia: false,
   });
   
   // AI Search
   const [aiSearch, setAiSearch] = useState(false);
   
   // AI Personalization
   const [aiPersonalization, setAiPersonalization] = useState(false);
   const [personalizationRules, setPersonalizationRules] = useState<PersonalizationRule[]>([]);
 
   const toggleSection = (section: string) => {
     setOpenSections(prev => 
       prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
     );
   };
 
   const addConversationFlow = () => {
     setConversationFlows([...conversationFlows, {
       id: crypto.randomUUID(),
       name: '',
       built: false,
       tested: false,
       live: false,
     }]);
   };
 
   const removeConversationFlow = (id: string) => {
     setConversationFlows(conversationFlows.filter(f => f.id !== id));
   };
 
   const addPersonalizationRule = () => {
     setPersonalizationRules([...personalizationRules, {
       id: crypto.randomUUID(),
       name: '',
       segment: 'new',
       configured: false,
       tested: false,
       live: false,
     }]);
   };
 
   const removePersonalizationRule = (id: string) => {
     setPersonalizationRules(personalizationRules.filter(r => r.id !== id));
   };
 
   const sections = [
     { id: 'chatbot', label: 'AI Chatbot' },
     { id: 'email', label: 'AI Email System' },
     { id: 'content', label: 'AI Content Tools' },
     { id: 'search', label: 'AI Search' },
     { id: 'personalization', label: 'AI Personalization', count: personalizationRules.length },
   ];
 
   return (
     <div className="space-y-3">
       {sections.map((section) => (
         <Collapsible
           key={section.id}
           open={openSections.includes(section.id)}
           onOpenChange={() => toggleSection(section.id)}
         >
           <CollapsibleTrigger asChild>
             <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
               <CardContent className="py-3 px-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <span className="font-medium text-sm">{section.label}</span>
                   {section.count !== undefined && (
                     <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                       {section.count}
                     </span>
                   )}
                 </div>
                 <ChevronDown className={cn(
                   'h-4 w-4 text-muted-foreground transition-transform',
                   openSections.includes(section.id) && 'rotate-180'
                 )} />
               </CardContent>
             </Card>
           </CollapsibleTrigger>
           <CollapsibleContent className="mt-2">
             <Card>
               <CardContent className="py-4 space-y-4">
                 {section.id === 'chatbot' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">AI Chatbot</span>
                       <Switch checked={aiChatbot} onCheckedChange={setAiChatbot} />
                     </div>
                     {aiChatbot && (
                       <div className="space-y-4 pl-4 border-l-2 border-muted">
                         <Select value={chatbotPlatform} onValueChange={setChatbotPlatform}>
                           <SelectTrigger>
                             <SelectValue placeholder="Select AI Platform" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="openai">OpenAI</SelectItem>
                             <SelectItem value="anthropic">Anthropic</SelectItem>
                             <SelectItem value="custom">Custom</SelectItem>
                             <SelectItem value="other">Other</SelectItem>
                           </SelectContent>
                         </Select>
                         
                         <Input placeholder="Bot Name" />
                         
                         <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                             <span>Personality</span>
                             <span className="text-muted-foreground">
                               {chatbotPersonality[0] < 30 ? 'Formal' : chatbotPersonality[0] > 70 ? 'Casual' : 'Balanced'}
                             </span>
                           </div>
                           <Slider
                             value={chatbotPersonality}
                             onValueChange={setChatbotPersonality}
                             max={100}
                             step={1}
                           />
                           <div className="flex justify-between text-xs text-muted-foreground">
                             <span>Formal</span>
                             <span>Casual</span>
                           </div>
                         </div>
 
                         <div className="space-y-2">
                           <h5 className="text-sm font-medium">Training Progress</h5>
                           <WorkflowProgress value={trainingProgress} />
                         </div>
 
                         <div className="space-y-3">
                           <div className="flex items-center justify-between">
                             <h5 className="text-sm font-medium">Conversation Flows</h5>
                             <Button variant="outline" size="sm" onClick={addConversationFlow}>
                               <Plus className="h-4 w-4 mr-1" />
                               Add Flow
                             </Button>
                           </div>
                           {conversationFlows.map((flow, index) => (
                             <Card key={flow.id} className="bg-muted/30">
                               <CardContent className="py-3 space-y-3">
                                 <div className="flex items-center gap-2">
                                   <Input
                                     value={flow.name}
                                     onChange={(e) => {
                                       const updated = [...conversationFlows];
                                       updated[index].name = e.target.value;
                                       setConversationFlows(updated);
                                     }}
                                     placeholder="Flow Name"
                                     className="flex-1"
                                   />
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 text-destructive"
                                     onClick={() => removeConversationFlow(flow.id)}
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </div>
                                 <div className="flex flex-wrap gap-4">
                                   <WorkflowCheckbox
                                     id={`${flow.id}-built`}
                                     label="Built"
                                     checked={flow.built}
                                     onCheckedChange={(checked) => {
                                       const updated = [...conversationFlows];
                                       updated[index].built = checked as boolean;
                                       setConversationFlows(updated);
                                     }}
                                   />
                                   <WorkflowCheckbox
                                     id={`${flow.id}-tested`}
                                     label="Tested"
                                     checked={flow.tested}
                                     onCheckedChange={(checked) => {
                                       const updated = [...conversationFlows];
                                       updated[index].tested = checked as boolean;
                                       setConversationFlows(updated);
                                     }}
                                   />
                                   <WorkflowCheckbox
                                     id={`${flow.id}-live`}
                                     label="Live"
                                     checked={flow.live}
                                     onCheckedChange={(checked) => {
                                       const updated = [...conversationFlows];
                                       updated[index].live = checked as boolean;
                                       setConversationFlows(updated);
                                     }}
                                   />
                                 </div>
                               </CardContent>
                             </Card>
                           ))}
                         </div>
 
                         <div className="space-y-2 pt-2">
                           <WorkflowCheckbox id="chatbot-testing" label="Testing Complete" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="chatbot-approved" label="Client Approved" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="chatbot-live" label="Live" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'email' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">AI Email Automation</span>
                       <Switch checked={aiEmail} onCheckedChange={setAiEmail} />
                     </div>
                     {aiEmail && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <Select>
                           <SelectTrigger>
                             <SelectValue placeholder="AI Platform" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="openai">OpenAI</SelectItem>
                             <SelectItem value="claude">Claude</SelectItem>
                             <SelectItem value="custom">Custom</SelectItem>
                           </SelectContent>
                         </Select>
                         <div className="space-y-2">
                           <WorkflowCheckbox id="ai-email-setup" label="AI Email Setup Complete" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="ai-email-personalization" label="Personalization Configured" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="ai-email-tested" label="Testing Complete" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="ai-email-live" label="Live" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'content' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">AI Content Generation</span>
                       <Switch checked={aiContent} onCheckedChange={setAiContent} />
                     </div>
                     {aiContent && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <WorkflowCheckbox
                           id="ai-product-desc"
                           label="Product Description AI"
                           checked={contentTools.productDescriptions}
                           onCheckedChange={(checked) => setContentTools(prev => ({ ...prev, productDescriptions: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="ai-blog"
                           label="Blog/Article AI Tools"
                           checked={contentTools.blogArticles}
                           onCheckedChange={(checked) => setContentTools(prev => ({ ...prev, blogArticles: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="ai-meta"
                           label="Meta Description Generator"
                           checked={contentTools.metaDescriptions}
                           onCheckedChange={(checked) => setContentTools(prev => ({ ...prev, metaDescriptions: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="ai-social"
                           label="Social Media AI"
                           checked={contentTools.socialMedia}
                           onCheckedChange={(checked) => setContentTools(prev => ({ ...prev, socialMedia: checked as boolean }))}
                         />
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'search' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">AI-Powered Search</span>
                       <Switch checked={aiSearch} onCheckedChange={setAiSearch} />
                     </div>
                     {aiSearch && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <WorkflowCheckbox id="ai-nlp-search" label="Natural Language Search" checked={false} onCheckedChange={() => {}} />
                         <WorkflowCheckbox id="ai-recommendations" label="Smart Recommendations Engine" checked={false} onCheckedChange={() => {}} />
                         <WorkflowCheckbox id="ai-visual-search" label="Visual Search" checked={false} onCheckedChange={() => {}} />
                         <Button variant="outline" size="sm" className="mt-2">
                           Test Search Function
                         </Button>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'personalization' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">AI Personalization</span>
                       <Switch checked={aiPersonalization} onCheckedChange={setAiPersonalization} />
                     </div>
                     {aiPersonalization && (
                       <div className="space-y-4 pl-4 border-l-2 border-muted">
                         <div className="space-y-2">
                           <h5 className="text-sm font-medium">Tracking Setup</h5>
                           <WorkflowCheckbox id="ai-behavior-tracking" label="User Behavior Tracking Active" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="ai-gdpr" label="Data Collection Compliant (GDPR/Privacy)" checked={false} onCheckedChange={() => {}} />
                         </div>
 
                         <div className="space-y-3">
                           <div className="flex items-center justify-between">
                             <h5 className="text-sm font-medium">Personalization Rules</h5>
                             <Button variant="outline" size="sm" onClick={addPersonalizationRule}>
                               <Plus className="h-4 w-4 mr-1" />
                               Add Rule
                             </Button>
                           </div>
                           {personalizationRules.map((rule, index) => (
                             <Card key={rule.id} className="bg-muted/30">
                               <CardContent className="py-3 space-y-3">
                                 <div className="flex items-center gap-2">
                                   <Input
                                     value={rule.name}
                                     onChange={(e) => {
                                       const updated = [...personalizationRules];
                                       updated[index].name = e.target.value;
                                       setPersonalizationRules(updated);
                                     }}
                                     placeholder="Rule Name"
                                     className="flex-1"
                                   />
                                   <Select
                                     value={rule.segment}
                                     onValueChange={(value) => {
                                       const updated = [...personalizationRules];
                                       updated[index].segment = value;
                                       setPersonalizationRules(updated);
                                     }}
                                   >
                                     <SelectTrigger className="w-[120px]">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="new">New</SelectItem>
                                       <SelectItem value="returning">Returning</SelectItem>
                                       <SelectItem value="vip">VIP</SelectItem>
                                       <SelectItem value="custom">Custom</SelectItem>
                                     </SelectContent>
                                   </Select>
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 text-destructive"
                                     onClick={() => removePersonalizationRule(rule.id)}
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </div>
                                 <div className="flex flex-wrap gap-4">
                                   <WorkflowCheckbox
                                     id={`${rule.id}-configured`}
                                     label="Configured"
                                     checked={rule.configured}
                                     onCheckedChange={(checked) => {
                                       const updated = [...personalizationRules];
                                       updated[index].configured = checked as boolean;
                                       setPersonalizationRules(updated);
                                     }}
                                   />
                                   <WorkflowCheckbox
                                     id={`${rule.id}-tested`}
                                     label="Tested"
                                     checked={rule.tested}
                                     onCheckedChange={(checked) => {
                                       const updated = [...personalizationRules];
                                       updated[index].tested = checked as boolean;
                                       setPersonalizationRules(updated);
                                     }}
                                   />
                                   <WorkflowCheckbox
                                     id={`${rule.id}-live`}
                                     label="Live"
                                     checked={rule.live}
                                     onCheckedChange={(checked) => {
                                       const updated = [...personalizationRules];
                                       updated[index].live = checked as boolean;
                                       setPersonalizationRules(updated);
                                     }}
                                   />
                                 </div>
                               </CardContent>
                             </Card>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </CardContent>
             </Card>
           </CollapsibleContent>
         </Collapsible>
       ))}
     </div>
   );
 }