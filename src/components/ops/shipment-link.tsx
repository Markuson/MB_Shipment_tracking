import Link from 'next/link';
import type { Shipment } from '@/domain/shipment';

type ShipmentLinkProps = {
  shipment: Shipment;
};

export function ShipmentLink({ shipment }: ShipmentLinkProps) {
  const { destination } = shipment;
  return (
    <Link
      href={`/ops/shipments/${shipment.id}`}
      className="self-start text-heading text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {`${shipment.id.toUpperCase()} → ${destination.city}, ${destination.country}`}
    </Link>
  );
}
