import {
    useEffect,
    useId,
    useRef,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type PropsWithChildren,
    type ReactNode
} from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
    icon?: ReactNode;
};

export function Button({ variant = 'primary', icon, children, className = '', ...props }: ButtonProps) {
    return (
        <button className={`tr-button tr-button--${variant} ${className}`.trim()} {...props}>
            {icon ? (
                <span className="tr-button__icon" aria-hidden="true">
                    {icon}
                </span>
            ) : null}
            <span>{children}</span>
        </button>
    );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
};

export function IconButton({ label, className = '', children, ...props }: IconButtonProps) {
    return (
        <button type="button" className={`tr-icon-button ${className}`.trim()} aria-label={label} title={label} {...props}>
            {children}
        </button>
    );
}

type SegmentedControlOption<T extends string> = {
    value: T;
    label: string;
};

type SegmentedControlProps<T extends string> = {
    value: T;
    options: SegmentedControlOption<T>[];
    onChange: (value: T) => void;
    ariaLabel: string;
};

export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel }: SegmentedControlProps<T>) {
    return (
        <div className="tr-segmented" role="tablist" aria-label={ariaLabel}>
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        className={`tr-segmented__item${selected ? ' is-active' : ''}`}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

type ProgressProps = {
    value: number;
    max?: number;
    label?: string;
};

export function Progress({ value, max = 100, label }: ProgressProps) {
    const ratio = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
    return (
        <div className="tr-progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
            <span className="tr-progress__fill" style={{ width: `${ratio * 100}%` }} />
        </div>
    );
}

type NoticeProps = PropsWithChildren<{
    tone?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
}>;

export function Notice({ tone = 'info', title, children }: NoticeProps) {
    return (
        <div className={`tr-notice tr-notice--${tone}`} role="status">
            {title ? <strong>{title}</strong> : null}
            <div>{children}</div>
        </div>
    );
}

type StatListItem = {
    label: string;
    value: string;
};

export function StatList({ items }: { items: StatListItem[] }) {
    return (
        <dl className="tr-stat-list">
            {items.map((item) => (
                <div key={item.label} className="tr-stat-list__row">
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                </div>
            ))}
        </dl>
    );
}

type ActionRowProps = {
    eyebrow?: string;
    title: string;
    detail?: string;
    action?: ReactNode;
    href?: string;
};

export function ActionRow({ eyebrow, title, detail, action, href }: ActionRowProps) {
    const content = (
        <>
            <div className="tr-action-row__copy">
                {eyebrow ? <p className="tr-action-row__eyebrow">{eyebrow}</p> : null}
                <p className="tr-action-row__title">{title}</p>
                {detail ? <p className="tr-action-row__detail">{detail}</p> : null}
            </div>
            {action ? <div className="tr-action-row__action">{action}</div> : null}
        </>
    );
    if (href) {
        return (
            <a className="tr-action-row" href={href}>
                {content}
            </a>
        );
    }
    return <div className="tr-action-row">{content}</div>;
}

type SheetProps = PropsWithChildren<{
    open: boolean;
    title: string;
    onClose: () => void;
}>;

export function Sheet({ open, title, onClose, children }: SheetProps) {
    const dialogRef = useRef<HTMLElement>(null);
    const titleId = useId();
    useEffect(() => {
        if (!open) return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const dialog = dialogRef.current;
        const focusable = () =>
            Array.from(dialog?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])') ?? []).filter(
                (element) => !element.hasAttribute('disabled')
            );
        focusable()[0]?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;
            const controls = focusable();
            if (controls.length === 0) {
                event.preventDefault();
                dialog?.focus();
                return;
            }
            const first = controls[0];
            const last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            previousFocus?.focus();
        };
    }, [onClose, open]);

    if (!open) return null;
    return (
        <div className="tr-sheet-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section ref={dialogRef} className="tr-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
                <header className="tr-sheet__header">
                    <h2 id={titleId}>{title}</h2>
                    <Button variant="quiet" onClick={onClose} aria-label="Close">
                        ×
                    </Button>
                </header>
                {children}
            </section>
        </div>
    );
}

export function Dialog({ open, title, onClose, children }: SheetProps) {
    return (
        <Sheet open={open} title={title} onClose={onClose}>
            {children}
        </Sheet>
    );
}

type PanelProps = PropsWithChildren<HTMLAttributes<HTMLElement>>;

export function Panel({ className = '', children, ...props }: PanelProps) {
    return (
        <section className={`tr-panel ${className}`.trim()} {...props}>
            {children}
        </section>
    );
}