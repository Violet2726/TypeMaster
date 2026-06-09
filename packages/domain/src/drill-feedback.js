import { buildKeyboardHotspotsFromStats } from './insights.js';

function normalizeLabel(value) {
    return String(value || '').trim().toLowerCase();
}

function uniqueLabels(values) {
    const seen = new Set();
    const result = [];

    (Array.isArray(values) ? values : []).forEach((value) => {
        const normalized = normalizeLabel(value);
        if (!normalized || seen.has(normalized)) {
            return;
        }

        seen.add(normalized);
        result.push(String(value));
    });

    return result;
}

function readCountStats(result, statsKey, topKey) {
    if (Array.isArray(result?.[statsKey]) && result[statsKey].length) {
        return result[statsKey]
            .map((item) => ({
                label: String(item?.label || '').trim(),
                count: Math.max(0, Number(item?.count || 0))
            }))
            .filter((item) => item.label && item.count > 0);
    }

    return Array.isArray(result?.[topKey])
        ? result[topKey].map((label) => ({ label, count: 1 }))
        : [];
}

function sumTargetCounts(stats, targets) {
    const targetSet = new Set((Array.isArray(targets) ? targets : []).map(normalizeLabel).filter(Boolean));
    if (!targetSet.size) {
        return 0;
    }

    return stats.reduce((sum, item) => (
        targetSet.has(normalizeLabel(item.label))
            ? sum + Number(item.count || 0)
            : sum
    ), 0);
}

function collectRemainingTargets(stats, targets, limit = 4) {
    const targetSet = new Set((Array.isArray(targets) ? targets : []).map(normalizeLabel).filter(Boolean));

    return stats
        .filter((item) => targetSet.has(normalizeLabel(item.label)))
        .slice(0, limit)
        .map((item) => item.label);
}

function buildAdaptiveDrillFeedback(session) {
    const meta = session?.sourceTextMeta || {};
    const targetChars = uniqueLabels(meta.adaptiveTargetChars);
    const targetWords = uniqueLabels(meta.adaptiveTargetWords);
    const baselineCount = Math.max(0, Number(meta.adaptiveBaselineCount || 0));

    if (!baselineCount || (!targetChars.length && !targetWords.length)) {
        return null;
    }

    const currentCharStats = readCountStats(session?.result, 'errorCharStats', 'topErrorChars');
    const currentWordStats = readCountStats(session?.result, 'errorWordStats', 'topErrorWords');
    const currentCount = sumTargetCounts(currentCharStats, targetChars) + sumTargetCounts(currentWordStats, targetWords);
    const remainingTargets = uniqueLabels([
        ...collectRemainingTargets(currentWordStats, targetWords, 3),
        ...collectRemainingTargets(currentCharStats, targetChars, 3)
    ]);
    const tone = currentCount === 0
        ? 'success'
        : baselineCount > currentCount
            ? 'progress'
            : 'stalled';

    return {
        type: 'adaptive',
        tone,
        focus: meta.adaptiveFocus || meta.template || 'speed',
        baselineCount,
        currentCount,
        delta: baselineCount - currentCount,
        remainingTargets,
        targetChars,
        targetWords
    };
}

function buildKeyboardZoneDrillFeedback(session) {
    const meta = session?.sourceTextMeta || {};
    const baselineShare = Math.max(0, Number(meta.keyboardZoneShare || 0));

    if (!meta.keyboardZone || !baselineShare) {
        return null;
    }

    const charStats = readCountStats(session?.result, 'errorCharStats', 'topErrorChars');
    const hotspots = buildKeyboardHotspotsFromStats(charStats, {
        keyboardLayout: meta.keyboardLayout || 'qwerty'
    });
    const currentZone = hotspots.zones.find((zone) => zone.id === meta.keyboardZone) || {
        id: meta.keyboardZone,
        count: 0,
        share: 0,
        chars: []
    };
    const tone = currentZone.share === 0
        ? 'success'
        : baselineShare > currentZone.share
            ? 'progress'
            : 'stalled';

    return {
        type: 'keyboard-zone',
        tone,
        zoneId: meta.keyboardZone,
        baselineShare,
        currentShare: currentZone.share,
        delta: baselineShare - currentZone.share,
        totalErrors: hotspots.total,
        remainingTargets: currentZone.chars.map((item) => item.label).slice(0, 4)
    };
}

export function buildTargetedDrillFeedback(session) {
    const generatedBy = session?.sourceTextMeta?.generatedBy;

    if (generatedBy === 'adaptive') {
        return buildAdaptiveDrillFeedback(session);
    }

    if (generatedBy === 'keyboard-zone') {
        return buildKeyboardZoneDrillFeedback(session);
    }

    return null;
}
