import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressiveBlurProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'top' | 'right' | 'bottom' | 'left';
  blurLayers?: number;
  blurIntensity?: number;
  className?: string;
}

const DIRECTION_GRADIENTS = {
  left: 'to right',
  right: 'to left',
  top: 'to bottom',
  bottom: 'to top',
};

export function ProgressiveBlur({
  direction = 'bottom',
  blurLayers = 8,
  blurIntensity = 1,
  className,
  ...props
}: ProgressiveBlurProps) {
  const layers = Math.max(blurLayers, 2);
  const gradDir = DIRECTION_GRADIENTS[direction] || 'to bottom';

  return (
    <div
      className={cn('relative pointer-events-none select-none overflow-hidden', className)}
      aria-hidden="true"
      {...props}
    >
      {Array.from({ length: layers }).map((_, i) => {
        const blurPx = Math.max(1, Math.round(Math.pow(2, i) * (blurIntensity * 0.75)));
        const start = Math.max(0, Math.round((i / layers) * 100));
        const end = Math.min(100, Math.round(((i + 1.5) / layers) * 100));

        const maskStyle = `linear-gradient(${gradDir}, rgba(0,0,0,1) ${start}%, rgba(0,0,0,0) ${end}%)`;

        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blurPx}px)`,
              WebkitBackdropFilter: `blur(${blurPx}px)`,
              maskImage: maskStyle,
              WebkitMaskImage: maskStyle,
            }}
          />
        );
      })}
    </div>
  );
}

export default ProgressiveBlur;
