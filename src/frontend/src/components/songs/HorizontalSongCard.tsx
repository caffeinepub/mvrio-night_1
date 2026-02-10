import { Play, Music, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SongEngagementBar } from './SongEngagementBar';
import { SongOverflowMenu } from './SongOverflowMenu';
import type { SongView } from '../../backend';

interface HorizontalSongCardProps {
  song: SongView;
  isPlaying: boolean;
  onPlay: () => void;
}

export function HorizontalSongCard({ song, isPlaying, onPlay }: HorizontalSongCardProps) {
  const titleImageUrl = song.titleImage?.getDirectURL?.() || '';
  const albumArtUrl = song.albumArt?.getDirectURL?.() || '';
  const displayImage = titleImageUrl || albumArtUrl;

  return (
    <div className="shrink-0 w-40 sm:w-48 group cursor-pointer" onClick={onPlay}>
      <div className="relative aspect-square rounded-lg overflow-hidden bg-card mb-3">
        {displayImage ? (
          <img
            src={displayImage}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Music className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            className={`rounded-full ${isPlaying ? 'neon-glow' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
          >
            <Play className="w-5 h-5" fill={isPlaying ? 'currentColor' : 'none'} />
          </Button>
        </div>
        
        <div 
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <SongOverflowMenu song={song} />
        </div>
      </div>
      
      <h3 className={`font-medium truncate text-sm ${isPlaying ? 'text-primary' : ''}`}>
        {song.title}
      </h3>
      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      <div className="mt-1">
        <SongEngagementBar song={song} variant="compact" showLikeButton={false} />
      </div>
    </div>
  );
}
