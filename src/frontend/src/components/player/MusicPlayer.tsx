import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SongEngagementBar } from '../songs/SongEngagementBar';
import { usePlaySong } from '../../hooks/useQueries';
import type { SongView } from '../../backend';

interface MusicPlayerProps {
  song: SongView | null;
  onNext: () => void;
  onPrevious: () => void;
}

export function MusicPlayer({ song, onNext, onPrevious }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hasIncrementedPlay, setHasIncrementedPlay] = useState(false);
  const playSongMutation = usePlaySong();

  useEffect(() => {
    if (audioRef.current && song) {
      const audioUrl = song.audioFile?.getDirectURL?.() || '';
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setHasIncrementedPlay(false);
        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    }
  }, [song]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onNext]);

  const togglePlay = async () => {
    if (!audioRef.current || !song) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        
        // Increment play count only once per song load
        if (!hasIncrementedPlay) {
          playSongMutation.mutate(song.id);
          setHasIncrementedPlay(true);
        }
      } catch (error) {
        console.error('Playback error:', error);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!song) {
    return (
      <Card className="card-shadow-custom">
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Select a song to start playing</p>
        </CardContent>
      </Card>
    );
  }

  const titleImageUrl = song.titleImage?.getDirectURL?.() || '';
  const albumArtUrl = song.albumArt?.getDirectURL?.() || '';
  const displayImage = titleImageUrl || albumArtUrl;

  return (
    <Card className="card-shadow-custom">
      <CardContent className="p-6 space-y-6">
        <audio ref={audioRef} />
        
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-card shrink-0">
            {displayImage ? (
              <img
                src={displayImage}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Volume2 className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate neon-glow">{song.title}</h2>
            <p className="text-lg text-muted-foreground truncate">{song.artist}</p>
            
            <div className="mt-2">
              <SongEngagementBar song={song} variant="default" />
            </div>
            
            <div className="mt-4 space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button
                size="icon"
                variant="outline"
                onClick={onPrevious}
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                size="icon"
                className="w-14 h-14 rounded-full neon-glow"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play className="w-6 h-6" fill="currentColor" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="outline"
                onClick={onNext}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </div>
        
        {song.lyrics && (
          <div className="border-t border-border/50 pt-4">
            <h3 className="font-semibold mb-2">Lyrics</h3>
            <ScrollArea className="h-48 rounded-md border border-border/50 p-4">
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                {song.lyrics}
              </pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
