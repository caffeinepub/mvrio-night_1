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
  useMarkAdminMessagesAsSeen,
  useGetUserProfile
} from '../../hooks/useMessaging';
import { useHiddenAdminMode } from '../../context/HiddenAdminModeContext';
import { useGetCallerUserProfile } from '../../hooks/useUserProfile';
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
  const callerProfileQuery = useGetCallerUserProfile();

  // Admin mode queries
  const adminConversationQuery = useGetConversation(selectedUser);
  const selectedUserProfileQuery = useGetUserProfile(selectedUser);
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

  // Get user display name
  const userDisplayName = isAdminView
    ? selectedUserProfileQuery.data?.userName || 'User'
    : callerProfileQuery.data?.userName || 'User';

  // Mark messages as seen when drawer opens
  useEffect(() => {
    if (open) {
      if (isAdminView && selectedUser) {
        // Admin viewing user messages - mark user messages as seen
        markAdminMessagesSeenMutation.mutate({ user: selectedUser });
      } else if (!isAdminModeEnabled) {
        // User viewing MARIO messages - mark admin messages as seen
        markUserMessagesSeenMutation.mutate();
      }
    }
  }, [open, isAdminView, selectedUser, isAdminModeEnabled]);

  const handleSendMessage = async (content: string, attachments?: {
    audioAttachment?: File;
    imageAttachment?: File;
    pdfAttachment?: File;
  }) => {
    if (isAdminView && selectedUser) {
      await replyMutation.mutateAsync({
        user: selectedUser,
        content,
        audioAttachment: attachments?.audioAttachment,
        imageAttachment: attachments?.imageAttachment,
        pdfAttachment: attachments?.pdfAttachment,
      });
    } else {
      await sendMessageMutation.mutateAsync({
        content,
        audioAttachment: attachments?.audioAttachment,
        imageAttachment: attachments?.imageAttachment,
        pdfAttachment: attachments?.pdfAttachment,
      });
    }
  };

  const handleDeleteMessage = (messageId: bigint) => {
    if (isAdminView && selectedUser) {
      deleteAdminMessageMutation.mutate({ user: selectedUser, messageId });
    } else {
      deleteUserMessageMutation.mutate(messageId);
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  const isLoading = isAdminView 
    ? adminConversationQuery.isLoading || selectedUserProfileQuery.isLoading
    : userMessagesQuery.isLoading || callerProfileQuery.isLoading;

  const isSending = isAdminView 
    ? replyMutation.isPending
    : sendMessageMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            {isAdminView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <MarioAvatar size="md" />
            <div className="flex-1">
              <SheetTitle>
                {isAdminView ? `Chat with ${userDisplayName}` : 'Messages with MARIO'}
              </SheetTitle>
              <MarioStatusPill />
            </div>
          </div>
          <SheetDescription className="text-left">
            {isAdminView 
              ? 'Reply to user messages and manage the conversation.'
              : 'Send a message to MARIO or request a custom song.'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isAdminModeEnabled && !selectedUser ? (
            <AdminConversationList onSelectUser={setSelectedUser} />
          ) : (
            <>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <MessageThread 
                  messages={messages} 
                  contactInfo={contactInfo}
                  onDeleteMessage={handleDeleteMessage}
                  isAdminView={isAdminView}
                  userDisplayName={userDisplayName}
                />
              )}

              <MessageComposerForm
                onSend={handleSendMessage}
                isSending={isSending}
                isAdminReply={isAdminView}
                prefillContent={prefillContent}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
