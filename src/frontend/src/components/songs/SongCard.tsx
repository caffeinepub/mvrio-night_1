import { Play, Trash2, Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SongEngagementBar } from './SongEngagementBar';
import { SongOverflowMenu } from './SongOverflowMenu';
import type { SongView } from '../../backend';

interface SongCardProps {
  song: SongView;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
}

export function SongCard({ song, isPlaying, onPlay, onDelete }: SongCardProps) {
  const albumArtUrl = song.albumArt?.getDirectURL?.() || '';
  const titleImageUrl = song.titleImage?.getDirectURL?.() || '';
  const displayImage = titleImageUrl || albumArtUrl;

  return (
    <Card 
      className="card-shadow-custom hover:scale-105 transition-transform duration-200 overflow-hidden cursor-pointer"
      onClick={onPlay}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square">
          {displayImage ? (
            <img
              src={displayImage}
              alt={song.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${displayImage ? 'hidden' : ''} w-full h-full bg-card flex items-center justify-center`}>
            <Music className="w-16 h-16 text-muted-foreground" />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end">
            <div className="p-4 w-full">
              <h3 className="font-semibold text-white truncate">{song.title}</h3>
              <p className="text-sm text-white/80 truncate">{song.artist}</p>
              <div className="mt-2">
                <SongEngagementBar song={song} variant="compact" />
              </div>
            </div>
          </div>
          
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className={`rounded-full ${isPlaying ? 'neon-glow' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
            >
              <Play className="w-4 h-4" fill={isPlaying ? 'currentColor' : 'none'} />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div onClick={(e) => e.stopPropagation()}>
              <SongOverflowMenu song={song} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
