import { ReactNode, useState } from 'react';
import { AppHeader } from '../branding/AppHeader';
import { Sidebar } from '../navigation/Sidebar';
import { BottomTabBar } from '../navigation/BottomTabBar';
import { StarfieldBackground } from '../visual/StarfieldBackground';
import { A2HSBanner } from '../pwa/A2HSBanner';
import type { Screen } from '../../App';
import { featureFlags } from '../../config/featureFlags';

interface AppShellProps {
  children: ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onOpenMessages?: () => void;
}

export function AppShell({ children, currentScreen, onNavigate, onOpenMessages }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <StarfieldBackground />
      <A2HSBanner />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Sidebar 
          currentScreen={currentScreen} 
          onNavigate={onNavigate}
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
        
        <div className="flex-1 flex flex-col">
          <AppHeader 
            onOpenMessages={onOpenMessages}
            onToggleSidebar={handleToggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
          
          <main className="flex-1 container mx-auto px-4 py-6 pb-32 lg:pb-6">
            {children}
          </main>
          
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
