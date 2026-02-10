import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useHiddenAdminMode } from '../context/HiddenAdminModeContext';
import type { SongView, PlaylistView, ArtistProfile } from '../backend';
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
      
      // Also update individual song queries
      queryClient.setQueryData<SongView>(['song', songId.toString()], (old) => {
        if (!old) return old;
        return {
          ...old,
          likesCount: newLikesCount,
        };
      });
      
      // Invalidate favorites to keep them in sync
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
      await actor.playSong(songId);
      return songId;
    },
    onSuccess: (songId) => {
      // Update the play count in cache
      queryClient.setQueriesData<SongView[]>({ queryKey: ['songs'] }, (old) => {
        if (!old) return old;
        return old.map((song) =>
          song.id === songId
            ? {
                ...song,
                playCount: song.playCount + BigInt(1),
              }
            : song
        );
      });
      
      // Also update individual song queries
      queryClient.setQueryData<SongView>(['song', songId.toString()], (old) => {
        if (!old) return old;
        return {
          ...old,
          playCount: old.playCount + BigInt(1),
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
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useToggleFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      const wasRemoved = await actor.toggleFavorite(songId);
      return { songId, wasRemoved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
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
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreatePlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createPlaylist(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
    },
    onError: (error: any) => {
      throw error;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Remove from playlist error:', error);
    },
  });
}

export function useGetPlaylistDetails(playlistName: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SongView[]>({
    queryKey: ['playlists', 'user', playlistName, 'details'],
    queryFn: async () => {
      if (!actor || !playlistName) return [];
      return actor.getPlaylistDetails(playlistName);
    },
    enabled: !!actor && !isFetching && !!identity && !!playlistName,
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

export function useCreateOfficialPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.createOfficialPlaylist(name, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'official'] });
    },
    onError: (error: any) => {
      throw error;
    },
  });
}

export function useGetOfficialPlaylistDetails(playlistName: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SongView[]>({
    queryKey: ['playlists', 'official', playlistName, 'details'],
    queryFn: async () => {
      if (!actor || !playlistName) return [];
      return actor.getOfficialPlaylistDetails(playlistName);
    },
    enabled: !!actor && !isFetching && !!playlistName,
  });
}

// Delete User Playlist
export function useDeleteUserPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deletePlaylist(playlistName, null);
    },
    onSuccess: (_, playlistName) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user', playlistName, 'details'] });
      toast.success('Playlist deleted successfully');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete user playlist error:', error);
    },
  });
}

// Delete Official Playlist
export function useDeleteOfficialPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (playlistName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }
      
      return actor.deletePlaylist(playlistName, passcode);
    },
    onSuccess: (_, playlistName) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', 'official'] });
      queryClient.invalidateQueries({ queryKey: ['playlists', 'official', playlistName, 'details'] });
      toast.success('Official playlist deleted successfully');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete official playlist error:', error);
    },
  });
}

// Artist Profile
export function useGetArtistProfile() {
  const { actor, isFetching } = useActor();

  return useQuery<ArtistProfile>({
    queryKey: ['artistProfile'],
    queryFn: async () => {
      if (!actor) {
        // Return default fallback if actor not ready
        return {
          bio: '',
          youtube: '',
          instagram: '',
          buyMeACoffee: '',
        };
      }
      return actor.getArtistProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateArtistProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (profile: ArtistProfile) => {
      if (!actor) throw new Error('Actor not initialized');

      const passcode = getPasscode();
      if (!passcode) {
        throw new Error('Admin passcode not found. Please re-enable Admin Mode.');
      }

      return actor.updateArtistProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artistProfile'] });
      toast.success('Artist profile updated successfully');
    },
    onError: (error: any) => {
      // Do not trigger sign-in modal for admin-only errors
      const message = getAuthErrorMessage(error);
      throw new Error(message);
    },
  });
}
