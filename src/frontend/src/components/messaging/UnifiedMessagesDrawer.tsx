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
  useGetConversationMessages,
  useReplyWithAttachments,
  useDeleteUserMessage,
  useMarkAllMessagesAsSeen
} from '../../hooks/useMessaging';
import { useHiddenAdminMode } from '../../context/HiddenAdminModeContext';
import { useGetCallerUserProfile } from '../../hooks/useUserProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { Principal } from '@icp-sdk/core/principal';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useActor } from '../../hooks/useActor';
import type { MessagesView } from '../../backend';

interface UnifiedMessagesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillContent?: string;
}

export function UnifiedMessagesDrawer({ open, onOpenChange, prefillContent }: UnifiedMessagesDrawerProps) {
  const { isAdminModeEnabled } = useHiddenAdminMode();
  const { actor } = useActor();
  const [selectedUser, setSelectedUser] = useState<Principal | null>(null);
  const [adminConversationData, setAdminConversationData] = useState<MessagesView | null>(null);
  const [selectedUserDisplayName, setSelectedUserDisplayName] = useState('User');
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(false);

  // User mode queries
  const userMessagesQuery = useGetMessages();
  const sendMessageMutation = useSendMessageWithAttachments();
  const markUserMessagesSeenMutation = useMarkMessagesAsSeen();
  const deleteUserMessageMutation = useDeleteMessage();
  const callerProfileQuery = useGetCallerUserProfile();

  // Admin mode mutations
  const getConversationMutation = useGetConversationMessages();
  const replyMutation = useReplyWithAttachments();
  const deleteAdminMessageMutation = useDeleteUserMessage();
  const markAdminMessagesSeenMutation = useMarkAllMessagesAsSeen();

  // Fetch admin conversation data when user is selected
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!selectedUser || !actor) return;
      
      setIsLoadingAdminData(true);
      try {
        // Fetch conversation messages
        const conversationData = await getConversationMutation.mutateAsync(selectedUser);
        setAdminConversationData(conversationData);
        
        // Fetch user profile for display name
        const userProfile = await actor.getUserProfile(selectedUser);
        if (userProfile?.userName) {
          setSelectedUserDisplayName(userProfile.userName);
        } else {
          setSelectedUserDisplayName('User');
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoadingAdminData(false);
      }
    };
    
    fetchAdminData();
  }, [selectedUser, actor]);

  // Determine which data to use
  const isAdminView = isAdminModeEnabled && selectedUser !== null;
  const messages = isAdminView 
    ? (adminConversationData?.messages || [])
    : (userMessagesQuery.data?.messages || []);
  const contactInfo = isAdminView 
    ? adminConversationData?.contactInfo
    : userMessagesQuery.data?.contactInfo;

  // Get user display name
  const userDisplayName = isAdminView
    ? selectedUserDisplayName
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
    fileAttachment?: File;
  }) => {
    if (isAdminView && selectedUser) {
      await replyMutation.mutateAsync({
        user: selectedUser,
        content,
        audioAttachment: attachments?.audioAttachment,
        imageAttachment: attachments?.imageAttachment,
        pdfAttachment: attachments?.pdfAttachment,
        fileAttachment: attachments?.fileAttachment,
      });
      // Refresh conversation data after reply
      const updatedData = await getConversationMutation.mutateAsync(selectedUser);
      setAdminConversationData(updatedData);
    } else {
      await sendMessageMutation.mutateAsync({
        content,
        audioAttachment: attachments?.audioAttachment,
        imageAttachment: attachments?.imageAttachment,
        pdfAttachment: attachments?.pdfAttachment,
        fileAttachment: attachments?.fileAttachment,
      });
    }
  };

  const handleDeleteMessage = async (messageId: bigint) => {
    if (isAdminView && selectedUser) {
      await deleteAdminMessageMutation.mutateAsync({ user: selectedUser, messageId });
      // Refresh conversation data after delete
      const updatedData = await getConversationMutation.mutateAsync(selectedUser);
      setAdminConversationData(updatedData);
    } else {
      deleteUserMessageMutation.mutate(messageId);
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setAdminConversationData(null);
    setSelectedUserDisplayName('User');
  };

  const isLoading = isAdminView 
    ? isLoadingAdminData
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
