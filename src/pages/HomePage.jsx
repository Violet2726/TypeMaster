/**
 * 首页。
 *
 * 首页不承担复杂交互，重点是：
 * - 告诉用户 2.0 的产品定位
 * - 展示当前本地数据的摘要
 * - 提供进入练习和教练页的入口
 */
import { Link } from 'react-router-dom';
import { usePracticeStore } from '../store/practice-store';

export function HomePage() {
    const { sessions, latestCoachAdvice } = usePracticeStore();

    const totalSessions = sessions.length;
    const averageWpm = totalSessions
        ? Math.round(sessions.reduce((sum, session) => sum + session.result.wpm, 0) / totalSessions)
        : 0;
    const bestAccuracy = totalSessions
        ? Math.max(...sessions.map((session) => session.result.accuracy))
        : 0;

    return (
        <div className="page-stack">
            <section className="hero-card">
                <div className="hero-copy">
                    <p className="hero-kicker">TypeMaster 2.0</p>
                    <h1>不只测速，而是让每一轮练习都能被 AI 解释。</h1>
                    <p className="hero-body">
                        这一版把产品主线切到 AI 教练：练习前能定制训练文本，练习后自动给出诊断、优点、弱项和下一练建议。
                    </p>
                    <div className="hero-actions">
                        <Link to="/practice" className="action-btn primary">开始练习</Link>
                        <Link to="/coach" className="action-btn">查看教练页</Link>
                    </div>
                </div>

                <div className="hero-stats">
                    <div className="metric-card">
                        <span>累计练习</span>
                        <strong>{totalSessions}</strong>
                    </div>
                    <div className="metric-card">
                        <span>平均速度</span>
                        <strong>{averageWpm} WPM</strong>
                    </div>
                    <div className="metric-card">
                        <span>最佳准确率</span>
                        <strong>{bestAccuracy}%</strong>
                    </div>
                </div>
            </section>

            <section className="panel dual-grid">
                <div>
                    <p className="panel-kicker">Latest Coach</p>
                    <h2>最近一次教练建议</h2>
                    {latestCoachAdvice ? (
                        <>
                            <p className="lead-text">{latestCoachAdvice.headline}</p>
                            <p className="muted-text">{latestCoachAdvice.summary}</p>
                        </>
                    ) : (
                        <p className="muted-text">还没有教练建议。先完成一次练习，结果页会自动生成第一份诊断。</p>
                    )}
                </div>

                <div>
                    <p className="panel-kicker">Recent Sessions</p>
                    <h2>最近练习</h2>
                    <div className="session-list">
                        {sessions.slice(0, 4).map((session) => (
                            <div key={session.id} className="session-row">
                                <span>{session.sourceTextMeta?.label || '训练文本'}</span>
                                <strong>{session.result.wpm} / {session.result.accuracy}%</strong>
                            </div>
                        ))}
                        {!sessions.length && <p className="muted-text">本地历史还是空的。</p>}
                    </div>
                </div>
            </section>
        </div>
    );
}
