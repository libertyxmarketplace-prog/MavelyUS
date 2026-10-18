import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IconPlaceholderProps extends React.SVGProps<SVGSVGElement> {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  size?: number | string;
  className?: string;
  'data-icon'?: string;
}

export function IconPlaceholder({
  lucide,
  size = 20,
  className,
  ...props
}: IconPlaceholderProps) {
  if (!lucide) {
    return <Icons.Sparkles size={size} className={className} {...(props as any)} />;
  }

  // Handle common Lucide icon name mappings
  const iconNameMap: Record<string, keyof typeof Icons> = {
    Group: 'Users',
    Flashlight: 'Zap',
  };

  const lookupName = iconNameMap[lucide] || lucide;
  const ResolvedIcon = (Icons as Record<string, any>)[lookupName] || (Icons as Record<string, any>)[lucide] || Icons.Sparkles;

  return <ResolvedIcon size={size} className={cn('shrink-0', className)} {...props} />;
}

export default IconPlaceholder;
