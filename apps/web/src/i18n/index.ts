import { LANGUAGE_META } from './language-meta';
import { zhCNMessages } from './messages/zh-CN';
import { enUSMessages } from './messages/en-US';

const COPY = {
    'zh-CN': zhCNMessages,
    'en-US': enUSMessages
};

export function getLanguageMeta(language = 'zh-CN') {
    return LANGUAGE_META[language] || LANGUAGE_META['zh-CN'];
}

export function getSupportedLanguages() {
    return Object.values(LANGUAGE_META);
}

export function getCopy(language = 'zh-CN') {
    return COPY[language] || COPY['zh-CN'];
}

export function getErrorMessage(language = 'zh-CN', code = 'unknown') {
    const copy = getCopy(language);
    return copy.errors[code] || copy.errors.unknown;
}

export function formatDateTime(value, language = 'zh-CN') {
    if (!value) return getCopy(language).common.emptyValue;
    return new Intl.DateTimeFormat(language, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
}

export function formatShortDate(value, language = 'zh-CN') {
    if (!value) return getCopy(language).common.emptyValue;
    return new Intl.DateTimeFormat(language, {
        month: 'short',
        day: 'numeric'
    }).format(new Date(value));
}

export function formatPercent(value) {
    return `${Math.round(Number(value || 0))}%`;
}

export function formatDurationLabel(seconds = 0, language = 'zh-CN') {
    const normalizedSeconds = Math.max(0, Math.round(Number(seconds || 0)));
    return language?.startsWith('zh') ? `${normalizedSeconds} 秒` : `${normalizedSeconds}s`;
}

export function getInlineSeparator(language = 'zh-CN') {
    return language === 'en-US' ? ' · ' : ' / ';
}
