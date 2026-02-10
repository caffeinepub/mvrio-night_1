import { useState, useEffect } from 'react';

interface BannerState {
  imageUrl: string;
  imageFile: string | null;
}

const STORAGE_KEY = 'mvrio-home-banner';
const DEFAULT_BANNER = '/assets/generated/home-banner-aesthetic-moments.dim_463x453.jpeg';

export function useHomeBanner() {
  const [bannerState, setBannerState] = useState<BannerState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load banner state:', error);
    }
    return { imageUrl: '', imageFile: null };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bannerState));
    } catch (error) {
      console.error('Failed to save banner state:', error);
    }
  }, [bannerState]);

  const setImageUrl = (url: string) => {
    setBannerState({ imageUrl: url, imageFile: null });
  };

  const setImageFile = (file: File) => {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBannerState({ imageUrl: '', imageFile: result });
    };
    reader.readAsDataURL(file);
  };

  const clearBanner = () => {
    setBannerState({ imageUrl: '', imageFile: null });
  };

  const displayImage = bannerState.imageFile || bannerState.imageUrl || DEFAULT_BANNER;

  return {
    imageUrl: bannerState.imageUrl,
    imageFile: bannerState.imageFile,
    displayImage,
    setImageUrl,
    setImageFile,
    clearBanner,
  };
}
