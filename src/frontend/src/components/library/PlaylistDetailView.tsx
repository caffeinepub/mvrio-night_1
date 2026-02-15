import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Shuffle, Repeat, Loader2, Music, Plus, Edit } from 'lucide-react';
import { SongListRow } from '../songs/SongListRow';
import { AddSongsToPlaylistModal } from './AddSongsToPlaylistModal';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetPlaylistDetails, useGetOfficialPlaylistDetails, useGetPlaylist, useGetOfficialPlaylist, useRemoveFromPlaylist, useRemoveFromOfficialPlaylist, useReorderPlaylist, useReorderOfficialPlaylist, useUpdatePlaylist, useUpdateOfficialPlaylist } from '@/hooks/useQueries';
import { useHiddenAdminMode } from '@/context/HiddenAdminModeContext';
import type { SongView } from '@/backend';
import { toast } from 'sonner';
import { PlaylistEditorCard, PlaylistEditorData } from './PlaylistEditorCard';

interface PlaylistDetailViewProps {
  playlistName: string;
  playlistType: 'user' | 'official';
  onBack: () => void;
  onPlaySong: (song: SongView, queue: SongView[], shuffle: boolean, repeat: boolean) => void;
  currentSongId: bigint | null;
  isPlaying: boolean;
  onPlaylistRenamed?: (oldName: string, newName: string) => void;
}

export function PlaylistDetailView({
  playlistName,
  playlistType,
  onBack,
  onPlaySong,
  currentSongId,
  isPlaying,
  onPlaylistRenamed,
}: PlaylistDetailViewProps) {
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const { isAdminModeEnabled } = useHiddenAdminMode();
  
  const isOfficial = playlistType === 'official';
  
  const { data: userPlaylistDetails, isLoading: userLoading } = useGetPlaylistDetails(
    !isOfficial ? playlistName : null
  );
  const { data: officialPlaylistDetails, isLoading: officialLoading } = useGetOfficialPlaylistDetails(
    isOfficial ? playlistName : null
  );
  const { data: userPlaylist } = useGetPlaylist(!isOfficial ? playlistName : null);
  const { data: officialPlaylist } = useGetOfficialPlaylist(isOfficial ? playlistName : null);
  
  const removeFromPlaylistMutation = useRemoveFromPlaylist();
  const removeFromOfficialPlaylistMutation = useRemoveFromOfficialPlaylist();
  const reorderPlaylistMutation = useReorderPlaylist();
  const reorderOfficialPlaylistMutation = useReorderOfficialPlaylist();
  const updatePlaylistMutation = useUpdatePlaylist();
  const updateOfficialPlaylistMutation = useUpdateOfficialPlaylist();
  
  const songs = isOfficial ? officialPlaylistDetails : userPlaylistDetails;
  const isLoading = isOfficial ? officialLoading : userLoading;
  const playlistData = isOfficial ? officialPlaylist : userPlaylist;
  
  // Permission check: user playlists always editable, official only when admin mode is ON
  const canEdit = !isOfficial || isAdminModeEnabled;

  const handleRemoveSong = async (songId: bigint) => {
    try {
      if (isOfficial) {
        await removeFromOfficialPlaylistMutation.mutateAsync({
          playlistName,
          songId,
        });
      } else {
        await removeFromPlaylistMutation.mutateAsync({
          playlistName,
          songId,
        });
      }
      toast.success('Song removed from playlist');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove song');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || !songs) return;
    
    if (draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...songs];
    const [draggedSong] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedSong);
    
    const newOrderIds = newOrder.map(song => song.id);
    
    try {
      if (isOfficial) {
        await reorderOfficialPlaylistMutation.mutateAsync({
          playlistName,
          newOrder: newOrderIds,
        });
      } else {
        await reorderPlaylistMutation.mutateAsync({
          playlistName,
          newOrder: newOrderIds,
        });
      }
      toast.success('Playlist reordered');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reorder playlist');
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePlayAll = () => {
    if (!songs || songs.length === 0) return;
    onPlaySong(songs[0], songs, shuffle, repeat);
  };

  const handleUpdatePlaylist = async (data: PlaylistEditorData) => {
    try {
      if (isOfficial) {
        await updateOfficialPlaylistMutation.mutateAsync({
          oldName: playlistName,
          newName: data.name,
          description: data.description,
          titleImage: data.titleImage,
        });
      } else {
        await updatePlaylistMutation.mutateAsync({
          oldName: playlistName,
          newName: data.name,
          description: data.description,
          titleImage: data.titleImage,
        });
      }
      
      toast.success('Playlist updated');
      setIsEditDialogOpen(false);
      
      // Notify parent if name changed
      if (data.name !== playlistName && onPlaylistRenamed) {
        onPlaylistRenamed(playlistName, data.name);
      }
    } catch (error: any) {
      // Check for rename conflict
      if (error.message && error.message.includes('already exists')) {
        toast.error('A playlist with that name already exists');
      } else {
        toast.error(error.message || 'Failed to update playlist');
      }
      throw error;
    }
  };

  // Prepare initial data for editing
  const [currentPlaylistData, setCurrentPlaylistData] = useState<PlaylistEditorData | null>(null);
  
  useEffect(() => {
    if (isEditDialogOpen && playlistData) {
      setCurrentPlaylistData({
        name: playlistData.name,
        description: playlistData.description || '',
        titleImage: playlistData.titleImage || null,
      });
    }
  }, [isEditDialogOpen, playlistData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const titleImageUrl = playlistData?.titleImage?.getDirectURL?.() || '';

  return (
    <div className="space-y-6">
      {/* Header with title image */}
      <div className="flex items-start gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {titleImageUrl && (
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
            <img
              src={titleImageUrl}
              alt={playlistName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{playlistName}</h1>
          {playlistData?.description && (
            <p className="text-sm text-muted-foreground mt-1">{playlistData.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {songs?.length || 0} {songs?.length === 1 ? 'song' : 'songs'}
          </p>
        </div>
        
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="gap-2 shrink-0"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePlayAll}
          disabled={!songs || songs.length === 0}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          Play All
        </Button>
        <Button
          variant={shuffle ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShuffle(!shuffle)}
        >
          <Shuffle className="w-4 w-4" />
        </Button>
        <Button
          variant={repeat ? 'default' : 'outline'}
          size="icon"
          onClick={() => setRepeat(!repeat)}
        >
          <Repeat className="w-4 h-4" />
        </Button>
        {canEdit && (
          <Button
            variant="outline"
            onClick={() => setIsAddSongsModalOpen(true)}
            className="gap-2 ml-auto"
          >
            <Plus className="w-4 h-4" />
            Add Songs
          </Button>
        )}
      </div>

      {/* Song List */}
      {songs && songs.length > 0 ? (
        <div className="space-y-2">
          {songs.map((song, index) => (
            <SongListRow
              key={song.id.toString()}
              song={song}
              isPlaying={currentSongId === song.id && isPlaying}
              onPlay={() => onPlaySong(song, songs, shuffle, repeat)}
              onDelete={canEdit ? () => handleRemoveSong(song.id) : undefined}
              draggable={canEdit}
              onDragStart={canEdit ? () => handleDragStart(index) : undefined}
              onDragOver={canEdit ? (e) => handleDragOver(e, index) : undefined}
              onDragLeave={canEdit ? handleDragLeave : undefined}
              onDrop={canEdit ? (e) => handleDrop(e, index) : undefined}
              isDragging={draggedIndex === index}
              isDragOver={dragOverIndex === index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No songs in this playlist yet</p>
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsAddSongsModalOpen(true)}
              className="mt-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Songs
            </Button>
          )}
        </div>
      )}

      {/* Add Songs Modal */}
      {canEdit && (
        <AddSongsToPlaylistModal
          open={isAddSongsModalOpen}
          onOpenChange={setIsAddSongsModalOpen}
          playlistName={playlistName}
          playlistType={playlistType}
          currentSongIds={songs?.map(s => s.id) || []}
        />
      )}

      {/* Edit Playlist Dialog */}
      {canEdit && currentPlaylistData && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Playlist</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <PlaylistEditorCard
                mode="edit"
                initialData={currentPlaylistData}
                onSave={handleUpdatePlaylist}
                onCancel={() => setIsEditDialogOpen(false)}
                isSaving={updatePlaylistMutation.isPending || updateOfficialPlaylistMutation.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
