import { useEffect, useMemo, useState, useCallback } from 'react';

export function useAppShellModel({ copy, exportTrainingData, importTrainingData, settings, trainingPlan, updateSettings }) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        document.body.dataset.theme = settings.theme;
        document.body.dataset.font = settings.fontScale;
        document.body.dataset.focus = settings.focusMode ? 'on' : 'off';
        document.body.dataset.language = settings.language;
        document.documentElement.lang = settings.language;
    }, [settings]);

    const openSettings = useCallback(() => setSettingsOpen(true), []);
    const closeSettings = useCallback(() => setSettingsOpen(false), []);
    const toggleTheme = useCallback(() => {
        updateSettings({ theme: settings.theme === 'serika-dark' ? 'serika-light' : 'serika-dark' });
    }, [settings.theme, updateSettings]);
    const hasTrainingPlan = Boolean(trainingPlan);

    const shellProps = useMemo(() => ({
        copy,
        exportTrainingData,
        hasTrainingPlan,
        importTrainingData,
        settings,
        settingsOpen
    }), [copy, exportTrainingData, hasTrainingPlan, importTrainingData, settings, settingsOpen]);

    return {
        closeSettings,
        hasTrainingPlan,
        openSettings,
        settingsOpen,
        shellProps,
        toggleTheme
    };
}
