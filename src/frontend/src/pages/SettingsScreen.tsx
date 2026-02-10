import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '../hooks/useSettings';
import { Separator } from '@/components/ui/separator';

export function SettingsScreen() {
  const { audioQuality, reduceAnimations, starEffects, notifications, updateSettings } = useSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold neon-glow">Settings</h1>
      
      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle>Audio</CardTitle>
          <CardDescription>Configure audio playback settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="audio-quality">Audio Quality</Label>
            <Select
              value={audioQuality}
              onValueChange={(value: 'low' | 'medium' | 'high') =>
                updateSettings({ audioQuality: value })
              }
            >
              <SelectTrigger id="audio-quality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (64 kbps)</SelectItem>
                <SelectItem value="medium">Medium (128 kbps)</SelectItem>
                <SelectItem value="high">High (320 kbps)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle>Visual Effects</CardTitle>
          <CardDescription>Customize visual appearance and animations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-animations">Reduce Animations</Label>
              <p className="text-sm text-muted-foreground">
                Minimize motion and transitions
              </p>
            </div>
            <Switch
              id="reduce-animations"
              checked={reduceAnimations}
              onCheckedChange={(checked) => updateSettings({ reduceAnimations: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="star-effects">Star Effects</Label>
              <p className="text-sm text-muted-foreground">
                Show twinkling stars in night mode
              </p>
            </div>
            <Switch
              id="star-effects"
              checked={starEffects}
              onCheckedChange={(checked) => updateSettings({ starEffects: checked })}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates and alerts
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={(checked) => updateSettings({ notifications: checked })}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-shadow-custom">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">App Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span className="font-mono">2026.02.09</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
