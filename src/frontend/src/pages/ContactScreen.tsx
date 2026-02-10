import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Music } from 'lucide-react';

interface ContactScreenProps {
  onOpenMessages?: (prefill?: string) => void;
}

export function ContactScreen({ onOpenMessages }: ContactScreenProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold neon-glow">Send a Message</h1>
        <p className="text-muted-foreground">
          Get in touch with MARIO
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start a Conversation</CardTitle>
          <CardDescription>
            Click the button below to open the messaging interface where you can send a normal message or a custom song request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => onOpenMessages?.()}
            className="w-full"
            size="lg"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Open Messages
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-accent/50">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Normal Message</p>
              <p className="text-sm text-muted-foreground">
                Send a general message or inquiry to MARIO
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Music className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Custom Song Request</p>
              <p className="text-sm text-muted-foreground">
                Request a custom song with specific details using a structured form
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
