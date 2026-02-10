import { createContext, useContext, useState, useEffect, type ReactNode, createElement } from 'react';

interface Settings {
  audioQuality: 'low' | 'medium' | 'high';
  reduceAnimations: boolean;
  starEffects: boolean;
  notifications: boolean;
}

interface SettingsContextType extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  audioQuality: 'high',
  reduceAnimations: false,
  starEffects: true,
  notifications: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem('mvrio-settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('mvrio-settings', JSON.stringify(settings));
    
    if (settings.reduceAnimations) {
      document.body.classList.add('reduce-animations');
    } else {
      document.body.classList.remove('reduce-animations');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const contextValue = { ...settings, updateSettings };

  return createElement(SettingsContext.Provider, { value: contextValue }, children);
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
