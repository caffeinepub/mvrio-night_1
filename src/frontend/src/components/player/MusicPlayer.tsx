import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SongEngagementBar } from '../songs/SongEngagementBar';
import { usePlaySong } from '../../hooks/useQueries';
import { useAddListeningTime } from '../../hooks/useListeningTime';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
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
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const lastUpdateTimeRef = useRef<number>(0);
  
  const playSongMutation = usePlaySong();
  const addListeningTimeMutation = useAddListeningTime();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (audioRef.current && song) {
      const audioUrl = song.audioFile?.getDirectURL?.() || '';
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setHasIncrementedPlay(false);
        setAccumulatedTime(0);
        lastUpdateTimeRef.current = 0;
        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    }
  }, [song]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const newTime = audio.currentTime;
      setCurrentTime(newTime);

      if (isAuthenticated && isPlaying && !audio.paused) {
        const now = Date.now();
        if (lastUpdateTimeRef.current > 0) {
          const delta = (now - lastUpdateTimeRef.current) / 1000;
          if (delta > 0 && delta < 5) {
            setAccumulatedTime(prev => prev + delta);
          }
        }
        lastUpdateTimeRef.current = now;
      }
    };

    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      persistListeningTime();
      onNext();
    };

    const handlePause = () => {
      persistListeningTime();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
  }, [onNext, isPlaying, isAuthenticated]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && isPlaying && accumulatedTime >= 10) {
        persistListeningTime();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isPlaying, accumulatedTime]);

  const persistListeningTime = () => {
    if (isAuthenticated && accumulatedTime > 0) {
      addListeningTimeMutation.mutate(Math.floor(accumulatedTime));
      setAccumulatedTime(0);
      lastUpdateTimeRef.current = Date.now();
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current || !song) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      persistListeningTime();
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        lastUpdateTimeRef.current = Date.now();
        
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevious}
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
            onClick={onNext}
            className="h-10 w-10"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>

        {song.lyrics && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2">Lyrics</h3>
            <ScrollArea className="h-32">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {song.lyrics}
              </p>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
