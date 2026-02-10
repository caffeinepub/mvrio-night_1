import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export function ThemesScreen() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold neon-glow">Themes</h1>
      
      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('dark')}
              className={`relative p-6 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-primary neon-border'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Moon className="w-12 h-12" />
                <div className="text-center">
                  <Label className="text-lg font-semibold">Night Mode</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dark sky with stars and neon accents
                  </p>
                </div>
              </div>
              {theme === 'dark' && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary neon-glow" />
              )}
            </button>
            
            <button
              onClick={() => setTheme('light')}
              className={`relative p-6 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-primary neon-border'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Sun className="w-12 h-12" />
                <div className="text-center">
                  <Label className="text-lg font-semibold">Day Mode</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Light background with soft accents
                  </p>
                </div>
              </div>
              {theme === 'light' && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
