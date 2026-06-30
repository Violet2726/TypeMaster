import { UPGRADES } from './content.js';
import { pick, seededRandom } from './rng.js';

const RARITY_WEIGHT = {
    common: 58,
    rare: 28,
    epic: 11,
    legendary: 3
};

export function getUpgradeEffects(upgrades = []) {
    const effects = {};
    upgrades.forEach((upgrade) => {
        Object.entries(upgrade.effect || {}).forEach(([key, value]) => {
            effects[key] = (effects[key] || 0) + Number(value || 0);
        });
    });
    return effects;
}

function rarityForRoll(roll) {
    let cursor = 0;
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHT)) {
        cursor += weight;
        if (roll <= cursor) return rarity;
    }
    return 'common';
}

export function serializeUpgrades(upgrades = []) {
    const stacks = {};
    upgrades.forEach((upgrade) => {
        stacks[upgrade.id] = (stacks[upgrade.id] || 0) + 1;
    });

    return Object.entries(stacks).map(([id, stack]) => {
        const definition = UPGRADES.find((upgrade) => upgrade.id === id);
        return {
            id,
            stack,
            category: definition?.category || 'relic',
            rarity: definition?.rarity || 'common',
            name: definition?.name || id,
            nameZh: definition?.nameZh || definition?.name || id,
            summary: definition?.summary || ''
        };
    });
}

export function generateUpgradeChoices(state, count = 3) {
    const rng = seededRandom(state.seed, `upgrade-${state.level}-${state.counters.upgrades}`);
    const ownedStacks = serializeUpgrades(state.upgrades);
    const selected = [];

    while (selected.length < count) {
        const rarity = rarityForRoll(rng() * 100);
        const category = pick(rng, ['weapon', 'relic', 'glyph']);
        const pool = UPGRADES.filter((upgrade) => {
            const stack = ownedStacks.find((item) => item.id === upgrade.id)?.stack || 0;
            return upgrade.category === category && stack < 3 && (
                upgrade.rarity === rarity || selected.length > 1
            );
        });
        const fallback = UPGRADES.filter((upgrade) => {
            const stack = ownedStacks.find((item) => item.id === upgrade.id)?.stack || 0;
            return stack < 3 && !selected.some((choice) => choice.id === upgrade.id);
        });
        const choice = pick(rng, pool.length ? pool : fallback);
        if (choice && !selected.some((item) => item.id === choice.id)) {
            selected.push({
                ...choice,
                stack: (ownedStacks.find((item) => item.id === choice.id)?.stack || 0) + 1
            });
        }
    }

    return selected;
}

export function chooseUpgrade(state, upgradeId) {
    if (state.phase !== 'playing' || !state.upgradeChoices?.length) return { state, events: [] };
    const choice = state.upgradeChoices.find((upgrade) => upgrade.id === upgradeId) || state.upgradeChoices[0];
    const nextUpgrades = [...state.upgrades, choice];
    const effects = getUpgradeEffects(nextUpgrades);
    const maxLives = 5 + Math.floor(effects.maxLives || 0);
    const lives = Math.min(maxLives, state.lives + Math.floor(effects.maxLives || 0));
    const blastEnemies = effects.upgradeBlast
        ? state.enemies.map((enemy) => (
            enemy.alive && enemy.y > 0.72 && !enemy.boss
                ? { ...enemy, alive: false, defeatedByUpgrade: true }
                : enemy
        ))
        : state.enemies;
    const blasted = blastEnemies.filter((enemy) => enemy.defeatedByUpgrade).length;

    return {
        state: {
            ...state,
            upgrades: nextUpgrades,
            upgradeChoices: null,
            maxLives,
            lives,
            energy: Math.min(100, state.energy + (effects.energyOnUpgrade || 0)),
            enemies: blastEnemies,
            score: state.score + blasted * 20,
            counters: { ...state.counters, upgrades: state.counters.upgrades + 1, kills: state.counters.kills + blasted },
            liveMessage: `${choice.nameZh || choice.name} online`
        },
        events: [{ type: 'upgrade_chosen', upgrade: choice }, ...(blasted ? [{ type: 'upgrade_blast', count: blasted }] : [])]
    };
}

