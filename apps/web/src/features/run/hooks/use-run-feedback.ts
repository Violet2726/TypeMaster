'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HudFeedback } from '../components/HudOverlay';
import { feedbackDuration } from '../runtime/feedback';

/**
 * Holds the single tier-2 message currently on screen and clears it after its duration.
 * A new message always replaces the previous one, so the HUD never stacks.
 */
export function useRunFeedback() {
    const [current, setCurrent] = useState<HudFeedback | null>(null);
    const sequence = useRef(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clear = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        setCurrent(null);
    }, []);

    const push = useCallback((feedback: Omit<HudFeedback, 'id'>) => {
        if (timer.current) clearTimeout(timer.current);
        sequence.current += 1;
        setCurrent({ ...feedback, id: sequence.current });
        timer.current = setTimeout(() => {
            timer.current = null;
            setCurrent(null);
        }, feedbackDuration(feedback.kind));
    }, []);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    return { feedback: current, pushFeedback: push, clearFeedback: clear };
}
