import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, User, Trash2 } from 'lucide-react';
import { useGetAllConversations } from '../../hooks/useMessaging';
import { DeleteConversationConfirmDialog } from './DeleteConversationConfirmDialog';
import { Principal } from '@icp-sdk/core/principal';

interface AdminConversationListProps {
  onSelectUser: (user: Principal) => void;
}

export function AdminConversationList({ onSelectUser }: AdminConversationListProps) {
  const conversationsQuery = useGetAllConversations();
  const [deleteTarget, setDeleteTarget] = useState<Principal | null>(null);

  const conversations = conversationsQuery.data || [];

  const handleDeleteClick = (user: Principal, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(user);
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  if (conversationsQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (conversationsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load conversations. Please check your admin permissions.
        </AlertDescription>
      </Alert>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No conversations yet
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {conversations.map((userPrincipal) => (
            <Card
              key={userPrincipal.toString()}
              className="cursor-pointer hover:bg-accent transition-colors relative group"
              onClick={() => onSelectUser(userPrincipal)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      User {userPrincipal.toString().slice(0, 8)}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to view conversation
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteClick(userPrincipal, e)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <DeleteConversationConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && handleCancelDelete()}
        conversationId={deleteTarget?.toString() || ''}
        onSuccess={handleCancelDelete}
      />
    </>
  );
}
