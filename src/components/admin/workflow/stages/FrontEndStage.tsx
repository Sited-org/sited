 import { useState } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { ChevronDown, Plus, Trash2, GripVertical } from 'lucide-react';
 import { QuantitySelector } from '../QuantitySelector';
 import { WorkflowCheckbox } from '../WorkflowCheckbox';
 import { WorkflowProgress } from '../WorkflowProgress';
 import { cn } from '@/lib/utils';
 
 interface PageItem {
   id: string;
   name: string;
   type: string;
   designComplete: boolean;
   contentAdded: boolean;
   clientApproved: boolean;
 }
 
 interface FormItem {
   id: string;
   name: string;
   type: string;
   backendConnected: boolean;
   testingComplete: boolean;
   live: boolean;
 }
 
 interface InteractiveElement {
   id: string;
   type: string;
   description: string;
   designed: boolean;
   implemented: boolean;
   tested: boolean;
 }
 
 export function FrontEndStage() {
   const [openSections, setOpenSections] = useState<string[]>([]);
   
   // Pages state
   const [pages, setPages] = useState<PageItem[]>([]);
   
   // Forms state
   const [forms, setForms] = useState<FormItem[]>([]);
   
   // Navigation state
   const [headerNav, setHeaderNav] = useState(false);
   const [footer, setFooter] = useState(false);
   const [mobileMenu, setMobileMenu] = useState(false);
   
   // Interactive elements
   const [interactiveElements, setInteractiveElements] = useState<InteractiveElement[]>([]);
   
   // Checkout
   const [checkoutRequired, setCheckoutRequired] = useState(false);
   const [checkoutItems, setCheckoutItems] = useState({
     cartDesign: false,
     cartFunctionality: false,
     checkoutDesign: false,
     paymentGateway: false,
     orderConfirmation: false,
     emailConfirmations: false,
   });
   
   // Chat
   const [chatWidget, setChatWidget] = useState(false);
   
   // Responsive
   const [responsive, setResponsive] = useState({
     desktop: { designed: false, built: false, tested: false, approved: false },
     tablet: { designed: false, built: false, tested: false, approved: false },
     mobile: { designed: false, built: false, tested: false, approved: false },
   });
 
   const toggleSection = (section: string) => {
     setOpenSections(prev => 
       prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
     );
   };
 
   const handlePagesQuantityChange = (quantity: number) => {
     if (quantity > pages.length) {
       const newPages = [...pages];
       for (let i = pages.length; i < quantity; i++) {
         newPages.push({
           id: crypto.randomUUID(),
           name: `Page ${i + 1}`,
           type: 'standard',
           designComplete: false,
           contentAdded: false,
           clientApproved: false,
         });
       }
       setPages(newPages);
     } else {
       setPages(pages.slice(0, quantity));
     }
   };
 
   const handleFormsQuantityChange = (quantity: number) => {
     if (quantity > forms.length) {
       const newForms = [...forms];
       for (let i = forms.length; i < quantity; i++) {
         newForms.push({
           id: crypto.randomUUID(),
           name: `Form ${i + 1}`,
           type: 'contact',
           backendConnected: false,
           testingComplete: false,
           live: false,
         });
       }
       setForms(newForms);
     } else {
       setForms(forms.slice(0, quantity));
     }
   };
 
   const addInteractiveElement = () => {
     setInteractiveElements([...interactiveElements, {
       id: crypto.randomUUID(),
       type: 'gallery',
       description: '',
       designed: false,
       implemented: false,
       tested: false,
     }]);
   };
 
   const removeInteractiveElement = (id: string) => {
     setInteractiveElements(interactiveElements.filter(e => e.id !== id));
   };
 
   const sections = [
     { id: 'pages', label: 'Pages', count: pages.length },
     { id: 'forms', label: 'Forms', count: forms.length },
     { id: 'navigation', label: 'Navigation & Menu' },
     { id: 'interactive', label: 'Interactive Elements', count: interactiveElements.length },
     { id: 'checkout', label: 'Checkout System' },
     { id: 'chat', label: 'Chat Interface' },
     { id: 'responsive', label: 'Responsive Design' },
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
                 {section.id === 'pages' && (
                   <>
                     <QuantitySelector
                       value={pages.length}
                       onChange={handlePagesQuantityChange}
                       max={50}
                       label="Number of Pages"
                     />
                     {pages.length > 0 && (
                       <div className="space-y-3 mt-4">
                         {pages.map((page, index) => (
                           <Card key={page.id} className="bg-muted/30">
                             <CardContent className="py-3 space-y-3">
                               <div className="flex items-center gap-2">
                                 <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                 <Input
                                   value={page.name}
                                   onChange={(e) => {
                                     const updated = [...pages];
                                     updated[index].name = e.target.value;
                                     setPages(updated);
                                   }}
                                   placeholder="Page Name"
                                   className="flex-1"
                                 />
                                 <Select
                                   value={page.type}
                                   onValueChange={(value) => {
                                     const updated = [...pages];
                                     updated[index].type = value;
                                     setPages(updated);
                                   }}
                                 >
                                   <SelectTrigger className="w-[140px]">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="standard">Standard</SelectItem>
                                     <SelectItem value="landing">Landing Page</SelectItem>
                                     <SelectItem value="blog">Blog</SelectItem>
                                     <SelectItem value="portfolio">Portfolio</SelectItem>
                                     <SelectItem value="custom">Custom</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div className="flex flex-wrap gap-4">
                                 <WorkflowCheckbox
                                   id={`${page.id}-design`}
                                   label="Design Complete"
                                   checked={page.designComplete}
                                   onCheckedChange={(checked) => {
                                     const updated = [...pages];
                                     updated[index].designComplete = checked as boolean;
                                     setPages(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${page.id}-content`}
                                   label="Content Added"
                                   checked={page.contentAdded}
                                   onCheckedChange={(checked) => {
                                     const updated = [...pages];
                                     updated[index].contentAdded = checked as boolean;
                                     setPages(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${page.id}-approved`}
                                   label="Client Approved"
                                   checked={page.clientApproved}
                                   onCheckedChange={(checked) => {
                                     const updated = [...pages];
                                     updated[index].clientApproved = checked as boolean;
                                     setPages(updated);
                                   }}
                                 />
                               </div>
                               <WorkflowProgress
                                 value={Math.round(
                                   ((page.designComplete ? 1 : 0) + (page.contentAdded ? 1 : 0) + (page.clientApproved ? 1 : 0)) / 3 * 100
                                 )}
                                 size="sm"
                               />
                             </CardContent>
                           </Card>
                         ))}
                       </div>
                     )}
                   </>
                 )}
 
                 {section.id === 'forms' && (
                   <>
                     <QuantitySelector
                       value={forms.length}
                       onChange={handleFormsQuantityChange}
                       max={20}
                       label="Number of Forms"
                     />
                     {forms.length > 0 && (
                       <div className="space-y-3 mt-4">
                         {forms.map((form, index) => (
                           <Card key={form.id} className="bg-muted/30">
                             <CardContent className="py-3 space-y-3">
                               <div className="flex items-center gap-2">
                                 <Input
                                   value={form.name}
                                   onChange={(e) => {
                                     const updated = [...forms];
                                     updated[index].name = e.target.value;
                                     setForms(updated);
                                   }}
                                   placeholder="Form Name"
                                   className="flex-1"
                                 />
                                 <Select
                                   value={form.type}
                                   onValueChange={(value) => {
                                     const updated = [...forms];
                                     updated[index].type = value;
                                     setForms(updated);
                                   }}
                                 >
                                   <SelectTrigger className="w-[140px]">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="contact">Contact</SelectItem>
                                     <SelectItem value="newsletter">Newsletter</SelectItem>
                                     <SelectItem value="quote">Quote Request</SelectItem>
                                     <SelectItem value="custom">Custom</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div className="flex flex-wrap gap-4">
                                 <WorkflowCheckbox
                                   id={`${form.id}-backend`}
                                   label="Backend Connected"
                                   checked={form.backendConnected}
                                   onCheckedChange={(checked) => {
                                     const updated = [...forms];
                                     updated[index].backendConnected = checked as boolean;
                                     setForms(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${form.id}-testing`}
                                   label="Testing Complete"
                                   checked={form.testingComplete}
                                   onCheckedChange={(checked) => {
                                     const updated = [...forms];
                                     updated[index].testingComplete = checked as boolean;
                                     setForms(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${form.id}-live`}
                                   label="Live"
                                   checked={form.live}
                                   onCheckedChange={(checked) => {
                                     const updated = [...forms];
                                     updated[index].live = checked as boolean;
                                     setForms(updated);
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
 
                 {section.id === 'navigation' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm">Header Navigation</span>
                       <Switch checked={headerNav} onCheckedChange={setHeaderNav} />
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm">Footer</span>
                       <Switch checked={footer} onCheckedChange={setFooter} />
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm">Mobile Menu</span>
                       <Switch checked={mobileMenu} onCheckedChange={setMobileMenu} />
                     </div>
                   </div>
                 )}
 
                 {section.id === 'interactive' && (
                   <>
                     <Button variant="outline" size="sm" onClick={addInteractiveElement}>
                       <Plus className="h-4 w-4 mr-1" />
                       Add Interactive Element
                     </Button>
                     {interactiveElements.length > 0 && (
                       <div className="space-y-3 mt-4">
                         {interactiveElements.map((element, index) => (
                           <Card key={element.id} className="bg-muted/30">
                             <CardContent className="py-3 space-y-3">
                               <div className="flex items-center gap-2">
                                 <Select
                                   value={element.type}
                                   onValueChange={(value) => {
                                     const updated = [...interactiveElements];
                                     updated[index].type = value;
                                     setInteractiveElements(updated);
                                   }}
                                 >
                                   <SelectTrigger className="w-[140px]">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="gallery">Image Gallery</SelectItem>
                                     <SelectItem value="video">Video</SelectItem>
                                     <SelectItem value="animation">Animation</SelectItem>
                                     <SelectItem value="map">Map</SelectItem>
                                     <SelectItem value="slider">Slider</SelectItem>
                                     <SelectItem value="accordion">Accordion</SelectItem>
                                     <SelectItem value="tabs">Tabs</SelectItem>
                                     <SelectItem value="custom">Custom</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <Input
                                   value={element.description}
                                   onChange={(e) => {
                                     const updated = [...interactiveElements];
                                     updated[index].description = e.target.value;
                                     setInteractiveElements(updated);
                                   }}
                                   placeholder="Description/Notes"
                                   className="flex-1"
                                 />
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8 text-destructive"
                                   onClick={() => removeInteractiveElement(element.id)}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                               <div className="flex flex-wrap gap-4">
                                 <WorkflowCheckbox
                                   id={`${element.id}-designed`}
                                   label="Designed"
                                   checked={element.designed}
                                   onCheckedChange={(checked) => {
                                     const updated = [...interactiveElements];
                                     updated[index].designed = checked as boolean;
                                     setInteractiveElements(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${element.id}-implemented`}
                                   label="Implemented"
                                   checked={element.implemented}
                                   onCheckedChange={(checked) => {
                                     const updated = [...interactiveElements];
                                     updated[index].implemented = checked as boolean;
                                     setInteractiveElements(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${element.id}-tested`}
                                   label="Tested"
                                   checked={element.tested}
                                   onCheckedChange={(checked) => {
                                     const updated = [...interactiveElements];
                                     updated[index].tested = checked as boolean;
                                     setInteractiveElements(updated);
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
 
                 {section.id === 'checkout' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">Checkout Required</span>
                       <Switch checked={checkoutRequired} onCheckedChange={setCheckoutRequired} />
                     </div>
                     {checkoutRequired && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <WorkflowCheckbox
                           id="cart-design"
                           label="Shopping Cart Design"
                           checked={checkoutItems.cartDesign}
                           onCheckedChange={(checked) => setCheckoutItems(prev => ({ ...prev, cartDesign: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="cart-functionality"
                           label="Cart Functionality"
                           checked={checkoutItems.cartFunctionality}
                           onCheckedChange={(checked) => setCheckoutItems(prev => ({ ...prev, cartFunctionality: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="checkout-design"
                           label="Checkout Page Design"
                           checked={checkoutItems.checkoutDesign}
                           onCheckedChange={(checked) => setCheckoutItems(prev => ({ ...prev, checkoutDesign: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="payment-gateway"
                           label="Payment Gateway Integration"
                           checked={checkoutItems.paymentGateway}
                           onCheckedChange={(checked) => setCheckoutItems(prev => ({ ...prev, paymentGateway: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="order-confirmation"
                           label="Order Confirmation Page"
                           checked={checkoutItems.orderConfirmation}
                           onCheckedChange={(checked) => setCheckoutItems(prev => ({ ...prev, orderConfirmation: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="email-confirmations"
                           label="Email Confirmations"
                           checked={checkoutItems.emailConfirmations}
                           onCheckedChange={(checked) => setCheckoutItems(prev => ({ ...prev, emailConfirmations: checked as boolean }))}
                         />
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'chat' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">Chat Widget</span>
                       <Switch checked={chatWidget} onCheckedChange={setChatWidget} />
                     </div>
                     {chatWidget && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <Input placeholder="Chat Platform (e.g., Intercom)" />
                         <div className="flex flex-wrap gap-4">
                           <WorkflowCheckbox id="chat-installed" label="Installed" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="chat-styled" label="Styled" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="chat-tested" label="Tested" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="chat-live" label="Live" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'responsive' && (
                   <div className="grid grid-cols-3 gap-4">
                     {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
                       <div key={device} className="space-y-3">
                         <h4 className="text-sm font-medium capitalize text-center">{device}</h4>
                         <div className="space-y-2">
                           <WorkflowCheckbox
                             id={`${device}-designed`}
                             label="Designed"
                             checked={responsive[device].designed}
                             onCheckedChange={(checked) => setResponsive(prev => ({
                               ...prev,
                               [device]: { ...prev[device], designed: checked as boolean }
                             }))}
                           />
                           <WorkflowCheckbox
                             id={`${device}-built`}
                             label="Built"
                             checked={responsive[device].built}
                             onCheckedChange={(checked) => setResponsive(prev => ({
                               ...prev,
                               [device]: { ...prev[device], built: checked as boolean }
                             }))}
                           />
                           <WorkflowCheckbox
                             id={`${device}-tested`}
                             label="Tested"
                             checked={responsive[device].tested}
                             onCheckedChange={(checked) => setResponsive(prev => ({
                               ...prev,
                               [device]: { ...prev[device], tested: checked as boolean }
                             }))}
                           />
                           <WorkflowCheckbox
                             id={`${device}-approved`}
                             label="Approved"
                             checked={responsive[device].approved}
                             onCheckedChange={(checked) => setResponsive(prev => ({
                               ...prev,
                               [device]: { ...prev[device], approved: checked as boolean }
                             }))}
                           />
                         </div>
                       </div>
                     ))}
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