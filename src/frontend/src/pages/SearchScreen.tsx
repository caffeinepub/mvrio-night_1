import { useState, useEffect } from 'react';
import { useSearchSongs } from '../hooks/useQueries';
import { SongCard } from '../components/songs/SongCard';
import { MusicPlayer } from '../components/player/MusicPlayer';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import type { SongView } from '../backend';

export function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [currentSongId, setCurrentSongId] = useState<bigint | null>(null);
  const { data: songs, isLoading } = useSearchSongs(keyword);

  const currentSong = songs?.find(s => s.id === currentSongId) || null;

  const handleNext = () => {
    if (!songs || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSongId);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSongId(songs[nextIndex].id);
  };

  const handlePrevious = () => {
    if (!songs || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSongId);
    const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
    setCurrentSongId(songs[prevIndex].id);
  };

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

      {currentSong && (
        <MusicPlayer
          song={currentSong}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}

      {isLoading && keyword ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : songs && songs.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {songs.length} {songs.length === 1 ? 'result' : 'results'} found
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {songs.map((song) => (
              <SongCard
                key={song.id.toString()}
                song={song}
                onPlay={() => setCurrentSongId(song.id)}
                onDelete={() => {}}
                isPlaying={currentSongId === song.id}
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
