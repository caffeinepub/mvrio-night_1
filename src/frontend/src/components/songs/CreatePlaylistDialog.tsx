import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';
import { useCreatePlaylist, useAddToPlaylist } from '@/hooks/useQueries';
import { isSignInRequiredError } from '@/utils/authorizationErrors';
import { toast } from 'sonner';
import type { SongView } from '@/backend';
import { PlaylistEditorCard, PlaylistEditorData } from '../library/PlaylistEditorCard';

interface CreatePlaylistDialogProps {
  song: SongView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlaylistDialog({ song, open, onOpenChange }: CreatePlaylistDialogProps) {
  const isMobile = useIsMobile();
  const { isAuthenticated, requireAuth } = useAuth();
  
  const createPlaylistMutation = useCreatePlaylist();
  const addToPlaylistMutation = useAddToPlaylist();

  const handleSave = async (data: PlaylistEditorData) => {
    if (!isAuthenticated) {
      onOpenChange(false);
      requireAuth({
        type: 'create-playlist',
        songId: song.id,
        playlistName: data.name,
      });
      return;
    }

    try {
      await createPlaylistMutation.mutateAsync({
        name: data.name,
        description: data.description,
        titleImage: data.titleImage,
      });
      
      // Add the song to the newly created playlist
      await addToPlaylistMutation.mutateAsync({
        playlistName: data.name,
        songId: song.id,
      });
      
      toast.success(`Created "${data.name}" and added song`);
      onOpenChange(false);
    } catch (error: any) {
      if (isSignInRequiredError(error)) {
        onOpenChange(false);
        requireAuth({
          type: 'create-playlist',
          songId: song.id,
          playlistName: data.name,
        });
      } else if (error.message?.includes('already exists')) {
        toast.error('A playlist with this name already exists');
      } else {
        toast.error('Failed to create playlist');
        console.error(error);
      }
      throw error;
    }
  };

  const content = (
    <div className="py-4">
      <p className="text-sm text-muted-foreground mb-4">
        "{song.title}" will be added to this playlist
      </p>
      <PlaylistEditorCard
        mode="create"
        onSave={handleSave}
        onCancel={() => onOpenChange(false)}
        isSaving={createPlaylistMutation.isPending || addToPlaylistMutation.isPending}
      />
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
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
