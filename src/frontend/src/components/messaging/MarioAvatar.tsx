import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useHomeBanner } from '../../hooks/useHomeBanner';
import { Music } from 'lucide-react';

interface MarioAvatarProps {
  size?: 'sm' | 'md' | 'lg';
}

export function MarioAvatar({ size = 'md' }: MarioAvatarProps) {
  const { displayImage } = useHomeBanner();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={displayImage} alt="MARIO" />
      <AvatarFallback className="bg-primary text-primary-foreground">
        <Music className="w-4 h-4" />
      </AvatarFallback>
    </Avatar>
  );
}
