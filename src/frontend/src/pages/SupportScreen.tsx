import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, Heart } from 'lucide-react';

export function SupportScreen() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold neon-glow">Support</h1>
      
      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Support MVRIO Night
          </CardTitle>
          <CardDescription>
            Help keep the music playing and support future releases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            If you enjoy MVRIO Night and want to support the creation of more music, 
            consider buying me a coffee. Your support helps me continue creating and 
            sharing music with the world.
          </p>
          
          <Button size="lg" className="w-full sm:w-auto neon-glow" asChild>
            <a href="https://buymeacoffee.com" target="_blank" rel="noopener noreferrer">
              <Coffee className="w-5 h-5 mr-2" />
              Buy Me a Coffee
            </a>
          </Button>
          
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Every contribution, no matter how small, makes a difference and is deeply appreciated. 
              Thank you for being part of this journey! 🌌
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
