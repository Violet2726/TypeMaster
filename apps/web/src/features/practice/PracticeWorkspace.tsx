'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, Check, Clock3, Keyboard, Pause, Play, RotateCcw, Settings2 } from 'lucide-react';
import { buildRunResult, getPassage, PRACTICE_PASSAGES, SESSION_DURATIONS_MS, type PracticeCommand, type PracticeState } from '@typemaster/domain';
import type { Settings, StoredRun } from '../../lib/storage';
import { translate } from '../../i18n';
import { TypeMasterMark } from '../../components/TypeMasterMark';

export type WorkspaceView = 'practice' | 'library' | 'progress';

type Props = {
    settings: Settings;
    runs: StoredRun[];
    view: WorkspaceView;
    practice: PracticeState;
    passageId: string;
    onNavigate: (view: WorkspaceView) => void;
    onOpenSettings: () => void;
    onSelectPassage: (id: string) => void;
    onDurationChange: (durationMs: Settings['durationMs']) => void;
    onCommand: (command: PracticeCommand) => void;
    onReplay: () => void;
};

const NAVIGATION: Array<{ id: WorkspaceView; icon: typeof Keyboard }> = [
    { id: 'practice', icon: Keyboard },
    { id: 'library', icon: BookOpen },
    { id: 'progress', icon: ChartNoAxesColumnIncreasing }
];

function durationLabel(durationMs: number, locale: Settings['locale']) {
    if (locale === 'zh-CN') return durationMs === 30_000 ? '30 秒' : `${durationMs / 60_000} 分钟`;
    return durationMs === 30_000 ? '30 sec' : `${durationMs / 60_000} min`;
}

function remainingTime(state: PracticeState) {
    const seconds = Math.max(0, Math.ceil((state.durationMs - state.elapsedMs) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function average(runs: StoredRun[], pick: (run: StoredRun) => number) {
    if (!runs.length) return null;
    return Math.round(runs.reduce((sum, run) => sum + pick(run), 0) / runs.length);
}

function todayCount(runs: StoredRun[]) {
    const today = new Date().toLocaleDateString();
    return runs.filter((run) => new Date(run.completedAt).toLocaleDateString() === today).length;
}

function formatDate(value: string, locale: Settings['locale']) {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function PracticeWorkspace(props: Props) {
    const { settings, view } = props;
    const t = (key: Parameters<typeof translate>[1]) => translate(settings.locale, key);
    return (
        <div className="workspace-shell">
            <header className="app-header">
                <TypeMasterMark />
                <nav className="primary-navigation" aria-label={t('nav.label')}>
                    {NAVIGATION.map(({ id, icon: Icon }) => (
                        <button
                            key={id}
                            aria-current={view === id ? 'page' : undefined}
                            className="navigation-tab"
                            type="button"
                            onClick={() => props.onNavigate(id)}
                        >
                            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                            <span>{t(`nav.${id}`)}</span>
                        </button>
                    ))}
                </nav>
                <div className="header-actions">
                    <span className="local-note">{t('app.local')}</span>
                    <button className="icon-button" type="button" aria-label={t('settings.open')} title={t('settings.open')} onClick={props.onOpenSettings}>
                        <Settings2 size={18} aria-hidden="true" />
                    </button>
                </div>
            </header>

            {view === 'practice' ? <PracticeView {...props} /> : null}
            {view === 'library' ? <LibraryView {...props} /> : null}
            {view === 'progress' ? <ProgressView {...props} /> : null}

            <footer className="workspace-footer">
                <span>{t('footer.note')}</span>
                <span>TYPEMASTER STUDIO</span>
            </footer>
        </div>
    );
}

function PracticeView(props: Props) {
    const { settings, runs, practice } = props;
    const t = (key: Parameters<typeof translate>[1]) => translate(settings.locale, key);
    const passage = getPassage(practice.passageId);
    const inputRef = useRef<HTMLInputElement>(null);
    const promptRef = useRef<HTMLParagraphElement>(null);
    const activeCharacterRef = useRef<HTMLSpanElement>(null);
    const [hasInputFocus, setHasInputFocus] = useState(false);
    const active = practice.phase === 'running' || practice.phase === 'paused';
    const result = practice.phase === 'complete' ? buildRunResult(practice) : null;

    useEffect(() => {
        activeCharacterRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }, [practice.passageId, practice.typed]);

    const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
        const previous = practice.typed;
        const value = event.currentTarget.value;
        if (value.length > previous.length) props.onCommand({ type: 'type', text: value.slice(previous.length) });
        else if (value.length < previous.length) {
            for (let index = value.length; index < previous.length; index += 1) props.onCommand({ type: 'backspace' });
        }
    };

    const resumePractice = () => {
        props.onCommand({ type: 'resume' });
        window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    };

    return (
        <main className="page-content practice-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">{t('practice.eyebrow')}</p>
                    <h1>
                        {t('practice.title')}
                        <span>{t('practice.titleAccent')}</span>
                    </h1>
                </div>
                <p className="page-heading__note">{t('practice.intro')}</p>
            </div>

            <div className="practice-layout">
                <section
                    className={`practice-room${settings.enhancedContrast ? ' is-high-contrast' : ''}${hasInputFocus ? ' is-focused' : ''}`}
                    aria-label={t('practice.sessionLabel')}
                >
                    <div className="session-toolbar">
                        <div className="passage-identity">
                            <span className="passage-category">{settings.locale === 'zh-CN' ? '精选短文' : passage.category}</span>
                            <h2>{passage.title}</h2>
                            <span className="passage-byline">{t('practice.byline')}</span>
                        </div>
                        <div className="duration-picker" role="group" aria-label={t('practice.duration')}>
                            {SESSION_DURATIONS_MS.map((durationMs) => (
                                <button
                                    type="button"
                                    key={durationMs}
                                    aria-pressed={settings.durationMs === durationMs}
                                    disabled={active}
                                    onClick={() => props.onDurationChange(durationMs as Settings['durationMs'])}
                                >
                                    {durationLabel(durationMs, settings.locale)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {result ? (
                        <SessionResult
                            result={result}
                            settings={settings}
                            runs={runs}
                            onReplay={props.onReplay}
                            onProgress={() => props.onNavigate('progress')}
                        />
                    ) : (
                        <>
                            <div className={`session-metrics${practice.phase === 'ready' ? ' is-idle' : ''}`} aria-label={t('practice.liveMetrics')}>
                                <Metric
                                    label={t('practice.remaining')}
                                    value={practice.phase === 'ready' ? durationLabel(practice.durationMs, settings.locale) : remainingTime(practice)}
                                    emphasized
                                />
                                <Metric label={t('practice.wpm')} value={practice.elapsedMs ? String(buildRunResult(practice).wpm) : '—'} />
                                <Metric label={t('practice.accuracy')} value={practice.attemptedChars ? `${buildRunResult(practice).accuracy}%` : '—'} />
                            </div>

                            <div className="passage-workspace" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
                                {practice.phase === 'paused' ? (
                                    <div className="paused-state">
                                        <span>{t('practice.paused')}</span>
                                        <button className="text-action" type="button" onClick={resumePractice}>
                                            <Play size={15} aria-hidden="true" /> {t('practice.continue')}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="passage-text" ref={promptRef} aria-label={passage.text}>
                                            {Array.from(passage.text).map((character, index) => {
                                                const status =
                                                    index < practice.typed.length
                                                        ? practice.typed[index] === character
                                                            ? 'typed'
                                                            : 'mistake'
                                                        : index === practice.typed.length
                                                          ? 'current'
                                                          : 'pending';
                                                return (
                                                    <span
                                                        className={`passage-character is-${status}`}
                                                        key={`${index}-${character}`}
                                                        ref={status === 'current' ? activeCharacterRef : undefined}
                                                    >
                                                        {character}
                                                    </span>
                                                );
                                            })}
                                            {practice.typed.length === passage.text.length &&
                                            practice.typed[practice.typed.length - 1] !== passage.text[passage.text.length - 1] ? (
                                                <span className="passage-character is-current is-end-caret" ref={activeCharacterRef} aria-hidden="true" />
                                            ) : null}
                                        </p>
                                        <input
                                            ref={inputRef}
                                            id="practice-input"
                                            className="typing-capture-input"
                                            type="text"
                                            value={practice.typed}
                                            onChange={handleInput}
                                            onFocus={(event) => {
                                                setHasInputFocus(true);
                                                const end = event.currentTarget.value.length;
                                                event.currentTarget.setSelectionRange(end, end);
                                            }}
                                            onBlur={() => setHasInputFocus(false)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Escape' && practice.phase === 'running') {
                                                    event.preventDefault();
                                                    props.onCommand({ type: 'pause' });
                                                }
                                            }}
                                            aria-label={t('practice.inputReady')}
                                            autoComplete="off"
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            spellCheck={false}
                                            inputMode="text"
                                            aria-describedby="practice-help"
                                        />
                                    </>
                                )}
                            </div>

                            <div className="typing-dock">
                                <p id="practice-help" className="typing-help">
                                    <span className="typing-help__instruction">
                                        <Keyboard size={16} aria-hidden="true" />
                                        {practice.phase === 'ready'
                                            ? t('practice.firstKey')
                                            : practice.phase === 'paused'
                                              ? t('practice.paused')
                                              : t('practice.live')}
                                    </span>
                                    <span className="typing-controls">
                                        {practice.phase === 'running' ? (
                                            <button
                                                className="icon-button subtle-button"
                                                type="button"
                                                title={t('practice.pause')}
                                                aria-label={t('practice.pause')}
                                                onClick={() => props.onCommand({ type: 'pause' })}
                                            >
                                                <Pause size={16} aria-hidden="true" />
                                            </button>
                                        ) : null}
                                        <button
                                            className="icon-button subtle-button"
                                            type="button"
                                            title={t('practice.restart')}
                                            aria-label={t('practice.restart')}
                                            onClick={props.onReplay}
                                        >
                                            <RotateCcw size={16} aria-hidden="true" />
                                        </button>
                                    </span>
                                </p>
                            </div>
                        </>
                    )}
                </section>

                <aside className="practice-aside">
                    <figure className="desk-feature">
                        <Image
                            src="/studio/quiet-desk.png"
                            alt={t('practice.imageAlt')}
                            width={1536}
                            height={1024}
                            sizes="(max-width: 720px) 100vw, 284px"
                            unoptimized
                        />
                        <figcaption>
                            <span>{t('practice.imageCaption')}</span>
                            <span>01 / 04</span>
                        </figcaption>
                    </figure>
                    <div className="today-summary">
                        <div className="aside-heading">
                            <span>{t('practice.today')}</span>
                            <Clock3 size={16} aria-hidden="true" />
                        </div>
                        <strong>
                            {todayCount(runs).toString().padStart(2, '0')} <small>{t('practice.sessionsToday')}</small>
                        </strong>
                        <p>{runs.length ? t('practice.keepNote') : t('practice.emptyNote')}</p>
                        <button className="inline-link" type="button" onClick={() => props.onNavigate('progress')}>
                            {t('practice.viewProgress')} <ArrowRight size={15} aria-hidden="true" />
                        </button>
                    </div>
                </aside>
            </div>
        </main>
    );
}

function Metric({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
    return (
        <div className={`live-metric${emphasized ? ' is-emphasized' : ''}`}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function SessionResult({
    result,
    settings,
    runs,
    onReplay,
    onProgress
}: {
    result: ReturnType<typeof buildRunResult>;
    settings: Settings;
    runs: StoredRun[];
    onReplay: () => void;
    onProgress: () => void;
}) {
    const t = (key: Parameters<typeof translate>[1]) => translate(settings.locale, key);
    const personalBest = Math.max(0, ...runs.map((run) => run.result.wpm));
    return (
        <section className="session-result" aria-live="polite" aria-labelledby="result-title">
            <p className="eyebrow">{t('result.eyebrow')}</p>
            <h3 id="result-title">{t('result.title')}</h3>
            <div className="result-primary">
                <div>
                    <strong>{result.wpm}</strong>
                    <span>{t('result.wpm')}</span>
                </div>
                <div>
                    <strong>
                        {result.accuracy}
                        <small>%</small>
                    </strong>
                    <span>{t('result.accuracy')}</span>
                </div>
            </div>
            <div className="result-detail-grid">
                <div>
                    <span>{t('result.errors')}</span>
                    <strong>{result.errors}</strong>
                </div>
                <div>
                    <span>{t('result.characters')}</span>
                    <strong>{result.typedChars}</strong>
                </div>
                <div>
                    <span>{t('result.passages')}</span>
                    <strong>{result.completedPassages}</strong>
                </div>
                <div>
                    <span>{t('result.personalBest')}</span>
                    <strong>{personalBest} WPM</strong>
                </div>
            </div>
            {result.weakKeys.length ? (
                <p className="weak-keys">
                    <span>{t('result.focus')}</span>
                    {result.weakKeys.map(({ key, mistakes }) => (
                        <span className="weak-key" key={key}>
                            {key} <small>×{mistakes}</small>
                        </span>
                    ))}
                </p>
            ) : null}
            <div className="result-actions">
                <button className="primary-action" type="button" onClick={onReplay}>
                    {t('result.again')} <RotateCcw size={16} aria-hidden="true" />
                </button>
                <button className="text-action" type="button" onClick={onProgress}>
                    {t('result.progress')} <ArrowRight size={15} aria-hidden="true" />
                </button>
            </div>
        </section>
    );
}

function LibraryView(props: Props) {
    const { settings, passageId } = props;
    const t = (key: Parameters<typeof translate>[1]) => translate(settings.locale, key);
    return (
        <main className="page-content library-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">{t('library.eyebrow')}</p>
                    <h1>
                        {t('library.title')}
                        <span>{t('library.titleAccent')}</span>
                    </h1>
                </div>
                <p className="page-heading__note">{t('library.intro')}</p>
            </div>
            <section className="library-feature" aria-labelledby="library-feature-title">
                <Image
                    src="/studio/quiet-desk.png"
                    alt={t('practice.imageAlt')}
                    width={1536}
                    height={1024}
                    sizes="(max-width: 720px) 100vw, 55vw"
                    unoptimized
                />
                <div className="library-feature__copy">
                    <p className="eyebrow">{t('library.featureLabel')}</p>
                    <h2 id="library-feature-title">{t('library.featureTitle')}</h2>
                    <p>{t('library.featureBody')}</p>
                    <span>
                        {PRACTICE_PASSAGES.length.toString().padStart(2, '0')} {t('library.selectionCount')}
                    </span>
                </div>
            </section>
            <section className="passage-library" aria-label={t('library.selectionLabel')}>
                {PRACTICE_PASSAGES.map((passage, index) => (
                    <button
                        className={`passage-row${passage.id === passageId ? ' is-selected' : ''}`}
                        key={passage.id}
                        type="button"
                        onClick={() => props.onSelectPassage(passage.id)}
                    >
                        <span className="passage-row__index">{String(index + 1).padStart(2, '0')}</span>
                        <span className="passage-row__copy">
                            <strong>{passage.title}</strong>
                            <span>{passage.description}</span>
                        </span>
                        <span className="passage-row__category">{settings.locale === 'zh-CN' ? '原创短文' : passage.category}</span>
                        {passage.id === passageId ? <Check size={17} aria-label={t('library.selected')} /> : <ArrowRight size={17} aria-hidden="true" />}
                    </button>
                ))}
            </section>
        </main>
    );
}

function ProgressView({ settings, runs }: Props) {
    const t = (key: Parameters<typeof translate>[1]) => translate(settings.locale, key);
    const best = Math.max(0, ...runs.map((run) => run.result.wpm));
    const avgWpm = average(runs, (run) => run.result.wpm);
    const avgAccuracy = average(runs, (run) => run.result.accuracy);
    const chart = Array.from({ length: 7 }, (_, offset) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - offset));
        const count = runs.filter((run) => new Date(run.completedAt).toDateString() === day.toDateString()).length;
        return { day, count };
    });
    const chartMax = Math.max(1, ...chart.map((item) => item.count));
    return (
        <main className="page-content progress-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">{t('progress.eyebrow')}</p>
                    <h1>
                        {t('progress.title')}
                        <span>{t('progress.titleAccent')}</span>
                    </h1>
                </div>
                <p className="page-heading__note">{t('progress.intro')}</p>
            </div>
            <section className="progress-overview" aria-label={t('progress.summary')}>
                <div className="overview-stat">
                    <span>{t('progress.sessions')}</span>
                    <strong>{runs.length}</strong>
                </div>
                <div className="overview-stat">
                    <span>{t('progress.averageWpm')}</span>
                    <strong>
                        {avgWpm ?? '—'}
                        <small>{avgWpm === null ? '' : ' WPM'}</small>
                    </strong>
                </div>
                <div className="overview-stat">
                    <span>{t('progress.averageAccuracy')}</span>
                    <strong>{avgAccuracy === null ? '—' : `${avgAccuracy}%`}</strong>
                </div>
                <div className="overview-stat">
                    <span>{t('progress.bestWpm')}</span>
                    <strong>
                        {best || '—'}
                        <small>{best ? ' WPM' : ''}</small>
                    </strong>
                </div>
            </section>
            <section className="activity-section" aria-labelledby="activity-title">
                <div className="section-title-row">
                    <div>
                        <p className="eyebrow">{t('progress.lastWeek')}</p>
                        <h2 id="activity-title">{t('progress.activity')}</h2>
                    </div>
                    <span>{runs.length ? `${runs.length} ${t('progress.savedLocally')}` : t('progress.noData')}</span>
                </div>
                <div className="activity-chart" role="img" aria-label={t('progress.chartLabel')}>
                    {chart.map(({ day, count }) => (
                        <div className="activity-day" key={day.toISOString()}>
                            <span className="activity-bar-wrap">
                                <span className="activity-bar" style={{ height: `${Math.max(count ? 14 : 4, (count / chartMax) * 100)}%` }} />
                            </span>
                            <span>{new Intl.DateTimeFormat(settings.locale, { weekday: 'narrow' }).format(day)}</span>
                        </div>
                    ))}
                </div>
            </section>
            <section className="history-section" aria-labelledby="history-title">
                <div className="section-title-row">
                    <div>
                        <p className="eyebrow">{t('progress.archive')}</p>
                        <h2 id="history-title">{t('progress.recent')}</h2>
                    </div>
                    <span>{Math.min(runs.length, 20).toString().padStart(2, '0')} / 20</span>
                </div>
                {runs.length ? (
                    <div className="history-list">
                        {runs.slice(0, 20).map((run) => (
                            <article className="history-row" key={run.id}>
                                <time dateTime={run.completedAt}>{formatDate(run.completedAt, settings.locale)}</time>
                                <strong>
                                    {run.result.wpm} <small>WPM</small>
                                </strong>
                                <span>
                                    {run.result.accuracy}% {t('result.accuracy')}
                                </span>
                                <span>
                                    {run.result.errors} {t('result.errors')}
                                </span>
                                <span>{durationLabel(run.result.durationMs, settings.locale)}</span>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="progress-empty">{t('progress.empty')}</p>
                )}
            </section>
        </main>
    );
}
