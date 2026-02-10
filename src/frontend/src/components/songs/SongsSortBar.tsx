import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SortOption = 'latest' | 'most-liked' | 'most-heard';

interface SongsSortBarProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}

export function SongsSortBar({ sortBy, onSortChange }: SongsSortBarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-sm font-medium text-muted-foreground">Top</div>
      <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">Latest</SelectItem>
          <SelectItem value="most-liked">Most Liked</SelectItem>
          <SelectItem value="most-heard">Most Heard</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
