import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Music2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';
import {
  useGetUserPlaylists,
  useAddToPlaylist,
  useRemoveFromPlaylist,
} from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { SongView } from '../../backend';

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
  const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null);

  const handleTogglePlaylist = async (playlistName: string, isCurrentlyInPlaylist: boolean) => {
    if (!isAuthenticated) {
      onOpenChange(false);
      requireAuth({
        type: 'add-to-playlist',
        songId: song.id,
        playlistName,
      });
      return;
    }

    setLoadingPlaylist(playlistName);
    
    try {
      if (isCurrentlyInPlaylist) {
        await removeFromPlaylistMutation.mutateAsync({
          playlistName,
          songId: song.id,
        });
        toast.success(`Removed from "${playlistName}"`);
      } else {
        await addToPlaylistMutation.mutateAsync({
          playlistName,
          songId: song.id,
        });
        toast.success(`Added to "${playlistName}"`);
      }
    } catch (error: any) {
      if (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Only users can')
      ) {
        onOpenChange(false);
        requireAuth({
          type: 'add-to-playlist',
          songId: song.id,
          playlistName,
        });
      } else {
        toast.error('Failed to update playlist');
      }
      console.error(error);
    } finally {
      setLoadingPlaylist(null);
    }
  };

  const content = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !playlists || playlists.length === 0 ? (
        <div className="text-center py-12">
          <Music2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No playlists yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a playlist first
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {playlists.map((playlist) => {
              const isInPlaylist = playlist.songIds.some((id) => id === song.id);
              const isThisLoading = loadingPlaylist === playlist.name;
              
              return (
                <div
                  key={playlist.name}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => !isThisLoading && handleTogglePlaylist(playlist.name, isInPlaylist)}
                >
                  {isThisLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Checkbox checked={isInPlaylist} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
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
