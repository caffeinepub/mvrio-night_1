import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface DeletePlaylistConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistName: string;
  playlistType: 'user' | 'official';
  isPending: boolean;
  onConfirm: () => void;
}

export function DeletePlaylistConfirmDialog({
  open,
  onOpenChange,
  playlistName,
  playlistType,
  isPending,
  onConfirm,
}: DeletePlaylistConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{playlistName}"? This action cannot be undone and will
            permanently remove this {playlistType === 'official' ? 'official ' : ''}playlist.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
