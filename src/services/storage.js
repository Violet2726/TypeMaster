/**
 * 本地存储服务。
 *
 * 该模块只和 localStorage 打交道，不参与业务判断。
 * 它的目标是让：
 * - 用户设置
 * - 最近练习历史
 * - 教练建议缓存
 *
 * 都能以统一方式读写，并带上安全兜底。
 */
import { DEFAULT_CONFIG, DEFAULT_SETTINGS, createBuiltinDraft } from '../engine';

const SETTINGS_KEY = 'typemaster:v2:settings';
const SESSIONS_KEY = 'typemaster:v2:sessions';
const COACH_ADVICES_KEY = 'typemaster:v2:coach-advices';
const SESSION_LIMIT = 50;

/**
 * 读取 JSON 并在异常时回退默认值。
 */
function readJson(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.warn(`Failed to read ${key}`, error);
        return fallback;
    }
}

/**
 * 写入 JSON 并吞掉本地存储失败异常。
 * 这样不会因为 storage 限制导致整个页面崩溃。
 */
function writeJson(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Failed to write ${key}`, error);
    }
}

/**
 * 读取用户设置，并把缺失字段和默认值合并。
 */
export function loadSettings() {
    const saved = readJson(SETTINGS_KEY, null);
    return {
        ...DEFAULT_SETTINGS,
        ...(saved || {}),
        lastConfig: {
            ...DEFAULT_CONFIG,
            ...((saved && saved.lastConfig) || {})
        }
    };
}

export function saveSettings(settings) {
    writeJson(SETTINGS_KEY, settings);
}

export function loadSessions() {
    return readJson(SESSIONS_KEY, []);
}

export function saveSessions(sessions) {
    writeJson(SESSIONS_KEY, sessions.slice(0, SESSION_LIMIT));
}

/**
 * 追加一条练习记录，并裁剪为最近 50 条。
 */
export function appendSession(session) {
    const current = loadSessions();
    const next = [session, ...current].slice(0, SESSION_LIMIT);
    saveSessions(next);
    return next;
}

/**
 * 更新某条历史记录，主要用于回填 coachAdviceId。
 */
export function updateSession(sessionId, updater) {
    const next = loadSessions().map((session) => (
        session.id === sessionId ? updater(session) : session
    ));
    saveSessions(next);
    return next;
}

export function loadCoachAdvices() {
    return readJson(COACH_ADVICES_KEY, []);
}

export function saveCoachAdvices(records) {
    writeJson(COACH_ADVICES_KEY, records.slice(0, SESSION_LIMIT));
}

/**
 * 追加一条教练建议缓存。
 */
export function appendCoachAdvice(record) {
    const next = [record, ...loadCoachAdvices()].slice(0, SESSION_LIMIT);
    saveCoachAdvices(next);
    return next;
}

/**
 * 根据 session id 查询对应教练建议。
 */
export function getCoachAdviceBySessionId(sessionId) {
    return loadCoachAdvices().find((record) => record.sessionId === sessionId) || null;
}

/**
 * 生成应用初始草稿。
 * 当前统一回到内置词库模式，保证首屏无 AI 依赖。
 */
export function createInitialDraft(config, options = {}) {
    return createBuiltinDraft(config || DEFAULT_CONFIG, options);
}
