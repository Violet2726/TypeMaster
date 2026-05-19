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
import { PracticeProvider, usePracticeStore } from './store/practice-store';

// Lazy load page components for better initial load performance
const HomePage = lazy(() => import('./pages/HomePage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));

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
                    <Suspense fallback={null}>
                        <Outlet />
                    </Suspense>
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
        <Route path="/" element={<HomePage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/coach" element={<Navigate to="/insights" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
));

export default function App() {
    return <RouterProvider router={router} />;
}
