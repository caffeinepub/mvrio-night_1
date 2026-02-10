import { useState } from 'react';
import { Upload, Link as LinkIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHomeBanner } from '../../hooks/useHomeBanner';
import { toast } from 'sonner';

export function HomeChannelBanner() {
  const { displayImage, imageUrl, imageFile, setImageUrl, setImageFile, clearBanner } = useHomeBanner();
  const [urlInput, setUrlInput] = useState(imageUrl);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageFile(file);
      setShowUrlInput(false);
      toast.success('Banner image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    setImageUrl(urlInput.trim());
    setShowUrlInput(false);
    toast.success('Banner image updated');
  };

  const handleClear = () => {
    clearBanner();
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Banner cleared to default');
  };

  const hasCustomBanner = !!(imageUrl || imageFile);

  return (
    <div className="w-full mb-8">
      <div className="relative w-full bg-card/30 rounded-lg overflow-hidden" style={{ aspectRatio: '6/1' }}>
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background/80 to-card/50">
          <img
            src={displayImage}
            alt="Channel Banner"
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          {hasCustomBanner && (
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full"
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full" asChild>
            <label className="cursor-pointer">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </Button>
        </div>
      </div>

      {showUrlInput && (
        <div className="mt-4 p-4 bg-card/50 rounded-lg space-y-3">
          <div className="space-y-2">
            <Label htmlFor="banner-url">Image URL</Label>
            <Input
              id="banner-url"
              type="url"
              placeholder="https://example.com/banner.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUrlSubmit}>
              Set Banner
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowUrlInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
