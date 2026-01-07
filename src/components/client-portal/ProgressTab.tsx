import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Palette, 
  Clock, 
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface ProjectUpdate {
  id: string;
  content: string;
  created_at: string;
}

interface ProjectMilestone {
  id: string;
  category: 'design' | 'metrics';
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
}

interface ProgressTabProps {
  lead: {
    id: string;
    project_type: string;
    status: string;
    created_at: string;
  };
  projectUpdates: ProjectUpdate[];
  designMilestones: ProjectMilestone[];
  metricsMilestones: ProjectMilestone[];
  designProgress: number;
  metricsProgress: number;
}

export function ProgressTab({ 
  lead, 
  projectUpdates, 
  designMilestones, 
  designProgress,
}: ProgressTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/50" />;
    }
  };

  // Default milestones if none exist
  const defaultDesignMilestones: ProjectMilestone[] = designMilestones.length > 0 ? designMilestones : [
    { id: '1', category: 'design', title: 'Initial Concept', description: 'Design concept and direction', status: 'pending', completed_at: null },
    { id: '2', category: 'design', title: 'Wireframes', description: 'Layout and structure', status: 'pending', completed_at: null },
    { id: '3', category: 'design', title: 'Visual Design', description: 'Colors, typography, imagery', status: 'pending', completed_at: null },
    { id: '4', category: 'design', title: 'Final Review', description: 'Design approval', status: 'pending', completed_at: null },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">Project Progress</h2>
              <p className="text-muted-foreground">
                Started {format(new Date(lead.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold">{designProgress}%</p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={designProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Design Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Design
            </CardTitle>
            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              {designProgress}%
            </Badge>
          </div>
          <Progress value={designProgress} className="h-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {defaultDesignMilestones.map((milestone) => (
              <div key={milestone.id} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStatusIcon(milestone.status)}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${milestone.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                    {milestone.title}
                  </p>
                  {milestone.description && (
                    <p className="text-xs text-muted-foreground">{milestone.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Updates Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Project Updates
          </CardTitle>
          <CardDescription>Updates from our development team</CardDescription>
        </CardHeader>
        <CardContent>
          {projectUpdates.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No updates yet</p>
              <p className="text-sm text-muted-foreground/70">Updates will appear here as your project progresses</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
              
              {projectUpdates.map((update) => (
                <div key={update.id} className="relative pl-10 pb-6 last:pb-0">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(update.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                    </p>
                    <p className="whitespace-pre-wrap">{update.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
