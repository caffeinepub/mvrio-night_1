import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MessageThread } from './MessageThread';
import { MessageComposerForm } from './MessageComposerForm';
import { AdminConversationList } from './AdminConversationList';
import { MarioAvatar } from './MarioAvatar';
import { MarioStatusPill } from './MarioStatusPill';
import { 
  useGetMessages, 
  useSendMessageWithAttachments, 
  useMarkMessagesAsSeen,
  useDeleteMessage,
  useGetConversation,
  useReplyWithAttachments,
  useDeleteUserMessage,
  useMarkAdminMessagesAsSeen
} from '../../hooks/useMessaging';
import { useHiddenAdminMode } from '../../context/HiddenAdminModeContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Principal } from '@icp-sdk/core/principal';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface UnifiedMessagesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillContent?: string;
}

export function UnifiedMessagesDrawer({ open, onOpenChange, prefillContent }: UnifiedMessagesDrawerProps) {
  const { isAdminModeEnabled } = useHiddenAdminMode();
  const [selectedUser, setSelectedUser] = useState<Principal | null>(null);

  // User mode queries
  const userMessagesQuery = useGetMessages();
  const sendMessageMutation = useSendMessageWithAttachments();
  const markUserMessagesSeenMutation = useMarkMessagesAsSeen();
  const deleteUserMessageMutation = useDeleteMessage();

  // Admin mode queries
  const adminConversationQuery = useGetConversation(selectedUser);
  const replyMutation = useReplyWithAttachments();
  const deleteAdminMessageMutation = useDeleteUserMessage();
  const markAdminMessagesSeenMutation = useMarkAdminMessagesAsSeen();

  // Determine which data to use
  const isAdminView = isAdminModeEnabled && selectedUser !== null;
  const messages = isAdminView 
    ? (adminConversationQuery.data?.messages || [])
    : (userMessagesQuery.data?.messages || []);
  const contactInfo = isAdminView 
    ? adminConversationQuery.data?.contactInfo
    : userMessagesQuery.data?.contactInfo;
  const isLoading = isAdminView ? adminConversationQuery.isLoading : userMessagesQuery.isLoading;

  // Mark messages as seen when drawer opens
  useEffect(() => {
    if (open && messages.length > 0) {
      if (isAdminView && selectedUser) {
        // Admin viewing user messages - mark user messages as seen
        const hasUnreadUserMessages = messages.some(msg => !msg.isAdmin && !msg.recipientSeen);
        if (hasUnreadUserMessages) {
          markAdminMessagesSeenMutation.mutate({ user: selectedUser });
        }
      } else if (!isAdminModeEnabled) {
        // User viewing MARIO messages - mark admin messages as seen
        const hasUnreadAdminMessages = messages.some(msg => msg.isAdmin && !msg.recipientSeen);
        if (hasUnreadAdminMessages) {
          markUserMessagesSeenMutation.mutate();
        }
      }
    }
  }, [open, messages.length, isAdminView, selectedUser, isAdminModeEnabled]);

  const handleSendMessage = (content: string, attachments: {
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  }) => {
    if (isAdminView && selectedUser) {
      // Admin replying to user
      replyMutation.mutate({ 
        user: selectedUser, 
        content,
        ...attachments
      });
    } else {
      // User sending message
      sendMessageMutation.mutate({ content, ...attachments });
    }
  };

  const handleDeleteMessage = (messageId: bigint) => {
    if (isAdminView && selectedUser) {
      // Admin deleting any message
      deleteAdminMessageMutation.mutate({ user: selectedUser, messageId });
    } else {
      // User deleting own message
      deleteUserMessageMutation.mutate(messageId);
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  const handleSelectUser = (user: Principal) => {
    setSelectedUser(user);
  };

  // Admin mode with no user selected - show conversation list
  if (isAdminModeEnabled && !selectedUser) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Messages</SheetTitle>
            <SheetDescription>
              Select a conversation to view and reply
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            <AdminConversationList onSelectUser={handleSelectUser} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // User mode or admin with selected user - show thread
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            {isAdminView && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <MarioAvatar size="md" />
            <div className="flex-1">
              <SheetTitle>MARIO</SheetTitle>
              <MarioStatusPill />
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[200px]" />
            </div>
          ) : (
            <>
              <MessageThread 
                messages={messages} 
                contactInfo={contactInfo}
                onDeleteMessage={handleDeleteMessage}
                isAdminView={isAdminView}
              />
              <MessageComposerForm 
                onSubmit={handleSendMessage} 
                isLoading={isAdminView ? replyMutation.isPending : sendMessageMutation.isPending}
                prefillContent={prefillContent}
                isAdminMode={isAdminView}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
