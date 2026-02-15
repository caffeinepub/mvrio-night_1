import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useHiddenAdminMode } from '../context/HiddenAdminModeContext';
import type { SongView, PlaylistView, ArtistProfile, UserProfileRecord, MessagesView, Message } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { isDataUrl, dataUrlToBytes } from '../utils/dataUrl';
import { getAuthErrorMessage } from '../utils/authorizationErrors';

export function useGetAllSongs() {
  const { actor, isFetching } = useActor();

  return useQuery<SongView[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSongs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSong(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SongView | null>({
    queryKey: ['song', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getSong(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useAddSong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      artist: string;
      albumArtUrl: string;
      titleImageUrl: string;
      audioUrl: string;
      lyrics: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      // Handle album art - convert data URLs to bytes
      let albumArt: ExternalBlob;
      if (data.albumArtUrl) {
        if (isDataUrl(data.albumArtUrl)) {
          const bytes = dataUrlToBytes(data.albumArtUrl);
          albumArt = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
        } else {
          albumArt = ExternalBlob.fromURL(data.albumArtUrl);
        }
      } else {
        albumArt = ExternalBlob.fromURL('');
      }
      
      // Handle title image - convert data URLs to bytes
      let titleImage: ExternalBlob;
      if (data.titleImageUrl) {
        if (isDataUrl(data.titleImageUrl)) {
          const bytes = dataUrlToBytes(data.titleImageUrl);
          titleImage = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
        } else {
          titleImage = ExternalBlob.fromURL(data.titleImageUrl);
        }
      } else {
        titleImage = ExternalBlob.fromURL('');
      }
      
      // Handle audio file - convert data URLs to bytes
      let audioFile: ExternalBlob;
      if (isDataUrl(data.audioUrl)) {
        const bytes = dataUrlToBytes(data.audioUrl);
        audioFile = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      } else {
        audioFile = ExternalBlob.fromURL(data.audioUrl);
      }
      
      return actor.addSong(
        data.title,
        data.artist,
        albumArt,
        titleImage,
        audioFile,
        data.lyrics,
        passcode
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song added successfully');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Add song error:', error);
    },
  });
}

export function useDeleteSong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.deleteSong(id, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song deleted successfully');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete song error:', error);
    },
  });
}

export function useSearchSongs(keyword: string) {
  const { actor, isFetching } = useActor();

  return useQuery<SongView[]>({
    queryKey: ['songs', 'search', keyword],
    queryFn: async () => {
      if (!actor || !keyword) return [];
      return actor.searchSongs(keyword);
    },
    enabled: !!actor && !isFetching && keyword.length > 0,
  });
}

export function useToggleLikeSong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      const newLikesCount = await actor.toggleLikeSong(songId);
      return { songId, newLikesCount };
    },
    onSuccess: ({ songId, newLikesCount }) => {
      // Update the cache with the actual count from backend
      queryClient.setQueriesData<SongView[]>({ queryKey: ['songs'] }, (old) => {
        if (!old) return old;
        return old.map((song) =>
          song.id === songId
            ? {
                ...song,
                likesCount: newLikesCount,
              }
            : song
        );
      });
      
      // Also update individual song query if it exists
      queryClient.setQueryData<SongView>(['song', songId.toString()], (old) => {
        if (!old) return old;
        return {
          ...old,
          likesCount: newLikesCount,
        };
      });

      // Invalidate favorites to update liked state
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Toggle like error:', error);
    },
  });
}

export function usePlaySong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.playSong(songId);
    },
    onSuccess: (_, songId) => {
      // Optimistically update play count
      queryClient.setQueriesData<SongView[]>({ queryKey: ['songs'] }, (old) => {
        if (!old) return old;
        return old.map((song) =>
          song.id === songId
            ? {
                ...song,
                playCount: song.playCount + 1n,
              }
            : song
        );
      });
      
      // Also update individual song query if it exists
      queryClient.setQueryData<SongView>(['song', songId.toString()], (old) => {
        if (!old) return old;
        return {
          ...old,
          playCount: old.playCount + 1n,
        };
      });
    },
    onError: (error: any) => {
      console.error('Play song error:', error);
    },
  });
}

// Favorites
export function useGetFavorites() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<bigint[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFavorites();
    },
    enabled: !!actor && !isFetching && !!identity && !identity.getPrincipal().isAnonymous(),
  });
}

export function useToggleFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      const wasFavorite = await actor.toggleFavorite(songId);
      return { songId, wasFavorite };
    },
    onSuccess: ({ songId, wasFavorite }) => {
      // Update favorites list
      queryClient.setQueryData<bigint[]>(['favorites'], (old) => {
        if (!old) return wasFavorite ? [] : [songId];
        if (wasFavorite) {
          return old.filter((id) => id !== songId);
        } else {
          return [...old, songId];
        }
      });
      
      const action = wasFavorite ? 'removed from' : 'added to';
      toast.success(`Song ${action} favorites`);
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Toggle favorite error:', error);
    },
  });
}

// Playlists
export function useGetUserPlaylists() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PlaylistView[]>({
    queryKey: ['playlists', 'user'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserPlaylists();
    },
    enabled: !!actor && !isFetching && !!identity && !identity.getPrincipal().isAnonymous(),
  });
}

export function useGetPlaylist(playlistName: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PlaylistView | null>({
    queryKey: ['playlist', playlistName],
    queryFn: async () => {
      if (!actor || !playlistName) return null;
      return actor.getPlaylist(playlistName);
    },
    enabled: !!actor && !isFetching && !!playlistName && !!identity && !identity.getPrincipal().isAnonymous(),
  });
}

export function useGetPlaylistDetails(playlistName: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SongView[]>({
    queryKey: ['playlist', playlistName, 'details'],
    queryFn: async () => {
      if (!actor || !playlistName) return [];
      return actor.getPlaylistDetails(playlistName);
    },
    enabled: !!actor && !isFetching && !!playlistName && !!identity && !identity.getPrincipal().isAnonymous(),
  });
}

export function useCreatePlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description: string; titleImage: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createPlaylist(data.name, data.description, data.titleImage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Create playlist error:', error);
    },
  });
}

export function useUpdatePlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { oldName: string; newName: string; description: string; titleImage: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updatePlaylist(data.oldName, data.newName, data.description, data.titleImage);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.oldName] });
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.newName] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Update playlist error:', error);
    },
  });
}

export function useAddToPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistName, songId }: { playlistName: string; songId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addToPlaylist(playlistName, songId);
    },
    onSuccess: (_, { playlistName }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistName] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Add to playlist error:', error);
    },
  });
}

export function useRemoveFromPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistName, songId }: { playlistName: string; songId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.removeFromPlaylist(playlistName, songId);
    },
    onSuccess: (_, { playlistName }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistName] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Remove from playlist error:', error);
    },
  });
}

export function useReorderPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistName, newOrder }: { playlistName: string; newOrder: bigint[] }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.reorderPlaylist(playlistName, newOrder);
    },
    onSuccess: (_, { playlistName }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistName] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Reorder playlist error:', error);
    },
  });
}

export function useDeletePlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async ({ playlistName, isOfficial }: { playlistName: string; isOfficial: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (isOfficial) {
        if (!isAdminModeEnabled) {
          throw new Error('You do not have permission to perform this action.');
        }
        const passcode = getPasscode();
        if (!passcode) {
          throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
        }
        return actor.deletePlaylist(playlistName, passcode);
      } else {
        return actor.deletePlaylist(playlistName, null);
      }
    },
    onSuccess: (_, { isOfficial }) => {
      if (isOfficial) {
        queryClient.invalidateQueries({ queryKey: ['playlists', 'official'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
      }
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete playlist error:', error);
    },
  });
}

// Official Playlists
export function useGetOfficialPlaylists() {
  const { actor, isFetching } = useActor();

  return useQuery<PlaylistView[]>({
    queryKey: ['playlists', 'official'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOfficialPlaylists();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOfficialPlaylist(playlistName: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PlaylistView | null>({
    queryKey: ['playlist', 'official', playlistName],
    queryFn: async () => {
      if (!actor || !playlistName) return null;
      return actor.getOfficialPlaylist(playlistName);
    },
    enabled: !!actor && !isFetching && !!playlistName,
  });
}

export function useGetOfficialPlaylistDetails(playlistName: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SongView[]>({
    queryKey: ['playlist', 'official', playlistName, 'details'],
    queryFn: async () => {
      if (!actor || !playlistName) return [];
      return actor.getOfficialPlaylistDetails(playlistName);
    },
    enabled: !!actor && !isFetching && !!playlistName,
  });
}

export function useCreateOfficialPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (data: { name: string; description: string; titleImage: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.createOfficialPlaylist(data.name, data.description, data.titleImage, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'official'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Create official playlist error:', error);
    },
  });
}

export function useUpdateOfficialPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (data: { oldName: string; newName: string; description: string; titleImage: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.updateOfficialPlaylist(data.oldName, data.newName, data.description, data.titleImage, passcode);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'official'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', 'official', variables.oldName] });
      queryClient.invalidateQueries({ queryKey: ['playlist', 'official', variables.newName] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Update official playlist error:', error);
    },
  });
}

export function useAddToOfficialPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async ({ playlistName, songId }: { playlistName: string; songId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.addToOfficialPlaylist(playlistName, songId, passcode);
    },
    onSuccess: (_, { playlistName }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', 'official', playlistName] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'official'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Add to official playlist error:', error);
    },
  });
}

export function useRemoveFromOfficialPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async ({ playlistName, songId }: { playlistName: string; songId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.removeFromOfficialPlaylist(playlistName, songId, passcode);
    },
    onSuccess: (_, { playlistName }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', 'official', playlistName] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'official'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Remove from official playlist error:', error);
    },
  });
}

export function useReorderOfficialPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async ({ playlistName, newOrder }: { playlistName: string; newOrder: bigint[] }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.reorderOfficialPlaylist(playlistName, newOrder, passcode);
    },
    onSuccess: (_, { playlistName }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', 'official', playlistName] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Reorder official playlist error:', error);
    },
  });
}

// Artist Profile
export function useGetArtistProfile() {
  const { actor, isFetching } = useActor();

  return useQuery<ArtistProfile>({
    queryKey: ['artistProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getArtistProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateArtistProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (profile: ArtistProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.updateArtistProfile(profile, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artistProfile'] });
      toast.success('Artist profile updated');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Update artist profile error:', error);
    },
  });
}

// User Profile
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfileRecord | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfileRecord) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Save user profile error:', error);
    },
  });
}

// Listening Time
export function useAddListeningTime() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seconds: number) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addListeningTime(BigInt(seconds));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      console.error('Add listening time error:', error);
    },
  });
}

// Messaging (existing code continues...)
export function useGetMessages() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<MessagesView | null>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMessages();
    },
    enabled: !!actor && !isFetching && !!identity && !identity.getPrincipal().isAnonymous(),
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.sendMessage(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Send message error:', error);
    },
  });
}

export function useSendMessageWithAttachments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      audioAttachment: any;
      imageAttachment: any;
      pdfAttachment: any;
      fileAttachment: any;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.sendMessageWithAttachments(
        data.content,
        data.audioAttachment,
        data.imageAttachment,
        data.pdfAttachment,
        data.fileAttachment
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Send message with attachments error:', error);
    },
  });
}

export function useMarkMessagesAsSeen() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileOnly: boolean = false) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.markMessagesAsSeen(fileOnly);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: any) => {
      console.error('Mark messages as seen error:', error);
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteMessage(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete message error:', error);
    },
  });
}

export function useClearMessages() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.clearMessages();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Messages cleared');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Clear messages error:', error);
    },
  });
}

// Admin messaging functions
export function useGetAllConversations() {
  const { actor, isFetching } = useActor();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useQuery<string[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not found');
      const principals = await actor.getAllConversations(passcode);
      return principals.map(p => p.toString());
    },
    enabled: !!actor && !isFetching && isAdminModeEnabled,
  });
}

export function useGetAllMessages() {
  const { actor } = useActor();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not found');
      
      const principal = userPrincipal as any;
      return actor.getAllMessages(principal, passcode);
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Get all messages error:', error);
    },
  });
}

export function useReplyToMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (data: { userPrincipal: string; content: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not found');
      
      const principal = data.userPrincipal as any;
      return actor.replyToMessage(principal, data.content, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Reply to message error:', error);
    },
  });
}

export function useReplyWithAttachments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (data: {
      userPrincipal: string;
      content: string;
      audioAttachment: any;
      imageAttachment: any;
      pdfAttachment: any;
      fileAttachment: any;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not found');
      
      const principal = data.userPrincipal as any;
      return actor.replyWithAttachments(
        principal,
        data.content,
        data.audioAttachment,
        data.imageAttachment,
        data.pdfAttachment,
        data.fileAttachment,
        passcode
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Reply with attachments error:', error);
    },
  });
}

export function useDeleteUserMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (data: { userPrincipal: string; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not found');
      
      const principal = data.userPrincipal as any;
      return actor.deleteUserMessage(principal, data.messageId, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete user message error:', error);
    },
  });
}

export function useAdminDeleteConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (data: { conversationId: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not found');
      
      return actor.adminDeleteConversation(null, data.conversationId, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete conversation error:', error);
    },
  });
}
