 import { useState } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { ChevronDown, Plus, Trash2 } from 'lucide-react';
 import { QuantitySelector } from '../QuantitySelector';
 import { WorkflowCheckbox } from '../WorkflowCheckbox';
 import { WorkflowProgress } from '../WorkflowProgress';
 import { StatusIndicator } from '../StatusIndicator';
 import { cn } from '@/lib/utils';
 
 interface EmailItem {
   id: string;
   name: string;
   trigger: string;
   designed: boolean;
   built: boolean;
   triggerConfigured: boolean;
   tested: boolean;
   live: boolean;
 }
 
 export function BackEndStage() {
   const [openSections, setOpenSections] = useState<string[]>([]);
   
   // CRM
   const [crmRequired, setCrmRequired] = useState(false);
   const [crmPlatform, setCrmPlatform] = useState('');
   const [crmStatus, setCrmStatus] = useState<'not_started' | 'in_progress' | 'complete'>('not_started');
   
   // Products
   const [productSystem, setProductSystem] = useState(false);
   const [productCount, setProductCount] = useState(0);
   
   // Sales
   const [salesSystem, setSalesSystem] = useState(false);
   
   // Booking
   const [bookingSystem, setBookingSystem] = useState(false);
   
   // Emails
   const [emails, setEmails] = useState<EmailItem[]>([]);
   
   // User Management
   const [userAccounts, setUserAccounts] = useState(false);
   
   // Database
   const [databaseProgress, setDatabaseProgress] = useState({
     architectureDesigned: false,
     deployed: false,
     securityConfigured: false,
     backupActive: false,
     testingComplete: false,
   });
 
   const toggleSection = (section: string) => {
     setOpenSections(prev => 
       prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
     );
   };
 
   const handleEmailsQuantityChange = (quantity: number) => {
     if (quantity > emails.length) {
       const newEmails = [...emails];
       for (let i = emails.length; i < quantity; i++) {
         newEmails.push({
           id: crypto.randomUUID(),
           name: `Email ${i + 1}`,
           trigger: 'manual',
           designed: false,
           built: false,
           triggerConfigured: false,
           tested: false,
           live: false,
         });
       }
       setEmails(newEmails);
     } else {
       setEmails(emails.slice(0, quantity));
     }
   };
 
   const sections = [
     { id: 'crm', label: 'CRM Integration' },
     { id: 'products', label: 'Product Management' },
     { id: 'sales', label: 'Sales System' },
     { id: 'booking', label: 'Booking / Scheduling' },
     { id: 'emails', label: 'Email System', count: emails.length },
     { id: 'users', label: 'User Management' },
     { id: 'database', label: 'Database & Storage' },
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
                 {section.id === 'crm' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">CRM Required</span>
                       <Switch checked={crmRequired} onCheckedChange={setCrmRequired} />
                     </div>
                     {crmRequired && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <Select value={crmPlatform} onValueChange={setCrmPlatform}>
                           <SelectTrigger>
                             <SelectValue placeholder="Select CRM Platform" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="salesforce">Salesforce</SelectItem>
                             <SelectItem value="hubspot">HubSpot</SelectItem>
                             <SelectItem value="zoho">Zoho</SelectItem>
                             <SelectItem value="custom">Custom</SelectItem>
                             <SelectItem value="other">Other</SelectItem>
                           </SelectContent>
                         </Select>
                         <div className="flex items-center gap-2">
                           <StatusIndicator status={crmStatus} showLabel />
                         </div>
                         <div className="space-y-2">
                           <WorkflowCheckbox id="crm-setup" label="CRM Setup Complete" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="crm-sync" label="Data Sync Configured" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="crm-contacts" label="Contact Management Active" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="crm-testing" label="Testing Complete" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'products' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">Product System</span>
                       <Switch checked={productSystem} onCheckedChange={setProductSystem} />
                     </div>
                     {productSystem && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <QuantitySelector
                           value={productCount}
                           onChange={setProductCount}
                           max={1000}
                           label="Total Products"
                         />
                         <div className="space-y-2">
                           <WorkflowCheckbox id="prod-database" label="Product Database Built" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="prod-admin" label="Admin Interface Created" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="prod-inventory" label="Inventory System Setup" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="prod-categories" label="Categories Configured" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'sales' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">Sales System</span>
                       <Switch checked={salesSystem} onCheckedChange={setSalesSystem} />
                     </div>
                     {salesSystem && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <Select>
                           <SelectTrigger>
                             <SelectValue placeholder="Payment Gateway" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="stripe">Stripe</SelectItem>
                             <SelectItem value="paypal">PayPal</SelectItem>
                             <SelectItem value="square">Square</SelectItem>
                             <SelectItem value="other">Other</SelectItem>
                           </SelectContent>
                         </Select>
                         <div className="space-y-2">
                           <WorkflowCheckbox id="sales-order" label="Order Processing System" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="sales-gateway" label="Payment Gateway Backend" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="sales-dashboard" label="Sales Dashboard Built" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="sales-reporting" label="Reporting System Active" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'booking' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">Booking System</span>
                       <Switch checked={bookingSystem} onCheckedChange={setBookingSystem} />
                     </div>
                     {bookingSystem && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <Select>
                           <SelectTrigger>
                             <SelectValue placeholder="Booking Platform" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="calendly">Calendly</SelectItem>
                             <SelectItem value="acuity">Acuity</SelectItem>
                             <SelectItem value="custom">Custom</SelectItem>
                             <SelectItem value="other">Other</SelectItem>
                           </SelectContent>
                         </Select>
                         <div className="space-y-2">
                           <WorkflowCheckbox id="booking-calendar" label="Calendar System Integrated" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="booking-live" label="Appointment Booking Live" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="booking-confirmations" label="Automated Confirmations Setup" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="booking-cancel" label="Cancellation/Rescheduling Enabled" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'emails' && (
                   <>
                     <QuantitySelector
                       value={emails.length}
                       onChange={handleEmailsQuantityChange}
                       max={30}
                       label="Number of Email Types"
                     />
                     {emails.length > 0 && (
                       <div className="space-y-3 mt-4">
                         {emails.map((email, index) => (
                           <Card key={email.id} className="bg-muted/30">
                             <CardContent className="py-3 space-y-3">
                               <div className="flex items-center gap-2">
                                 <Input
                                   value={email.name}
                                   onChange={(e) => {
                                     const updated = [...emails];
                                     updated[index].name = e.target.value;
                                     setEmails(updated);
                                   }}
                                   placeholder="Email Name"
                                   className="flex-1"
                                 />
                                 <Select
                                   value={email.trigger}
                                   onValueChange={(value) => {
                                     const updated = [...emails];
                                     updated[index].trigger = value;
                                     setEmails(updated);
                                   }}
                                 >
                                   <SelectTrigger className="w-[140px]">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="manual">Manual</SelectItem>
                                     <SelectItem value="purchase">On Purchase</SelectItem>
                                     <SelectItem value="signup">On Signup</SelectItem>
                                     <SelectItem value="scheduled">Scheduled</SelectItem>
                                     <SelectItem value="custom">Custom</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div className="flex flex-wrap gap-4">
                                 <WorkflowCheckbox
                                   id={`${email.id}-designed`}
                                   label="Designed"
                                   checked={email.designed}
                                   onCheckedChange={(checked) => {
                                     const updated = [...emails];
                                     updated[index].designed = checked as boolean;
                                     setEmails(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${email.id}-built`}
                                   label="Built"
                                   checked={email.built}
                                   onCheckedChange={(checked) => {
                                     const updated = [...emails];
                                     updated[index].built = checked as boolean;
                                     setEmails(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${email.id}-tested`}
                                   label="Tested"
                                   checked={email.tested}
                                   onCheckedChange={(checked) => {
                                     const updated = [...emails];
                                     updated[index].tested = checked as boolean;
                                     setEmails(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${email.id}-live`}
                                   label="Live"
                                   checked={email.live}
                                   onCheckedChange={(checked) => {
                                     const updated = [...emails];
                                     updated[index].live = checked as boolean;
                                     setEmails(updated);
                                   }}
                                 />
                               </div>
                             </CardContent>
                           </Card>
                         ))}
                       </div>
                     )}
                   </>
                 )}
 
                 {section.id === 'users' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">User Accounts</span>
                       <Switch checked={userAccounts} onCheckedChange={setUserAccounts} />
                     </div>
                     {userAccounts && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <div className="space-y-2">
                           <WorkflowCheckbox id="user-login" label="Login System Built" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="user-register" label="Registration Page" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="user-dashboard" label="Account Dashboard" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="user-password" label="Password Reset Flow" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="user-verify" label="Email Verification" checked={false} onCheckedChange={() => {}} />
                         </div>
                         <h5 className="text-sm font-medium pt-2">Security</h5>
                         <div className="space-y-2">
                           <WorkflowCheckbox id="user-2fa" label="Two-Factor Authentication" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="user-session" label="Session Management" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="user-security-test" label="Security Testing Complete" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'database' && (
                   <div className="space-y-4">
                     <WorkflowProgress
                       value={Math.round(
                         (Object.values(databaseProgress).filter(Boolean).length / 5) * 100
                       )}
                       className="mb-4"
                     />
                     <div className="space-y-2">
                       <WorkflowCheckbox
                         id="db-architecture"
                         label="Database Architecture Designed"
                         checked={databaseProgress.architectureDesigned}
                         onCheckedChange={(checked) => setDatabaseProgress(prev => ({ ...prev, architectureDesigned: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="db-deployed"
                         label="Database Deployed"
                         checked={databaseProgress.deployed}
                         onCheckedChange={(checked) => setDatabaseProgress(prev => ({ ...prev, deployed: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="db-security"
                         label="Security Configured"
                         checked={databaseProgress.securityConfigured}
                         onCheckedChange={(checked) => setDatabaseProgress(prev => ({ ...prev, securityConfigured: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="db-backup"
                         label="Backup System Active"
                         checked={databaseProgress.backupActive}
                         onCheckedChange={(checked) => setDatabaseProgress(prev => ({ ...prev, backupActive: checked as boolean }))}
                       />
                       <WorkflowCheckbox
                         id="db-testing"
                         label="Testing Complete"
                         checked={databaseProgress.testingComplete}
                         onCheckedChange={(checked) => setDatabaseProgress(prev => ({ ...prev, testingComplete: checked as boolean }))}
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