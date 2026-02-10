import { useState } from 'react';
import { MoreVertical, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { usePlaylistFavorites } from '@/hooks/usePlaylistFavorites';
import { buildPlaylistDeepLink } from '@/utils/deepLinks';
import { shareViaWebShare, copyToClipboard, isWebShareSupported } from '@/utils/share';
import { toast } from 'sonner';

interface PlaylistOverflowMenuProps {
  playlistName: string;
  playlistType: 'user' | 'official';
}

export function PlaylistOverflowMenu({ playlistName, playlistType }: PlaylistOverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { requireAuth } = useAuth();
  const { identity } = useInternetIdentity();
  const { isFavorite, toggleFavorite, isToggling } = usePlaylistFavorites(playlistName);

  const isAuthenticated = !!identity;

  const handleAddToFavorites = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    // Close menu/drawer first
    setIsOpen(false);

    // Check authentication before attempting toggle
    if (!isAuthenticated) {
      // Trigger sign-in flow with pending action
      requireAuth({ type: 'playlist-favorites', playlistName });
      return;
    }
    
    try {
      await toggleFavorite();
    } catch (error: any) {
      // Error handling is done in the hook
      console.error('Toggle playlist favorite error:', error);
    }
  };

  const handleShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    // Close menu/drawer first to ensure user gesture context is preserved
    setIsOpen(false);

    // Small delay to ensure drawer is closed before share sheet opens
    await new Promise(resolve => setTimeout(resolve, 100));

    const deepLink = buildPlaylistDeepLink(playlistName, playlistType);
    const shareData = {
      title: `${playlistName} - MVRIO Night`,
      text: `Check out this playlist: ${playlistName}`,
      url: deepLink,
    };

    if (isWebShareSupported()) {
      const result = await shareViaWebShare(shareData);
      
      if (result.success) {
        // Successfully shared via native share sheet
        return;
      } else if (result.reason === 'cancelled') {
        // User cancelled, do nothing (no error toast)
        return;
      } else {
        // Share failed (non-cancel error), fall back to clipboard
        const copied = await copyToClipboard(deepLink);
        if (copied) {
          toast.success('Link copied to clipboard');
        } else {
          toast.error('Failed to copy link');
        }
      }
    } else {
      // Web Share not supported, use clipboard
      const copied = await copyToClipboard(deepLink);
      if (copied) {
        toast.success('Link copied to clipboard');
      } else {
        toast.error('Failed to copy link');
      }
    }
  };

  const menuItems = (
    <>
      <button
        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
        onClick={handleAddToFavorites}
        disabled={isToggling}
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-primary' : ''}`} />
        <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
      </button>
      <button
        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
        onClick={handleShare}
      >
        <Share2 className="w-5 h-5" />
        <span>Share</span>
      </button>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(true);
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent onClick={(e) => e.stopPropagation()}>
            <DrawerHeader>
              <DrawerTitle>{playlistName}</DrawerTitle>
            </DrawerHeader>
            <div className="py-2">
              {menuItems}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={handleAddToFavorites}
          disabled={isToggling}
          className="gap-3 cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-primary' : ''}`} />
          <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="gap-3 cursor-pointer">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
