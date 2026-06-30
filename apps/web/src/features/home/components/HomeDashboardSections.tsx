'use client';

import type { ComponentType, ReactNode } from 'react';
import { DoorOpen, Gauge, ShieldCheck, Swords, Trophy } from 'lucide-react';
import { AppButton, AppCard, MetricCard, SectionHeader } from '../../../components/app/AppPrimitives';

type IconType = ComponentType<any>;

export type ProgressItem = {
    id: string;
    icon: IconType;
    label: ReactNode;
    value: ReactNode;
    tone?: 'default' | 'primary' | 'success' | 'warning';
};

export function TodayHero({
    body,
    kicker,
    onOpenMissions,
    onStart,
    startLabel,
    title,
    viewMissionsLabel
}: {
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

export function NextActionCard({
    description,
    icon,
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
        <AppCard
            icon={icon}
            kicker={kicker}
            title={label}
            body={description}
            tone={tone}
            onClick={onClick}
        />
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
    emptyDescription,
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
    emptyDescription: string;
    isEmpty: boolean;
    kicker: string;
    title: string;
    runTitle?: string;
}) {
    return (
        <section className="home-recent">
            <SectionHeader kicker={kicker} title={title} />
            <div className="home-recent-list">
                <div className="home-recent-item">
                    <span className="home-recent-item__icon" aria-hidden="true">
                        <Swords size={16} strokeWidth={2.2} />
                    </span>
                    <div className="home-recent-item__body">
                        <strong>{isEmpty ? emptyBody : runTitle}</strong>
                        <p>{isEmpty ? emptyDescription : date}</p>
                    </div>
                    {!isEmpty ? (
                        <div className="home-recent-item__metrics">
                            <RecentChip icon={Gauge}>{depthLabel} {depth || 1}</RecentChip>
                            <RecentChip icon={ShieldCheck} accent>{accuracy || 0}%</RecentChip>
                            <RecentChip icon={DoorOpen}>{duration}</RecentChip>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
