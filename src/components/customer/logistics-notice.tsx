import { MessageSquare } from 'lucide-react';
import type { ApprovedNotice } from '@/domain/notice';
import { formatDateTime } from '@/lib/format-date';

type LogisticsNoticeProps = {
  notices: ApprovedNotice[];
};

// A message a person sent, kept apart from the derived status alert so the two never read as one source.
export function LogisticsNotice({ notices }: LogisticsNoticeProps) {
  if (notices.length === 0) return null;

  return (
    <section aria-labelledby="logistics-notice-heading" className="flex flex-col gap-2 rounded border border-border bg-surface p-4">
      <h2 id="logistics-notice-heading" className="flex items-center gap-2 text-heading">
        <MessageSquare aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        Message from your logistics team
      </h2>
      <ul className="flex flex-col gap-3">
        {notices.map(notice => (
          <li key={`${notice.legId}-${notice.cause}`} className="flex flex-col gap-1">
            <p className="text-body font-semibold">{notice.subject}</p>
            <p className="text-body">{notice.text}</p>
            <p className="text-caption text-muted-foreground">{`Sent ${formatDateTime(notice.approvedAt)}`}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
