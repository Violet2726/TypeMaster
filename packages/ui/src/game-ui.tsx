import { useCallback, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type PropsWithChildren, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/**
 * TypeRift UI — game surface primitives.
 *
 * GameDialog owns every behaviour a modal needs so no feature component has to:
 * focus trap, Escape, initial focus, return focus, aria wiring, background inert,
 * scroll locking, mobile safe area, and reduced-motion transitions.
 *
 * Feature components only supply content.
 */

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusableWithin(scope: HTMLElement | null) {
    if (!scope) return [];
    return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
    );
}

function isFocusable(element: HTMLElement | null): element is HTMLElement {
    return Boolean(element && (element.matches(FOCUSABLE) || element.tabIndex >= 0));
}

/**
 * Resolves the element a modal should focus first.
 * `preferred` may be a control, or a container whose first control should be used.
 */
function resolveInitialFocus(container: HTMLElement, preferred?: HTMLElement | null) {
    const candidate = preferred ?? null;
    if (isFocusable(candidate)) return candidate;
    return focusableWithin(candidate)[0] ?? focusableWithin(container)[0] ?? container;
}

/**
 * The single implementation of modal behaviour, shared by every dialog and sheet.
 *
 * Covers: scroll locking without layout shift, `inert` on the background, initial focus,
 * Escape dismissal, Tab trapping, and returning focus to whatever opened the modal.
 */
export function useModalBehavior({
    open,
    onClose,
    containerRef,
    initialFocusRef,
    dismissOnEscape = true
}: {
    open: boolean;
    onClose?: () => void;
    containerRef: RefObject<HTMLElement | null>;
    initialFocusRef?: RefObject<HTMLElement | null>;
    dismissOnEscape?: boolean;
}) {
    const close = useCallback(() => onClose?.(), [onClose]);

    useEffect(() => {
        if (!open) return;
        const container = containerRef.current;
        if (!container) return;

        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const body = document.body;
        const previousOverflow = body.style.overflow;
        const previousPaddingRight = body.style.paddingRight;
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;

        body.style.overflow = 'hidden';
        if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

        // Everything outside the modal layer becomes inert and unreachable.
        // Walk to the outermost ancestor under <body> so this stays correct whether the
        // modal is portalled (GameDialog) or rendered inline in the app tree (Sheet).
        let layer = container;
        while (layer.parentElement && layer.parentElement !== body) layer = layer.parentElement;
        const inertTargets = Array.from(body.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child !== layer);
        for (const target of inertTargets) target.setAttribute('inert', '');

        resolveInitialFocus(container, initialFocusRef?.current ?? null).focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && dismissOnEscape) {
                event.preventDefault();
                close();
                return;
            }
            if (event.key !== 'Tab') return;
            const controls = focusableWithin(container);
            if (controls.length === 0) {
                event.preventDefault();
                container.focus();
                return;
            }
            const first = controls[0]!;
            const last = controls[controls.length - 1]!;
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            for (const target of inertTargets) target.removeAttribute('inert');
            body.style.overflow = previousOverflow;
            body.style.paddingRight = previousPaddingRight;
            if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
        };
    }, [close, containerRef, dismissOnEscape, initialFocusRef, open]);
}

export type GameDialogProps = PropsWithChildren<{
    open: boolean;
    /** Accessible name. Rendered as the dialog heading unless `hideTitle` is set. */
    title: string;
    description?: string;
    onClose?: () => void;
    /** Element to focus when the dialog opens. Defaults to the first control in the body. */
    initialFocusRef?: RefObject<HTMLElement | null>;
    dismissOnEscape?: boolean;
    dismissOnBackdrop?: boolean;
    /** `battle` uses the dark in-run material; `surface` uses the app material. */
    tone?: 'battle' | 'surface';
    width?: 'compact' | 'wide';
    hideTitle?: boolean;
    className?: string;
    footer?: ReactNode;
}>;

export function GameDialog({
    open,
    title,
    description,
    onClose,
    initialFocusRef,
    dismissOnEscape = true,
    dismissOnBackdrop = false,
    tone = 'surface',
    width = 'compact',
    hideTitle = false,
    className = '',
    footer,
    children
}: GameDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    // Portals cannot render on the server, so mount-gate to keep hydration deterministic.
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    useModalBehavior({ open: open && mounted, onClose, containerRef: dialogRef, initialFocusRef, dismissOnEscape });

    if (!open || !mounted) return null;

    return createPortal(
        <div
            className={`game-dialog-layer game-dialog-layer--${tone}`}
            role="presentation"
            onMouseDown={(event) => {
                if (dismissOnBackdrop && event.target === event.currentTarget) onClose?.();
            }}
        >
            <div
                ref={dialogRef}
                className={`game-dialog game-dialog--${tone} game-dialog--${width} ${className}`.trim()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
            >
                <h2 id={titleId} className={hideTitle ? 'sr-only' : 'game-dialog__title'}>
                    {title}
                </h2>
                {description ? (
                    <p id={descriptionId} className="game-dialog__description">
                        {description}
                    </p>
                ) : null}
                <div className="game-dialog__body">{children}</div>
                {footer ? <div className="game-dialog__footer">{footer}</div> : null}
            </div>
        </div>,
        document.body
    );
}

export type GameButtonTone = 'accent' | 'quiet' | 'danger' | 'ghost';

export type GameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: GameButtonTone;
    icon?: ReactNode;
    /** Rendered as a keyboard hint chip, e.g. Space or Esc. */
    shortcut?: string;
    block?: boolean;
};

/** A button that always clears the 44px touch target, whatever the icon size. */
export function GameButton({ tone = 'accent', icon, shortcut, block = false, className = '', children, ...props }: GameButtonProps) {
    return (
        <button
            type="button"
            className={`game-button game-button--${tone}${block ? ' is-block' : ''} ${className}`.trim()}
            {...props}
        >
            {icon ? (
                <span className="game-button__icon" aria-hidden="true">
                    {icon}
                </span>
            ) : null}
            <span>{children}</span>
            {shortcut ? (
                <kbd className="game-button__kbd" aria-hidden="true">
                    {shortcut}
                </kbd>
            ) : null}
        </button>
    );
}

export type GameMeterTone = 'accent' | 'success' | 'warning' | 'danger';

export type GameMeterProps = {
    value: number;
    max?: number;
    label: string;
    tone?: GameMeterTone;
    /** Omit for a continuous bar; pass a number for discrete segments. */
    segments?: number;
    showValue?: boolean;
    className?: string;
};

/** A labelled meter. Segments make a fast-moving value readable at a glance. */
export function GameMeter({ value, max = 100, label, tone = 'accent', segments, showValue = false, className = '' }: GameMeterProps) {
    const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
    const filled = segments ? Math.round(ratio * segments) : 0;
    return (
        <div className={`game-meter game-meter--${tone} ${className}`.trim()}>
            <div className="game-meter__label">
                <span>{label}</span>
                {showValue ? <strong>{Math.round(ratio * 100)}%</strong> : null}
            </div>
            {segments ? (
                <div className="game-meter__segments" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-label={label}>
                    {Array.from({ length: segments }, (_, index) => (
                        <i key={index} className={index < filled ? 'is-on' : ''} />
                    ))}
                </div>
            ) : (
                <div className="game-meter__track" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-label={label}>
                    <span style={{ width: `${ratio * 100}%` }} />
                </div>
            )}
        </div>
    );
}

export type GameSurfaceProps = PropsWithChildren<{
    tone?: 'battle' | 'surface';
    className?: string;
}>;

/** The flat surface primitive: hairline border, one radius token, no glow. */
export function GameSurface({ tone = 'surface', className = '', children }: GameSurfaceProps) {
    return <div className={`game-surface game-surface--${tone} ${className}`.trim()}>{children}</div>;
}
