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
import { useDeleteConversation } from '../../hooks/useMessaging';

interface DeleteConversationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
}

export function DeleteConversationConfirmDialog({
  open,
  onOpenChange,
  conversationId,
}: DeleteConversationConfirmDialogProps) {
  const deleteConversationMutation = useDeleteConversation();

  const handleConfirm = async () => {
    if (!conversationId) return;
    
    try {
      await deleteConversationMutation.mutateAsync(conversationId);
      onOpenChange(false);
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error('Delete conversation failed:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this entire conversation? This action cannot be undone and all messages will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteConversationMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteConversationMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteConversationMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
