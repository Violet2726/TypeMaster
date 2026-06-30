import { AREAS, BOSS_TYPES, ELITE_TYPES, ENEMY_TYPES } from './content.js';
import { getUpgradeEffects } from './upgrades.js';
import { clamp, pick, seededRandom, weightedPick } from './rng.js';

const LANES = [0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.94];
const GLYPH_WORDS = ['a1', 's2', 'd3', 'j7', 'k8', 'l9', 'api?', 'v2', 'x9', 'q4', 'z0', 'run+'];
const MIRROR_PAIRS = [['form', 'from'], ['quiet', 'quite'], ['trail', 'trial'], ['angle', 'angel'], ['react', 'trace']];

export function getAreaIndex(state) {
    const segment = state.durationSeconds / AREAS.length;
    return clamp(Math.floor(state.elapsed / segment), 0, AREAS.length - 1);
}

export function buildSpawnProfile(state) {
    const effects = getUpgradeEffects(state.upgrades);
    const areaIndex = getAreaIndex(state);
    const heat = clamp(state.heat / 100, 0, 1);
    const anomaly = state.anomaly || {};
    return {
        areaIndex,
        activeCap: clamp(5 + areaIndex + Math.floor(state.level / 3) + (anomaly.activeCapBonus || 0), 5, 15),
        spawnInterval: clamp(1.28 - areaIndex * 0.11 - state.level * 0.018 - heat * 0.18, 0.42, 1.28),
        speedMultiplier: clamp(1 + areaIndex * 0.08 + heat * 0.16 + (effects.haste || 0), 0.72, 1.55) * (anomaly.enemySpeed || 1),
        eliteChance: clamp(0.04 + areaIndex * 0.018 + state.level * 0.004, 0.04, 0.18),
        bossDue: areaIndex > 0 && !state.bossSpawnedAreas.includes(AREAS[areaIndex].id)
    };
}

function enemyWeights(areaIndex, anomaly) {
    const weights = {
        spark: 5,
        shard: areaIndex >= 0 ? 2 : 0,
        mirror: areaIndex >= 1 ? 2 : 0,
        static: areaIndex >= 1 ? 2 : 0,
        husk: areaIndex >= 2 ? 2 : 0,
        siren: areaIndex >= 2 ? 2 : 0,
        prism: areaIndex >= 2 ? 2 : 0,
        stitch: areaIndex >= 3 ? 2 : 0,
        cipher: areaIndex >= 3 ? 2 : 0,
        anchor: areaIndex >= 3 ? 1 : 0,
        chorus: areaIndex >= 4 ? 2 : 0,
        omen: areaIndex >= 4 ? 2 : 0
    };

    Object.entries(anomaly?.weights || {}).forEach(([id, weight]) => {
        weights[id] = (weights[id] || 0) + Number(weight || 0);
    });

    return weights;
}

function chooseWord(rng, type, wordPool, focusChars) {
    if (type === 'cipher' || type === 'static') return pick(rng, GLYPH_WORDS);
    if (type === 'mirror') return pick(rng, MIRROR_PAIRS)[rng() > 0.5 ? 0 : 1];

    const definition = ENEMY_TYPES[type] || ENEMY_TYPES.spark;
    const [min, max] = definition.wordRange;
    const focus = Array.isArray(focusChars) ? focusChars.filter(Boolean) : [];
    const focused = focus.length
        ? wordPool.filter((word) => focus.some((char) => word.includes(char)))
        : [];
    const candidates = (focused.length && rng() > 0.45 ? focused : wordPool)
        .filter((word) => word.length >= min && word.length <= max);
    return pick(rng, candidates.length ? candidates : wordPool);
}

export function generateEnemy(state, forcedType = null) {
    const profile = buildSpawnProfile(state);
    const rng = seededRandom(state.seed, `enemy-${state.spawnIndex}-${state.elapsed.toFixed(2)}`);
    const type = forcedType || weightedPick(rng, enemyWeights(profile.areaIndex, state.anomaly));
    const definition = ENEMY_TYPES[type] || ENEMY_TYPES.spark;
    const eliteRoll = !forcedType && rng() < profile.eliteChance;
    const elite = eliteRoll ? pick(rng, ELITE_TYPES.filter((item) => item.baseType === type) || ELITE_TYPES) : null;
    const hp = definition.hp + (elite?.hpBonus || 0);
    const speed = definition.speed * profile.speedMultiplier * (elite?.speedBonus || 1);

    return {
        id: `enemy-${state.spawnIndex}`,
        type,
        archetype: type,
        eliteId: elite?.id || null,
        label: elite?.name || definition.name,
        labelZh: elite?.nameZh || definition.nameZh,
        role: definition.role,
        color: definition.color,
        word: chooseWord(rng, type, state.wordPool, state.focusChars),
        typed: '',
        xRatio: pick(rng, LANES),
        y: -0.08 - rng() * 0.1,
        hp,
        maxHp: hp,
        shield: definition.shield || 0,
        speed,
        score: definition.score + (elite?.scoreBonus || 0),
        alive: true,
        leaked: false,
        elite: Boolean(elite),
        boss: false
    };
}

export function generateBoss(state) {
    const area = AREAS[getAreaIndex(state)];
    const definition = BOSS_TYPES.find((boss) => boss.areaId === area.id) || BOSS_TYPES[0];
    const rng = seededRandom(state.seed, `boss-${area.id}`);
    const word = chooseWord(rng, 'anchor', state.wordPool, state.focusChars);

    return {
        id: `boss-${area.id}`,
        type: 'boss',
        archetype: definition.id,
        label: definition.name,
        labelZh: definition.nameZh,
        role: 'boss',
        color: definition.color,
        word,
        typed: '',
        xRatio: 0.5,
        y: -0.14,
        hp: definition.hp,
        maxHp: definition.hp,
        shield: 0,
        speed: 0.022 + getAreaIndex(state) * 0.002,
        score: 350 + getAreaIndex(state) * 100,
        alive: true,
        leaked: false,
        elite: true,
        boss: true,
        bossId: definition.id,
        phase: 1
    };
}

