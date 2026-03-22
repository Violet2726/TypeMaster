/**
 * 结果页。
 *
 * 结果页是 2.0 切片的关键闭环页面：
 * - 展示本次结果
 * - 展示趋势图
 * - 自动请求 AI 教练建议
 * - 提供“下一练”入口
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TrendChart } from '../components/TrendChart';
import { deriveComparison } from '../engine';
import { usePracticeStore } from '../store/practice-store';

export function ResultPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {
        sessions,
        lastCompletedSession,
        getAdviceForSession,
        generateCoachForSession,
        launchNextDrill
    } = usePracticeStore();

    const sessionId = searchParams.get('session');

    /**
     * 优先按 query 里的 session id 读取结果。
     * 如果没有，就回退到最近一次完成的练习。
     */
    const session = useMemo(
        () => sessions.find((item) => item.id === sessionId) || lastCompletedSession,
        [lastCompletedSession, sessionId, sessions]
    );

    const [coachRecord, setCoachRecord] = useState(() => (session ? getAdviceForSession(session.id) : null));
    const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

    /**
     * 结果页首次进入时自动触发 AI 教练诊断。
     * 如果本地已有缓存，则直接复用。
     */
    useEffect(() => {
        if (!session) {
            return;
        }

        const existing = getAdviceForSession(session.id);
        if (existing) {
            setCoachRecord(existing);
            return;
        }

        let isActive = true;
        setIsLoadingAdvice(true);

        generateCoachForSession(session.id)
            .then((record) => {
                if (isActive) {
                    setCoachRecord(record);
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoadingAdvice(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [generateCoachForSession, getAdviceForSession, session]);

    if (!session) {
        return (
            <section className="panel empty-panel">
                <h2>还没有可展示的结果</h2>
                <p className="muted-text">先完成一次练习，再回来查看结果页和 AI 教练建议。</p>
                <Link to="/practice" className="action-btn primary">去练习</Link>
            </section>
        );
    }

    const comparison = coachRecord?.comparison || deriveComparison(sessions, session.id, session.result);

    /**
     * “下一练”按钮会直接拿教练建议里的 configPatch 和 aiPrompt，
     * 生成一份新的 AI 草稿，然后跳回练习页。
     */
    const handleNextDrill = async () => {
        if (coachRecord?.nextDrill) {
            try {
                await launchNextDrill(coachRecord);
            } catch (error) {
                // 失败时仍然允许返回练习页，练习页会显示已有内容。
            }
        }
        navigate('/practice');
    };

    return (
        <div className="page-stack">
            <section className="panel result-hero">
                <div className="result-hero__stats">
                    <div className="result-big">
                        <span className="result-label">wpm</span>
                        <span className="result-value">{session.result.wpm}</span>
                    </div>
                    <div className="result-big">
                        <span className="result-label">acc</span>
                        <span className="result-value">{session.result.accuracy}<span className="result-unit">%</span></span>
                    </div>
                </div>

                <div className="result-copy">
                    <p className="panel-kicker">Outcome</p>
                    <h2>{comparison.summary}</h2>
                    <p className="muted-text">
                        本次文本来源于 {session.sourceTextMeta?.label || '训练文本'}，稳定度 {session.result.consistency}%。
                    </p>
                </div>
            </section>

            <TrendChart timeline={session.timeline || { labels: [], wpm: [], raw: [], burst: [], errors: [] }} />

            <section className="panel result-grid">
                <div className="results-details">
                    <div className="result-item">
                        <span className="result-item-label">test type</span>
                        <span className="result-item-value">
                            {session.config.mode === 'time' ? `time ${session.config.durationSeconds}` : `words ${session.config.wordCount}`}
                        </span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">raw</span>
                        <span className="result-item-value">{session.result.rawWpm}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">characters</span>
                        <span className="result-item-value">
                            {session.result.correctChars}/{session.result.incorrectChars}/{session.result.extraChars}/{session.result.missedChars}
                        </span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">consistency</span>
                        <span className="result-item-value">{session.result.consistency}%</span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">time</span>
                        <span className="result-item-value">{session.result.durationSeconds}s</span>
                    </div>
                </div>

                <div className="coach-card">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">AI Coach</p>
                            <h2>{coachRecord?.headline || '正在生成本次建议...'}</h2>
                        </div>
                        <span className="panel-badge">
                            {coachRecord ? (coachRecord.source === 'ai' ? 'AI 诊断' : '本地兜底') : '处理中'}
                        </span>
                    </div>

                    {isLoadingAdvice && !coachRecord ? (
                        <p className="muted-text">正在基于本次结果和最近历史生成教练建议...</p>
                    ) : (
                        <>
                            <p className="lead-text">{coachRecord?.summary}</p>

                            <div className="coach-section">
                                <h3>本次结论</h3>
                                <p>{comparison.summary}</p>
                            </div>

                            <div className="coach-section">
                                <h3>主要问题</h3>
                                <ul className="flat-list">
                                    {(coachRecord?.weaknesses || []).map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>

                            <div className="coach-section">
                                <h3>做得好的地方</h3>
                                <ul className="flat-list">
                                    {(coachRecord?.strengths || []).map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>

                            <div className="coach-section">
                                <h3>下一练建议</h3>
                                <p>{coachRecord?.nextDrill?.reason}</p>
                                <button type="button" className="action-btn primary" onClick={handleNextDrill}>
                                    {coachRecord?.nextDrill?.label || '开始下一练'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <div className="results-actions">
                <button type="button" className="action-btn" onClick={() => navigate('/practice')}>返回练习页</button>
                <Link to="/coach" className="action-btn">打开教练页</Link>
            </div>
        </div>
    );
}
