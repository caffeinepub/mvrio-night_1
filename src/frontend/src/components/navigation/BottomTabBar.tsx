import { Home, Music, Library, Search } from 'lucide-react';
import type { Screen } from '../../App';

interface BottomTabBarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  showOnDesktop?: boolean;
}

export function BottomTabBar({ currentScreen, onNavigate, showOnDesktop = false }: BottomTabBarProps) {
  const tabs = [
    { id: 'home' as Screen, label: 'Home', icon: Home },
    { id: 'songs' as Screen, label: 'Songs', icon: Music },
    { id: 'library' as Screen, label: 'Library', icon: Library },
    { id: 'search' as Screen, label: 'Search', icon: Search },
  ];

  return (
    <nav className={`${showOnDesktop ? '' : 'lg:hidden'} fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-sm bottom-tab-bar`}>
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              data-active={isActive}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-[#1ED760]' 
                  : 'text-primary hover:bg-primary/10 dark:hover:bg-white/10'
              }`}
            >
              <Icon 
                className={`w-5 h-5 ${isActive ? '!text-[#000000]' : ''}`}
                style={
                  isActive 
                    ? { stroke: '#000000', color: '#000000' }
                    : undefined
                }
                strokeWidth={2}
              />
              <span className={`text-xs font-medium ${isActive ? '!text-[#000000]' : 'dark:!text-[#FFFFFF]'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
