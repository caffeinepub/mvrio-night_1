import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { SongView, PlaylistView } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

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
      
      const albumArt = data.albumArtUrl ? ExternalBlob.fromURL(data.albumArtUrl) : ExternalBlob.fromURL('');
      const titleImage = data.titleImageUrl ? ExternalBlob.fromURL(data.titleImageUrl) : ExternalBlob.fromURL('');
      const audioFile = ExternalBlob.fromURL(data.audioUrl);
      
      return actor.addSong(
        data.title,
        data.artist,
        albumArt,
        titleImage,
        audioFile,
        data.lyrics
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
  });
}

export function useDeleteSong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteSong(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
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
    },
    onError: (err) => {
      toast.error('Failed to update like');
      console.error(err);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['songs'] });
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
    onSuccess: () => {
      // Refetch to get updated play counts
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: (err) => {
      console.error('Failed to increment play count:', err);
    },
  });
}

// Favorites hooks
export function useGetFavorites() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<bigint[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFavorites();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useToggleFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      const wasRemoved = await actor.toggleFavorite(songId);
      return wasRemoved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// Playlist hooks
export function useGetUserPlaylists() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<PlaylistView[]>({
    queryKey: ['playlists', 'user'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserPlaylists();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
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
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
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
      queryClient.invalidateQueries({ queryKey: ['playlists', 'user'] });
    },
  });
}

export function useGetPlaylistDetails(playlistName: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<SongView[]>({
    queryKey: ['playlists', 'details', playlistName],
    queryFn: async () => {
      if (!actor || !playlistName) return [];
      return actor.getPlaylistDetails(playlistName);
    },
    enabled: !!actor && !isFetching && isAuthenticated && !!playlistName,
  });
}
