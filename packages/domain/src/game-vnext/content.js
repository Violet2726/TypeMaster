import { commonWords } from '../data/words.js';

export const GAME_VERSION = 'typerift-v1';
export const GAME_PHASES = {
    idle: 'idle',
    playing: 'playing',
    paused: 'paused',
    gameover: 'gameover'
};

export const GAME_MODES = ['expedition', 'daily-anomaly', 'first-descent'];

export const GAME_MODE_DEFINITIONS = {
    expedition: {
        id: 'expedition',
        name: 'Expedition',
        nameZh: '远征',
        durationSeconds: 960,
        extractEveryArea: true,
        summary: '五个区域的完整 Roguelite 生存远征。'
    },
    'daily-anomaly': {
        id: 'daily-anomaly',
        name: 'Daily Anomaly',
        nameZh: '每日异象',
        durationSeconds: 900,
        extractEveryArea: true,
        summary: '每日固定 seed、固定异变和排行榜入口。'
    },
    'first-descent': {
        id: 'first-descent',
        name: 'First Descent',
        nameZh: '首次下潜',
        durationSeconds: 360,
        extractEveryArea: false,
        summary: '六分钟新手引导局，建立第一份 TypeRift 样本。'
    }
};

export const AREAS = [
    { id: 'neon-archive', name: 'Neon Archive', nameZh: '霓虹档案馆', palette: ['#64d2ff', '#34c759', '#f7f7ff'] },
    { id: 'glass-mire', name: 'Glass Mire', nameZh: '玻璃沼泽', palette: ['#7ee198', '#ff9f0a', '#effff8'] },
    { id: 'signal-foundry', name: 'Signal Foundry', nameZh: '信号铸炉', palette: ['#ff9f0a', '#ff453a', '#fff4d8'] },
    { id: 'paper-moon', name: 'Paper Moon', nameZh: '纸月庭', palette: ['#f7f2df', '#bf8cff', '#ffffff'] },
    { id: 'black-terminal', name: 'Black Terminal', nameZh: '黑色终端', palette: ['#ff2d55', '#64d2ff', '#f2f6ff'] }
];

export const ENEMY_TYPES = {
    spark: { id: 'spark', name: 'Spark', nameZh: '火花', role: 'swift', hp: 1, speed: 0.095, score: 18, wordRange: [2, 4], color: '#64d2ff' },
    shard: { id: 'shard', name: 'Shard', nameZh: '碎晶', role: 'armor', hp: 2, speed: 0.063, score: 32, wordRange: [4, 7], color: '#a6f0ff' },
    mirror: { id: 'mirror', name: 'Mirror', nameZh: '镜像', role: 'confuse', hp: 1, speed: 0.073, score: 28, wordRange: [4, 6], color: '#bf8cff' },
    static: { id: 'static', name: 'Static', nameZh: '静电', role: 'punctuation', hp: 1, speed: 0.068, score: 36, wordRange: [2, 6], color: '#ffd60a' },
    husk: { id: 'husk', name: 'Husk', nameZh: '空壳', role: 'heavy', hp: 3, speed: 0.045, score: 54, wordRange: [6, 9], color: '#8e8e93' },
    siren: { id: 'siren', name: 'Siren', nameZh: '鸣妖', role: 'decoy', hp: 1, speed: 0.082, score: 34, wordRange: [4, 7], color: '#ff6b7a' },
    prism: { id: 'prism', name: 'Prism', nameZh: '棱镜', role: 'shield', hp: 1, shield: 1, speed: 0.058, score: 42, wordRange: [4, 8], color: '#7ee198' },
    stitch: { id: 'stitch', name: 'Stitch', nameZh: '缝线', role: 'combo', hp: 2, speed: 0.066, score: 44, wordRange: [5, 8], color: '#ff9f0a' },
    cipher: { id: 'cipher', name: 'Cipher', nameZh: '密文', role: 'number', hp: 1, speed: 0.072, score: 40, wordRange: [3, 6], color: '#5ac8fa' },
    anchor: { id: 'anchor', name: 'Anchor', nameZh: '锚点', role: 'gate', hp: 4, speed: 0.034, score: 72, wordRange: [7, 10], color: '#c7c7cc' },
    chorus: { id: 'chorus', name: 'Chorus', nameZh: '合声', role: 'swarm', hp: 1, speed: 0.078, score: 30, wordRange: [4, 7], color: '#f6d365' },
    omen: { id: 'omen', name: 'Omen', nameZh: '预兆', role: 'elite-seed', hp: 2, speed: 0.061, score: 50, wordRange: [5, 8], color: '#ff2d55' }
};

export const ELITE_TYPES = [
    { id: 'glass-knight', name: 'Glass Knight', nameZh: '玻璃骑士', baseType: 'shard', hpBonus: 2, speedBonus: 0.88, scoreBonus: 90 },
    { id: 'signal-witch', name: 'Signal Witch', nameZh: '信号女巫', baseType: 'siren', hpBonus: 1, speedBonus: 1.05, scoreBonus: 80 },
    { id: 'paper-warden', name: 'Paper Warden', nameZh: '纸月守卫', baseType: 'prism', hpBonus: 2, speedBonus: 0.86, scoreBonus: 92 },
    { id: 'terminal-saint', name: 'Terminal Saint', nameZh: '终端圣徒', baseType: 'cipher', hpBonus: 2, speedBonus: 1, scoreBonus: 100 },
    { id: 'black-key', name: 'Black Key', nameZh: '黑键', baseType: 'anchor', hpBonus: 3, speedBonus: 0.82, scoreBonus: 120 }
];

export const BOSS_TYPES = [
    { id: 'archive-seraph', name: 'Archive Seraph', nameZh: '档案炽天使', areaId: 'neon-archive', hp: 5, color: '#64d2ff' },
    { id: 'mire-oracle', name: 'Mire Oracle', nameZh: '沼泽神谕', areaId: 'glass-mire', hp: 6, color: '#7ee198' },
    { id: 'foundry-heart', name: 'Foundry Heart', nameZh: '铸炉之心', areaId: 'signal-foundry', hp: 7, color: '#ff9f0a' },
    { id: 'paper-regent', name: 'Paper Regent', nameZh: '纸月摄政', areaId: 'paper-moon', hp: 7, color: '#bf8cff' },
    { id: 'terminal-eclipse', name: 'Terminal Eclipse', nameZh: '终端蚀日', areaId: 'black-terminal', hp: 9, color: '#ff2d55' }
];

export const UPGRADES = [
    { id: 'pulse-lance', category: 'weapon', rarity: 'common', name: 'Pulse Lance', nameZh: '脉冲长矛', summary: '击杀得分 +12%，每 6 次击杀触发穿透清除。', effect: { scoreMultiplier: 0.12, pierceEvery: 6 } },
    { id: 'echo-blade', category: 'weapon', rarity: 'common', name: 'Echo Blade', nameZh: '回声刃', summary: '连击收益 +18%。', effect: { comboScore: 0.18 } },
    { id: 'glass-orbit', category: 'weapon', rarity: 'rare', name: 'Glass Orbit', nameZh: '玻璃环轨', summary: '每次升级清屏边缘敌人并获得能量。', effect: { upgradeBlast: 1, energyOnUpgrade: 18 } },
    { id: 'terminal-ray', category: 'weapon', rarity: 'epic', name: 'Terminal Ray', nameZh: '终端射线', summary: '命中 Boss 阶段时额外造成一次伤害。', effect: { bossDamage: 1 } },
    { id: 'calm-buffer', category: 'relic', rarity: 'common', name: 'Calm Buffer', nameZh: '静稳缓冲', summary: '每个区域抵消一次断连错误。', effect: { errorBuffer: 1 } },
    { id: 'clean-room', category: 'relic', rarity: 'common', name: 'Clean Room', nameZh: '洁净室', summary: '准确率 96% 以上时得分 +16%。', effect: { accuracyScore: 0.16 } },
    { id: 'aegis-line', category: 'relic', rarity: 'rare', name: 'Aegis Line', nameZh: '护壁线', summary: '最大生命 +1。', effect: { maxLives: 1 } },
    { id: 'risk-engine', category: 'relic', rarity: 'rare', name: 'Risk Engine', nameZh: '风险引擎', summary: '热度越高，击杀分越高。', effect: { heatScore: 0.02 } },
    { id: 'exit-credit', category: 'relic', rarity: 'epic', name: 'Exit Credit', nameZh: '撤离筹码', summary: '撤离结算奖励 +35%。', effect: { extractScore: 0.35 } },
    { id: 'last-signal', category: 'relic', rarity: 'legendary', name: 'Last Signal', nameZh: '最后信号', summary: '首次死亡保留 1 点生命并清屏。', effect: { lastStand: 1 } },
    { id: 'weak-key-glyph', category: 'glyph', rarity: 'common', name: 'Weak-Key Glyph', nameZh: '弱键符文', summary: '弱字符目标经验 +20%。', effect: { focusXp: 0.2 } },
    { id: 'number-glyph', category: 'glyph', rarity: 'common', name: 'Number Glyph', nameZh: '数字符文', summary: '数字目标连击 +1。', effect: { numberCombo: 1 } },
    { id: 'punctuation-glyph', category: 'glyph', rarity: 'rare', name: 'Punctuation Glyph', nameZh: '标点符文', summary: '标点护盾只需一次击破。', effect: { punctuationBreak: 1 } },
    { id: 'mirror-glyph', category: 'glyph', rarity: 'rare', name: 'Mirror Glyph', nameZh: '镜面符文', summary: '镜像与诱饵敌人速度 -12%。', effect: { confuseSlow: 0.12 } },
    { id: 'boss-glyph', category: 'glyph', rarity: 'epic', name: 'Boss Glyph', nameZh: '首领符文', summary: 'Boss 击破奖励 +40%。', effect: { bossScore: 0.4 } },
    { id: 'black-terminal-key', category: 'glyph', rarity: 'legendary', name: 'Black Terminal Key', nameZh: '黑终端密钥', summary: '所有得分 +18%，敌人速度 +5%。', effect: { scoreMultiplier: 0.18, haste: 0.05 } }
];

export const DAILY_ANOMALIES = [
    { id: 'mirror-rain', name: 'Mirror Rain', nameZh: '镜雨', weights: { mirror: 4, siren: 3 }, scoreMultiplier: 1.08 },
    { id: 'cipher-bloom', name: 'Cipher Bloom', nameZh: '密文绽放', weights: { cipher: 5, static: 3 }, includeNumbers: true },
    { id: 'heavy-glass', name: 'Heavy Glass', nameZh: '重玻璃', weights: { shard: 3, husk: 3, anchor: 2 }, enemySpeed: 0.94, scoreMultiplier: 1.12 },
    { id: 'chorus-hour', name: 'Chorus Hour', nameZh: '合声时刻', weights: { chorus: 5, spark: 2 }, activeCapBonus: 2 },
    { id: 'terminal-fever', name: 'Terminal Fever', nameZh: '终端热病', weights: { omen: 4, cipher: 3 }, heatBonus: 8, scoreMultiplier: 1.16 }
];

export const GAME_COPY = {
    'zh-CN': {
        title: 'TypeRift：回声围城',
        startExpedition: '开始远征',
        startDaily: '每日异象',
        startFirst: '首次下潜',
        paused: 'TypeRift 已暂停',
        defeated: '防线崩溃',
        extracted: '成功撤离',
        victory: '蚀日终端已关闭',
        upgradeReady: '选择一次构筑升级',
        extractReady: '撤离门已开启',
        extractLocked: '当前区域尚未开放撤离',
        miss: '没有匹配目标',
        error: '期望 {expected}',
        linePressure: '边界线承压',
        codexUnlock: '图鉴更新',
        shieldBroken: '护盾击破',
        hit: '命中',
        surgeReady: '回声超载就绪',
        surgeCharging: '能量尚未充满',
        surgeOnline: '回声超载释放',
        upgradeOnline: '{name} 已上线',
        recommendationWeak: '下一局优先处理 {chars}',
        recommendationStable: '保持节奏，尝试更高热度构筑。'
    },
    'en-US': {
        title: 'TypeRift: Echo Siege',
        startExpedition: 'Start Expedition',
        startDaily: 'Daily Anomaly',
        startFirst: 'First Descent',
        paused: 'TypeRift paused',
        defeated: 'Line collapsed',
        extracted: 'Extraction complete',
        victory: 'Terminal Eclipse closed',
        upgradeReady: 'Choose an upgrade',
        extractReady: 'Extraction gate open',
        extractLocked: 'Extraction is sealed in this area',
        miss: 'No matching target',
        error: 'Expected {expected}',
        linePressure: 'Boundary under pressure',
        codexUnlock: 'Codex updated',
        shieldBroken: 'Shield broken',
        hit: 'Hit',
        surgeReady: 'Echo Surge ready',
        surgeCharging: 'Energy is still charging',
        surgeOnline: 'Echo Surge released',
        upgradeOnline: '{name} online',
        recommendationWeak: 'Prioritize {chars} next run',
        recommendationStable: 'Keep the rhythm and try a higher-heat build.'
    }
};

export function normalizeGameMode(mode) {
    return GAME_MODES.includes(mode) ? mode : 'expedition';
}

export function getGameCopy(language = 'zh-CN') {
    return GAME_COPY[language] || GAME_COPY['en-US'];
}

export function sanitizeWordPool(wordPool) {
    const pool = Array.isArray(wordPool) && wordPool.length ? wordPool : commonWords;
    const clean = pool
        .map((word) => String(word || '').trim().toLowerCase())
        .filter((word) => /^[a-z0-9?!+\-]+$/.test(word) && word.length > 1);
    return clean.length ? clean : ['go', 'cat', 'home', 'focus', 'trace', 'vector', 'steady'];
}
