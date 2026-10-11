'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyPracticeCommand, buildRunResult, createPractice, type PracticeCommand } from '@typemaster/domain';
import { PracticeWorkspace, type WorkspaceView } from '../features/practice/PracticeWorkspace';
import { DEFAULT_SETTINGS, loadRuns, loadSettings, saveRun, saveSettings, type Settings, type StoredRun } from '../lib/storage';
import { SettingsDialog } from './SettingsDialog';
import { TypeMasterMark } from './TypeMasterMark';

function createSeed() {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PracticeApp() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [runs, setRuns] = useState<StoredRun[]>([]);
    const [storageReady, setStorageReady] = useState(false);
    const [view, setView] = useState<WorkspaceView>('practice');
    const [passageId, setPassageId] = useState('morning-light');
    const [practice, setPractice] = useState(() => createPractice('first-session', DEFAULT_SETTINGS.durationMs, 'morning-light'));
    const [settingsOpen, setSettingsOpen] = useState(false);
    const practiceRef = useRef(practice);
    const resultSaved = useRef(false);

    const refreshLocalState = useCallback(() => {
        setSettings(loadSettings());
        setRuns(loadRuns());
    }, []);

    useEffect(() => {
        refreshLocalState();
        setStorageReady(true);
    }, [refreshLocalState]);

    useEffect(() => {
        const root = document.documentElement;
        root.lang = settings.locale;
        root.dataset.largeText = String(settings.textScale > 1);
        root.dataset.reduceMotion = String(settings.reduceMotion);
        root.dataset.contrast = String(settings.enhancedContrast);
        root.style.setProperty('--user-text-scale', String(settings.textScale));
    }, [settings]);

    const dispatch = useCallback((command: PracticeCommand) => {
        const update = applyPracticeCommand(practiceRef.current, command);
        practiceRef.current = update.state;
        setPractice(update.state);
    }, []);

    useEffect(() => {
        if (practice.phase !== 'running') return;
        let previous = performance.now();
        const interval = window.setInterval(() => {
            const now = performance.now();
            dispatch({ type: 'tick', deltaMs: now - previous });
            previous = now;
        }, 120);
        const pauseWhenHidden = () => {
            if (document.visibilityState === 'hidden') dispatch({ type: 'pause' });
        };
        document.addEventListener('visibilitychange', pauseWhenHidden);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', pauseWhenHidden);
        };
    }, [dispatch, practice.phase]);

    useEffect(() => {
        if (practice.phase !== 'complete' || resultSaved.current) return;
        resultSaved.current = true;
        saveRun(buildRunResult(practice));
        setRuns(loadRuns());
    }, [practice]);

    const updateSettings = (next: Settings) => {
        setSettings(next);
        saveSettings(next);
        if (next.durationMs !== settings.durationMs && practiceRef.current.phase !== 'running' && practiceRef.current.phase !== 'paused') {
            const fresh = createPractice(createSeed(), next.durationMs, passageId);
            practiceRef.current = fresh;
            setPractice(fresh);
            resultSaved.current = false;
        }
    };

    const resetSession = (nextPassageId = passageId, durationMs = settings.durationMs) => {
        const fresh = createPractice(createSeed(), durationMs, nextPassageId);
        practiceRef.current = fresh;
        setPractice(fresh);
        resultSaved.current = false;
    };

    const selectPassage = (nextPassageId: string) => {
        setPassageId(nextPassageId);
        resetSession(nextPassageId);
        setView('practice');
    };

    const changeDuration = (durationMs: Settings['durationMs']) => {
        const next = { ...settings, durationMs };
        setSettings(next);
        saveSettings(next);
        resetSession(passageId, durationMs);
    };

    if (!storageReady) {
        return (
            <main className="storage-screen">
                <TypeMasterMark />
                <p className="storage-message" role="status">
                    {settings.locale === 'zh-CN' ? '正在准备练习空间…' : 'Preparing your studio…'}
                </p>
            </main>
        );
    }

    return (
        <>
            <PracticeWorkspace
                settings={settings}
                runs={runs}
                view={view}
                practice={practice}
                passageId={passageId}
                onNavigate={setView}
                onOpenSettings={() => setSettingsOpen(true)}
                onSelectPassage={selectPassage}
                onDurationChange={changeDuration}
                onCommand={dispatch}
                onReplay={() => resetSession()}
            />
            <SettingsDialog open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onUpdate={updateSettings} />
        </>
    );
}
