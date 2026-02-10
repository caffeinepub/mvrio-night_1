import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useGetUserPlaylists, useAddToPlaylist, useRemoveFromPlaylist } from '@/hooks/useQueries';
import { isSignInRequiredError } from '@/utils/authorizationErrors';
import { toast } from 'sonner';
import type { SongView } from '@/backend';

interface PlaylistChooserDialogProps {
  song: SongView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlaylistChooserDialog({ song, open, onOpenChange }: PlaylistChooserDialogProps) {
  const isMobile = useIsMobile();
  const { isAuthenticated, requireAuth } = useAuth();
  const { data: playlists, isLoading } = useGetUserPlaylists();
  const addToPlaylistMutation = useAddToPlaylist();
  const removeFromPlaylistMutation = useRemoveFromPlaylist();
  
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (playlists && open) {
      const initialSelected = new Set<string>();
      playlists.forEach((playlist) => {
        if (playlist.songIds.includes(song.id)) {
          initialSelected.add(playlist.name);
        }
      });
      setSelectedPlaylists(initialSelected);
    }
  }, [playlists, song.id, open]);

  const handleTogglePlaylist = async (playlistName: string, isCurrentlySelected: boolean) => {
    if (!isAuthenticated) {
      onOpenChange(false);
      requireAuth({
        type: 'add-to-playlist',
        songId: song.id,
        playlistName,
      });
      return;
    }

    try {
      if (isCurrentlySelected) {
        await removeFromPlaylistMutation.mutateAsync({
          playlistName,
          songId: song.id,
        });
        setSelectedPlaylists((prev) => {
          const next = new Set(prev);
          next.delete(playlistName);
          return next;
        });
        toast.success(`Removed from "${playlistName}"`);
      } else {
        await addToPlaylistMutation.mutateAsync({
          playlistName,
          songId: song.id,
        });
        setSelectedPlaylists((prev) => new Set(prev).add(playlistName));
        toast.success(`Added to "${playlistName}"`);
      }
    } catch (error: any) {
      if (isSignInRequiredError(error)) {
        onOpenChange(false);
        requireAuth({
          type: 'add-to-playlist',
          songId: song.id,
          playlistName,
        });
      } else {
        toast.error('Failed to update playlist');
        console.error(error);
      }
    }
  };

  const content = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !playlists || playlists.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No playlists yet</p>
          <p className="text-sm mt-1">Create one from the overflow menu</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {playlists.map((playlist) => {
              const isSelected = selectedPlaylists.has(playlist.name);
              return (
                <div
                  key={playlist.name}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleTogglePlaylist(playlist.name, isSelected)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleTogglePlaylist(playlist.name, isSelected)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add to Playlist</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
