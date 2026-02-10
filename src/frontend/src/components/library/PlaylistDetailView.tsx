import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Shuffle, Repeat, Loader2, Music } from 'lucide-react';
import { SongListRow } from '../songs/SongListRow';
import { useGetPlaylistDetails, useGetOfficialPlaylistDetails } from '@/hooks/useQueries';
import type { SongView } from '@/backend';

type PlaylistContext = {
  type: 'user' | 'official';
  name: string;
  songs: SongView[];
};

interface PlaylistDetailViewProps {
  playlist: PlaylistContext;
  onBack: () => void;
  onPlay: (songs: SongView[]) => void;
  onSongSelect: (songId: bigint) => void;
  currentSongId: bigint | null;
  isShuffled: boolean;
  onShuffleToggle: (songs: SongView[]) => void;
  repeatMode: 'off' | 'all';
  onRepeatToggle: () => void;
  playlistQueue: SongView[];
}

export function PlaylistDetailView({
  playlist,
  onBack,
  onPlay,
  onSongSelect,
  currentSongId,
  isShuffled,
  onShuffleToggle,
  repeatMode,
  onRepeatToggle,
  playlistQueue,
}: PlaylistDetailViewProps) {
  const [songs, setSongs] = useState<SongView[]>([]);
  
  // Fetch user playlist details
  const { 
    data: userPlaylistSongs, 
    isLoading: userPlaylistLoading 
  } = useGetPlaylistDetails(playlist.type === 'user' ? playlist.name : null);
  
  // Fetch official playlist details
  const { 
    data: officialPlaylistSongs, 
    isLoading: officialPlaylistLoading 
  } = useGetOfficialPlaylistDetails(playlist.type === 'official' ? playlist.name : null);

  useEffect(() => {
    if (playlist.type === 'user' && userPlaylistSongs) {
      setSongs(userPlaylistSongs);
    } else if (playlist.type === 'official' && officialPlaylistSongs) {
      setSongs(officialPlaylistSongs);
    }
  }, [playlist.type, userPlaylistSongs, officialPlaylistSongs]);

  const isLoading = playlist.type === 'user' ? userPlaylistLoading : officialPlaylistLoading;
  const displaySongs = playlistQueue.length > 0 ? playlistQueue : songs;

  const handlePlayAll = () => {
    if (songs.length > 0) {
      onPlay(songs);
    }
  };

  const handleShuffleClick = () => {
    onShuffleToggle(songs);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Playlists
        </Button>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Playlists
      </Button>

      {/* Playlist Info and Controls */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold neon-glow">{playlist.name}</h1>
          <p className="text-muted-foreground mt-1">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            {playlist.type === 'official' && ' • Official Playlist'}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            onClick={handlePlayAll}
            disabled={songs.length === 0}
            className="gap-2 neon-glow"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Play
          </Button>
          
          <Button
            size="icon"
            variant={isShuffled ? 'default' : 'outline'}
            onClick={handleShuffleClick}
            disabled={songs.length === 0}
            className={isShuffled ? 'neon-glow' : ''}
          >
            <Shuffle className="w-5 h-5" />
          </Button>
          
          <Button
            size="icon"
            variant={repeatMode === 'all' ? 'default' : 'outline'}
            onClick={onRepeatToggle}
            disabled={songs.length === 0}
            className={repeatMode === 'all' ? 'neon-glow' : ''}
          >
            <Repeat className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Songs List */}
      {displaySongs.length > 0 ? (
        <div className="space-y-2">
          {displaySongs.map((song) => (
            <SongListRow
              key={song.id.toString()}
              song={song}
              isPlaying={currentSongId === song.id}
              onPlay={() => onSongSelect(song.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No songs in this playlist yet</p>
          {playlist.type === 'user' && (
            <p className="text-sm mt-1">Add songs from the overflow menu</p>
          )}
        </div>
      )}
    </div>
  );
}
