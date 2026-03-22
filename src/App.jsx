/**
 * React 应用根组件。
 *
 * 这里负责：
 * 1. 接入 HashRouter，保证纯静态部署也能工作。
 * 2. 挂载全局状态提供者。
 * 3. 渲染应用骨架，包括头部、内容区、页脚和设置抽屉。
 */
import { useEffect, useMemo, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { CoachPage } from './pages/CoachPage';
import { HomePage } from './pages/HomePage';
import { PracticePage } from './pages/PracticePage';
import { ResultPage } from './pages/ResultPage';
import { PracticeProvider, usePracticeStore } from './store/practice-store';

/**
 * 应用实际布局层。
 * 之所以把它和 HashRouter 外壳拆开，是为了让 `useLocation` 等路由钩子
 * 只在 Router 已挂载的上下文中使用。
 */
function AppFrame() {
    const location = useLocation();
    const { settings, updateSettings } = usePracticeStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    /**
     * 把用户设置同步到 body data 属性。
     * CSS 会直接基于这些 data 属性切换主题、字号和专注模式样式。
     */
    useEffect(() => {
        document.body.dataset.theme = settings.theme;
        document.body.dataset.font = settings.fontScale;
        document.body.dataset.focus = settings.focusMode ? 'on' : 'off';
    }, [settings]);

    const isPracticeRoute = location.pathname === '/practice';
    const isFocusedLayout = settings.focusMode && isPracticeRoute;

    /**
     * 页脚文案随专注模式切换。
     * 在专注练习时，页脚更像快捷键提示；否则显示产品状态摘要。
     */
    const footerText = useMemo(() => (
        isFocusedLayout
            ? '专注模式已开启 · Tab + Enter 重新开始 · Esc 重置'
            : 'TypeMaster 2.0 · AI Coach Mode'
    ), [isFocusedLayout]);

    return (
        <div className={`app-shell ${isFocusedLayout ? 'is-focus-layout' : ''}`}>
            <Header
                settings={settings}
                onToggleTheme={() => updateSettings({ theme: settings.theme === 'serika-dark' ? 'serika-light' : 'serika-dark' })}
                onOpenSettings={() => setSettingsOpen(true)}
            />

            <main className="app-main">
                <div className="container">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/practice" element={<PracticePage />} />
                        <Route path="/result" element={<ResultPage />} />
                        <Route path="/coach" element={<CoachPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </main>

            <footer className="app-footer">
                <div className="container app-footer__inner">
                    <span>{footerText}</span>
                    {!isFocusedLayout && <span>本地历史 / AI 教练 / 下一练闭环</span>}
                </div>
            </footer>

            <SettingsDrawer
                isOpen={settingsOpen}
                settings={settings}
                onClose={() => setSettingsOpen(false)}
                onChange={updateSettings}
            />
        </div>
    );
}

/**
 * 最外层应用组件。
 * 只负责注入路由和全局状态。
 */
export default function App() {
    return (
        <HashRouter>
            <PracticeProvider>
                <AppFrame />
            </PracticeProvider>
        </HashRouter>
    );
}
