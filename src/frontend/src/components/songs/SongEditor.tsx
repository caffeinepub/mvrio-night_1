import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAddSong } from '../../hooks/useQueries';
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

  const addSongMutation = useAddSong();

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

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await handleFileToDataURL(file);
      setFormData({ ...formData, albumArtUrl: dataUrl });
      toast.success('Cover image loaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load cover image');
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
    
    if (!formData.title || !formData.artist || !formData.audioUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addSongMutation.mutateAsync(formData);
      toast.success('Song added successfully!');
      setFormData({
        title: '',
        artist: '',
        albumArtUrl: '',
        titleImageUrl: '',
        audioUrl: '',
        lyrics: '',
      });
      setOpen(false);
    } catch (error) {
      toast.error('Failed to add song');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
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
              className="dark:text-white"
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
              className="dark:text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Audio Source *</Label>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Input
                  type="url"
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  placeholder="https://example.com/song.mp3"
                  className="dark:text-white"
                />
              </TabsContent>
              <TabsContent value="file" className="space-y-2">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="dark:text-white"
                />
                <p className="text-xs text-muted-foreground">Max file size: 10MB</p>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <Label>Album Art</Label>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Input
                  type="url"
                  value={formData.albumArtUrl}
                  onChange={(e) => setFormData({ ...formData, albumArtUrl: e.target.value })}
                  placeholder="https://example.com/cover.jpg"
                  className="dark:text-white"
                />
              </TabsContent>
              <TabsContent value="file" className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="dark:text-white"
                />
                <p className="text-xs text-muted-foreground">Max file size: 10MB</p>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <Label>Title Image</Label>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Input
                  type="url"
                  value={formData.titleImageUrl}
                  onChange={(e) => setFormData({ ...formData, titleImageUrl: e.target.value })}
                  placeholder="https://example.com/title.jpg"
                  className="dark:text-white"
                />
              </TabsContent>
              <TabsContent value="file" className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleTitleImageFileChange}
                  className="dark:text-white"
                />
                <p className="text-xs text-muted-foreground">Max file size: 10MB</p>
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
              rows={8}
              className="dark:text-white"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addSongMutation.isPending} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {addSongMutation.isPending ? 'Adding...' : 'Add Song'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
