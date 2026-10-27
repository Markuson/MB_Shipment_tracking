'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { NextAction } from '@/domain/next-action';
import type { NoticeDraft, RequestAction } from '@/domain/notice';
import { NoticeDialog } from './notice-dialog';

const actionLabel: Record<NextAction, string> = {
  'notify-customer': 'Notify customer',
  'contact-operator': 'Contact operator',
  'upload-document': 'Upload document',
  'review-status': 'Review status',
};

const outcomeLabel: Record<NextAction, string> = {
  'notify-customer': 'Customer notified',
  'contact-operator': 'Request logged (simulated)',
  'upload-document': 'Request logged (simulated)',
  'review-status': 'Marked for review (simulated)',
};

type ActionOutcomeProps = {
  text: string;
  // The button that was clicked is gone, so focus moves here instead of falling back to the page.
  shouldFocus: boolean;
};

function ActionOutcome({ text, shouldFocus }: ActionOutcomeProps) {
  const outcomeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (shouldFocus) outcomeRef.current?.focus();
  }, [shouldFocus]);

  return (
    <p
      ref={outcomeRef}
      role="status"
      tabIndex={-1}
      className="rounded text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {text}
    </p>
  );
}

type NotifyCustomerActionProps = {
  draft: NoticeDraft;
  onApproved: () => void;
};

function NotifyCustomerAction({ draft, onApproved }: NotifyCustomerActionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function openDraft() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // The dialog keeps the last button's value, so a reopened draft must not start as approved.
    dialog.returnValue = '';
    dialog.showModal();
  }

  function handleDraftClosed(isApproved: boolean) {
    if (isApproved) onApproved();
    else triggerRef.current?.focus();
  }

  return (
    <>
      <Button ref={triggerRef} variant="secondary" type="button" aria-haspopup="dialog" onClick={openDraft}>
        {actionLabel['notify-customer']}
      </Button>
      <NoticeDialog ref={dialogRef} draft={draft} onClosed={handleDraftClosed} />
    </>
  );
}

type ExceptionActionProps = {
  suggestedAction: NextAction;
  draft?: NoticeDraft;
  isHandled: boolean;
  onApproveNotice: (draft: NoticeDraft) => void;
  onLogRequest: (action: RequestAction) => void;
};

export function ExceptionAction({
  suggestedAction,
  draft,
  isHandled,
  onApproveNotice,
  onLogRequest,
}: ExceptionActionProps) {
  const [wasHandledHere, setWasHandledHere] = useState(false);

  if (isHandled) return <ActionOutcome text={outcomeLabel[suggestedAction]} shouldFocus={wasHandledHere} />;

  const suggestion = <p className="text-caption text-muted-foreground">Suggested (simulated)</p>;

  if (suggestedAction !== 'notify-customer') {
    return (
      <>
        {suggestion}
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            setWasHandledHere(true);
            onLogRequest(suggestedAction);
          }}
        >
          {actionLabel[suggestedAction]}
        </Button>
      </>
    );
  }

  if (!draft) return suggestion;

  return (
    <>
      {suggestion}
      <NotifyCustomerAction
        draft={draft}
        onApproved={() => {
          setWasHandledHere(true);
          onApproveNotice(draft);
        }}
      />
    </>
  );
}
