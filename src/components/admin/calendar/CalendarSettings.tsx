import { useState, useEffect } from 'react';
import { type CalendarConfig } from '@/hooks/useBookings';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface CalendarSettingsProps {
  config: CalendarConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: Partial<CalendarConfig>) => Promise<boolean>;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

export function CalendarSettings({ config, open, onOpenChange, onSave }: CalendarSettingsProps) {
  const [draft, setDraft] = useState(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config, open]);

  const toggleDay = (day: number) => {
    setDraft(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day].sort((a, b) => a - b),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Calendar Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Meeting Types */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Meeting Types</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Discovery Call</p>
                  <p className="text-xs text-muted-foreground">Standard booking via website</p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">20 min</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Plan Call</p>
                  <p className="text-xs text-muted-foreground">Post-payment onboarding</p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">45 min</Badge>
              </div>
            </div>
          </div>

          {/* Buffers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Buffer Before (min)</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={draft.buffer_before_minutes}
                onChange={(e) => setDraft(prev => ({ ...prev, buffer_before_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Buffer After (min)</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={draft.buffer_after_minutes}
                onChange={(e) => setDraft(prev => ({ ...prev, buffer_after_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <Separator />

          {/* Available Days */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Available Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((name, i) => {
                const dayVal = DAY_VALUES[i];
                const active = draft.available_days.includes(dayVal);
                return (
                  <button
                    key={name}
                    onClick={() => toggleDay(dayVal)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 text-muted-foreground border-border hover:border-foreground/20'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Time</Label>
              <Input
                type="time"
                value={draft.available_hours_start}
                onChange={(e) => setDraft(prev => ({ ...prev, available_hours_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Time</Label>
              <Input
                type="time"
                value={draft.available_hours_end}
                onChange={(e) => setDraft(prev => ({ ...prev, available_hours_end: e.target.value }))}
              />
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Timezone</Label>
            <Input
              value={draft.timezone}
              onChange={(e) => setDraft(prev => ({ ...prev, timezone: e.target.value }))}
              placeholder="Australia/Sydney"
            />
          </div>

          <Separator />

          {/* Google Calendar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Google Calendar Sync</Label>
              <Badge variant={draft.google_calendar_connected ? 'default' : 'outline'} className="text-xs">
                {draft.google_calendar_connected ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Two-way sync with Google Calendar. Bookings create events and busy times block availability.
            </p>
            {!draft.google_calendar_connected && (
              <Button variant="outline" size="sm" disabled className="text-xs">
                Connect Google Calendar (Coming Soon)
              </Button>
            )}
          </div>

          {/* Zoom Availability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Zoom Availability</Label>
              <Badge variant="default" className="text-xs">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Existing Zoom meetings automatically block booking time slots.
            </p>
          </div>

          <Separator />

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
