 import { useState } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { ChevronDown, Plus, Trash2 } from 'lucide-react';
 import { WorkflowCheckbox } from '../WorkflowCheckbox';
 import { WorkflowProgress } from '../WorkflowProgress';
 import { StatusIndicator } from '../StatusIndicator';
 import { cn } from '@/lib/utils';
 
 interface KeywordItem {
   id: string;
   keyword: string;
   searchVolume: number;
   difficulty: string;
   targetPage: string;
   contentWritten: boolean;
   optimized: boolean;
   published: boolean;
 }
 
 export function SEOStage() {
   const [openSections, setOpenSections] = useState<string[]>([]);
   
   // Technical SEO
   const [seoScore, setSeoScore] = useState(0);
   const [technicalSEO, setTechnicalSEO] = useState({
     sitemapGenerated: false,
     sitemapSubmitted: false,
     sitemapIndexed: false,
     robotsConfigured: false,
     robotsTested: false,
     sslActive: false,
   });
   
   // Keywords
   const [keywords, setKeywords] = useState<KeywordItem[]>([]);
   
   // Local SEO
   const [localBusiness, setLocalBusiness] = useState(false);
   
   // AEO
   const [aeoItems, setAeoItems] = useState({
     featuredSnippet: false,
     faqSchema: false,
     voiceSearch: false,
     aiReadyContent: false,
   });
   
   // Analytics
   const [analyticsStatus, setAnalyticsStatus] = useState({
     ga: 'not_started' as 'not_started' | 'in_progress' | 'complete',
     gsc: 'not_started' as 'not_started' | 'in_progress' | 'complete',
   });
 
   const toggleSection = (section: string) => {
     setOpenSections(prev => 
       prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
     );
   };
 
   const addKeyword = () => {
     setKeywords([...keywords, {
       id: crypto.randomUUID(),
       keyword: '',
       searchVolume: 0,
       difficulty: 'medium',
       targetPage: '',
       contentWritten: false,
       optimized: false,
       published: false,
     }]);
   };
 
   const removeKeyword = (id: string) => {
     setKeywords(keywords.filter(k => k.id !== id));
   };
 
   const sections = [
     { id: 'technical', label: 'Technical SEO' },
     { id: 'onpage', label: 'On-Page SEO' },
     { id: 'content', label: 'Content Optimization', count: keywords.length },
     { id: 'local', label: 'Local SEO' },
     { id: 'aeo', label: 'AEO (Answer Engine)' },
     { id: 'analytics', label: 'Analytics & Tracking' },
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
                 {section.id === 'technical' && (
                   <div className="space-y-4">
                     <div className="flex items-center gap-4">
                       <div className="relative w-20 h-20">
                         <svg className="w-20 h-20 transform -rotate-90">
                           <circle
                             cx="40"
                             cy="40"
                             r="36"
                             stroke="currentColor"
                             strokeWidth="8"
                             fill="none"
                             className="text-muted"
                           />
                           <circle
                             cx="40"
                             cy="40"
                             r="36"
                             stroke="currentColor"
                             strokeWidth="8"
                             fill="none"
                             strokeDasharray={`${seoScore * 2.26} 226`}
                             className="text-primary transition-all"
                           />
                         </svg>
                         <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                           {seoScore}
                         </span>
                       </div>
                       <div className="flex-1 space-y-2">
                         <h4 className="text-sm font-medium">SEO Health Score</h4>
                         <p className="text-xs text-muted-foreground">Overall technical SEO score</p>
                       </div>
                     </div>
                     
                     <div className="space-y-3">
                       <h5 className="text-sm font-medium">XML Sitemap</h5>
                       <div className="flex flex-wrap gap-4">
                         <WorkflowCheckbox
                           id="sitemap-generated"
                           label="Generated"
                           checked={technicalSEO.sitemapGenerated}
                           onCheckedChange={(checked) => setTechnicalSEO(prev => ({ ...prev, sitemapGenerated: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="sitemap-submitted"
                           label="Submitted"
                           checked={technicalSEO.sitemapSubmitted}
                           onCheckedChange={(checked) => setTechnicalSEO(prev => ({ ...prev, sitemapSubmitted: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="sitemap-indexed"
                           label="Indexed"
                           checked={technicalSEO.sitemapIndexed}
                           onCheckedChange={(checked) => setTechnicalSEO(prev => ({ ...prev, sitemapIndexed: checked as boolean }))}
                         />
                       </div>
                     </div>
 
                     <div className="space-y-3">
                       <h5 className="text-sm font-medium">Robots.txt</h5>
                       <div className="flex flex-wrap gap-4">
                         <WorkflowCheckbox
                           id="robots-configured"
                           label="Configured"
                           checked={technicalSEO.robotsConfigured}
                           onCheckedChange={(checked) => setTechnicalSEO(prev => ({ ...prev, robotsConfigured: checked as boolean }))}
                         />
                         <WorkflowCheckbox
                           id="robots-tested"
                           label="Tested"
                           checked={technicalSEO.robotsTested}
                           onCheckedChange={(checked) => setTechnicalSEO(prev => ({ ...prev, robotsTested: checked as boolean }))}
                         />
                       </div>
                     </div>
 
                     <div className="flex items-center justify-between">
                       <span className="text-sm">SSL Certificate</span>
                       <div className="flex items-center gap-2">
                         <StatusIndicator status={technicalSEO.sslActive ? 'complete' : 'not_started'} />
                         <span className="text-sm">{technicalSEO.sslActive ? 'Active' : 'Not Installed'}</span>
                       </div>
                     </div>
                   </div>
                 )}
 
                 {section.id === 'onpage' && (
                   <div className="space-y-4">
                     <p className="text-sm text-muted-foreground">
                       On-page SEO tracking for each page. Pages are pulled from Front End Development section.
                     </p>
                     <div className="space-y-2">
                       <WorkflowCheckbox id="meta-titles" label="Meta Titles Optimized" checked={false} onCheckedChange={() => {}} />
                       <WorkflowCheckbox id="meta-descriptions" label="Meta Descriptions Written" checked={false} onCheckedChange={() => {}} />
                       <WorkflowCheckbox id="header-tags" label="Header Tags (H1, H2, H3) Optimized" checked={false} onCheckedChange={() => {}} />
                       <WorkflowCheckbox id="image-alt" label="Image Alt Text Complete" checked={false} onCheckedChange={() => {}} />
                       <WorkflowCheckbox id="url-structure" label="URL Structure Optimized" checked={false} onCheckedChange={() => {}} />
                       <WorkflowCheckbox id="internal-links" label="Internal Links Added" checked={false} onCheckedChange={() => {}} />
                     </div>
                   </div>
                 )}
 
                 {section.id === 'content' && (
                   <>
                     <Button variant="outline" size="sm" onClick={addKeyword}>
                       <Plus className="h-4 w-4 mr-1" />
                       Add Keyword
                     </Button>
                     {keywords.length > 0 && (
                       <div className="space-y-3 mt-4">
                         {keywords.map((keyword, index) => (
                           <Card key={keyword.id} className="bg-muted/30">
                             <CardContent className="py-3 space-y-3">
                               <div className="flex items-center gap-2">
                                 <Input
                                   value={keyword.keyword}
                                   onChange={(e) => {
                                     const updated = [...keywords];
                                     updated[index].keyword = e.target.value;
                                     setKeywords(updated);
                                   }}
                                   placeholder="Target Keyword"
                                   className="flex-1"
                                 />
                                 <Select
                                   value={keyword.difficulty}
                                   onValueChange={(value) => {
                                     const updated = [...keywords];
                                     updated[index].difficulty = value;
                                     setKeywords(updated);
                                   }}
                                 >
                                   <SelectTrigger className="w-[100px]">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="low">Low</SelectItem>
                                     <SelectItem value="medium">Medium</SelectItem>
                                     <SelectItem value="high">High</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8 text-destructive"
                                   onClick={() => removeKeyword(keyword.id)}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                               <div className="flex flex-wrap gap-4">
                                 <WorkflowCheckbox
                                   id={`${keyword.id}-written`}
                                   label="Content Written"
                                   checked={keyword.contentWritten}
                                   onCheckedChange={(checked) => {
                                     const updated = [...keywords];
                                     updated[index].contentWritten = checked as boolean;
                                     setKeywords(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${keyword.id}-optimized`}
                                   label="Optimized"
                                   checked={keyword.optimized}
                                   onCheckedChange={(checked) => {
                                     const updated = [...keywords];
                                     updated[index].optimized = checked as boolean;
                                     setKeywords(updated);
                                   }}
                                 />
                                 <WorkflowCheckbox
                                   id={`${keyword.id}-published`}
                                   label="Published"
                                   checked={keyword.published}
                                   onCheckedChange={(checked) => {
                                     const updated = [...keywords];
                                     updated[index].published = checked as boolean;
                                     setKeywords(updated);
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
 
                 {section.id === 'local' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">Local Business</span>
                       <Switch checked={localBusiness} onCheckedChange={setLocalBusiness} />
                     </div>
                     {localBusiness && (
                       <div className="space-y-3 pl-4 border-l-2 border-muted">
                         <Input placeholder="Business Name" />
                         <Input placeholder="Address" />
                         <div className="space-y-2">
                           <WorkflowCheckbox id="gbp-setup" label="Google Business Profile Setup" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="citations" label="Citations Complete" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="location-page" label="Location Page Built" checked={false} onCheckedChange={() => {}} />
                           <WorkflowCheckbox id="local-schema" label="Schema Added" checked={false} onCheckedChange={() => {}} />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
 
                 {section.id === 'aeo' && (
                   <div className="space-y-3">
                     <WorkflowCheckbox
                       id="aeo-snippet"
                       label="Featured Snippet Optimization"
                       checked={aeoItems.featuredSnippet}
                       onCheckedChange={(checked) => setAeoItems(prev => ({ ...prev, featuredSnippet: checked as boolean }))}
                     />
                     <WorkflowCheckbox
                       id="aeo-faq"
                       label="FAQ Schema Implemented"
                       checked={aeoItems.faqSchema}
                       onCheckedChange={(checked) => setAeoItems(prev => ({ ...prev, faqSchema: checked as boolean }))}
                     />
                     <WorkflowCheckbox
                       id="aeo-voice"
                       label="Voice Search Optimization"
                       checked={aeoItems.voiceSearch}
                       onCheckedChange={(checked) => setAeoItems(prev => ({ ...prev, voiceSearch: checked as boolean }))}
                     />
                     <WorkflowCheckbox
                       id="aeo-ai"
                       label="AI Answer-Ready Content"
                       checked={aeoItems.aiReadyContent}
                       onCheckedChange={(checked) => setAeoItems(prev => ({ ...prev, aiReadyContent: checked as boolean }))}
                     />
                   </div>
                 )}
 
                 {section.id === 'analytics' && (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-sm">Google Analytics</span>
                       <div className="flex items-center gap-2">
                         <StatusIndicator status={analyticsStatus.ga} showLabel />
                       </div>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm">Google Search Console</span>
                       <div className="flex items-center gap-2">
                         <StatusIndicator status={analyticsStatus.gsc} showLabel />
                       </div>
                     </div>
                     <div className="space-y-2 pt-2">
                       <WorkflowCheckbox id="analytics-goals" label="Goals Configured" checked={false} onCheckedChange={() => {}} />
                       <WorkflowCheckbox id="analytics-events" label="Events Setup" checked={false} onCheckedChange={() => {}} />
                       <WorkflowCheckbox id="analytics-sitemap" label="Sitemap Submitted" checked={false} onCheckedChange={() => {}} />
                       <WorkflowCheckbox id="analytics-conversion" label="Conversion Tracking Live" checked={false} onCheckedChange={() => {}} />
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