import { Music } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-card flex items-center justify-center">
          <Music className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold neon-glow">MVRIO Night</h1>
          <p className="text-xs text-muted-foreground">Premium Music Experience</p>
        </div>
      </div>
    </header>
  );
}
