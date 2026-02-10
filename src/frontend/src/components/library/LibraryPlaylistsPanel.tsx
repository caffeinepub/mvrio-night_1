import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Music2, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useHiddenAdminMode } from '@/context/HiddenAdminModeContext';
import { useActor } from '@/hooks/useActor';
import { 
  useGetUserPlaylists, 
  useCreatePlaylist,
  useGetOfficialPlaylists,
  useCreateOfficialPlaylist,
  useDeleteUserPlaylist,
  useDeleteOfficialPlaylist,
} from '@/hooks/useQueries';
import { isSignInRequiredError } from '@/utils/authorizationErrors';
import { toast } from 'sonner';
import type { SongView } from '@/backend';
import { DeletePlaylistConfirmDialog } from './DeletePlaylistConfirmDialog';

type PlaylistContext = {
  type: 'user' | 'official';
  name: string;
  songs: SongView[];
};

interface LibraryPlaylistsPanelProps {
  onOpenPlaylist: (playlist: PlaylistContext) => void;
}

export function LibraryPlaylistsPanel({ onOpenPlaylist }: LibraryPlaylistsPanelProps) {
  const { isAuthenticated, requireAuth } = useAuth();
  const { isAdminModeEnabled } = useHiddenAdminMode();
  const { actor } = useActor();
  const { data: userPlaylists, isLoading: userPlaylistsLoading } = useGetUserPlaylists();
  const { data: officialPlaylists, isLoading: officialPlaylistsLoading } = useGetOfficialPlaylists();
  const createPlaylistMutation = useCreatePlaylist();
  const createOfficialPlaylistMutation = useCreateOfficialPlaylist();
  const deleteUserPlaylistMutation = useDeleteUserPlaylist();
  const deleteOfficialPlaylistMutation = useDeleteOfficialPlaylist();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createOfficialDialogOpen, setCreateOfficialDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newOfficialPlaylistName, setNewOfficialPlaylistName] = useState('');
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<{
    name: string;
    type: 'user' | 'official';
  } | null>(null);

  const handleCreatePlaylistClick = () => {
    if (!isAuthenticated) {
      requireAuth({
        type: 'create-playlist',
      });
      return;
    }
    setCreateDialogOpen(true);
  };

  const handleCreatePlaylist = async () => {
    if (!isAuthenticated) {
      setCreateDialogOpen(false);
      requireAuth({
        type: 'create-playlist',
        playlistName: newPlaylistName.trim(),
      });
      return;
    }
    
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }
    
    try {
      await createPlaylistMutation.mutateAsync(newPlaylistName.trim());
      toast.success(`Created "${newPlaylistName}"`);
      setNewPlaylistName('');
      setCreateDialogOpen(false);
    } catch (error: any) {
      if (isSignInRequiredError(error)) {
        setCreateDialogOpen(false);
        requireAuth({
          type: 'create-playlist',
          playlistName: newPlaylistName.trim(),
        });
      } else if (error.message?.includes('already exists')) {
        toast.error('A playlist with this name already exists');
      } else {
        toast.error('Failed to create playlist');
      }
      console.error(error);
    }
  };

  const handleCreateOfficialPlaylist = async () => {
    if (!newOfficialPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }
    
    try {
      await createOfficialPlaylistMutation.mutateAsync(newOfficialPlaylistName.trim());
      toast.success(`Created official playlist "${newOfficialPlaylistName}"`);
      setNewOfficialPlaylistName('');
      setCreateOfficialDialogOpen(false);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        toast.error('An official playlist with this name already exists');
      } else {
        toast.error('Failed to create official playlist');
      }
      console.error(error);
    }
  };

  const handleOpenUserPlaylist = async (playlistName: string) => {
    if (!actor) {
      toast.error('Unable to load playlist');
      return;
    }
    
    try {
      // Fetch playlist details directly from actor
      const songs = await actor.getPlaylistDetails(playlistName);
      
      onOpenPlaylist({
        type: 'user',
        name: playlistName,
        songs: songs || [],
      });
    } catch (error) {
      console.error('Failed to open user playlist:', error);
      toast.error('Failed to load playlist');
    }
  };

  const handleOpenOfficialPlaylist = async (playlistName: string) => {
    if (!actor) {
      toast.error('Unable to load playlist');
      return;
    }
    
    try {
      // Fetch official playlist details directly from actor
      const songs = await actor.getOfficialPlaylistDetails(playlistName);
      
      onOpenPlaylist({
        type: 'official',
        name: playlistName,
        songs: songs || [],
      });
    } catch (error) {
      console.error('Failed to open official playlist:', error);
      toast.error('Failed to load playlist');
    }
  };

  const handleDeleteClick = (playlistName: string, type: 'user' | 'official', e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylistToDelete({ name: playlistName, type });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!playlistToDelete) return;

    try {
      if (playlistToDelete.type === 'user') {
        await deleteUserPlaylistMutation.mutateAsync(playlistToDelete.name);
        toast.success(`Deleted "${playlistToDelete.name}"`);
      } else {
        await deleteOfficialPlaylistMutation.mutateAsync(playlistToDelete.name);
        toast.success(`Deleted official playlist "${playlistToDelete.name}"`);
      }
      setDeleteConfirmOpen(false);
      setPlaylistToDelete(null);
    } catch (error: any) {
      toast.error('Failed to delete playlist');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Official Playlists</h3>
          {isAdminModeEnabled && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateOfficialDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Official Playlist
            </Button>
          )}
        </div>
        
        {officialPlaylistsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !officialPlaylists || officialPlaylists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No official playlists yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {officialPlaylists.map((playlist) => (
              <div
                key={playlist.name}
                className="relative group cursor-pointer bg-card hover:bg-accent rounded-lg p-4 transition-colors"
                onClick={() => handleOpenOfficialPlaylist(playlist.name)}
              >
                <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
                  <Music2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-medium truncate">{playlist.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                </p>
                
                {isAdminModeEnabled && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteClick(playlist.name, 'official', e)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Playlists</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreatePlaylistClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </div>
        
        {userPlaylistsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !userPlaylists || userPlaylists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No playlists yet</p>
            <p className="text-sm mt-1">Create your first playlist to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userPlaylists.map((playlist) => (
              <div
                key={playlist.name}
                className="relative group cursor-pointer bg-card hover:bg-accent rounded-lg p-4 transition-colors"
                onClick={() => handleOpenUserPlaylist(playlist.name)}
              >
                <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
                  <Music2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-medium truncate">{playlist.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                </p>
                
                {isAuthenticated && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteClick(playlist.name, 'user', e)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Playlist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                placeholder="My Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPlaylistName.trim()) {
                    handleCreatePlaylist();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createPlaylistMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
            >
              {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Official Playlist Dialog */}
      <Dialog open={createOfficialDialogOpen} onOpenChange={setCreateOfficialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Official Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="official-playlist-name">Playlist Name</Label>
              <Input
                id="official-playlist-name"
                placeholder="Official Playlist"
                value={newOfficialPlaylistName}
                onChange={(e) => setNewOfficialPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newOfficialPlaylistName.trim()) {
                    handleCreateOfficialPlaylist();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOfficialDialogOpen(false)}
              disabled={createOfficialPlaylistMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOfficialPlaylist}
              disabled={!newOfficialPlaylistName.trim() || createOfficialPlaylistMutation.isPending}
            >
              {createOfficialPlaylistMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeletePlaylistConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        playlistName={playlistToDelete?.name || ''}
        isPending={deleteUserPlaylistMutation.isPending || deleteOfficialPlaylistMutation.isPending}
        playlistType={playlistToDelete?.type || 'user'}
      />
    </div>
  );
}
