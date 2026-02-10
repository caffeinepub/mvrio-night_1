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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Music2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useGetUserPlaylists, useAddToPlaylist, useRemoveFromPlaylist, useGetPlaylistDetails } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { SongView } from '../../backend';

interface PlaylistChooserDialogProps {
  song: SongView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlaylistChooserDialog({ song, open, onOpenChange }: PlaylistChooserDialogProps) {
  const isMobile = useIsMobile();
  const { data: playlists, isLoading } = useGetUserPlaylists();
  const addToPlaylistMutation = useAddToPlaylist();
  const removeFromPlaylistMutation = useRemoveFromPlaylist();
  const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null);

  const handleTogglePlaylist = async (playlistName: string, isInPlaylist: boolean) => {
    setLoadingPlaylist(playlistName);
    
    try {
      if (isInPlaylist) {
        await removeFromPlaylistMutation.mutateAsync({ playlistName, songId: song.id });
        toast.success(`Removed from ${playlistName}`);
      } else {
        await addToPlaylistMutation.mutateAsync({ playlistName, songId: song.id });
        toast.success(`Added to ${playlistName}`);
      }
    } catch (error) {
      toast.error('Failed to update playlist');
      console.error(error);
    } finally {
      setLoadingPlaylist(null);
    }
  };

  const content = (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : playlists && playlists.length > 0 ? (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {playlists.map((playlist) => {
              const isInPlaylist = playlist.songIds.includes(song.id);
              const isLoading = loadingPlaylist === playlist.name;
              
              return (
                <div
                  key={playlist.name}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => !isLoading && handleTogglePlaylist(playlist.name, isInPlaylist)}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Checkbox checked={isInPlaylist} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                  <Music2 className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No playlists yet</p>
          <p className="text-sm mt-1">Create your first playlist to get started</p>
        </div>
      )}
    </div>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
