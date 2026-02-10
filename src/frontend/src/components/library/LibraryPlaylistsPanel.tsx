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
import { Plus, Music2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useHiddenAdminMode } from '@/context/HiddenAdminModeContext';
import { 
  useGetUserPlaylists, 
  useCreatePlaylist,
  useGetOfficialPlaylists,
  useGetPlaylistDetails,
  useGetOfficialPlaylistDetails,
  useCreateOfficialPlaylist,
} from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { SongView } from '@/backend';

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
  const { data: userPlaylists, isLoading: userPlaylistsLoading } = useGetUserPlaylists();
  const { data: officialPlaylists, isLoading: officialPlaylistsLoading } = useGetOfficialPlaylists();
  const createPlaylistMutation = useCreatePlaylist();
  const createOfficialPlaylistMutation = useCreateOfficialPlaylist();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createOfficialDialogOpen, setCreateOfficialDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newOfficialPlaylistName, setNewOfficialPlaylistName] = useState('');

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
    try {
      // Fetch playlist details from backend
      const response = await fetch(`/api/playlists/${playlistName}`);
      // This is a placeholder - we'll use the hook instead
      const songs: SongView[] = []; // Will be populated by the hook
      
      onOpenPlaylist({
        type: 'user',
        name: playlistName,
        songs,
      });
    } catch (error) {
      console.error('Failed to load playlist:', error);
      toast.error('Failed to load playlist');
    }
  };

  const handleOpenOfficialPlaylist = async (playlistName: string) => {
    try {
      // Fetch official playlist details from backend
      const songs: SongView[] = []; // Will be populated by the hook
      
      onOpenPlaylist({
        type: 'official',
        name: playlistName,
        songs,
      });
    } catch (error) {
      console.error('Failed to load official playlist:', error);
      toast.error('Failed to load official playlist');
    }
  };

  if (!isAuthenticated && officialPlaylistsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Official Playlists Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Official Playlists</h2>
          {isAdminModeEnabled && (
            <Button
              size="sm"
              onClick={() => setCreateOfficialDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Official Playlist
            </Button>
          )}
        </div>
        
        {officialPlaylistsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : officialPlaylists && officialPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officialPlaylists.map((playlist) => (
              <div
                key={playlist.name}
                className="p-4 rounded-lg bg-card hover:bg-accent transition-colors cursor-pointer"
                onClick={() => handleOpenOfficialPlaylist(playlist.name)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Music2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No official playlists yet</p>
          </div>
        )}
      </div>

      {/* Your Playlists Section */}
      {isAuthenticated && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Playlists</h2>
            <Button
              size="sm"
              onClick={handleCreatePlaylistClick}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Playlist
            </Button>
          </div>
          
          {userPlaylistsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : userPlaylists && userPlaylists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPlaylists.map((playlist) => (
                <div
                  key={playlist.name}
                  className="p-4 rounded-lg bg-card hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleOpenUserPlaylist(playlist.name)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Music2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{playlist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No playlists yet</p>
              <p className="text-sm mt-1">Create your first playlist to get started</p>
            </div>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="text-center py-12">
          <Music2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Sign in to view your playlists</h3>
          <p className="text-muted-foreground">
            Create and manage your playlists after signing in
          </p>
        </div>
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-playlist-name">Playlist Name</Label>
              <Input
                id="new-playlist-name"
                placeholder="My Awesome Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !createPlaylistMutation.isPending) {
                    handleCreatePlaylist();
                  }
                }}
                disabled={createPlaylistMutation.isPending}
                autoFocus
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
              disabled={createPlaylistMutation.isPending || !newPlaylistName.trim()}
            >
              {createPlaylistMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-official-playlist-name">Playlist Name</Label>
              <Input
                id="new-official-playlist-name"
                placeholder="Official Playlist Name"
                value={newOfficialPlaylistName}
                onChange={(e) => setNewOfficialPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !createOfficialPlaylistMutation.isPending) {
                    handleCreateOfficialPlaylist();
                  }
                }}
                disabled={createOfficialPlaylistMutation.isPending}
                autoFocus
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
              disabled={createOfficialPlaylistMutation.isPending || !newOfficialPlaylistName.trim()}
            >
              {createOfficialPlaylistMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
