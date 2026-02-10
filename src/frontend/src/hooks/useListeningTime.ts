import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

export function useAddListeningTime() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seconds: number) => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) throw new Error('User not authenticated');
      return actor.addListeningTime(BigInt(Math.floor(seconds)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      console.error('Add listening time error:', error);
    },
  });
}
