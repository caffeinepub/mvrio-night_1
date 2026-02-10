import { type ReactNode } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface HorizontalSongRowProps {
  title: string;
  children: ReactNode;
}

export function HorizontalSongRow({ title, children }: HorizontalSongRowProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {children}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
