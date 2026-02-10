import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, FileText, Music as MusicIcon, Image as ImageIcon } from 'lucide-react';
import { MarioAvatar } from './MarioAvatar';
import { useHiddenAdminMode } from '../../context/HiddenAdminModeContext';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import type { Message, ContactInfo } from '../../backend';
import { ReactNode } from 'react';

interface MessageThreadProps {
  messages: Message[];
  contactInfo?: ContactInfo | null;
  onDeleteMessage?: (messageId: bigint) => void;
  isAdminView?: boolean;
}

export function MessageThread({ messages, contactInfo, onDeleteMessage, isAdminView = false }: MessageThreadProps) {
  const { isAdminModeEnabled } = useHiddenAdminMode();
  const { identity } = useInternetIdentity();

  const handleDeleteClick = (messageId: bigint, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteMessage?.(messageId);
  };

  const canDeleteMessage = (message: Message): boolean => {
    if (isAdminModeEnabled) {
      // Admin can delete any message
      return true;
    }
    // User can only delete their own messages (non-admin messages)
    return !message.isAdmin;
  };

  const renderAttachment = (message: Message): ReactNode => {
    const attachments: ReactNode[] = [];

    if (message.imageAttachment) {
      const imageUrl = message.imageAttachment.getDirectURL();
      attachments.push(
        <div key="image" className="mt-2">
          <img 
            src={imageUrl} 
            alt="Attachment" 
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              window.open(imageUrl, '_blank');
            }}
          />
        </div>
      );
    }

    if (message.audioAttachment) {
      const audioUrl = message.audioAttachment.getDirectURL();
      attachments.push(
        <div key="audio" className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(audioUrl, '_blank');
            }}
          >
            <MusicIcon className="w-4 h-4" />
            Play Audio
          </Button>
        </div>
      );
    }

    if (message.pdfAttachment) {
      const pdfUrl = message.pdfAttachment.getDirectURL();
      attachments.push(
        <div key="pdf" className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(pdfUrl, '_blank');
            }}
          >
            <FileText className="w-4 h-4" />
            Open PDF
          </Button>
        </div>
      );
    }

    return attachments.length > 0 ? <>{attachments}</> : null;
  };

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No messages yet. Start the conversation!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4">
            {messages.map((message: Message) => {
              const isFromMario = message.isAdmin;
              const showDelete = canDeleteMessage(message);

              return (
                <div
                  key={message.id.toString()}
                  className={`flex gap-3 ${isFromMario ? 'flex-row' : 'flex-row-reverse'} relative group`}
                >
                  {isFromMario ? (
                    <MarioAvatar size="sm" />
                  ) : (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-semibold">U</span>
                    </div>
                  )}
                  
                  <div className={`flex-1 ${isFromMario ? 'text-left' : 'text-right'}`}>
                    <div className={`inline-block max-w-[80%] rounded-lg px-4 py-2 relative ${
                      isFromMario 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-xs font-semibold mb-1">
                        {isFromMario ? 'MARIO' : 'You'}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {renderAttachment(message)}
                      
                      {message.recipientSeen && (
                        <p className="text-xs opacity-70 mt-1">Seen</p>
                      )}
                      
                      {showDelete && onDeleteMessage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteClick(message.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
