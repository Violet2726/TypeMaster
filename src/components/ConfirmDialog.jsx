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

    return (
        <div className="modal-overlay" role="presentation" onClick={onCancel}>
            <div
                className="confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="confirm-dialog__body">
                    <h3>{title}</h3>
                    <p className="muted-text">{body}</p>
                </div>

                <div className="confirm-dialog__actions">
                    <button type="button" className="action-btn" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button type="button" className={`action-btn primary ${tone === 'danger' ? 'danger' : ''}`} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
