"use client";

import { Button } from "@/components/ui/button";

export interface ToastMessage {
  id: number;
  title: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastViewportProps {
  toast: ToastMessage | null;
}

export function ToastViewport({ toast }: ToastViewportProps) {
  if (!toast) {
    return null;
  }

  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      <div>
        <strong>{toast.title}</strong>
        {toast.detail ? <span>{toast.detail}</span> : null}
      </div>
      {toast.actionLabel && toast.onAction ? (
        <Button variant="primary" size="sm" onClick={toast.onAction}>
          {toast.actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
