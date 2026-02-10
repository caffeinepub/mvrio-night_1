import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, Mail } from 'lucide-react';

export function CustomSongRequestsScreen() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold neon-glow">Custom Song Requests</h1>
      
      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle>Create Your Unique Track</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed text-lg">
            Want a custom song made just for you? Tell me the situation, preferred language, 
            vibe, and style. I'll turn your story into a unique track. Contact below for 
            requests or collaborations.
          </p>
          
          <div className="space-y-3 pt-4">
            <Button size="lg" variant="outline" className="w-full justify-start" asChild>
              <a href="https://buymeacoffee.com" target="_blank" rel="noopener noreferrer">
                <Coffee className="w-5 h-5 mr-3" />
                ☕ Support / Buy Me a Coffee
              </a>
            </Button>
            
            <Button size="lg" variant="outline" className="w-full justify-start" asChild>
              <a href="mailto:contact@mvrio.com">
                <Mail className="w-5 h-5 mr-3" />
                📧 Contact via Email
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
