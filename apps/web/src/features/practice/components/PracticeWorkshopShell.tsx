import type { ReactNode } from 'react';
import { Sparkles, type LucideIcon } from 'lucide-react';

interface PracticeWorkshopShellProps {
    actions?: ReactNode;
    children: ReactNode;
    description: ReactNode;
    icon: LucideIcon;
    kicker: ReactNode;
    statusCaption: ReactNode;
    statusLabel: ReactNode;
    statusTone: string;
    title: ReactNode;
    variant: string;
}

export function PracticeWorkshopShell({
    actions,
    children,
    description,
    icon: Icon,
    kicker,
    statusCaption,
    statusLabel,
    statusTone,
    title,
    variant
}: PracticeWorkshopShellProps) {
    return (
        <section className={`ai-custom-panel ai-custom-panel--${variant} ai-custom-panel--${statusTone} practice-workshop-shell`}>
            <div className="ai-custom-panel__head">
                <span className="ai-custom-panel__icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={2.25} />
                </span>
                <div className="practice-workshop-shell__copy">
                    <p className="panel-kicker">{kicker}</p>
                    <strong>{title}</strong>
                    <p className="muted-text">{description}</p>
                </div>
                <div className="ai-custom-panel__command">
                    <span className={`ai-custom-panel__status-pill ai-custom-panel__status-pill--${statusTone}`} aria-live="polite">
                        <Sparkles aria-hidden="true" size={14} strokeWidth={2.2} />
                        <small>{statusCaption}</small>
                        <strong>{statusLabel}</strong>
                    </span>
                    {actions ? <div className="workshop-actions">{actions}</div> : null}
                </div>
            </div>

            {children}
        </section>
    );
}
