import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useHiddenAdminMode } from '../context/HiddenAdminModeContext';
import type { MessagesView, Message, ContactInfo, UserProfileRecord } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';
import { getAuthErrorMessage, isSignInRequiredError } from '../utils/authorizationErrors';
import { ExternalBlob } from '../backend';
import { fileToBytes } from '../utils/messagingAttachments';

// User messaging hooks
export function useGetMessages() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<MessagesView | null>({
    queryKey: ['messages', 'user'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMessages();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSendMessageWithAttachments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      content, 
      audioAttachment, 
      imageAttachment, 
      pdfAttachment 
    }: { 
      content: string;
      audioAttachment?: File;
      imageAttachment?: File;
      pdfAttachment?: File;
    }) => {
      if (!actor) throw new Error('Actor not initialized');

      let audioBlob: ExternalBlob | null = null;
      let imageBlob: ExternalBlob | null = null;
      let pdfBlob: ExternalBlob | null = null;

      if (audioAttachment) {
        const bytes = await fileToBytes(audioAttachment);
        audioBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      }

      if (imageAttachment) {
        const bytes = await fileToBytes(imageAttachment);
        imageBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      }

      if (pdfAttachment) {
        const bytes = await fileToBytes(pdfAttachment);
        pdfBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      }

      return actor.sendMessageWithAttachments(content, audioBlob, imageBlob, pdfBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', 'admin'] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Send message error:', error);
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteMessage(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', 'admin'] });
      toast.success('Message deleted');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete message error:', error);
    },
  });
}

export function useMarkMessagesAsSeen() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.markMessagesAsSeen(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', 'admin'] });
    },
    onError: (error: any) => {
      console.error('Mark as seen error:', error);
    },
  });
}

// Admin unread count query
export function useGetAdminUnreadCount() {
  const { actor, isFetching } = useActor();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useQuery<number>({
    queryKey: ['unreadCount', 'admin'],
    queryFn: async () => {
      if (!actor) return 0;
      const passcode = getPasscode();
      if (!passcode) return 0;
      
      try {
        const conversations = await actor.getAllConversations(passcode);
        let unreadCount = 0;
        
        // Check each conversation for unread user messages
        for (const userPrincipal of conversations) {
          const messagesView = await actor.getAllMessages(userPrincipal, passcode);
          if (messagesView && messagesView.messages) {
            const hasUnreadUserMessages = messagesView.messages.some(
              msg => !msg.isAdmin && !msg.recipientSeen
            );
            if (hasUnreadUserMessages) {
              unreadCount++;
            }
          }
        }
        
        return unreadCount;
      } catch (error) {
        console.error('Error fetching admin unread count:', error);
        return 0;
      }
    },
    enabled: !!actor && !isFetching && isAdminModeEnabled && !!getPasscode(),
    refetchInterval: 10000, // Refetch every 10 seconds when admin mode is active
  });
}

// Compute unread state for user inbox icon
export function useHasUnreadMessages() {
  const { isAdminModeEnabled } = useHiddenAdminMode();
  const userMessagesQuery = useGetMessages();
  const adminUnreadCountQuery = useGetAdminUnreadCount();
  const { identity } = useInternetIdentity();

  if (isAdminModeEnabled) {
    // Admin mode: check if there are any conversations with unread user messages
    const unreadCount = adminUnreadCountQuery.data || 0;
    return {
      hasUnread: unreadCount > 0,
      isLoading: adminUnreadCountQuery.isLoading,
    };
  } else {
    // User mode: check for unread admin messages
    const messages = userMessagesQuery.data?.messages || [];
    const hasUnread = messages.some(msg => msg.isAdmin && !msg.recipientSeen);
    
    return {
      hasUnread,
      isLoading: userMessagesQuery.isLoading,
    };
  }
}

// Admin messaging hooks
export function useGetAllConversations() {
  const { actor, isFetching } = useActor();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useQuery<Principal[]>({
    queryKey: ['conversations', 'admin'],
    queryFn: async () => {
      if (!actor) return [];
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not available');
      return actor.getAllConversations(passcode);
    },
    enabled: !!actor && !isFetching && isAdminModeEnabled && !!getPasscode(),
  });
}

export function useGetConversation(user: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useQuery<MessagesView | null>({
    queryKey: ['conversation', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not available');
      return actor.getAllMessages(user, passcode);
    },
    enabled: !!actor && !isFetching && isAdminModeEnabled && !!user && !!getPasscode(),
  });
}

// Fetch user profile for a given principal
export function useGetUserProfile(user: Principal | null) {
  const { actor, isFetching } = useActor();
  const { isAdminModeEnabled } = useHiddenAdminMode();

  return useQuery<UserProfileRecord | null>({
    queryKey: ['userProfile', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      try {
        return await actor.getUserProfile(user);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && isAdminModeEnabled && !!user,
  });
}

export function useReplyWithAttachments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async ({ 
      user, 
      content,
      audioAttachment,
      imageAttachment,
      pdfAttachment
    }: { 
      user: Principal; 
      content: string;
      audioAttachment?: File;
      imageAttachment?: File;
      pdfAttachment?: File;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not available');

      let audioBlob: ExternalBlob | null = null;
      let imageBlob: ExternalBlob | null = null;
      let pdfBlob: ExternalBlob | null = null;

      if (audioAttachment) {
        const bytes = await fileToBytes(audioAttachment);
        audioBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      }

      if (imageAttachment) {
        const bytes = await fileToBytes(imageAttachment);
        imageBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      }

      if (pdfAttachment) {
        const bytes = await fileToBytes(pdfAttachment);
        pdfBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      }

      return actor.replyWithAttachments(user, content, audioBlob, imageBlob, pdfBlob, passcode);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.user.toString()] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', 'admin'] });
      toast.success('Reply sent');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Reply error:', error);
    },
  });
}

export function useDeleteUserMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async ({ user, messageId }: { user: Principal; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not available');
      return actor.deleteUserMessage(user, messageId, passcode);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.user.toString()] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', 'admin'] });
      toast.success('Message deleted');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete message error:', error);
    },
  });
}

export function useMarkAdminMessagesAsSeen() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async ({ user }: { user: Principal }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not available');
      return actor.markAllMessagesAsSeen('user', user, passcode);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.user.toString()] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', 'admin'] });
    },
    onError: (error: any) => {
      console.error('Mark as seen error:', error);
    },
  });
}

export function useDeleteConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Admin passcode not available');
      return actor.adminDeleteConversation(null, conversationId, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', 'admin'] });
      toast.success('Conversation deleted');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete conversation error:', error);
    },
  });
}
