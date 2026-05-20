import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import {
    Navigate,
    Outlet,
    Route,
    RouterProvider,
    createHashRouter,
    createRoutesFromElements,
    useLocation
} from 'react-router-dom';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
const HomePage = lazy(() => import('./pages/HomePage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
import { PracticeProvider, usePracticeStore } from './store/practice-store';

function AppFrame() {
    const location = useLocation();
    const { settings, updateSettings, copy } = usePracticeStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        document.body.dataset.theme = settings.theme;
        document.body.dataset.font = settings.fontScale;
        document.body.dataset.focus = settings.focusMode ? 'on' : 'off';
        document.body.dataset.language = settings.language;
        document.documentElement.lang = settings.language;
    }, [settings]);

    const isPracticeRoute = location.pathname === '/practice';
    const isFocusedLayout = settings.focusMode && isPracticeRoute;
    const footerText = useMemo(() => (
        isFocusedLayout
            ? copy.shell.footerFocus
            : `${copy.common.appName} · ${copy.shell.footerDefault}`
    ), [copy, isFocusedLayout]);

    return (
        <div className={`app-shell ${isFocusedLayout ? 'is-focus-layout' : ''}`}>
            <Header
                settings={settings}
                copy={copy}
                onToggleTheme={() => updateSettings({ theme: settings.theme === 'serika-dark' ? 'serika-light' : 'serika-dark' })}
                onOpenSettings={() => setSettingsOpen(true)}
            />

            <main className="app-main">
                <div className="container">
                    <Outlet />
                </div>
            </main>

            <footer className="app-footer">
                <div className="container app-footer__inner">
                    <span>{footerText}</span>
                </div>
            </footer>

            <SettingsDrawer
                isOpen={settingsOpen}
                settings={settings}
                copy={copy}
                onClose={() => setSettingsOpen(false)}
                onChange={updateSettings}
            />
        </div>
    );
}

function AppShell() {
    return (
        <PracticeProvider>
            <AppFrame />
        </PracticeProvider>
    );
}

const router = createHashRouter(createRoutesFromElements(
    <Route element={<AppShell />}>
        <Route
            path="/"
            element={
                <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                    <HomePage />
                </Suspense>
            }
        />
        <Route
            path="/practice"
            element={
                <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                    <PracticePage />
                </Suspense>
            }
        />
        <Route
            path="/result"
            element={
                <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                    <ResultPage />
                </Suspense>
            }
        />
        <Route
            path="/insights"
            element={
                <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                    <InsightsPage />
                </Suspense>
            }
        />
        <Route path="/coach" element={<Navigate to="/insights" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
));

export default function App() {
    return <RouterProvider router={router} />;
}
