import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { SongView } from '../backend';
import { usePlaySong } from '../hooks/useQueries';
import { useAddListeningTime } from '../hooks/useListeningTime';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface PlayerContextType {
  currentSong: SongView | null;
  queue: SongView[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  play: (song: SongView, newQueue?: SongView[], shuffleMode?: boolean, repeatMode?: boolean) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<SongView | null>(null);
  const [queue, setQueue] = useState<SongView[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [hasIncrementedPlay, setHasIncrementedPlay] = useState(false);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  
  const playSongMutation = usePlaySong();
  const addListeningTimeMutation = useAddListeningTime();
  const { identity } = useInternetIdentity();
  
  const isAuthenticated = !!identity;

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Persist listening time
  const persistListeningTime = useCallback(() => {
    if (isAuthenticated && accumulatedTime > 0) {
      addListeningTimeMutation.mutate(Math.floor(accumulatedTime));
      setAccumulatedTime(0);
      lastUpdateTimeRef.current = Date.now();
    }
  }, [isAuthenticated, accumulatedTime, addListeningTimeMutation]);

  // Handle song change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const audioUrl = currentSong.audioFile?.getDirectURL?.() || '';
    if (audioUrl) {
      audio.src = audioUrl;
      audio.load();
      setHasIncrementedPlay(false);
      setAccumulatedTime(0);
      lastUpdateTimeRef.current = 0;
      
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [currentSong]);

  // Audio event listeners
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
      next();
    };

    const handlePause = () => {
      persistListeningTime();
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [isPlaying, isAuthenticated, persistListeningTime]);

  // Periodic listening time persistence
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && isPlaying && accumulatedTime >= 10) {
        persistListeningTime();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isPlaying, accumulatedTime, persistListeningTime]);

  // Background playback support
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Keep playing when tab is hidden
      if (document.hidden && isPlaying && audioRef.current) {
        // Ensure audio continues
        audioRef.current.play().catch(() => {
          // Platform may have paused it, state will sync on next play
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);

  const play = useCallback((song: SongView, newQueue?: SongView[], shuffleMode?: boolean, repeatMode?: boolean) => {
    setCurrentSong(song);
    if (newQueue) setQueue(newQueue);
    if (shuffleMode !== undefined) setShuffle(shuffleMode);
    if (repeatMode !== undefined) setRepeat(repeatMode);
    setIsPlaying(true);
    
    if (!hasIncrementedPlay) {
      playSongMutation.mutate(song.id);
      setHasIncrementedPlay(true);
    }
  }, [hasIncrementedPlay, playSongMutation]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      persistListeningTime();
    }
  }, [persistListeningTime]);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      pause();
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        lastUpdateTimeRef.current = Date.now();
        
        if (!hasIncrementedPlay) {
          playSongMutation.mutate(currentSong.id);
          setHasIncrementedPlay(true);
        }
      } catch (error) {
        console.error('Playback error:', error);
      }
    }
  }, [currentSong, isPlaying, hasIncrementedPlay, pause, playSongMutation]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    
    const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
    let nextIndex: number;
    
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (repeat && currentIndex === queue.length - 1) {
      nextIndex = 0;
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }
    
    play(queue[nextIndex], queue, shuffle, repeat);
  }, [queue, currentSong, shuffle, repeat, play]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;
    
    const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    
    play(queue[prevIndex], queue, shuffle, repeat);
  }, [queue, currentSong, shuffle, repeat, play]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolumeState(newVolume);
    }
  }, []);

  const value: PlayerContextType = {
    currentSong,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    play,
    pause,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    setShuffle,
    setRepeat,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
