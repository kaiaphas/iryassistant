"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function ReservationPrintConfirmDialog({ open, saving, error, onCancel, onConfirm }: {
  open: boolean;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={saving}
      className="w-[calc(100%-2rem)] max-w-sm rounded-lg border p-5 shadow-xl backdrop:bg-black/40"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onCancel();
      }}
    >
      <h2 id={titleId} className="text-base font-bold">명단을 인쇄하시겠습니까?</h2>
      <p id={descriptionId} className="mt-2 text-sm text-slate-600">시간이 기록됩니다.</p>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>No</Button>
        <Button onClick={onConfirm} disabled={saving}>{saving ? "기록 중…" : "Yes"}</Button>
      </div>
    </dialog>
  );
}
