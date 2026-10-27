'use client';

import { Sparkles } from 'lucide-react';
import { useId, type Ref } from 'react';
import { Button } from '@/components/ui/button';
import type { NoticeDraft } from '@/domain/notice';

const approveValue = 'approve';

type NoticeDialogProps = {
  ref: Ref<HTMLDialogElement>;
  draft: NoticeDraft;
  // Escape and Cancel both close without approving, so the caller only needs to know which happened.
  onClosed: (isApproved: boolean) => void;
};

// Native <dialog> opened with showModal(): the browser makes the page behind it inert and closes it on Escape.
export function NoticeDialog({ ref, draft, onClosed }: NoticeDialogProps) {
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={event => onClosed(event.currentTarget.returnValue === approveValue)}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded border border-border bg-surface p-6 text-foreground backdrop:bg-foreground/40"
    >
      <form method="dialog" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 text-label text-status-ai">
            <Sparkles aria-hidden="true" className="size-4 shrink-0" />
            Simulated AI draft · review before sending
          </p>
          <h2 id={titleId} className="text-heading">{`Notify customer · ${draft.shipmentId.toUpperCase()}`}</h2>
        </div>

        <div className="flex flex-col gap-2 rounded border border-border bg-background p-4">
          <p className="text-label">{`Subject: ${draft.subject}`}</p>
          <p className="text-body">{draft.text}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-label">Based on:</p>
          {draft.basedOn.length === 0
            ? <p className="text-caption text-muted-foreground">No operator report on this leg yet.</p>
            : (
                <ul className="flex list-disc flex-col gap-1 pl-5 text-caption text-muted-foreground">
                  {draft.basedOn.map(basis => <li key={basis}>{basis}</li>)}
                </ul>
              )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {/* Focus starts on Cancel, so a stray Enter never sends a message to the customer. */}
          <Button type="submit" variant="secondary" value="cancel" autoFocus>Cancel</Button>
          <Button type="submit" value={approveValue}>Approve and send</Button>
        </div>
      </form>
    </dialog>
  );
}
