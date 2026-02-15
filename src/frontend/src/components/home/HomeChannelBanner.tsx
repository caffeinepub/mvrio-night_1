import { useState } from 'react';
import { Upload, Link as LinkIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHomeBanner } from '../../hooks/useHomeBanner';
import { useAdminContext } from '../../context/AdminContext';
import { useHiddenAdminMode } from '../../context/HiddenAdminModeContext';
import { useLongPress } from '../../hooks/useLongPress';
import { toast } from 'sonner';

export function HomeChannelBanner() {
  const { displayImage, setImageUrl, setImageFile, clearBanner, isUploading } = useHomeBanner();
  const { isAdmin } = useAdminContext();
  const { openModal } = useHiddenAdminMode();
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Long-press handler for admin mode activation
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      openModal();
    },
    delay: 5000,
    movementThreshold: 10,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await setImageFile(file);
      setShowUrlInput(false);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleUrlSubmit = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action.');
      return;
    }

    try {
      await setImageUrl(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleClear = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action.');
      return;
    }

    try {
      await clearBanner();
      setUrlInput('');
      setShowUrlInput(false);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  return (
    <div className="w-full mb-8">
      <div className="relative w-full max-w-5xl mx-auto">
        <div className="flex items-stretch bg-card/30 rounded-lg overflow-hidden h-[200px] md:h-[280px]">
          {/* Left: Banner Image with long-press trigger */}
          <div
            className="w-1/2 bg-gradient-to-br from-background/80 to-card/50 flex items-center justify-center p-4 touch-none select-none"
            {...longPressHandlers}
          >
            <img
              src={displayImage}
              alt="Channel Banner"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
          
          {/* Right: Artist Name */}
          <div className="w-1/2 flex items-center justify-center p-4 md:p-8">
            <h2 
              className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center"
              style={{ 
                color: '#1ED760',
                textShadow: '0 0 20px rgba(30, 215, 96, 0.5), 0 0 40px rgba(30, 215, 96, 0.3)',
                WebkitTextStroke: '1px rgba(0, 0, 0, 0.3)'
              }}
            >
              THE MVRIO
            </h2>
          </div>
        </div>

        {/* Controls - Only show to admin users */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full"
              onClick={handleClear}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full"
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={isUploading}
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
                  disabled={isUploading}
                />
              </label>
            </Button>
          </div>
        )}
      </div>

      {isAdmin && showUrlInput && (
        <div className="mt-4 p-4 bg-card/50 rounded-lg space-y-3 max-w-5xl mx-auto">
          <div className="space-y-2">
            <Label htmlFor="banner-url">Image URL</Label>
            <Input
              id="banner-url"
              type="url"
              placeholder="https://example.com/banner.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUrlSubmit} disabled={isUploading}>
              {isUploading ? 'Setting...' : 'Set Banner'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowUrlInput(false)} disabled={isUploading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
