import { useHiddenAdminMode } from '../../context/HiddenAdminModeContext';

export function MarioStatusPill() {
  const { isAdminModeEnabled } = useHiddenAdminMode();

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span 
        className={`w-2 h-2 rounded-full ${
          isAdminModeEnabled ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      <span>{isAdminModeEnabled ? 'online' : 'offline'}</span>
    </div>
  );
}
