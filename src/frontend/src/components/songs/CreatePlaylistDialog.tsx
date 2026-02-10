import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCreatePlaylist, useAddToPlaylist } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { SongView } from '../../backend';

interface CreatePlaylistDialogProps {
  song: SongView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlaylistDialog({ song, open, onOpenChange }: CreatePlaylistDialogProps) {
  const isMobile = useIsMobile();
  const [playlistName, setPlaylistName] = useState('');
  const createPlaylistMutation = useCreatePlaylist();
  const addToPlaylistMutation = useAddToPlaylist();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!playlistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create the playlist
      await createPlaylistMutation.mutateAsync(playlistName.trim());
      
      // Add the song to the new playlist
      await addToPlaylistMutation.mutateAsync({
        playlistName: playlistName.trim(),
        songId: song.id,
      });
      
      toast.success(`Created "${playlistName}" and added song`);
      setPlaylistName('');
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        toast.error('A playlist with this name already exists');
      } else {
        toast.error('Failed to create playlist');
      }
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate();
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="playlist-name">Playlist Name</Label>
        <Input
          id="playlist-name"
          placeholder="My Awesome Playlist"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isCreating}
          autoFocus
        />
      </div>
    </div>
  );

  const footer = (
    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isCreating}
      >
        Cancel
      </Button>
      <Button
        onClick={handleCreate}
        disabled={isCreating || !playlistName.trim()}
      >
        {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create & Add
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create New Playlist</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
          <DrawerFooter>
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter>
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
