import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useHiddenAdminMode } from '../context/HiddenAdminModeContext';
import type { MessagesView, Message, ContactInfo } from '../backend';
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
    },
    onError: (error: any) => {
      console.error('Mark as seen error:', error);
    },
  });
}

// Compute unread state for user inbox icon
export function useHasUnreadMessages() {
  const { isAdminModeEnabled } = useHiddenAdminMode();
  const userMessagesQuery = useGetMessages();
  const adminConversationsQuery = useGetAllConversations();
  const { identity } = useInternetIdentity();

  if (isAdminModeEnabled) {
    // Admin mode: check if any conversation has unread user messages
    // For simplicity, we'll show unread if there are any conversations
    // A more sophisticated approach would query each conversation
    const hasConversations = (adminConversationsQuery.data?.length || 0) > 0;
    return {
      hasUnread: hasConversations,
      isLoading: adminConversationsQuery.isLoading,
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
      toast.success('Conversation deleted');
    },
    onError: (error: any) => {
      const message = getAuthErrorMessage(error);
      toast.error(message);
      console.error('Delete conversation error:', error);
    },
  });
}
