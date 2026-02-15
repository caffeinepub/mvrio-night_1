import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useHiddenAdminMode } from '../context/HiddenAdminModeContext';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { isDataUrl, dataUrlToBytes } from '../utils/dataUrl';

const DEFAULT_BANNER = '/assets/generated/home-banner-aesthetic-moments.dim_463x453.jpeg';

export function useHomeBanner() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  // Query to fetch the universal banner from backend
  const bannerQuery = useQuery<ExternalBlob | null>({
    queryKey: ['universalHomeBanner'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUniversalHomeBanner();
    },
    enabled: !!actor && !isFetching,
  });

  // Query to fetch the default banner path
  const defaultPathQuery = useQuery<string>({
    queryKey: ['defaultBannerPath'],
    queryFn: async () => {
      if (!actor) return '';
      return actor.getDefaultBannerPath();
    },
    enabled: !!actor && !isFetching,
  });

  // Mutation to set banner from uploaded bytes
  const setFromBytesMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Read file as bytes
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      return actor.setUniversalHomeBanner(blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universalHomeBanner'] });
      toast.success('Banner image uploaded');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload banner');
      console.error('Upload banner error:', error);
    },
  });

  // Mutation to set banner from URL
  const setFromUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      if (!url.trim()) {
        throw new Error('Please enter a valid URL');
      }

      return actor.setUniversalHomeBannerFromURL(url.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universalHomeBanner'] });
      toast.success('Banner image updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set banner URL');
      console.error('Set banner URL error:', error);
    },
  });

  // Mutation to clear banner
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      
      if (!isAdminModeEnabled) {
        throw new Error('You do not have permission to perform this action.');
      }

      return actor.clearUniversalHomeBanner();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universalHomeBanner'] });
      toast.success('Banner cleared to default');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear banner');
      console.error('Clear banner error:', error);
    },
  });

  // Compute display image
  const displayImage = bannerQuery.data 
    ? bannerQuery.data.getDirectURL() 
    : DEFAULT_BANNER;

  return {
    displayImage,
    isLoading: bannerQuery.isLoading,
    setImageFile: setFromBytesMutation.mutateAsync,
    setImageUrl: setFromUrlMutation.mutateAsync,
    clearBanner: clearMutation.mutateAsync,
    isUploading: setFromBytesMutation.isPending || setFromUrlMutation.isPending || clearMutation.isPending,
  };
}
