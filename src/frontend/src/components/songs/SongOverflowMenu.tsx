import { MoreVertical, ListPlus, Plus, Heart, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';
import { useToggleFavorite, useGetFavorites } from '@/hooks/useQueries';
import { hasUsableAudioUrl, downloadSong } from '@/utils/download';
import { cacheAudioForOffline } from '@/utils/offlineAudioCache';
import { buildSongDeepLink } from '@/utils/deepLinks';
import { isWebShareSupported, shareViaWebShare, copyToClipboard } from '@/utils/share';
import { toast } from 'sonner';
import { PlaylistChooserDialog } from './PlaylistChooserDialog';
import { CreatePlaylistDialog } from './CreatePlaylistDialog';
import { DownloadChooserDialog } from './DownloadChooserDialog';
import type { SongView } from '../../backend';

interface SongOverflowMenuProps {
  song: SongView;
}

export function SongOverflowMenu({ song }: SongOverflowMenuProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [playlistChooserOpen, setPlaylistChooserOpen] = useState(false);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [downloadChooserOpen, setDownloadChooserOpen] = useState(false);
  
  const { isAuthenticated, requireAuth } = useAuth();
  
  const toggleFavoriteMutation = useToggleFavorite();
  const { data: favorites } = useGetFavorites();
  const isFavorite = favorites?.includes(song.id) || false;
  
  const audioUrl = song.audioFile?.getDirectURL?.() || '';
  const canDownload = hasUsableAudioUrl(audioUrl);

  const handleMenuTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    setOpen(true);
  };

  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      setOpen(false);
      requireAuth({
        type: 'like',
        songId: song.id,
      });
      return;
    }
    
    try {
      const wasRemoved = await toggleFavoriteMutation.mutateAsync(song.id);
      if (wasRemoved) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites');
      }
      setOpen(false);
    } catch (error: any) {
      if (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Only users can')
      ) {
        setOpen(false);
        requireAuth({
          type: 'like',
          songId: song.id,
        });
      } else {
        toast.error('Failed to update favorites');
        console.error(error);
      }
    }
  };

  const handleAddToPlaylist = () => {
    if (!isAuthenticated) {
      setOpen(false);
      requireAuth({
        type: 'add-to-playlist',
        songId: song.id,
      });
      return;
    }
    
    setOpen(false);
    setPlaylistChooserOpen(true);
  };

  const handleCreateNewPlaylist = () => {
    if (!isAuthenticated) {
      setOpen(false);
      requireAuth({
        type: 'create-playlist',
        songId: song.id,
      });
      return;
    }
    
    setOpen(false);
    setCreatePlaylistOpen(true);
  };

  const handleDownloadClick = () => {
    if (!canDownload) {
      toast.error('No audio file available');
      setOpen(false);
      return;
    }
    
    setOpen(false);
    setDownloadChooserOpen(true);
  };

  const handleOfflineCache = async () => {
    if (!isAuthenticated) {
      setDownloadChooserOpen(false);
      requireAuth({
        type: 'offline-cache',
        songId: song.id,
        audioUrl,
        songTitle: song.title,
      });
      return;
    }
    
    try {
      await cacheAudioForOffline(audioUrl, song.title);
      toast.success('Saved for offline');
      setDownloadChooserOpen(false);
    } catch (error: any) {
      if (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Only users can')
      ) {
        setDownloadChooserOpen(false);
        requireAuth({
          type: 'offline-cache',
          songId: song.id,
          audioUrl,
          songTitle: song.title,
        });
      } else {
        toast.error('Failed to save for offline');
        console.error(error);
      }
    }
  };

  const handleDeviceDownload = async () => {
    if (!isAuthenticated) {
      setDownloadChooserOpen(false);
      requireAuth({
        type: 'device-download',
        songId: song.id,
        audioUrl,
        songTitle: song.title,
      });
      return;
    }
    
    try {
      await downloadSong(audioUrl, song.title);
      toast.success('Download started');
      setDownloadChooserOpen(false);
    } catch (error: any) {
      if (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Only users can')
      ) {
        setDownloadChooserOpen(false);
        requireAuth({
          type: 'device-download',
          songId: song.id,
          audioUrl,
          songTitle: song.title,
        });
      } else {
        toast.error('Failed to download song');
        console.error(error);
      }
    }
  };

  const handleShare = async () => {
    const deepLink = buildSongDeepLink(song.id);
    const shareData = {
      title: song.title,
      text: `Listen to ${song.title} by ${song.artist}`,
      url: deepLink,
    };
    
    if (isWebShareSupported()) {
      const shared = await shareViaWebShare(shareData);
      if (shared) {
        setOpen(false);
      }
    } else {
      const copied = await copyToClipboard(deepLink);
      if (copied) {
        toast.success('Link copied');
        setOpen(false);
      } else {
        toast.error('Failed to copy link');
      }
    }
  };

  const menuItems = (
    <>
      <div
        className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
        onClick={handleAddToPlaylist}
      >
        <ListPlus className="w-4 h-4" />
        <span>Add to Playlist</span>
      </div>
      
      <div
        className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
        onClick={handleCreateNewPlaylist}
      >
        <Plus className="w-4 h-4" />
        <span>Create New Playlist</span>
      </div>
      
      <div className="h-px bg-border my-1" />
      
      <div
        className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
        onClick={handleAddToFavorites}
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-primary' : ''}`} />
        <span>Add to Favorites</span>
      </div>
      
      {canDownload && (
        <div
          className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
          onClick={handleDownloadClick}
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </div>
      )}
      
      <div
        className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={handleMenuTriggerClick}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
        
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent onClick={(e) => e.stopPropagation()}>
            <DrawerHeader>
              <DrawerTitle>{song.title}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-1">
              {menuItems}
            </div>
          </DrawerContent>
        </Drawer>
        
        <PlaylistChooserDialog
          song={song}
          open={playlistChooserOpen}
          onOpenChange={setPlaylistChooserOpen}
        />
        
        <CreatePlaylistDialog
          song={song}
          open={createPlaylistOpen}
          onOpenChange={setCreatePlaylistOpen}
        />
        
        <DownloadChooserDialog
          open={downloadChooserOpen}
          onOpenChange={setDownloadChooserOpen}
          onOfflineCache={handleOfflineCache}
          onDeviceDownload={handleDeviceDownload}
          isLoading={false}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={handleMenuTriggerClick}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem onSelect={handleAddToPlaylist}>
            <ListPlus className="w-4 h-4 mr-2" />
            Add to Playlist
          </DropdownMenuItem>
          
          <DropdownMenuItem onSelect={handleCreateNewPlaylist}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Playlist
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onSelect={handleAddToFavorites}>
            <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current text-primary' : ''}`} />
            Add to Favorites
          </DropdownMenuItem>
          
          {canDownload && (
            <DropdownMenuItem onSelect={handleDownloadClick}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onSelect={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <PlaylistChooserDialog
        song={song}
        open={playlistChooserOpen}
        onOpenChange={setPlaylistChooserOpen}
      />
      
      <CreatePlaylistDialog
        song={song}
        open={createPlaylistOpen}
        onOpenChange={setCreatePlaylistOpen}
      />
      
      <DownloadChooserDialog
        open={downloadChooserOpen}
        onOpenChange={setDownloadChooserOpen}
        onOfflineCache={handleOfflineCache}
        onDeviceDownload={handleDeviceDownload}
        isLoading={false}
      />
    </>
  );
}
