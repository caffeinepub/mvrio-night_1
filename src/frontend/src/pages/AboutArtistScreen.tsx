import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SiYoutube, SiInstagram } from 'react-icons/si';
import { Coffee, Loader2 } from 'lucide-react';
import { useGetArtistProfile } from '../hooks/useQueries';
import { useHiddenAdminMode } from '../context/HiddenAdminModeContext';
import { AboutArtistProfileEditor } from '../components/admin/AboutArtistProfileEditor';

export function AboutArtistScreen() {
  const { data: profile, isLoading } = useGetArtistProfile();
  const { isAdminModeEnabled } = useHiddenAdminMode();

  // Default fallback values
  const defaultBio = 'Welcome to MVRIO Night, a premium music experience crafted with passion and dedication. Every track is carefully curated to bring you the best in modern music, blending unique sounds with emotional depth. Join me on this musical journey through the night sky.';
  const defaultYoutube = 'https://youtube.com';
  const defaultInstagram = 'https://instagram.com';
  const defaultBuyMeACoffee = 'https://buymeacoffee.com';

  // Use backend values if available, otherwise use defaults
  const displayBio = profile?.bio || defaultBio;
  const displayYoutube = profile?.youtube || defaultYoutube;
  const displayInstagram = profile?.instagram || defaultInstagram;
  const displayBuyMeACoffee = profile?.buyMeACoffee || defaultBuyMeACoffee;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold neon-glow">About the Artist</h1>
      
      {isAdminModeEnabled && (
        <AboutArtistProfileEditor />
      )}

      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle>THE MVRIO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground leading-relaxed">
                {displayBio}
              </p>
              
              <div className="pt-4 border-t border-border/50">
                <h3 className="font-semibold mb-4">Connect with me</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <a href={displayYoutube} target="_blank" rel="noopener noreferrer">
                      <SiYoutube className="w-5 h-5 mr-2" />
                      YouTube
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <a href={displayInstagram} target="_blank" rel="noopener noreferrer">
                      <SiInstagram className="w-5 h-5 mr-2" />
                      Instagram
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <a href={displayBuyMeACoffee} target="_blank" rel="noopener noreferrer">
                      <Coffee className="w-5 h-5 mr-2" />
                      Buy Me a Coffee
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
