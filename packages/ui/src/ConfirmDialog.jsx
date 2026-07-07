import React from 'react';

export function ConfirmDialog({
    isOpen,
    title,
    body,
    confirmLabel,
    cancelLabel,
    tone = 'danger',
    onConfirm,
    onCancel
}) {
    if (!isOpen) {
        return null;
    }

    const titleId = React.useId();
    const bodyId = React.useId();

    return (
        <div className="modal-overlay" role="presentation" onClick={onCancel}>
            <div
                className={`confirm-dialog confirm-dialog--${tone}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={body ? bodyId : undefined}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="confirm-dialog__body">
                    <h3 id={titleId}>{title}</h3>
                    <p id={bodyId} className="muted-text">{body}</p>
                </div>

                <div className="confirm-dialog__actions">
                    <button type="button" className="confirm-dialog__btn" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`confirm-dialog__btn confirm-dialog__btn--confirm${tone === 'danger' ? ' confirm-dialog__btn--danger' : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
