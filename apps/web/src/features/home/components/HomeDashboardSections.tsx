'use client';

import type { ReactNode } from 'react';
import { ChevronRight, DoorOpen, Gauge, ShieldCheck, Swords, Trophy, type LucideIcon } from 'lucide-react';
import { AppButton, MetricCard, SectionHeader } from '../../../components/app/AppPrimitives';

type IconType = LucideIcon;

export type ProgressItem = {
    id: string;
    icon: IconType;
    label: ReactNode;
    value: ReactNode;
    tone?: 'default' | 'primary' | 'success' | 'warning';
};

export function TodayHero({
    aside,
    body,
    kicker,
    onOpenMissions,
    onStart,
    startLabel,
    title,
    viewMissionsLabel
}: {
    aside?: ReactNode;
    body: string;
    kicker: string;
    onOpenMissions: () => void;
    onStart: () => void;
    startLabel: string;
    title: string;
    viewMissionsLabel: string;
}) {
    return (
        <section className="app-feature-card app-feature-card--primary" aria-label={title}>
            <span className="app-feature-card__icon" aria-hidden="true">
                <Swords size={22} strokeWidth={2.2} />
            </span>
            <div className="app-feature-card__body">
                <p className="app-feature-card__kicker">{kicker}</p>
                <h1>{title}</h1>
                <p className="hero-body">{body}</p>
            </div>
            <div className="app-feature-card__actions">
                <AppButton variant="primary" icon={Swords} aria-label={startLabel} onClick={onStart}>
                    {startLabel}
                </AppButton>
                <AppButton icon={Trophy} onClick={onOpenMissions}>
                    {viewMissionsLabel}
                </AppButton>
            </div>
            {aside ? <div className="app-feature-card__aside">{aside}</div> : null}
        </section>
    );
}

export function ProgressStrip({ ariaLabel, items }: { ariaLabel: string; items: ProgressItem[] }) {
    return (
        <section className="app-progress-strip" aria-label={ariaLabel}>
            {items.map((item) => (
                <MetricCard
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                    tone={item.tone}
                />
            ))}
        </section>
    );
}

export function NextActionRow({
    description,
    icon: Icon,
    kicker,
    label,
    onClick,
    tone = 'default'
}: {
    description: string;
    icon: IconType;
    kicker: string;
    label: string;
    onClick: () => void;
    tone?: 'default' | 'primary' | 'success' | 'warning';
}) {
    return (
        <button className={`home-action-row home-action-row--${tone}`} type="button" onClick={onClick}>
            <span className="home-action-row__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
            </span>
            <span className="home-action-row__copy">
                <small>{kicker}</small>
                <strong>{label}</strong>
                <span>{description}</span>
            </span>
            <ChevronRight className="home-action-row__chevron" aria-hidden="true" size={17} strokeWidth={2.2} />
        </button>
    );
}

function RecentChip({ icon: Icon, children, accent = false }: { icon: IconType; children: ReactNode; accent?: boolean }) {
    return (
        <span className={`home-recent-chip${accent ? ' home-recent-chip--accent' : ''}`}>
            <Icon aria-hidden="true" size={13} strokeWidth={2.2} />
            {children}
        </span>
    );
}

export function RecentRunCard({
    accuracy,
    date,
    depth,
    depthLabel,
    duration,
    emptyBody,
    isEmpty,
    kicker,
    title,
    runTitle
}: {
    accuracy?: number;
    date?: string;
    depth?: number;
    depthLabel: string;
    duration?: string;
    emptyBody: string;
    isEmpty: boolean;
    kicker: string;
    title: string;
    runTitle?: string;
}) {
    return (
        <section className={`home-recent${isEmpty ? ' home-recent--empty' : ''}`}>
            <SectionHeader kicker={kicker} title={title} />
            <div className="home-recent-summary" aria-label="TypeRift recent status">
                <span className="home-recent-summary__icon" aria-hidden="true">
                    <Swords size={16} strokeWidth={2.2} />
                </span>
                <div className="home-recent-summary__body">
                    <strong>{isEmpty ? emptyBody : runTitle}</strong>
                    {!isEmpty ? <p className="home-recent-summary__detail">{date}</p> : null}
                </div>
                {!isEmpty ? (
                    <div className="home-recent-summary__metrics">
                        <RecentChip icon={Gauge}>{depthLabel} {depth || 1}</RecentChip>
                        <RecentChip icon={ShieldCheck} accent>{accuracy || 0}%</RecentChip>
                        <RecentChip icon={DoorOpen}>{duration}</RecentChip>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
