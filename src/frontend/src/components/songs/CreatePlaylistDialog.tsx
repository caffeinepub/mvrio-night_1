import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';
import { useCreatePlaylist, useAddToPlaylist } from '@/hooks/useQueries';
import { isSignInRequiredError } from '@/utils/authorizationErrors';
import { toast } from 'sonner';
import type { SongView } from '@/backend';

interface CreatePlaylistDialogProps {
  song: SongView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlaylistDialog({ song, open, onOpenChange }: CreatePlaylistDialogProps) {
  const isMobile = useIsMobile();
  const { isAuthenticated, requireAuth } = useAuth();
  const [playlistName, setPlaylistName] = useState('');
  
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
      if (isSignInRequiredError(error)) {
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
        console.error(error);
      }
    }
  };

  const content = (
    <>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="playlist-name">Playlist Name</Label>
          <Input
            id="playlist-name"
            placeholder="My Playlist"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && playlistName.trim()) {
                handleCreate();
              }
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          "{song.title}" will be added to this playlist
        </p>
      </div>
    </>
  );

  const footer = (
    <div className="flex gap-2 w-full">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={createPlaylistMutation.isPending}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button
        onClick={handleCreate}
        disabled={!playlistName.trim() || createPlaylistMutation.isPending}
        className="flex-1"
      >
        {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
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
          <div className="px-4">
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
      <DialogContent className="sm:max-w-md">
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
