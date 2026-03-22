/**
 * 教练页。
 *
 * 当前版本不做完整成长中心，因此这里主要承担两个展示任务：
 * - 保留最近一次完整建议
 * - 展示最近几条练习摘要
 */
import { Link } from 'react-router-dom';
import { usePracticeStore } from '../store/practice-store';

export function CoachPage() {
    const { latestCoachAdvice, sessions } = usePracticeStore();

    return (
        <div className="page-stack">
            <section className="panel coach-page__hero">
                <div>
                    <p className="panel-kicker">Coach Center</p>
                    <h1>最近一次完整建议</h1>
                </div>
                <Link to="/practice" className="action-btn primary">继续练习</Link>
            </section>

            <section className="panel">
                {latestCoachAdvice ? (
                    <div className="coach-section-grid">
                        <div className="coach-highlight">
                            <h2>{latestCoachAdvice.headline}</h2>
                            <p className="lead-text">{latestCoachAdvice.summary}</p>
                            <p className="muted-text">{latestCoachAdvice.comparison?.summary}</p>
                        </div>

                        <div className="coach-columns">
                            <div className="coach-section">
                                <h3>做得好的地方</h3>
                                <ul className="flat-list">
                                    {latestCoachAdvice.strengths.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                            <div className="coach-section">
                                <h3>主要问题</h3>
                                <ul className="flat-list">
                                    {latestCoachAdvice.weaknesses.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="muted-text">暂无教练建议。完成一次练习后，这里会保留最近一次完整建议和练习摘要。</p>
                )}
            </section>

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">History</p>
                        <h2>最近练习摘要</h2>
                    </div>
                    <span className="panel-badge">本地最多保留 50 条</span>
                </div>

                <div className="history-table">
                    {sessions.slice(0, 8).map((session) => (
                        <div key={session.id} className="history-row">
                            <div>
                                <strong>{session.sourceTextMeta?.label || '训练文本'}</strong>
                                <p className="muted-text">{new Date(session.result.completedAt).toLocaleString('zh-CN')}</p>
                            </div>
                            <div className="history-metrics">
                                <span>{session.result.wpm} WPM</span>
                                <span>{session.result.accuracy}%</span>
                                <span>{session.result.consistency}%</span>
                            </div>
                        </div>
                    ))}
                    {!sessions.length && <p className="muted-text">还没有历史样本。</p>}
                </div>
            </section>
        </div>
    );
}
