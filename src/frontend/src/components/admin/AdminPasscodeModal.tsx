import { useState, useEffect } from 'react';
import { useHiddenAdminMode } from '../../context/HiddenAdminModeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, LogOut, Loader2 } from 'lucide-react';

export function AdminPasscodeModal() {
  const { isModalOpen, closeModal, enableAdminMode, isAdminModeEnabled, disableAdminMode } = useHiddenAdminMode();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      setPasscode('');
      setError('');
      setIsVerifying(false);
    }
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passcode.trim()) {
      setError('Please enter a passcode');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await enableAdminMode(passcode);
      
      if (result.success) {
        closeModal();
      } else {
        setError(result.error || 'Verification failed');
        setPasscode('');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = () => {
    disableAdminMode();
    closeModal();
  };

  const handleCancel = () => {
    setPasscode('');
    setError('');
    closeModal();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Admin Mode
          </DialogTitle>
          <DialogDescription>
            {isAdminModeEnabled
              ? 'Admin Mode is currently enabled. You can disable it below.'
              : 'Enter the admin passcode to enable Admin Mode.'}
          </DialogDescription>
        </DialogHeader>

        {isAdminModeEnabled ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-primary">Admin Mode Active</p>
            </div>
            <Button
              onClick={handleDisable}
              variant="destructive"
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              Disable Admin Mode
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError('');
                }}
                placeholder="Enter admin passcode"
                autoFocus
                autoComplete="off"
                disabled={isVerifying}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Enable Admin Mode'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {!isAdminModeEnabled && (
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="w-full"
              disabled={isVerifying}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
