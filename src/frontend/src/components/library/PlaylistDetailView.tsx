import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Shuffle, Repeat, Loader2, Music, Plus } from 'lucide-react';
import { SongListRow } from '../songs/SongListRow';
import { AddSongsToPlaylistModal } from './AddSongsToPlaylistModal';
import { useGetPlaylistDetails, useGetOfficialPlaylistDetails, useRemoveFromPlaylist, useRemoveFromOfficialPlaylist, useReorderPlaylist, useReorderOfficialPlaylist } from '@/hooks/useQueries';
import { useHiddenAdminMode } from '@/context/HiddenAdminModeContext';
import type { SongView } from '@/backend';
import { toast } from 'sonner';

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
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { isAdminModeEnabled } = useHiddenAdminMode();
  
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

  // Remove mutations
  const removeFromUserPlaylist = useRemoveFromPlaylist();
  const removeFromOfficialPlaylist = useRemoveFromOfficialPlaylist();

  // Reorder mutations
  const reorderUserPlaylist = useReorderPlaylist();
  const reorderOfficialPlaylist = useReorderOfficialPlaylist();

  useEffect(() => {
    if (playlist.type === 'user' && userPlaylistSongs) {
      setSongs(userPlaylistSongs);
    } else if (playlist.type === 'official' && officialPlaylistSongs) {
      setSongs(officialPlaylistSongs);
    }
  }, [playlist.type, userPlaylistSongs, officialPlaylistSongs]);

  const isLoading = playlist.type === 'user' ? userPlaylistLoading : officialPlaylistLoading;
  const displaySongs = playlistQueue.length > 0 ? playlistQueue : songs;

  // Check if editing is allowed
  const canEdit = playlist.type === 'user' || (playlist.type === 'official' && isAdminModeEnabled);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      onPlay(songs);
    }
  };

  const handleShuffleClick = () => {
    onShuffleToggle(songs);
  };

  const handleAddSongsClick = () => {
    if (playlist.type === 'official' && !isAdminModeEnabled) {
      toast.error('Admin permission required.');
      return;
    }
    setIsAddSongsModalOpen(true);
  };

  const handleRemoveSong = async (songId: bigint) => {
    if (!canEdit) {
      toast.error('Admin permission required.');
      return;
    }

    try {
      if (playlist.type === 'user') {
        await removeFromUserPlaylist.mutateAsync({
          playlistName: playlist.name,
          songId,
        });
      } else {
        await removeFromOfficialPlaylist.mutateAsync({
          playlistName: playlist.name,
          songId,
        });
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleDragStart = (index: number) => {
    if (!canEdit) {
      return;
    }
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!canEdit || draggedIndex === null) {
      return;
    }
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!canEdit || draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Create new order
    const newSongs = [...displaySongs];
    const [draggedSong] = newSongs.splice(draggedIndex, 1);
    newSongs.splice(dropIndex, 0, draggedSong);

    // Update local state immediately for smooth UX
    setSongs(newSongs);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Persist to backend
    const newOrder = newSongs.map(song => song.id);
    
    try {
      if (playlist.type === 'user') {
        await reorderUserPlaylist.mutateAsync({
          playlistName: playlist.name,
          newOrder,
        });
      } else {
        await reorderOfficialPlaylist.mutateAsync({
          playlistName: playlist.name,
          newOrder,
        });
      }
    } catch (error) {
      // Revert on error
      if (playlist.type === 'user' && userPlaylistSongs) {
        setSongs(userPlaylistSongs);
      } else if (playlist.type === 'official' && officialPlaylistSongs) {
        setSongs(officialPlaylistSongs);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Add Songs Button */}
          <Button
            variant="outline"
            onClick={handleAddSongsClick}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Songs
          </Button>
        </div>
      </div>

      {/* Songs List */}
      {displaySongs.length > 0 ? (
        <div className="space-y-2">
          {displaySongs.map((song, index) => (
            <SongListRow
              key={song.id.toString()}
              song={song}
              isPlaying={currentSongId === song.id}
              onPlay={() => onSongSelect(song.id)}
              onDelete={canEdit ? () => handleRemoveSong(song.id) : undefined}
              draggable={canEdit}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
              isDragOver={dragOverIndex === index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No songs in this playlist yet</p>
          <p className="text-sm mt-1">Click "Add Songs" to get started</p>
        </div>
      )}

      {/* Add Songs Modal */}
      <AddSongsToPlaylistModal
        open={isAddSongsModalOpen}
        onOpenChange={setIsAddSongsModalOpen}
        playlistName={playlist.name}
        playlistType={playlist.type}
        currentSongIds={songs.map(s => s.id)}
      />
    </div>
  );
}
