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
import { useState, useRef } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
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

type PendingAction = 'offline-cache' | 'device-download' | null;

export function SongOverflowMenu({ song }: SongOverflowMenuProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [playlistChooserOpen, setPlaylistChooserOpen] = useState(false);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [downloadChooserOpen, setDownloadChooserOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const pendingActionRef = useRef<PendingAction>(null);
  
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const toggleFavoriteMutation = useToggleFavorite();
  const { data: favorites } = useGetFavorites();
  const isFavorite = favorites?.includes(song.id) || false;
  
  const audioUrl = song.audioFile?.getDirectURL?.() || '';
  const canDownload = hasUsableAudioUrl(audioUrl);

  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add favorites');
      setOpen(false);
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
    } catch (error) {
      toast.error('Failed to update favorites');
      console.error(error);
    }
  };

  const handleAddToPlaylist = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to manage playlists');
      setOpen(false);
      return;
    }
    
    setOpen(false);
    setPlaylistChooserOpen(true);
  };

  const handleCreateNewPlaylist = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create playlists');
      setOpen(false);
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

  const executeOfflineCache = async () => {
    try {
      await cacheAudioForOffline(audioUrl, song.title);
      toast.success('Saved for offline');
      setDownloadChooserOpen(false);
    } catch (error) {
      toast.error('Failed to save for offline');
      console.error(error);
    }
  };

  const executeDeviceDownload = async () => {
    try {
      await downloadSong(audioUrl, song.title);
      toast.success('Download started');
      setDownloadChooserOpen(false);
    } catch (error) {
      toast.error('Failed to download song');
      console.error(error);
    }
  };

  const handleOfflineCache = async () => {
    if (!isAuthenticated) {
      pendingActionRef.current = 'offline-cache';
      setDownloadChooserOpen(false);
      setIsAuthenticating(true);
      
      try {
        await login();
        // After successful login, execute the pending action
        if (pendingActionRef.current === 'offline-cache') {
          await executeOfflineCache();
        }
      } catch (error) {
        toast.error('Sign-in required to download');
        console.error(error);
      } finally {
        setIsAuthenticating(false);
        pendingActionRef.current = null;
      }
      return;
    }
    
    await executeOfflineCache();
  };

  const handleDeviceDownload = async () => {
    if (!isAuthenticated) {
      pendingActionRef.current = 'device-download';
      setDownloadChooserOpen(false);
      setIsAuthenticating(true);
      
      try {
        await login();
        // After successful login, execute the pending action
        if (pendingActionRef.current === 'device-download') {
          await executeDeviceDownload();
        }
      } catch (error) {
        toast.error('Sign-in required to download');
        console.error(error);
      } finally {
        setIsAuthenticating(false);
        pendingActionRef.current = null;
      }
      return;
    }
    
    await executeDeviceDownload();
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
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
        
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
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
          isLoading={isAuthenticating || loginStatus === 'logging-in'}
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
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
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
        isLoading={isAuthenticating || loginStatus === 'logging-in'}
      />
    </>
  );
}
