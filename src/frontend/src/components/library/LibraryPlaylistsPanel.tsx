import { useState, useEffect } from 'react';
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
  useDeletePlaylist,
} from '@/hooks/useQueries';
import { isSignInRequiredError } from '@/utils/authorizationErrors';
import { toast } from 'sonner';
import type { SongView } from '@/backend';
import { DeletePlaylistConfirmDialog } from './DeletePlaylistConfirmDialog';
import { PlaylistOverflowMenu } from './PlaylistOverflowMenu';

type PlaylistContext = {
  type: 'user' | 'official';
  name: string;
  songs: SongView[];
};

type PlaylistDeepLink = {
  name: string;
  type: 'user' | 'official';
};

interface LibraryPlaylistsPanelProps {
  onOpenPlaylist: (playlist: PlaylistContext) => void;
  initialDeepLink?: PlaylistDeepLink | null;
}

export function LibraryPlaylistsPanel({ onOpenPlaylist, initialDeepLink }: LibraryPlaylistsPanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingOfficial, setIsCreatingOfficial] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ name: string; type: 'user' | 'official' } | null>(null);
  const [deepLinkProcessed, setDeepLinkProcessed] = useState(false);
  
  const { requireAuth } = useAuth();
  const { isAdminModeEnabled } = useHiddenAdminMode();
  const { actor } = useActor();
  
  const { data: userPlaylists, isLoading: userPlaylistsLoading } = useGetUserPlaylists();
  const { data: officialPlaylists, isLoading: officialPlaylistsLoading } = useGetOfficialPlaylists();
  const createPlaylistMutation = useCreatePlaylist();
  const createOfficialPlaylistMutation = useCreateOfficialPlaylist();
  const deletePlaylistMutation = useDeletePlaylist();

  // Handle deep link
  useEffect(() => {
    if (initialDeepLink && !deepLinkProcessed && actor) {
      setDeepLinkProcessed(true);
      
      const openDeepLinkedPlaylist = async () => {
        try {
          let songs: SongView[] = [];
          
          if (initialDeepLink.type === 'official') {
            songs = await actor.getOfficialPlaylistDetails(initialDeepLink.name);
          } else {
            songs = await actor.getPlaylistDetails(initialDeepLink.name);
          }
          
          onOpenPlaylist({
            type: initialDeepLink.type,
            name: initialDeepLink.name,
            songs,
          });
        } catch (error) {
          console.error('Failed to open deep-linked playlist:', error);
          toast.error('Could not open playlist');
        }
      };
      
      openDeepLinkedPlaylist();
    }
  }, [initialDeepLink, deepLinkProcessed, actor, onOpenPlaylist]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    try {
      if (isCreatingOfficial) {
        await createOfficialPlaylistMutation.mutateAsync(newPlaylistName.trim());
        toast.success('Official playlist created');
      } else {
        await createPlaylistMutation.mutateAsync(newPlaylistName.trim());
        toast.success('Playlist created');
      }
      setIsCreateDialogOpen(false);
      setNewPlaylistName('');
      setIsCreatingOfficial(false);
    } catch (error: any) {
      if (isSignInRequiredError(error)) {
        requireAuth({ type: 'create-playlist', playlistName: newPlaylistName.trim() });
        setIsCreateDialogOpen(false);
        setNewPlaylistName('');
      } else {
        toast.error(error.message || 'Failed to create playlist');
      }
    }
  };

  const handleOpenCreateDialog = (isOfficial: boolean) => {
    setIsCreatingOfficial(isOfficial);
    setIsCreateDialogOpen(true);
  };

  const handleOpenPlaylistClick = async (name: string, type: 'user' | 'official') => {
    if (!actor) return;

    try {
      let songs: SongView[] = [];
      
      if (type === 'official') {
        songs = await actor.getOfficialPlaylistDetails(name);
      } else {
        songs = await actor.getPlaylistDetails(name);
      }
      
      onOpenPlaylist({ type, name, songs });
    } catch (error) {
      console.error('Failed to load playlist:', error);
      toast.error('Failed to load playlist');
    }
  };

  const handleDeleteClick = (name: string, type: 'user' | 'official', e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ name, type });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deletePlaylistMutation.mutateAsync({
        playlistName: deleteTarget.name,
        isOfficial: deleteTarget.type === 'official',
      });
      
      if (deleteTarget.type === 'official') {
        toast.success('Official playlist deleted');
      } else {
        toast.success('Playlist deleted');
      }
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete playlist');
    }
  };

  const isLoading = userPlaylistsLoading || officialPlaylistsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Official Playlists */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Official Playlists</h2>
          {isAdminModeEnabled && (
            <Button
              size="sm"
              onClick={() => handleOpenCreateDialog(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Official Playlist
            </Button>
          )}
        </div>

        {officialPlaylists && officialPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officialPlaylists.map((playlist) => (
              <div
                key={playlist.name}
                className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                onClick={() => handleOpenPlaylistClick(playlist.name, 'official')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlaylistOverflowMenu
                      playlistName={playlist.name}
                      playlistType="official"
                    />
                    {isAdminModeEnabled && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteClick(playlist.name, 'official', e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No official playlists yet</p>
          </div>
        )}
      </div>

      {/* Your Playlists */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Playlists</h2>
          <Button
            size="sm"
            onClick={() => handleOpenCreateDialog(false)}
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
                className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                onClick={() => handleOpenPlaylistClick(playlist.name, 'user')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlaylistOverflowMenu
                      playlistName={playlist.name}
                      playlistType="user"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteClick(playlist.name, 'user', e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No playlists yet. Create your first playlist!</p>
          </div>
        )}
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCreatingOfficial ? 'Create Official Playlist' : 'Create Playlist'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
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
                setIsCreateDialogOpen(false);
                setNewPlaylistName('');
                setIsCreatingOfficial(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              disabled={createPlaylistMutation.isPending || createOfficialPlaylistMutation.isPending}
            >
              {(createPlaylistMutation.isPending || createOfficialPlaylistMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeletePlaylistConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        playlistName={deleteTarget?.name || ''}
        playlistType={deleteTarget?.type || 'user'}
        isPending={deletePlaylistMutation.isPending}
      />
    </div>
  );
}
