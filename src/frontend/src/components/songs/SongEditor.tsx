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
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  const { isAdmin } = useAdminContext();
  const addSongMutation = useAddSong();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'albumArtUrl' | 'titleImageUrl' | 'audioUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({ ...prev, [field]: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.artist || !formData.audioUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addSongMutation.mutateAsync(formData);
      setOpen(false);
      // Reset form
      setFormData({
        title: '',
        artist: '',
        albumArtUrl: '',
        titleImageUrl: '',
        audioUrl: '',
        lyrics: '',
      });
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error('Failed to add song:', error);
    }
  };

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
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'url')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload Files</TabsTrigger>
              <TabsTrigger value="url">Use URLs</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="albumArt">Album Art</Label>
                <Input
                  id="albumArt"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'albumArtUrl')}
                />
                {formData.albumArtUrl && (
                  <img src={formData.albumArtUrl} alt="Album art preview" className="w-32 h-32 object-cover rounded" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleImage">Title Image</Label>
                <Input
                  id="titleImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'titleImageUrl')}
                />
                {formData.titleImageUrl && (
                  <img src={formData.titleImageUrl} alt="Title image preview" className="w-32 h-32 object-cover rounded" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio">Audio File *</Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, 'audioUrl')}
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="albumArtUrl">Album Art URL</Label>
                <Input
                  id="albumArtUrl"
                  value={formData.albumArtUrl}
                  onChange={(e) => setFormData({ ...formData, albumArtUrl: e.target.value })}
                  placeholder="https://example.com/album-art.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleImageUrl">Title Image URL</Label>
                <Input
                  id="titleImageUrl"
                  value={formData.titleImageUrl}
                  onChange={(e) => setFormData({ ...formData, titleImageUrl: e.target.value })}
                  placeholder="https://example.com/title-image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioUrl">Audio File URL *</Label>
                <Input
                  id="audioUrl"
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  placeholder="https://example.com/audio.mp3"
                  required
                />
              </div>
            </TabsContent>
          </Tabs>

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
