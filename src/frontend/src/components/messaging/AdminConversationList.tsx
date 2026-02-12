import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, MessageSquare } from 'lucide-react';
import { useGetAllConversations } from '../../hooks/useMessaging';
import { Skeleton } from '@/components/ui/skeleton';
import { Principal } from '@icp-sdk/core/principal';
import { useState, useEffect } from 'react';
import { DeleteConversationConfirmDialog } from './DeleteConversationConfirmDialog';
import { useActor } from '../../hooks/useActor';

interface AdminConversationListProps {
  onSelectUser: (user: Principal) => void;
}

export function AdminConversationList({ onSelectUser }: AdminConversationListProps) {
  const conversationsQuery = useGetAllConversations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  if (conversationsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const conversations = conversationsQuery.data || [];

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No conversations yet</p>
          <p className="text-sm mt-1">User messages will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {conversations.map((userPrincipal) => (
          <ConversationCard
            key={userPrincipal.toString()}
            userPrincipal={userPrincipal}
            onSelect={() => onSelectUser(userPrincipal)}
            onDelete={(e) => handleDeleteClick(userPrincipal.toString(), e)}
          />
        ))}
      </div>

      <DeleteConversationConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        conversationId={conversationToDelete}
      />
    </>
  );
}

interface ConversationCardProps {
  userPrincipal: Principal;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ConversationCard({ userPrincipal, onSelect, onDelete }: ConversationCardProps) {
  const { actor } = useActor();
  const [displayName, setDisplayName] = useState('User');
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!actor) return;
      try {
        const profile = await actor.getUserProfile(userPrincipal);
        if (profile?.userName) {
          setDisplayName(profile.userName);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [actor, userPrincipal]);
  
  const principalText = userPrincipal.toString();
  const shortPrincipal = `${principalText.slice(0, 8)}...${principalText.slice(-6)}`;

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors group"
      onClick={onSelect}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-sm font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{shortPrincipal}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
