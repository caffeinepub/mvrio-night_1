import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Music, Loader2, Trash2 } from 'lucide-react';
import { useGetUserPlaylists, useGetOfficialPlaylists, useCreatePlaylist, useCreateOfficialPlaylist, useDeletePlaylist } from '@/hooks/useQueries';
import { useHiddenAdminMode } from '@/context/HiddenAdminModeContext';
import { PlaylistEditorCard, PlaylistEditorData } from './PlaylistEditorCard';
import { PlaylistOverflowMenu } from './PlaylistOverflowMenu';
import { DeletePlaylistConfirmDialog } from './DeletePlaylistConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface LibraryPlaylistsPanelProps {
  onSelectPlaylist: (name: string, type: 'user' | 'official') => void;
}

export function LibraryPlaylistsPanel({ onSelectPlaylist }: LibraryPlaylistsPanelProps) {
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreateOfficialDialogOpen, setIsCreateOfficialDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ name: string; type: 'user' | 'official' } | null>(null);
  
  const { data: userPlaylists, isLoading: userLoading } = useGetUserPlaylists();
  const { data: officialPlaylists, isLoading: officialLoading } = useGetOfficialPlaylists();
  const { isAdminModeEnabled } = useHiddenAdminMode();
  
  const createUserPlaylist = useCreatePlaylist();
  const createOfficialPlaylist = useCreateOfficialPlaylist();
  const deletePlaylist = useDeletePlaylist();

  const handleCreateUserPlaylist = async (data: PlaylistEditorData) => {
    try {
      await createUserPlaylist.mutateAsync({
        name: data.name,
        description: data.description,
        titleImage: data.titleImage,
      });
      toast.success('Playlist created');
      setIsCreateUserDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create playlist');
      throw error;
    }
  };

  const handleCreateOfficialPlaylist = async (data: PlaylistEditorData) => {
    try {
      await createOfficialPlaylist.mutateAsync({
        name: data.name,
        description: data.description,
        titleImage: data.titleImage,
      });
      toast.success('Official playlist created');
      setIsCreateOfficialDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create official playlist');
      throw error;
    }
  };

  const handleDeletePlaylist = async () => {
    if (!deleteTarget) return;
    
    try {
      await deletePlaylist.mutateAsync({
        playlistName: deleteTarget.name,
        isOfficial: deleteTarget.type === 'official',
      });
      toast.success('Playlist deleted');
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete playlist');
    }
  };

  return (
    <div className="space-y-8">
      {/* Official Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Official Playlists</h2>
          {isAdminModeEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOfficialDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create
            </Button>
          )}
        </div>
        
        {officialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : officialPlaylists && officialPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officialPlaylists.map((playlist) => {
              const titleImageUrl = playlist.titleImage?.getDirectURL?.() || '';
              
              return (
                <Card
                  key={playlist.name}
                  className="cursor-pointer hover:bg-card/50 transition-colors group"
                  onClick={() => onSelectPlaylist(playlist.name, 'official')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded overflow-hidden bg-muted shrink-0">
                        {titleImageUrl ? (
                          <img
                            src={titleImageUrl}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{playlist.name}</h3>
                        {playlist.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {playlist.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <PlaylistOverflowMenu
                          playlistName={playlist.name}
                          playlistType="official"
                        />
                        {isAdminModeEnabled && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ name: playlist.name, type: 'official' });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No official playlists yet</p>
          </div>
        )}
      </div>

      {/* User Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Playlists</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateUserDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>
        
        {userLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : userPlaylists && userPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlaylists.map((playlist) => {
              const titleImageUrl = playlist.titleImage?.getDirectURL?.() || '';
              
              return (
                <Card
                  key={playlist.name}
                  className="cursor-pointer hover:bg-card/50 transition-colors group"
                  onClick={() => onSelectPlaylist(playlist.name, 'user')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded overflow-hidden bg-muted shrink-0">
                        {titleImageUrl ? (
                          <img
                            src={titleImageUrl}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{playlist.name}</h3>
                        {playlist.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {playlist.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <PlaylistOverflowMenu
                          playlistName={playlist.name}
                          playlistType="user"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ name: playlist.name, type: 'user' });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No playlists yet</p>
            <Button
              variant="outline"
              onClick={() => setIsCreateUserDialogOpen(true)}
              className="mt-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Playlist
            </Button>
          </div>
        )}
      </div>

      {/* Create User Playlist Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Playlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PlaylistEditorCard
              mode="create"
              onSave={handleCreateUserPlaylist}
              onCancel={() => setIsCreateUserDialogOpen(false)}
              isSaving={createUserPlaylist.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Official Playlist Dialog */}
      <Dialog open={isCreateOfficialDialogOpen} onOpenChange={setIsCreateOfficialDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Official Playlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PlaylistEditorCard
              mode="create"
              onSave={handleCreateOfficialPlaylist}
              onCancel={() => setIsCreateOfficialDialogOpen(false)}
              isSaving={createOfficialPlaylist.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeletePlaylistConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          playlistName={deleteTarget.name}
          playlistType={deleteTarget.type}
          onConfirm={handleDeletePlaylist}
          isPending={deletePlaylist.isPending}
        />
      )}
    </div>
  );
}
