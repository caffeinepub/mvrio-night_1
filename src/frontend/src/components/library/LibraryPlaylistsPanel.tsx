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
      if (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Only users can')
      ) {
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

  const handleDeleteClick = (name: string, type: 'user' | 'official', e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylistToDelete({ name, type });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!playlistToDelete) return;

    try {
      if (playlistToDelete.type === 'user') {
        await deleteUserPlaylistMutation.mutateAsync(playlistToDelete.name);
      } else {
        await deleteOfficialPlaylistMutation.mutateAsync(playlistToDelete.name);
      }
      setDeleteConfirmOpen(false);
      setPlaylistToDelete(null);
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Delete playlist error:', error);
    }
  };

  const isPendingDelete = deleteUserPlaylistMutation.isPending || deleteOfficialPlaylistMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Official Playlists Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Official Playlists</h3>
          {isAdminModeEnabled && (
            <Button
              onClick={() => setCreateOfficialDialogOpen(true)}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Official Playlist
            </Button>
          )}
        </div>

        {officialPlaylistsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : officialPlaylists && officialPlaylists.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {officialPlaylists.map((playlist) => (
              <div
                key={playlist.name}
                onClick={() => handleOpenOfficialPlaylist(playlist.name)}
                className="group relative cursor-pointer rounded-lg bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-muted">
                  <Music2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h4 className="truncate text-sm font-medium text-foreground">{playlist.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                </p>
                
                {/* Delete button - only visible in admin mode */}
                {isAdminModeEnabled && (
                  <button
                    onClick={(e) => handleDeleteClick(playlist.name, 'official', e)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                    aria-label="Delete playlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Music2 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No official playlists yet</p>
          </div>
        )}
      </div>

      {/* User Playlists Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Your Playlists</h3>
          <Button
            onClick={handleCreatePlaylistClick}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Playlist
          </Button>
        </div>

        {!isAuthenticated ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Music2 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-sm text-muted-foreground">Sign in to create and manage your playlists</p>
            <Button
              onClick={() => requireAuth({ type: 'create-playlist' })}
              size="sm"
            >
              Sign In
            </Button>
          </div>
        ) : userPlaylistsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : userPlaylists && userPlaylists.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {userPlaylists.map((playlist) => (
              <div
                key={playlist.name}
                onClick={() => handleOpenUserPlaylist(playlist.name)}
                className="group relative cursor-pointer rounded-lg bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-muted">
                  <Music2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h4 className="truncate text-sm font-medium text-foreground">{playlist.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                </p>
                
                {/* Delete button - visible when authenticated */}
                {isAuthenticated && (
                  <button
                    onClick={(e) => handleDeleteClick(playlist.name, 'user', e)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                    aria-label="Delete playlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Music2 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No playlists yet. Create your first one!</p>
          </div>
        )}
      </div>

      {/* Create User Playlist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                placeholder="My Awesome Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreatePlaylist();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewPlaylistName('');
              }}
              disabled={createPlaylistMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              disabled={createPlaylistMutation.isPending || !newPlaylistName.trim()}
            >
              {createPlaylistMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
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
                placeholder="Top Hits 2026"
                value={newOfficialPlaylistName}
                onChange={(e) => setNewOfficialPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateOfficialPlaylist();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOfficialDialogOpen(false);
                setNewOfficialPlaylistName('');
              }}
              disabled={createOfficialPlaylistMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOfficialPlaylist}
              disabled={createOfficialPlaylistMutation.isPending || !newOfficialPlaylistName.trim()}
            >
              {createOfficialPlaylistMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeletePlaylistConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setPlaylistToDelete(null);
          }
        }}
        playlistName={playlistToDelete?.name || ''}
        playlistType={playlistToDelete?.type || 'user'}
        isPending={isPendingDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
