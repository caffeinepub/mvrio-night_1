import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfileRecord } from '../backend';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '../utils/authorizationErrors';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfileRecord | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
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
      toast.success('Profile saved successfully');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Save profile error:', error);
    },
  });
}

export function useProfileHelpers() {
  const profileQuery = useGetCallerUserProfile();
  const profile = profileQuery.data;

  const isProfileComplete = !!(
    profile &&
    profile.fullName &&
    profile.userName &&
    profile.dateOfBirth
  );

  const formatListeningTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const listeningTimeFormatted = profile
    ? formatListeningTime(Number(profile.totalListeningTime))
    : '0m';

  return {
    profile,
    isProfileComplete,
    listeningTimeFormatted,
    isLoading: profileQuery.isLoading,
    isFetched: profileQuery.isFetched,
  };
}
