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
import { useAuth } from '@/context/AuthContext';
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
  const { isAuthenticated, requireAuth } = useAuth();
  
  const createPlaylistMutation = useCreatePlaylist();
  const addToPlaylistMutation = useAddToPlaylist();

  const handleCreate = async () => {
    if (!isAuthenticated) {
      onOpenChange(false);
      requireAuth({
        type: 'create-playlist',
        songId: song.id,
        playlistName: playlistName.trim(),
      });
      return;
    }

    if (!playlistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    try {
      await createPlaylistMutation.mutateAsync(playlistName.trim());
      
      // Add the song to the newly created playlist
      await addToPlaylistMutation.mutateAsync({
        playlistName: playlistName.trim(),
        songId: song.id,
      });
      
      toast.success(`Created "${playlistName}" and added song`);
      setPlaylistName('');
      onOpenChange(false);
    } catch (error: any) {
      if (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Only users can')
      ) {
        onOpenChange(false);
        requireAuth({
          type: 'create-playlist',
          songId: song.id,
          playlistName: playlistName.trim(),
        });
      } else if (error.message?.includes('already exists')) {
        toast.error('A playlist with this name already exists');
      } else {
        toast.error('Failed to create playlist');
      }
      console.error(error);
    }
  };

  const isLoading = createPlaylistMutation.isPending || addToPlaylistMutation.isPending;

  const content = (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="playlist-name">Playlist Name</Label>
          <Input
            id="playlist-name"
            placeholder="My Awesome Playlist"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleCreate();
              }
            }}
            disabled={isLoading}
            autoFocus
          />
        </div>
        <p className="text-sm text-muted-foreground">
          "{song.title}" will be added to this playlist
        </p>
      </div>
    </>
  );

  const actions = (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button
        onClick={handleCreate}
        disabled={isLoading || !playlistName.trim()}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create & Add
      </Button>
    </>
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
          <DrawerFooter className="flex-row gap-2">
            {actions}
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
          {actions}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
