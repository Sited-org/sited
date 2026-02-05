 import { useState } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { ChevronDown, Plus, Trash2, Rocket } from 'lucide-react';
 import { WorkflowCheckbox } from '../WorkflowCheckbox';
 import { StatusIndicator } from '../StatusIndicator';
 import { cn } from '@/lib/utils';
 
 interface Issue {
   id: string;
   description: string;
   severity: string;
   status: string;
 }
 
 interface FeedbackItem {
   id: string;
   feedback: string;
   priority: string;
   implemented: boolean;
   reApproved: boolean;
 }
 
 interface TrainingSession {
   id: string;
   topic: string;
   format: string;
   completed: boolean;
 }
 
 export function TestingLaunchStage() {
   const [openSections, setOpenSections] = useState<string[]>([]);
   
   // QA Testing
   const [testMatrix, setTestMatrix] = useState({
     functionality: 'not_started',
     crossBrowser: 'not_started',
     mobile: 'not_started',
     forms: 'not_started',
     load: 'not_started',
     security: 'not_started',
   });
   const [issues, setIssues] = useState<Issue[]>([]);
   
   // Client Review
   const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
   const [clientApproval, setClientApproval] = useState(false);
   
   // Launch Checklist
   const [launchChecklist, setLaunchChecklist] = useState({
     domainConfigured: false,
     sslInstalled: false,
     backupCreated: false,
     analyticsConfirmed: false,
     redirectsSetup: false,
   });
   const [isLaunched, setIsLaunched] = useState(false);
   
   // Post-Launch
   const [postLaunch, setPostLaunch] = useState({
     check24h: false,
     check48h: false,
   });
   
   // Training
   const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
   const [documentation, setDocumentation] = useState({
     adminGuide: false,
     contentGuide: false,
     technicalDocs: false,
     brandGuidelines: false,
   });
 
   const toggleSection = (section: string) => {
     setOpenSections(prev => 
       prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
     );
   };
 
   const addIssue = () => {
     setIssues([...issues, {
       id: crypto.randomUUID(),
       description: '',
       severity: 'medium',
       status: 'open',
     }]);
   };
 
   const removeIssue = (id: string) => {
     setIssues(issues.filter(i => i.id !== id));
   };
 
   const addFeedback = () => {
     setFeedbackItems([...feedbackItems, {
       id: crypto.randomUUID(),
       feedback: '',
       priority: 'must_fix',
       implemented: false,
       reApproved: false,
     }]);
   };
 
   const removeFeedback = (id: string) => {
     setFeedbackItems(feedbackItems.filter(f => f.id !== id));
   };
 
   const addTrainingSession = () => {
     setTrainingSessions([...trainingSessions, {
       id: crypto.randomUUID(),
       topic: '',
       format: 'video_call',
       completed: false,
     }]);
   };
 
   const removeTrainingSession = (id: string) => {
     setTrainingSessions(trainingSessions.filter(s => s.id !== id));
   };
 
   const openIssuesCount = issues.filter(i => i.status === 'open').length;
 
   const sections = [
     { id: 'qa', label: 'Quality Assurance Testing', badge: openIssuesCount > 0 ? openIssuesCount : undefined },
     { id: 'review', label: 'Client Review', count: feedbackItems.length },
     { id: 'launch', label: 'Launch Checklist' },
     { id: 'postlaunch', label: 'Post-Launch Monitoring' },
     { id: 'training', label: 'Training & Handover', count: trainingSessions.length },
   ];
 
   const testTypes = [
     { key: 'functionality', label: 'Functionality' },
     { key: 'crossBrowser', label: 'Cross-Browser' },
     { key: 'mobile', label: 'Mobile' },
     { key: 'forms', label: 'Forms' },
     { key: 'load', label: 'Load' },
     { key: 'security', label: 'Security' },
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
                   {section.badge !== undefined && (
                     <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                       {section.badge} issues
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
                 {section.id === 'qa' && (
                   <div className="space-y-4">
                     <h5 className="text-sm font-medium">Test Matrix</h5>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {testTypes.map(({ key, label }) => (
                         <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                           <span className="text-sm">{label}</span>
                           <Select
                             value={testMatrix[key as keyof typeof testMatrix]}
                             onValueChange={(value) => setTestMatrix(prev => ({ ...prev, [key]: value }))}
                           >
                             <SelectTrigger className="w-[110px] h-8">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="not_started">Not Started</SelectItem>
                               <SelectItem value="in_progress">In Progress</SelectItem>
                               <SelectItem value="issues">Issues Found</SelectItem>
                               <SelectItem value="complete">Complete</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       ))}
                     </div>
 
                     <div className="space-y-3 pt-4">
                       <div className="flex items-center justify-between">
                         <h5 className="text-sm font-medium">Issues Tracker</h5>
                         <Button variant="outline" size="sm" onClick={addIssue}>
                           <Plus className="h-4 w-4 mr-1" />
                           Add Issue
                         </Button>
                       </div>
                       {issues.map((issue, index) => (
                         <Card key={issue.id} className="bg-muted/30">
                           <CardContent className="py-3 space-y-3">
                             <div className="flex items-start gap-2">
                               <Textarea
                                 value={issue.description}
                                 onChange={(e) => {
                                   const updated = [...issues];
                                   updated[index].description = e.target.value;
                                   setIssues(updated);
                                 }}
                                 placeholder="Issue Description"
                                 className="flex-1 min-h-[60px]"
                               />
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-8 w-8 text-destructive"
                                 onClick={() => removeIssue(issue.id)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                             <div className="flex gap-2">
                               <Select
                                 value={issue.severity}
                                 onValueChange={(value) => {
                                   const updated = [...issues];
                                   updated[index].severity = value;
                                   setIssues(updated);
                                 }}
                               >
                                 <SelectTrigger className="w-[100px]">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="low">Low</SelectItem>
                                   <SelectItem value="medium">Medium</SelectItem>
                                   <SelectItem value="high">High</SelectItem>
                                   <SelectItem value="critical">Critical</SelectItem>
                                 </SelectContent>
                               </Select>
                               <Select
                                 value={issue.status}
                                 onValueChange={(value) => {
                                   const updated = [...issues];
                                   updated[index].status = value;
                                   setIssues(updated);
                                 }}
                               >
                                 <SelectTrigger className="w-[110px]">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="open">Open</SelectItem>
                                   <SelectItem value="in_progress">In Progress</SelectItem>
                                   <SelectItem value="resolved">Resolved</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>
                           </CardContent>
                         </Card>
                       ))}
                     </div>
                   </div>
                 )}
 
                 {section.id === 'review' && (
                   <div className="space-y-4">
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <h5 className="text-sm font-medium">Client Feedback</h5>
                         <Button variant="outline" size="sm" onClick={addFeedback}>
                           <Plus className="h-4 w-4 mr-1" />
                           Add Feedback
                         </Button>
                       </div>
                       {feedbackItems.map((item, index) => (
                         <Card key={item.id} className="bg-muted/30">
                           <CardContent className="py-3 space-y-3">
                             <div className="flex items-start gap-2">
                               <Textarea
                                 value={item.feedback}
                                 onChange={(e) => {
                                   const updated = [...feedbackItems];
                                   updated[index].feedback = e.target.value;
                                   setFeedbackItems(updated);
                                 }}
                                 placeholder="Client Feedback"
                                 className="flex-1 min-h-[60px]"
                               />
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-8 w-8 text-destructive"
                                 onClick={() => removeFeedback(item.id)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                             <div className="flex items-center gap-4">
                               <Select
                                 value={item.priority}
                                 onValueChange={(value) => {
                                   const updated = [...feedbackItems];
                                   updated[index].priority = value;
                                   setFeedbackItems(updated);
                                 }}
                               >
                                 <SelectTrigger className="w-[120px]">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="must_fix">Must Fix</SelectItem>
                                   <SelectItem value="nice_to_have">Nice to Have</SelectItem>
                                   <SelectItem value="future">Future</SelectItem>
                                 </SelectContent>
                               </Select>
                               <WorkflowCheckbox
                                 id={`${item.id}-implemented`}
                                 label="Implemented"
                                 checked={item.implemented}
                                 onCheckedChange={(checked) => {
                                   const updated = [...feedbackItems];
                                   updated[index].implemented = checked as boolean;
                                   setFeedbackItems(updated);
                                 }}
                               />
                               <WorkflowCheckbox
                                 id={`${item.id}-approved`}
                                 label="Re-Approved"
                                 checked={item.reApproved}
                                 onCheckedChange={(checked) => {
                                   const updated = [...feedbackItems];
                                   updated[index].reApproved = checked as boolean;
                                   setFeedbackItems(updated);
                                 }}
                               />
                             </div>
                           </CardContent>
                         </Card>
                       ))}
                     </div>
 
                     <div className="pt-4 border-t">
                       <WorkflowCheckbox
                         id="client-final-approval"
                         label="Final Client Approval Received"
                         checked={clientApproval}
                         onCheckedChange={(checked) => setClientApproval(checked as boolean)}
                         className="text-base font-medium"
                       />
                     </div>
                   </div>
                 )}
 
                 {section.id === 'launch' && (
                   <div className="space-y-4">
                     <div className="space-y-3">
                       <div className="flex items-center gap-3">
                         <WorkflowCheckbox
                           id="domain-configured"
                           label="Domain Configured & Verified"
                           checked={launchChecklist.domainConfigured}
                           onCheckedChange={(checked) => setLaunchChecklist(prev => ({ ...prev, domainConfigured: checked as boolean }))}
                         />
                         <StatusIndicator status={launchChecklist.domainConfigured ? 'complete' : 'not_started'} />
                       </div>
                       <div className="flex items-center gap-3">
                         <WorkflowCheckbox
                           id="ssl-installed"
                           label="SSL Certificate Installed & Active"
                           checked={launchChecklist.sslInstalled}
                           onCheckedChange={(checked) => setLaunchChecklist(prev => ({ ...prev, sslInstalled: checked as boolean }))}
                         />
                         {launchChecklist.sslInstalled && <span className="text-sm">🔒 Secure</span>}
                       </div>
                       <WorkflowCheckbox
                         id="backup-created"
                         label="Final Backup Created"
                         checked={launchChecklist.backupCreated}
                         onCheckedChange={(checked) => setLaunchChecklist(prev => ({ ...prev, backupCreated: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="analytics-confirmed"
                         label="Analytics Confirmed Working"
                         checked={launchChecklist.analyticsConfirmed}
                         onCheckedChange={(checked) => setLaunchChecklist(prev => ({ ...prev, analyticsConfirmed: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="redirects-setup"
                         label="301 Redirects Setup"
                         checked={launchChecklist.redirectsSetup}
                         onCheckedChange={(checked) => setLaunchChecklist(prev => ({ ...prev, redirectsSetup: checked as boolean }))}
                       />
                     </div>
 
                     <div className="pt-4">
                       {!isLaunched ? (
                         <Button 
                           size="lg" 
                           className="w-full"
                           onClick={() => setIsLaunched(true)}
                         >
                           <Rocket className="h-5 w-5 mr-2" />
                           Launch Website
                         </Button>
                       ) : (
                         <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                           <span className="text-green-600 font-medium">✓ Site Live</span>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
 
                 {section.id === 'postlaunch' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                       <span className="text-sm">Uptime Status</span>
                       <div className="flex items-center gap-2">
                         <StatusIndicator status="complete" />
                         <span className="text-sm font-medium">Online</span>
                       </div>
                     </div>
                     <div className="space-y-3">
                       <WorkflowCheckbox
                         id="check-24h"
                         label="24-Hour Check Complete"
                         checked={postLaunch.check24h}
                         onCheckedChange={(checked) => setPostLaunch(prev => ({ ...prev, check24h: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="check-48h"
                         label="48-Hour Check Complete"
                         checked={postLaunch.check48h}
                         onCheckedChange={(checked) => setPostLaunch(prev => ({ ...prev, check48h: checked as boolean }))}
                       />
                     </div>
                   </div>
                 )}
 
                 {section.id === 'training' && (
                   <div className="space-y-4">
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <h5 className="text-sm font-medium">Training Sessions</h5>
                         <Button variant="outline" size="sm" onClick={addTrainingSession}>
                           <Plus className="h-4 w-4 mr-1" />
                           Add Session
                         </Button>
                       </div>
                       {trainingSessions.map((session, index) => (
                         <Card key={session.id} className="bg-muted/30">
                           <CardContent className="py-3 space-y-3">
                             <div className="flex items-center gap-2">
                               <Input
                                 value={session.topic}
                                 onChange={(e) => {
                                   const updated = [...trainingSessions];
                                   updated[index].topic = e.target.value;
                                   setTrainingSessions(updated);
                                 }}
                                 placeholder="Session Topic"
                                 className="flex-1"
                               />
                               <Select
                                 value={session.format}
                                 onValueChange={(value) => {
                                   const updated = [...trainingSessions];
                                   updated[index].format = value;
                                   setTrainingSessions(updated);
                                 }}
                               >
                                 <SelectTrigger className="w-[130px]">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="video_call">Video Call</SelectItem>
                                   <SelectItem value="in_person">In-Person</SelectItem>
                                   <SelectItem value="recorded">Recorded Video</SelectItem>
                                   <SelectItem value="docs">Documentation</SelectItem>
                                 </SelectContent>
                               </Select>
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-8 w-8 text-destructive"
                                 onClick={() => removeTrainingSession(session.id)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                             <WorkflowCheckbox
                               id={`${session.id}-completed`}
                               label="Completed"
                               checked={session.completed}
                               onCheckedChange={(checked) => {
                                 const updated = [...trainingSessions];
                                 updated[index].completed = checked as boolean;
                                 setTrainingSessions(updated);
                               }}
                             />
                           </CardContent>
                         </Card>
                       ))}
                     </div>
 
                     <div className="space-y-3 pt-4 border-t">
                       <h5 className="text-sm font-medium">Documentation</h5>
                       <WorkflowCheckbox
                         id="doc-admin"
                         label="Admin Guide Provided"
                         checked={documentation.adminGuide}
                         onCheckedChange={(checked) => setDocumentation(prev => ({ ...prev, adminGuide: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="doc-content"
                         label="Content Guide Provided"
                         checked={documentation.contentGuide}
                         onCheckedChange={(checked) => setDocumentation(prev => ({ ...prev, contentGuide: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="doc-technical"
                         label="Technical Documentation"
                         checked={documentation.technicalDocs}
                         onCheckedChange={(checked) => setDocumentation(prev => ({ ...prev, technicalDocs: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="doc-brand"
                         label="Brand Guidelines"
                         checked={documentation.brandGuidelines}
                         onCheckedChange={(checked) => setDocumentation(prev => ({ ...prev, brandGuidelines: checked as boolean }))}
                       />
                     </div>
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