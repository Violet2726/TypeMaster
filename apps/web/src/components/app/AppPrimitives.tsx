'use client';

import type { ButtonHTMLAttributes, ComponentType, CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Button } from '@typemaster/ui';

type IconType = ComponentType<any>;

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(' ');
}

export function AppButton({
    children,
    className = '',
    variant = 'secondary',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: IconType;
    iconPosition?: 'start' | 'end';
    size?: 'sm' | 'md';
    variant?: 'primary' | 'secondary' | 'quiet';
}) {
    return (
        <Button className={cx('app-button', className)} variant={variant} {...props}>
            {children}
        </Button>
    );
}

export function AppSheet({
    actions,
    backgroundImage,
    body,
    children,
    className = '',
    icon: Icon,
    kicker,
    title,
    variant = 'default',
    ...props
}: {
    actions?: ReactNode;
    backgroundImage?: string;
    body?: ReactNode;
    children?: ReactNode;
    className?: string;
    icon?: IconType;
    kicker?: ReactNode;
    title?: ReactNode;
    variant?: 'default' | 'hero';
} & HTMLAttributes<HTMLElement>) {
    const style = backgroundImage ? ({ '--app-sheet-image': `url('${backgroundImage}')` } as CSSProperties) : undefined;

    return (
        <section className={cx('app-sheet', `app-sheet--${variant}`, backgroundImage && 'app-sheet--image', className)} style={style} {...props}>
            <div className="app-sheet__content">
                {(kicker || Icon) ? (
                    <span className="app-sheet__status">
                        {Icon ? <Icon aria-hidden="true" size={15} strokeWidth={2.2} /> : null}
                        {kicker}
                    </span>
                ) : null}
                {title ? <h1>{title}</h1> : null}
                {body ? <p className="hero-body">{body}</p> : null}
                {actions ? <div className="app-sheet__actions">{actions}</div> : null}
                {children}
            </div>
        </section>
    );
}

export function AppCard({
    action,
    body,
    className = '',
    icon: Icon,
    kicker,
    onClick,
    title,
    tone = 'default',
    ...props
}: {
    action?: ReactNode;
    body?: ReactNode;
    className?: string;
    icon?: IconType;
    kicker?: ReactNode;
    onClick?: () => void;
    title: ReactNode;
    tone?: 'default' | 'primary' | 'success' | 'warning';
} & HTMLAttributes<HTMLElement>) {
    const Component = onClick ? 'button' : 'article';
    const componentProps = onClick
        ? { type: 'button' as const, onClick }
        : {};

    return (
        <Component className={cx('app-card', `app-card--${tone}`, className)} {...componentProps} {...props}>
            {Icon ? (
                <span className="app-card__icon" aria-hidden="true">
                    <Icon size={19} strokeWidth={2.2} />
                </span>
            ) : null}
            <span className="app-card__text">
                {kicker ? <p className="app-card__kicker">{kicker}</p> : null}
                <strong>{title}</strong>
                {body ? <span>{body}</span> : null}
            </span>
            {action ? <span className="app-card__action">{action}</span> : null}
        </Component>
    );
}

export function MetricCard({
    ariaLabel,
    className = '',
    icon: Icon,
    label,
    value,
    tone = 'default'
}: {
    ariaLabel?: string;
    className?: string;
    icon?: IconType;
    label: ReactNode;
    value: ReactNode;
    tone?: 'default' | 'primary' | 'success' | 'warning';
}) {
    return (
        <div className={cx('app-metric-card', `app-metric-card--${tone}`, className)} aria-label={ariaLabel}>
            {Icon ? <Icon aria-hidden="true" size={16} strokeWidth={2.2} /> : null}
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

export function SectionHeader({
    actions,
    className = '',
    kicker,
    title
}: {
    actions?: ReactNode;
    className?: string;
    kicker?: ReactNode;
    title: ReactNode;
}) {
    return (
        <div className={cx('app-section-header', className)}>
            <div>
                {kicker ? <p className="panel-kicker">{kicker}</p> : null}
                <h2>{title}</h2>
            </div>
            {actions ? <div className="app-section-header__actions">{actions}</div> : null}
        </div>
    );
}
