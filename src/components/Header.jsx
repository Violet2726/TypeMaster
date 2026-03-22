/**
 * 顶部导航组件。
 *
 * 该组件只处理全局导航和两个全局动作：
 * - 切换主题
 * - 打开设置抽屉
 *
 * 当用户进入专注模式且位于练习页时，导航会自动压缩，
 * 减少对打字流程的干扰。
 */
import { NavLink, useLocation } from 'react-router-dom';

export function Header({ settings, onToggleTheme, onOpenSettings }) {
    const location = useLocation();
    const compact = settings.focusMode && location.pathname === '/practice';

    return (
        <header className={`app-header ${compact ? 'is-compact' : ''}`}>
            <div className="container app-header__inner">
                <div className="brand-block">
                    <NavLink to="/" className="logo">
                        <span className="logo-icon">⌨</span>
                        <span className="logo-word">type<span>master</span></span>
                    </NavLink>
                    {!compact && <p className="hero-kicker">AI Coach Mode</p>}
                </div>

                {!compact && (
                    <nav className="nav-links" aria-label="Primary">
                        <NavLink to="/" className="nav-link">首页</NavLink>
                        <NavLink to="/practice" className="nav-link">练习</NavLink>
                        <NavLink to="/coach" className="nav-link">教练页</NavLink>
                    </nav>
                )}

                <div className="nav-actions">
                    <button className="nav-icon" type="button" onClick={onToggleTheme} title="切换主题">
                        {settings.theme === 'serika-dark' ? '☀' : '☾'}
                    </button>
                    <button className="nav-icon" type="button" onClick={onOpenSettings} title="打开设置">
                        ⚙
                    </button>
                </div>
            </div>
        </header>
    );
}
