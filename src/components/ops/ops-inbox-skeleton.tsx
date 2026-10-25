import { Skeleton } from '@/components/ui/skeleton';

const skeletonRowCount = 4;

export function OpsInboxSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <span className="sr-only">Loading shipments</span>
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-64 max-w-full" />
        {Array.from({ length: skeletonRowCount }, (_, rowIndex) => (
          <Skeleton key={rowIndex} className="h-row" />
        ))}
      </div>
    </main>
  );
}
