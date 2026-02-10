import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAddSong } from '../../hooks/useQueries';
import { useAdminContext } from '../../context/AdminContext';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '../../utils/authorizationErrors';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export function SongEditor() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    albumArtUrl: '',
    titleImageUrl: '',
    audioUrl: '',
    lyrics: '',
  });

  const addSongMutation = useAddSong();
  const { isAdmin, isLoading: adminLoading } = useAdminContext();

  const handleFileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error(`File size exceeds 10MB limit. Please use a smaller file or provide a URL instead.`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await handleFileToDataURL(file);
      setFormData({ ...formData, audioUrl: dataUrl });
      toast.success('Audio file loaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load audio file');
    }
  };

  const handleAlbumArtFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await handleFileToDataURL(file);
      setFormData({ ...formData, albumArtUrl: dataUrl });
      toast.success('Album art loaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load album art');
    }
  };

  const handleTitleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await handleFileToDataURL(file);
      setFormData({ ...formData, titleImageUrl: dataUrl });
      toast.success('Title image loaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load title image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    if (!formData.title || !formData.artist || !formData.audioUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addSongMutation.mutateAsync(formData);
      toast.success('Song added successfully');
      setFormData({
        title: '',
        artist: '',
        albumArtUrl: '',
        titleImageUrl: '',
        audioUrl: '',
        lyrics: '',
      });
      setOpen(false);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      toast.error(errorMessage);
      console.error('Add song error:', error);
    }
  };

  // Don't show the button while checking admin status
  if (adminLoading) {
    return null;
  }

  // Only show the button to admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Song
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Song</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Song title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                placeholder="Artist name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Audio File *</Label>
              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-2">
                  <Input
                    type="url"
                    value={formData.audioUrl.startsWith('data:') ? '' : formData.audioUrl}
                    onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                    placeholder="https://example.com/audio.mp3"
                  />
                </TabsContent>
                <TabsContent value="upload" className="space-y-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                  />
                  {formData.audioUrl.startsWith('data:') && (
                    <p className="text-sm text-muted-foreground">✓ Audio file loaded</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Album Art</Label>
              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-2">
                  <Input
                    type="url"
                    value={formData.albumArtUrl.startsWith('data:') ? '' : formData.albumArtUrl}
                    onChange={(e) => setFormData({ ...formData, albumArtUrl: e.target.value })}
                    placeholder="https://example.com/album-art.jpg"
                  />
                </TabsContent>
                <TabsContent value="upload" className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAlbumArtFileChange}
                  />
                  {formData.albumArtUrl.startsWith('data:') && (
                    <p className="text-sm text-muted-foreground">✓ Album art loaded</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Title Image</Label>
              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-2">
                  <Input
                    type="url"
                    value={formData.titleImageUrl.startsWith('data:') ? '' : formData.titleImageUrl}
                    onChange={(e) => setFormData({ ...formData, titleImageUrl: e.target.value })}
                    placeholder="https://example.com/title-image.jpg"
                  />
                </TabsContent>
                <TabsContent value="upload" className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleTitleImageFileChange}
                  />
                  {formData.titleImageUrl.startsWith('data:') && (
                    <p className="text-sm text-muted-foreground">✓ Title image loaded</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lyrics">Lyrics</Label>
              <Textarea
                id="lyrics"
                value={formData.lyrics}
                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                placeholder="Enter song lyrics..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addSongMutation.isPending}>
              {addSongMutation.isPending ? 'Adding...' : 'Add Song'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
