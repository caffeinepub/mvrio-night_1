import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SongEngagementBar } from '../songs/SongEngagementBar';
import { usePlayer } from '../../context/PlayerContext';
import { useEffect } from 'react';

export function PersistentMusicPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    setShuffle,
    setRepeat,
  } = usePlayer();

  // Media Session API for background controls
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;

    const titleImageUrl = currentSong.titleImage?.getDirectURL?.() || '';
    const albumArtUrl = currentSong.albumArt?.getDirectURL?.() || '';
    const artwork = titleImageUrl || albumArtUrl;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      artwork: artwork ? [
        { src: artwork, sizes: '512x512', type: 'image/jpeg' }
      ] : [],
    });

    navigator.mediaSession.setActionHandler('play', togglePlay);
    navigator.mediaSession.setActionHandler('pause', togglePlay);
    navigator.mediaSession.setActionHandler('previoustrack', previous);
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime);
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [currentSong, togglePlay, next, previous, seek]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return (
      <Card className="card-shadow-custom">
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Select a song to start playing</p>
        </CardContent>
      </Card>
    );
  }

  const titleImageUrl = currentSong.titleImage?.getDirectURL?.() || '';
  const albumArtUrl = currentSong.albumArt?.getDirectURL?.() || '';
  const displayImage = titleImageUrl || albumArtUrl;

  return (
    <Card className="card-shadow-custom">
      <CardContent className="p-6 space-y-6">
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-card shrink-0">
            {displayImage ? (
              <img
                src={displayImage}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Volume2 className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate neon-glow">{currentSong.title}</h2>
            <p className="text-lg text-muted-foreground truncate">{currentSong.artist}</p>
            
            <div className="mt-2">
              <SongEngagementBar song={currentSong} variant="default" />
            </div>
            
            <div className="mt-4 space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={(value) => seek(value[0])}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant={shuffle ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShuffle(!shuffle)}
            className="h-10 w-10"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={previous}
            className="h-10 w-10"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          
          <Button
            size="icon"
            onClick={togglePlay}
            className="h-14 w-14 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            className="h-10 w-10"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
          
          <Button
            variant={repeat ? 'default' : 'outline'}
            size="icon"
            onClick={() => setRepeat(!repeat)}
            className="h-10 w-10"
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={(value) => setVolume(value[0])}
            className="w-24"
          />
        </div>

        {currentSong.lyrics && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2">Lyrics</h3>
            <ScrollArea className="h-32">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {currentSong.lyrics}
              </p>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
