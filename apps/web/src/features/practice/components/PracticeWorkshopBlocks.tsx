import type { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
    return classNames.filter(Boolean).join(' ');
}

interface PracticeWorkshopFieldProps {
    children: ReactNode;
    className?: string;
    icon: LucideIcon;
    label: ReactNode;
}

interface PracticeWorkshopMetric {
    label: ReactNode;
    value: ReactNode;
}

interface PracticeWorkshopSnapshotProps {
    className?: string;
    description?: ReactNode;
    eyebrow: ReactNode;
    live?: 'off' | 'polite' | 'assertive';
    metrics?: PracticeWorkshopMetric[];
    title: ReactNode;
}

export function PracticeWorkshopField({
    children,
    className,
    icon: Icon,
    label
}: PracticeWorkshopFieldProps) {
    return (
        <label className={joinClassNames('field workshop-field practice-workshop-field', className)}>
            <span>
                <Icon aria-hidden="true" size={15} strokeWidth={2.25} />
                {label}
            </span>
            {children}
        </label>
    );
}

export function PracticeWorkshopSnapshot({
    className,
    description,
    eyebrow,
    live = 'polite',
    metrics = [],
    title
}: PracticeWorkshopSnapshotProps) {
    return (
        <div className={joinClassNames('ai-custom-panel__state practice-workshop-snapshot', className)} aria-live={live}>
            <div className="practice-workshop-snapshot__copy">
                <p className="summary-label">{eyebrow}</p>
                <strong>{title}</strong>
                {description ? <span>{description}</span> : null}
            </div>
            {metrics.length ? (
                <div className="ai-custom-panel__state-grid practice-workshop-snapshot__metrics">
                    {metrics.map((metric, index) => (
                        <span key={`${index}-${String(metric.label)}`}>
                            <small>{metric.label}</small>
                            <strong>{metric.value}</strong>
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
