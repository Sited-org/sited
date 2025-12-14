import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Save } from 'lucide-react';

interface FormResponsesCardProps {
  formData: Record<string, any>;
  onSave: (updatedFormData: Record<string, any>) => Promise<void>;
  canEdit: boolean;
}

export function FormResponsesCard({ formData, onSave, canEdit }: FormResponsesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({ ...formData });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(editedData);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  const formatKey = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Form Responses</CardTitle>
        {canEdit && (
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
            <Button 
              variant={isEditing ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => {
                if (isEditing) {
                  setEditedData({ ...formData });
                }
                setIsEditing(!isEditing);
              }}
            >
              <Pencil className="h-4 w-4 mr-1" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          {Object.entries(isEditing ? editedData : formData).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {formatKey(key)}
              </label>
              {isEditing ? (
                <Input
                  value={typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}
                </p>
              )}
            </div>
          ))}
        </div>
        
        {isEditing && canEdit && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
