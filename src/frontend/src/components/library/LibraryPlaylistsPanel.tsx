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
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetUserPlaylists, useCreatePlaylist } from '@/hooks/useQueries';
import { toast } from 'sonner';

export function LibraryPlaylistsPanel() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userPlaylists, isLoading } = useGetUserPlaylists();
  const createPlaylistMutation = useCreatePlaylist();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylist = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create playlists');
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
      if (error.message?.includes('already exists')) {
        toast.error('A playlist with this name already exists');
      } else {
        toast.error('Failed to create playlist');
      }
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Music2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Sign in to view playlists</h3>
        <p className="text-muted-foreground">
          Create and manage your playlists after signing in
        </p>
      </div>
    );
  }

  if (isLoading) {
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
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No official playlists yet</p>
        </div>
      </div>

      {/* Your Playlists Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Playlists</h2>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Playlist
          </Button>
        </div>
        
        {userPlaylists && userPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlaylists.map((playlist) => (
              <div
                key={playlist.name}
                className="p-4 rounded-lg bg-card hover:bg-accent transition-colors cursor-pointer"
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
    </div>
  );
}
