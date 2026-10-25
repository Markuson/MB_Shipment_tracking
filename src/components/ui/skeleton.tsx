import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type SkeletonProps = ComponentProps<'div'>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('rounded bg-muted motion-safe:animate-pulse', className)} {...props} />;
}
