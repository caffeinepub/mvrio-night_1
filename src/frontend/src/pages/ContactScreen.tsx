import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export function ContactScreen() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold neon-glow">Contact</h1>
      
      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle>Get in Touch</CardTitle>
          <CardDescription>
            Have questions, feedback, or collaboration ideas? Reach out!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            I'd love to hear from you. Whether you have questions about the music, 
            want to discuss a custom song request, or just want to say hello, 
            feel free to send me an email.
          </p>
          
          <Button size="lg" className="neon-glow" asChild>
            <a href="mailto:contact@mvrio.com">
              <Mail className="w-5 h-5 mr-2" />
              Send Email
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
