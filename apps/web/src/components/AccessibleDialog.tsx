'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function AccessibleDialog({
    open,
    title,
    closeLabel,
    onClose,
    children
}: {
    open: boolean;
    title: string;
    closeLabel: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            className="app-dialog"
            aria-label={title}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="app-dialog__head">
                <h2>{title}</h2>
                <button className="icon-button" type="button" aria-label={closeLabel} onClick={onClose}>
                    <X size={18} aria-hidden="true" />
                </button>
            </div>
            <div className="app-dialog__body">{children}</div>
        </dialog>
    );
}
