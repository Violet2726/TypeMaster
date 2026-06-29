import React from 'react';

function cx(...parts) {
    return parts.filter(Boolean).join(' ');
}

export function Button({
    children,
    className = '',
    icon: Icon,
    iconPosition = 'start',
    variant = 'secondary',
    size = 'md',
    ...props
}) {
    return (
        <button
            type="button"
            className={cx('tm-button', `tm-button--${variant}`, `tm-button--${size}`, className)}
            {...props}
        >
            {Icon && iconPosition === 'start' ? <Icon aria-hidden="true" size={17} strokeWidth={2.2} /> : null}
            <span>{children}</span>
            {Icon && iconPosition === 'end' ? <Icon aria-hidden="true" size={17} strokeWidth={2.2} /> : null}
        </button>
    );
}

export function IconButton({
    className = '',
    icon: Icon,
    label,
    variant = 'ghost',
    size = 'md',
    ...props
}) {
    return (
        <button
            type="button"
            className={cx('tm-icon-button', `tm-icon-button--${variant}`, `tm-icon-button--${size}`, className)}
            aria-label={label}
            title={label}
            {...props}
        >
            {Icon ? <Icon aria-hidden="true" size={17} strokeWidth={2.2} /> : null}
        </button>
    );
}

export function Surface({
    as: Component = 'section',
    children,
    className = '',
    tone = 'default',
    ...props
}) {
    return (
        <Component className={cx('tm-surface', `tm-surface--${tone}`, className)} {...props}>
            {children}
        </Component>
    );
}

export function MetricStrip({ items = [], ariaLabel = undefined, className = '' }) {
    return (
        <div className={cx('tm-metric-strip', className)} aria-label={ariaLabel}>
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <div key={item.id || item.label} className={cx('tm-metric', item.tone ? `tm-metric--${item.tone}` : '')}>
                        {Icon ? <Icon aria-hidden="true" size={16} strokeWidth={2.2} /> : null}
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                    </div>
                );
            })}
        </div>
    );
}

export function Inspector({
    eyebrow,
    title,
    badge,
    children,
    actions = null,
    className = '',
    ...props
}) {
    return (
        <aside className={cx('tm-inspector', className)} {...props}>
            <div className="tm-inspector__head">
                <div>
                    {eyebrow ? <p>{eyebrow}</p> : null}
                    {title ? <h2>{title}</h2> : null}
                </div>
                {badge ? <span className="tm-inspector__badge">{badge}</span> : null}
            </div>
            <div className="tm-inspector__body">
                {children}
            </div>
            {actions ? <div className="tm-inspector__actions">{actions}</div> : null}
        </aside>
    );
}

export function EmptyState({
    icon: Icon,
    eyebrow,
    title,
    body,
    actions,
    className = ''
}) {
    return (
        <div className={cx('tm-empty-state', className)}>
            {Icon ? (
                <span className="tm-empty-state__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={2.2} />
                </span>
            ) : null}
            {eyebrow ? <p>{eyebrow}</p> : null}
            <h2>{title}</h2>
            {body ? <span>{body}</span> : null}
            {actions ? <div className="tm-empty-state__actions">{actions}</div> : null}
        </div>
    );
}

export function SegmentedControl({
    items = [],
    value,
    onChange,
    ariaLabel,
    className = ''
}) {
    return (
        <div className={cx('tm-segmented', className)} role="tablist" aria-label={ariaLabel}>
            {items.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={item.value === value}
                    className={item.value === value ? 'is-selected' : ''}
                    onClick={() => onChange?.(item.value)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
