import { useState } from 'react';
import { useSearchSongs } from '../hooks/useQueries';
import { SongListRow } from '../components/songs/SongListRow';
import { usePlayer } from '../context/PlayerContext';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

export function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const { data: songs, isLoading } = useSearchSongs(keyword);
  const { currentSong, isPlaying, play } = usePlayer();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold neon-glow mb-4">Search</h1>
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for songs or artists..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-10 h-12 text-lg dark:text-white"
          />
        </div>
      </div>

      {isLoading && keyword ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : songs && songs.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {songs.length} {songs.length === 1 ? 'result' : 'results'} found
          </h2>
          <div className="space-y-2">
            {songs.map((song) => (
              <SongListRow
                key={song.id.toString()}
                song={song}
                isPlaying={currentSong?.id === song.id && isPlaying}
                onPlay={() => play(song, songs)}
              />
            ))}
          </div>
        </div>
      ) : keyword ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No songs found matching "{keyword}"</p>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Start typing to search for songs</p>
        </div>
      )}
    </div>
  );
}
