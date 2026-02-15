import { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExternalBlob } from '@/backend';
import { toast } from 'sonner';

export interface PlaylistEditorData {
  name: string;
  description: string;
  titleImage: ExternalBlob | null;
}

interface PlaylistEditorCardProps {
  initialData?: Partial<PlaylistEditorData>;
  onSave: (data: PlaylistEditorData) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  mode: 'create' | 'edit';
}

export function PlaylistEditorCard({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
  mode,
}: PlaylistEditorCardProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [titleImage, setTitleImage] = useState<ExternalBlob | null>(initialData?.titleImage || null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    if (titleImage) {
      setImagePreview(titleImage.getDirectURL());
    }
  }, [titleImage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      setTitleImage(blob);
      setShowUrlInput(false);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    try {
      const blob = ExternalBlob.fromURL(urlInput.trim());
      setTitleImage(blob);
      setUrlInput('');
      setShowUrlInput(false);
      toast.success('Image URL set');
    } catch (error) {
      toast.error('Failed to set image URL');
      console.error(error);
    }
  };

  const handleClearImage = () => {
    setTitleImage(null);
    setImagePreview('');
    setUrlInput('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        titleImage,
      });
    } catch (error: any) {
      // Error handling done by parent
    }
  };

  return (
    <div className="space-y-4">
      {/* Playlist Name */}
      <div className="space-y-2">
        <Label htmlFor="playlist-name">Playlist Name *</Label>
        <Input
          id="playlist-name"
          placeholder="My Awesome Playlist"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSaving}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="playlist-description">Description</Label>
        <Textarea
          id="playlist-description"
          placeholder="Describe your playlist..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSaving}
          rows={3}
        />
      </div>

      {/* Title Image */}
      <div className="space-y-2">
        <Label>Title Card Image</Label>
        
        {imagePreview ? (
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={imagePreview}
              alt="Playlist cover"
              className="w-full h-full object-cover"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 rounded-full"
              onClick={handleClearImage}
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={isSaving}
            className="gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            URL
          </Button>
          <Button size="sm" variant="outline" disabled={isSaving} asChild>
            <label className="cursor-pointer gap-2">
              <Upload className="w-4 h-4" />
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isSaving}
              />
            </label>
          </Button>
        </div>

        {showUrlInput && (
          <div className="space-y-2 pt-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isSaving}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUrlSubmit} disabled={isSaving}>
                Set Image
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowUrlInput(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={isSaving || !name.trim()} className="flex-1">
          {isSaving ? 'Saving...' : mode === 'create' ? 'Create Playlist' : 'Save Changes'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSaving} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}
