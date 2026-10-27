import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const skeletonLegCount = 4;
const skeletonRowCount = 4;

export function ShipmentListSkeleton() {
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

export function ShipmentDetailSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <span className="sr-only">Loading shipment</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid gap-6 lg:auto-cols-fr lg:grid-flow-col lg:gap-2">
        {Array.from({ length: skeletonLegCount }, (_, legIndex) => (
          <div key={legIndex} className="flex flex-col gap-2">
            <Skeleton className="h-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40 max-w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}

type ShipmentNotFoundProps = {
  backHref: string;
  backLabel: string;
};

// Rendered inside the page's shell, so the header and the active account stay in place.
export function ShipmentNotFound({ backHref, backLabel }: ShipmentNotFoundProps) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title">Shipment not found</h1>
      <p>
        <Link
          href={backHref}
          className="text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {backLabel}
        </Link>
      </p>
    </section>
  );
}
