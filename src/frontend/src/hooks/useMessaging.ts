import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useHiddenAdminMode } from '../context/HiddenAdminModeContext';
import type { MessagesView, Message, ContactInfo, UserProfileRecord, Attachment } from '../backend';
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
      pdfAttachment,
      fileAttachment
    }: { 
      content: string;
      audioAttachment?: File;
      imageAttachment?: File;
      pdfAttachment?: File;
      fileAttachment?: File;
    }) => {
      if (!actor) throw new Error('Actor not initialized');

      let audioAttachmentObj: Attachment | null = null;
      let imageAttachmentObj: Attachment | null = null;
      let pdfAttachmentObj: Attachment | null = null;
      let fileAttachmentObj: Attachment | null = null;

      if (audioAttachment) {
        const bytes = await fileToBytes(audioAttachment);
        audioAttachmentObj = {
          blob: ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>),
          fileName: audioAttachment.name,
          mimeType: audioAttachment.type || 'audio/mpeg',
        };
      }

      if (imageAttachment) {
        const bytes = await fileToBytes(imageAttachment);
        imageAttachmentObj = {
          blob: ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>),
          fileName: imageAttachment.name,
          mimeType: imageAttachment.type || 'image/jpeg',
        };
      }

      if (pdfAttachment) {
        const bytes = await fileToBytes(pdfAttachment);
        pdfAttachmentObj = {
          blob: ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>),
          fileName: pdfAttachment.name,
          mimeType: pdfAttachment.type || 'application/pdf',
        };
      }

      if (fileAttachment) {
        const bytes = await fileToBytes(fileAttachment);
        fileAttachmentObj = {
          blob: ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>),
          fileName: fileAttachment.name,
          mimeType: fileAttachment.type || 'application/octet-stream',
        };
      }

      return actor.sendMessageWithAttachments(
        content, 
        audioAttachmentObj, 
        imageAttachmentObj, 
        pdfAttachmentObj,
        fileAttachmentObj
      );
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
        return conversations.length;
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        return 0;
      }
    },
    enabled: !!actor && !isFetching && isAdminModeEnabled,
    refetchInterval: 30000, // Refetch every 30 seconds when admin mode is enabled
  });
}

// Admin conversation hooks
export function useGetAllConversations() {
  const { actor, isFetching } = useActor();
  const { isAdminModeEnabled, getPasscode } = useHiddenAdminMode();

  return useQuery<Principal[]>({
    queryKey: ['conversations', 'admin'],
    queryFn: async () => {
      if (!actor) return [];
      const passcode = getPasscode();
      if (!passcode) return [];
      
      return actor.getAllConversations(passcode);
    },
    enabled: !!actor && !isFetching && isAdminModeEnabled,
  });
}

export function useGetConversationMessages() {
  const { actor } = useActor();
  const { getPasscode } = useHiddenAdminMode();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Passcode not available');
      
      return actor.getAllMessages(user, passcode);
    },
  });
}

export function useReplyWithAttachments() {
  const { actor } = useActor();
  const { getPasscode } = useHiddenAdminMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      user, 
      content, 
      audioAttachment, 
      imageAttachment, 
      pdfAttachment,
      fileAttachment
    }: { 
      user: Principal;
      content: string;
      audioAttachment?: File;
      imageAttachment?: File;
      pdfAttachment?: File;
      fileAttachment?: File;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Passcode not available');

      let audioAttachmentObj: Attachment | null = null;
      let imageAttachmentObj: Attachment | null = null;
      let pdfAttachmentObj: Attachment | null = null;
      let fileAttachmentObj: Attachment | null = null;

      if (audioAttachment) {
        const bytes = await fileToBytes(audioAttachment);
        audioAttachmentObj = {
          blob: ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>),
          fileName: audioAttachment.name,
          mimeType: audioAttachment.type || 'audio/mpeg',
        };
      }

      if (imageAttachment) {
        const bytes = await fileToBytes(imageAttachment);
        imageAttachmentObj = {
          blob: ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>),
          fileName: imageAttachment.name,
          mimeType: imageAttachment.type || 'image/jpeg',
        };
      }

      if (pdfAttachment) {
        const bytes = await fileToBytes(pdfAttachment);
        pdfAttachmentObj = {
          blob: ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>),
          fileName: pdfAttachment.name,
          mimeType: pdfAttachment.type || 'application/pdf',
        };
      }

      if (fileAttachment) {
        const bytes = await fileToBytes(fileAttachment);
        fileAttachmentObj = {
          blob: ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>),
          fileName: fileAttachment.name,
          mimeType: fileAttachment.type || 'application/octet-stream',
        };
      }

      return actor.replyWithAttachments(
        user, 
        content, 
        audioAttachmentObj, 
        imageAttachmentObj, 
        pdfAttachmentObj,
        fileAttachmentObj,
        passcode
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', 'admin'] });
      toast.success('Reply sent successfully');
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
  const { getPasscode } = useHiddenAdminMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, messageId }: { user: Principal; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Passcode not available');
      
      return actor.deleteUserMessage(user, messageId, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'admin'] });
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

export function useMarkAllMessagesAsSeen() {
  const { actor } = useActor();
  const { getPasscode } = useHiddenAdminMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user }: { user: Principal }) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Passcode not available');
      
      return actor.markAllMessagesAsSeen('admin', user, passcode);
    },
    onSuccess: () => {
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
  const { getPasscode } = useHiddenAdminMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const passcode = getPasscode();
      if (!passcode) throw new Error('Passcode not available');
      
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

// User profile fetching for admin view
export function useGetUserProfile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getUserProfile(user);
    },
  });
}
