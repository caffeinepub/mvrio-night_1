import { Heart, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSongEngagement } from '../../hooks/useSongEngagement';
import { useLikedSongs } from '../../hooks/useLikedSongs';
import type { SongView } from '../../backend';

interface SongEngagementBarProps {
  song: SongView;
  variant?: 'compact' | 'default';
  showLikeButton?: boolean;
}

export function SongEngagementBar({ song, variant = 'default', showLikeButton = true }: SongEngagementBarProps) {
  const { handleLike, isLiking } = useSongEngagement();
  const { isLiked, isAuthenticated } = useLikedSongs();

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent event from bubbling to parent elements
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    
    await handleLike(song.id);
  };

  const likesCount = Number(song.likesCount);
  const playCount = Number(song.playCount);
  const liked = isLiked(song.id);

  const isCompact = variant === 'compact';

  return (
    <div className={`flex items-center gap-3 ${isCompact ? 'text-xs' : 'text-sm'}`}>
      {showLikeButton && (
        <Button
          variant="ghost"
          size={isCompact ? 'sm' : 'default'}
          className={`gap-1.5 h-auto px-2 py-1 transition-all duration-200 ${
            liked 
              ? 'text-primary hover:text-primary' 
              : 'text-muted-foreground hover:text-primary'
          }`}
          onClick={handleLikeClick}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isLiking}
          style={{ pointerEvents: 'auto' }}
        >
          <Heart
            className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-all duration-200 ${
              isLiking ? 'scale-125' : 'scale-100'
            }`}
            fill={liked ? 'currentColor' : 'none'}
          />
          <span className="font-medium">{likesCount}</span>
        </Button>
      )}
      
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Play className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill="currentColor" />
        <span className="font-medium">{playCount}</span>
      </div>
    </div>
  );
}
