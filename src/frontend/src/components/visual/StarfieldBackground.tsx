import { useEffect, useRef } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { reduceAnimations } = useSettings();
  const { theme } = useTheme();

  useEffect(() => {
    if (!canvasRef.current || theme !== 'dark') return;

    const container = canvasRef.current;
    container.innerHTML = '';

    const starCount = 300;
    const stars: HTMLDivElement[] = [];

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = `absolute rounded-full bg-white ${reduceAnimations ? 'no-animation' : 'star'}`;
      
      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      
      if (!reduceAnimations) {
        star.style.setProperty('--twinkle-duration', `${Math.random() * 3 + 2}s`);
        star.style.setProperty('--twinkle-delay', `${Math.random() * 3}s`);
      }
      
      container.appendChild(star);
      stars.push(star);
    }

    return () => {
      stars.forEach(star => star.remove());
    };
  }, [reduceAnimations, theme]);

  if (theme !== 'dark') return null;

  return (
    <div 
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background: 'linear-gradient(to bottom, #0B0C1A 0%, #000000 100%)'
      }}
    />
  );
}
