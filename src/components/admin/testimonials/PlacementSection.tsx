import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlacementSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  position: number | null;
  onPositionChange: (pos: number) => void;
  maxPositions: number;
  takenPositions: number[]; // positions already taken by OTHER testimonials
  accentClass?: string;
}

export function PlacementSection({
  title,
  description,
  icon,
  enabled,
  onToggle,
  position,
  onPositionChange,
  maxPositions,
  takenPositions,
  accentClass = 'text-primary',
}: PlacementSectionProps) {
  return (
    <Collapsible defaultOpen={enabled}>
      <div className="border border-border rounded-lg overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className={accentClass}>{icon}</span>
            <div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {enabled && position && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Position {position}
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={enabled}
                onCheckedChange={(v) => {
                  onToggle(v);
                  if (v && !position) {
                    // Auto-assign first available position
                    for (let i = 1; i <= maxPositions; i++) {
                      if (!takenPositions.includes(i)) {
                        onPositionChange(i);
                        break;
                      }
                    }
                  }
                }}
              />
              <Label className="text-sm">Show on {title}</Label>
            </div>
            {enabled && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Display Position</Label>
                <div className="flex gap-2">
                  {Array.from({ length: maxPositions }, (_, i) => i + 1).map((pos) => {
                    const isTaken = takenPositions.includes(pos);
                    const isSelected = position === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        disabled={isTaken && !isSelected}
                        onClick={() => onPositionChange(pos)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-semibold border-2 transition-all',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : isTaken
                            ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                        )}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
                {takenPositions.length >= maxPositions && !position && (
                  <p className="text-xs text-destructive">All positions are taken. Remove another first.</p>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
