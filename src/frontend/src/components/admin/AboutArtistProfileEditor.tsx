import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import { useGetArtistProfile, useUpdateArtistProfile } from '../../hooks/useQueries';
import { validateArtistProfile, hasValidationErrors, type ArtistProfileValidationErrors } from '../../utils/artistProfileValidation';
import type { ArtistProfile } from '../../backend';

export function AboutArtistProfileEditor() {
  const { data: profile, isLoading: isLoadingProfile } = useGetArtistProfile();
  const updateMutation = useUpdateArtistProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ArtistProfile>({
    bio: '',
    youtube: '',
    instagram: '',
    buyMeACoffee: '',
  });
  const [validationErrors, setValidationErrors] = useState<ArtistProfileValidationErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleEdit = () => {
    setIsEditing(true);
    setSaveError(null);
    setValidationErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    setValidationErrors({});
    // Reset to last saved values
    if (profile) {
      setFormData(profile);
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    
    // Validate form data
    const errors = validateArtistProfile(formData);
    if (hasValidationErrors(errors)) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    try {
      await updateMutation.mutateAsync(formData);
      setIsEditing(false);
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save profile. Please try again.');
    }
  };

  const handleChange = (field: keyof ArtistProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="card-shadow-custom border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Admin Editor</CardTitle>
        {!isEditing ? (
          <Button onClick={handleEdit} size="sm" variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
              disabled={updateMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {saveError && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {saveError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          {isEditing ? (
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Enter artist bio..."
              rows={4}
              className="resize-none"
            />
          ) : (
            <p className="text-sm text-muted-foreground min-h-[80px] p-3 rounded-md bg-muted/30">
              {formData.bio || 'No bio set'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtube">YouTube URL</Label>
          {isEditing ? (
            <>
              <Input
                id="youtube"
                type="url"
                value={formData.youtube}
                onChange={(e) => handleChange('youtube', e.target.value)}
                placeholder="https://youtube.com/..."
                className={validationErrors.youtube ? 'border-destructive' : ''}
              />
              {validationErrors.youtube && (
                <p className="text-sm text-destructive">{validationErrors.youtube}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted/30 break-all">
              {formData.youtube || 'Not set'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram URL</Label>
          {isEditing ? (
            <>
              <Input
                id="instagram"
                type="url"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
                className={validationErrors.instagram ? 'border-destructive' : ''}
              />
              {validationErrors.instagram && (
                <p className="text-sm text-destructive">{validationErrors.instagram}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted/30 break-all">
              {formData.instagram || 'Not set'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="buyMeACoffee">Buy Me a Coffee URL</Label>
          {isEditing ? (
            <>
              <Input
                id="buyMeACoffee"
                type="url"
                value={formData.buyMeACoffee}
                onChange={(e) => handleChange('buyMeACoffee', e.target.value)}
                placeholder="https://buymeacoffee.com/..."
                className={validationErrors.buyMeACoffee ? 'border-destructive' : ''}
              />
              {validationErrors.buyMeACoffee && (
                <p className="text-sm text-destructive">{validationErrors.buyMeACoffee}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted/30 break-all">
              {formData.buyMeACoffee || 'Not set'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
