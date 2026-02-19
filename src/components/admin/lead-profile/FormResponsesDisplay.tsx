import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User, Building2, Globe, Target, Palette, Settings, Calendar, FileText, ClipboardList } from 'lucide-react';

interface FormResponsesDisplayProps {
  formData: Record<string, any>;
  isEditing?: boolean;
  editedFormData?: Record<string, any>;
  onFieldChange?: (key: string, value: string) => void;
}

// Questions map for the quick questionnaire (service/retail/professional)
const SERVICE_QUESTION_LABELS = [
  'How many services do you offer?',
  'How many suburbs do you service?',
  'Do you have your own images?',
  'How soon do you need your website?',
];
const RETAIL_QUESTION_LABELS = [
  'How many locations do you have?',
  'Do you sell online?',
  'Do you have your own product images?',
  'How soon do you need your website?',
];
const PROFESSIONAL_QUESTION_LABELS = [
  'What best describes your practice?',
  'How many service areas do you cover?',
  'Do you have professional headshots & images?',
  'How soon do you need your website?',
];

const CATEGORY_LABELS: Record<string, string> = {
  service: 'Service Business',
  retail: 'Retail Business',
  professional: 'Professional Services',
};

function getQuestionLabels(category: string): string[] {
  if (category === 'service') return SERVICE_QUESTION_LABELS;
  if (category === 'retail') return RETAIL_QUESTION_LABELS;
  if (category === 'professional') return PROFESSIONAL_QUESTION_LABELS;
  return [];
}

// Define categories with their fields, colors, and icons
const FIELD_CATEGORIES = {
  questionnaire: {
    label: 'Quick Questionnaire',
    icon: ClipboardList,
    color: 'bg-sited-blue/10 border-sited-blue/20 text-sited-blue',
    badgeColor: 'bg-sited-blue/10 text-sited-blue',
    fields: ['business_category', 'questionnaire_answers', 'source', 'contactInfoOnly'],
  },
  contact: {
    label: 'Contact Information',
    icon: User,
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    fields: ['fullName', 'full_name', 'name', 'email', 'phone', 'preferredContact', 'preferred_contact', 'timezone']
  },
  business: {
    label: 'Business Details',
    icon: Building2,
    color: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    fields: ['businessName', 'business_name', 'industry', 'businessDescription', 'business_description', 'targetAudience', 'target_audience']
  },
  goals: {
    label: 'Project Goals',
    icon: Target,
    color: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    fields: ['primaryGoal', 'primary_goal', 'secondaryGoals', 'secondary_goals', 'desiredActions', 'desired_actions', 'successMetrics', 'success_metrics']
  },
  design: {
    label: 'Design & Branding',
    icon: Palette,
    color: 'bg-pink-500/10 border-pink-500/20 text-pink-700 dark:text-pink-300',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    fields: ['existingBranding', 'existing_branding', 'brandColors', 'brand_colors', 'brandFonts', 'brand_fonts', 'designStyle', 'design_style', 'inspirationSite1', 'inspiration_site_1', 'inspirationSite2', 'inspiration_site_2', 'inspirationSite3', 'inspiration_site_3', 'contentReady', 'content_ready', 'contentHelp', 'content_help', 'requiredPages', 'required_pages', 'customPages', 'custom_pages']
  },
  technical: {
    label: 'Technical Requirements',
    icon: Settings,
    color: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    fields: ['currentWebsite', 'current_website', 'domainOwned', 'domain_owned', 'domainName', 'domain_name', 'domainRegistrar', 'domain_registrar', 'domainRegistrarOther', 'domain_registrar_other', 'integrations', 'features', 'otherIntegrations', 'other_integrations', 'otherFeatures', 'other_features']
  },
  timeline: {
    label: 'Timeline & Budget',
    icon: Calendar,
    color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300',
    badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    fields: ['budget', 'timeline', 'launchDate', 'launch_date', 'howDidYouHear', 'how_did_you_hear']
  },
  other: {
    label: 'Additional Information',
    icon: FileText,
    color: 'bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-300',
    badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
    fields: [] // Catch-all for uncategorized fields
  }
};

// Fields to hide from generic display (internal flags)
const HIDDEN_FIELDS = ['partial', 'contactInfoOnly', 'source'];

const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  const str = String(value);
  if (str === 'yes') return '✓ Yes';
  if (str === 'no') return '✗ No';
  if (str === 'need-help') return '? Need Help';
  if (str === 'true') return '✓ Yes';
  if (str === 'false') return '✗ No';
  return str;
};

const categorizeFields = (formData: Record<string, any>) => {
  const categorized: Record<string, { key: string; value: any }[]> = {};
  const processedFields = new Set<string>();

  Object.keys(FIELD_CATEGORIES).forEach(cat => {
    categorized[cat] = [];
  });

  // Mark hidden fields as processed so they don't show
  HIDDEN_FIELDS.forEach(f => processedFields.add(f));

  // Handle questionnaire data specially
  if (formData.business_category || formData.questionnaire_answers) {
    categorized.questionnaire = []; // Will be rendered specially
    processedFields.add('business_category');
    processedFields.add('questionnaire_answers');
  }

  Object.entries(FIELD_CATEGORIES).forEach(([category, config]) => {
    if (category === 'other' || category === 'questionnaire') return;
    
    config.fields.forEach(field => {
      if (field in formData && !processedFields.has(field)) {
        categorized[category].push({ key: field, value: formData[field] });
        processedFields.add(field);
      }
    });
  });

  Object.entries(formData).forEach(([key, value]) => {
    if (!processedFields.has(key)) {
      categorized.other.push({ key, value });
    }
  });

  return Object.fromEntries(
    Object.entries(categorized).filter(([_, fields]) => fields.length > 0 || _ === 'questionnaire')
  );
};

// Special renderer for the quick questionnaire answers
function QuestionnaireDisplay({ formData }: { formData: Record<string, any> }) {
  const category = formData.business_category;
  const answers: string[] = formData.questionnaire_answers || [];
  const labels = getQuestionLabels(category);

  if (!category && answers.length === 0) return null;

  return (
    <div className="rounded-lg border p-4 bg-sited-blue/10 border-sited-blue/20 text-sited-blue">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="h-4 w-4" />
        <span className="text-sm font-semibold">Quick Questionnaire</span>
        {category && (
          <Badge variant="outline" className="ml-auto text-xs bg-sited-blue/10 text-sited-blue border-sited-blue/30">
            {CATEGORY_LABELS[category] || category}
          </Badge>
        )}
      </div>
      {answers.length > 0 ? (
        <div className="grid gap-2">
          {answers.map((answer, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 text-sm py-1 border-b border-current/10 last:border-0">
              <span className="font-medium min-w-[200px] opacity-70 text-xs uppercase tracking-wide">
                {labels[i] || `Question ${i + 1}`}
              </span>
              <span className="flex-1 break-words font-semibold">{answer}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm opacity-70">No questionnaire answers recorded</p>
      )}
    </div>
  );
}

export function FormResponsesDisplay({ 
  formData, 
  isEditing = false, 
  editedFormData,
  onFieldChange 
}: FormResponsesDisplayProps) {
  const categorizedData = categorizeFields(formData);
  const displayData = isEditing && editedFormData ? editedFormData : formData;
  const hasQuestionnaire = formData.business_category || formData.questionnaire_answers;

  if (Object.keys(formData).length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No form responses available</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Render questionnaire data specially */}
      {hasQuestionnaire && <QuestionnaireDisplay formData={formData} />}

      {/* Render other categorized fields */}
      {Object.entries(categorizedData).map(([category, fields]) => {
        if (category === 'questionnaire') return null; // Already rendered above
        const categoryConfig = FIELD_CATEGORIES[category as keyof typeof FIELD_CATEGORIES];
        const Icon = categoryConfig.icon;
        
        return (
          <div 
            key={category} 
            className={`rounded-lg border p-4 ${categoryConfig.color}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{categoryConfig.label}</span>
              <Badge variant="outline" className={`ml-auto text-xs ${categoryConfig.badgeColor}`}>
                {(fields as any[]).length} {(fields as any[]).length === 1 ? 'field' : 'fields'}
              </Badge>
            </div>
            
            <div className="grid gap-2">
              {(fields as { key: string; value: any }[]).map(({ key }) => {
                const value = displayData[key];
                
                if (isEditing && onFieldChange) {
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium opacity-70">{formatKey(key)}</label>
                      <Input
                        value={typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                        onChange={(e) => onFieldChange(key, e.target.value)}
                        className="h-9 text-sm bg-background/50"
                      />
                    </div>
                  );
                }

                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 text-sm py-1 border-b border-current/10 last:border-0">
                    <span className="font-medium min-w-[140px] opacity-70 text-xs uppercase tracking-wide">
                      {formatKey(key)}
                    </span>
                    <span className="flex-1 break-words">
                      {formatValue(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
