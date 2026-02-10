import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type LibraryTab = 'songs' | 'playlists';

interface LibraryTopTabsProps {
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
}

export function LibraryTopTabs({ activeTab, onTabChange }: LibraryTopTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as LibraryTab)}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="songs">Songs</TabsTrigger>
        <TabsTrigger value="playlists">Playlists</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
