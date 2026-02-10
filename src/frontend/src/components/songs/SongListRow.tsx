import { Play, Trash2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SongEngagementBar } from './SongEngagementBar';
import { SongOverflowMenu } from './SongOverflowMenu';
import type { SongView } from '../../backend';

interface SongListRowProps {
  song: SongView;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete?: () => void;
}

export function SongListRow({ song, isPlaying, onPlay, onDelete }: SongListRowProps) {
  const titleImageUrl = song.titleImage?.getDirectURL?.() || '';
  const albumArtUrl = song.albumArt?.getDirectURL?.() || '';
  const displayImage = titleImageUrl || albumArtUrl;

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-lg hover:bg-card/50 transition-colors group cursor-pointer"
      onClick={onPlay}
    >
      <div className="w-14 h-14 rounded overflow-hidden bg-muted shrink-0">
        {displayImage ? (
          <img
            src={displayImage}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium truncate ${isPlaying ? 'text-primary' : ''}`}>
          {song.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>
      
      <div className="hidden sm:block">
        <SongEngagementBar song={song} variant="compact" />
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant={isPlaying ? 'default' : 'ghost'}
          className={`rounded-full ${isPlaying ? 'neon-glow' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
        >
          <Play className="w-4 h-4" fill={isPlaying ? 'currentColor' : 'none'} />
        </Button>
        
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        
        <div onClick={(e) => e.stopPropagation()}>
          <SongOverflowMenu song={song} />
        </div>
      </div>
    </div>
  );
}
