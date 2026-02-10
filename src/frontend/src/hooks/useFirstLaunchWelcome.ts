import { useState, useEffect } from 'react';

const FIRST_LAUNCH_KEY = 'firstLaunchShown';

export function useFirstLaunchWelcome() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  useEffect(() => {
    // Check if first launch has been shown
    const hasShown = localStorage.getItem(FIRST_LAUNCH_KEY);
    if (!hasShown || hasShown !== 'true') {
      setIsWelcomeOpen(true);
    }
  }, []);

  const dismissWelcome = () => {
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    setIsWelcomeOpen(false);
  };

  return {
    isWelcomeOpen,
    dismissWelcome,
  };
}
