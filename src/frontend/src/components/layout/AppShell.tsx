import { type ReactNode } from 'react';
import { StarfieldBackground } from '../visual/StarfieldBackground';
import { AppHeader } from '../branding/AppHeader';
import { Sidebar } from '../navigation/Sidebar';
import { BottomTabBar } from '../navigation/BottomTabBar';
import { A2HSBanner } from '../pwa/A2HSBanner';
import { useSettings } from '../../hooks/useSettings';
import { featureFlags } from '../../config/featureFlags';
import type { Screen } from '../../App';

interface AppShellProps {
  children: ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function AppShell({ children, currentScreen, onNavigate }: AppShellProps) {
  const { starEffects } = useSettings();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {starEffects && <StarfieldBackground />}
      
      <div className="relative z-10 flex min-h-screen">
        <Sidebar currentScreen={currentScreen} onNavigate={onNavigate} />
        
        <div className="flex-1 flex flex-col">
          <A2HSBanner />
          <AppHeader />
          
          <main className={`flex-1 overflow-y-auto pb-20 ${featureFlags.enableDesktopBottomTabBar ? 'lg:pb-24' : 'lg:pb-0'}`}>
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              {children}
            </div>
          </main>
          
          <footer className={`${featureFlags.enableDesktopBottomTabBar ? 'hidden' : 'hidden lg:block'} border-t border-border/50 py-4 px-4 text-center text-sm text-muted-foreground`}>
            <p>© {new Date().getFullYear()}. Built with ❤️ using <a href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">caffeine.ai</a></p>
          </footer>

          <BottomTabBar 
            currentScreen={currentScreen} 
            onNavigate={onNavigate}
            showOnDesktop={featureFlags.enableDesktopBottomTabBar}
          />
        </div>
      </div>
    </div>
  );
}
