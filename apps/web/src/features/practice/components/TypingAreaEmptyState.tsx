import { ShieldCheck } from 'lucide-react';

export function TypingAreaEmptyState({
    copy,
    unavailableTitle,
    unavailableBody,
    preparationItems,
    hasLockedPrimaryAction,
    lockedPrimaryActionLabel,
    LockedPrimaryActionIcon,
    lockedPrimaryActionDisabled,
    onLockedPrimaryAction,
    hasLockedSecondaryAction,
    lockedSecondaryActionLabel,
    LockedSecondaryActionIcon,
    onLockedSecondaryAction
}) {
    return (
        <div className="typing-empty-state">
            <div className="typing-empty-state__copy">
                <span className="typing-empty-state__icon" aria-hidden="true">
                    <ShieldCheck size={22} strokeWidth={2.25} />
                </span>
                <span className="summary-label">{copy.common.status}</span>
                <strong>{unavailableTitle}</strong>
                <p>{unavailableBody}</p>
                {(hasLockedPrimaryAction || hasLockedSecondaryAction) && (
                    <div className="typing-empty-state__actions">
                        {hasLockedPrimaryAction && (
                            <button
                                type="button"
                                className="action-btn primary"
                                onClick={onLockedPrimaryAction}
                                disabled={lockedPrimaryActionDisabled}
                            >
                                <LockedPrimaryActionIcon aria-hidden="true" size={18} strokeWidth={2.25} />
                                {lockedPrimaryActionLabel}
                            </button>
                        )}
                        {hasLockedSecondaryAction && (
                            <button type="button" className="action-btn" onClick={onLockedSecondaryAction}>
                                <LockedSecondaryActionIcon aria-hidden="true" size={18} strokeWidth={2.25} />
                                {lockedSecondaryActionLabel}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <ul className="typing-empty-state__preflight" aria-label={unavailableTitle}>
                {preparationItems.map(({ key, icon: Icon, label, value }) => (
                    <li key={key} className="typing-empty-state__step">
                        <span aria-hidden="true">
                            <Icon size={16} strokeWidth={2.2} />
                        </span>
                        <div>
                            <small>{label}</small>
                            <strong>{value}</strong>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="typing-empty-state__preview" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}
