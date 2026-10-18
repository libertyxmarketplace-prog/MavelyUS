import React from 'react';
import { cn } from '@/lib/utils';

export interface InfiniteSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: number;
  duration?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
}

export function InfiniteSlider({
  children,
  gap = 16,
  duration = 25,
  direction = 'horizontal',
  reverse = false,
  className,
  style,
  ...props
}: InfiniteSliderProps) {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={cn(
        'group flex overflow-hidden select-none',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
      style={
        {
          '--gap': `${gap}px`,
          '--duration': `${duration}s`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-around',
          isHorizontal
            ? reverse
              ? 'animate-infinite-slider-reverse flex-row'
              : 'animate-infinite-slider flex-row'
            : reverse
              ? 'animate-infinite-slider-vertical-reverse flex-col'
              : 'animate-infinite-slider-vertical flex-col',
          'group-hover:[animation-play-state:paused]'
        )}
        style={{ gap: `${gap}px` }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-around',
          isHorizontal
            ? reverse
              ? 'animate-infinite-slider-reverse flex-row'
              : 'animate-infinite-slider flex-row'
            : reverse
              ? 'animate-infinite-slider-vertical-reverse flex-col'
              : 'animate-infinite-slider-vertical flex-col',
          'group-hover:[animation-play-state:paused]'
        )}
        style={{ gap: `${gap}px` }}
      >
        {children}
      </div>
    </div>
  );
}

export default InfiniteSlider;
