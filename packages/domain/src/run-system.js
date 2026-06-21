/**
 * Run System - Roguelike 关卡流核心
 *
 * 将 Typing Raid 从无限波次生存重塑为结构化闯关冒险。
 * 每局游戏由3幕组成，玩家在分叉路径中做出选择。
 */

export const NODE_TYPES = {
  combat: { id: "combat", nameZh: "战斗", icon: "⚔", color: "#0a84ff", glow: "rgba(10,132,255,0.5)" },
  elite: { id: "elite", nameZh: "精英", icon: "💀", color: "#ff9f0a", glow: "rgba(255,159,10,0.5)" },
  boss: { id: "boss", nameZh: "Boss", icon: "👑", color: "#ff453a", glow: "rgba(255,69,58,0.5)" },
  shop: { id: "shop", nameZh: "商店", icon: "🛒", color: "#ffd60a", glow: "rgba(255,214,10,0.5)" },
  rest: { id: "rest", nameZh: "休息", icon: "🏕", color: "#34c759", glow: "rgba(52,199,89,0.5)" },
  event: { id: "event", nameZh: "事件", icon: "❓", color: "#bf5af2", glow: "rgba(191,90,242,0.5)" },
};

export const UPGRADE_DEFS = [
  { id: "double_score", nameZh: "双倍得分", description: "所有得分 x2", icon: "✨", color: "#ffd60a", cost: 80, rarity: "common", stackable: true, maxStack: 3 },
  { id: "slow_field", nameZh: "减速力场", description: "敌人移动速度 -30%", icon: "❄", color: "#64d2ff", cost: 60, rarity: "common", stackable: true, maxStack: 3 },
  { id: "extra_life", nameZh: "额外生命", description: "最大生命 +1", icon: "❤", color: "#ff453a", cost: 100, rarity: "uncommon", stackable: true, maxStack: 3 },
  { id: "combo_shield", nameZh: "连击护盾", description: "连击 >=10 时抵挡一次伤害", icon: "🛡", color: "#0a84ff", cost: 120, rarity: "uncommon", stackable: false },
  { id: "chain_lightning", nameZh: "连锁闪电", description: "消灭敌人时对最近敌人造成1点伤害", icon: "⚡", color: "#ffd60a", cost: 150, rarity: "rare", stackable: false },
  { id: "vampiric_keys", nameZh: "吸血按键", description: "完美波次恢复1生命", icon: "🧛", color: "#ff453a", cost: 130, rarity: "rare", stackable: false },
  { id: "word_reveal", nameZh: "词汇预览", description: "显示下一波敌人词汇", icon: "👁", color: "#bf5af2", cost: 70, rarity: "common", stackable: false },
  { id: "coin_magnet", nameZh: "金币磁铁", description: "击杀金币 +50%", icon: "🧲", color: "#ffd60a", cost: 90, rarity: "uncommon", stackable: true, maxStack: 2 },
  { id: "critical_strike", nameZh: "暴击一击", description: "15% 概率造成双倍伤害", icon: "💥", color: "#ff9f0a", cost: 140, rarity: "rare", stackable: true, maxStack: 2 },
  { id: "time_warp", nameZh: "时间扭曲", description: "Boss战开始时冻结敌人3秒", icon: "⌛", color: "#bf5af2", cost: 160, rarity: "rare", stackable: false },
];

export const ACT_CONFIG = [
  { act: 1, nameZh: "觉醒之域", nodeCount: 7, combatCount: 3, eliteCount: 0, shopCount: 1, restCount: 1, eventCount: 0, bossHp: 8, bossNameZh: "守门者", difficultyBase: 0.3, wordLengthRange: [2, 5] },
  { act: 2, nameZh: "深渊回廊", nodeCount: 8, combatCount: 3, eliteCount: 1, shopCount: 1, restCount: 1, eventCount: 0, bossHp: 14, bossNameZh: "深渊守望者", difficultyBase: 0.55, wordLengthRange: [3, 7] },
  { act: 3, nameZh: "虚空终焉", nodeCount: 9, combatCount: 3, eliteCount: 2, shopCount: 1, restCount: 1, eventCount: 0, bossHp: 22, bossNameZh: "虚空之主", difficultyBase: 0.8, wordLengthRange: [4, 10] },
];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateActNodes(actConfig, rng) {
  const { nodeCount, combatCount, eliteCount, shopCount, restCount, eventCount, act } = actConfig;
  const nodes = [];
  let nodeId = 0;
  nodes.push({ id: "act" + act + "-node-" + nodeId++, type: "combat", row: 0, col: 0, connections: [], act, completed: false, current: false, available: false });
  const middleRows = nodeCount - 2;
  const typePool = [];
  for (let i = 0; i < combatCount; i++) typePool.push("combat");
  for (let i = 0; i < eliteCount; i++) typePool.push("elite");
  for (let i = 0; i < shopCount; i++) typePool.push("shop");
  for (let i = 0; i < restCount; i++) typePool.push("rest");
  for (let i = 0; i < eventCount; i++) typePool.push("event");
  while (typePool.length < middleRows) typePool.push("combat");
  const shuffledTypes = shuffle(typePool, rng);
  for (let row = 1; row <= middleRows; row++) {
    const width = row <= 2 ? 1 : Math.min(3, 1 + Math.floor(rng() * 3));
    const type = shuffledTypes[row - 1] || "combat";
    for (let c = 0; c < width; c++) {
      const nodeType = c === 0 ? type : (rng() < 0.5 ? "combat" : "event");
      nodes.push({ id: "act" + act + "-node-" + nodeId++, type: nodeType, row, col: c - (width - 1) / 2, connections: [], act, completed: false, current: false, available: false });
    }
  }
  nodes.push({ id: "act" + act + "-node-" + nodeId++, type: "boss", row: nodeCount - 1, col: 0, connections: [], act, completed: false, current: false, available: false });
  for (let row = 0; row < nodeCount - 1; row++) {
    const currentRow = nodes.filter(n => n.row === row);
    const nextRow = nodes.filter(n => n.row === row + 1);
    for (const node of currentRow) {
      if (nextRow.length === 0) continue;
      const sorted = [...nextRow].sort((a, b) => Math.abs(a.col - node.col) - Math.abs(b.col - node.col));
      node.connections.push(sorted[0].id);
      if (sorted.length > 1 && rng() < 0.5) node.connections.push(sorted[1].id);
    }
    for (const next of nextRow) {
      const hasIncoming = currentRow.some(n => n.connections.includes(next.id));
      if (!hasIncoming && currentRow.length > 0) {
        const closest = [...currentRow].sort((a, b) => Math.abs(a.col - next.col) - Math.abs(b.col - next.col))[0];
        closest.connections.push(next.id);
      }
    }
  }
  nodes[0].current = true;
  nodes[0].completed = true;
  for (const connId of nodes[0].connections) {
    const n = nodes.find(nd => nd.id === connId);
    if (n) n.available = true;
  }
  return nodes;
}

export function generateRun(seed) {
  const rng = seededRandom(seed || Date.now());
  const acts = ACT_CONFIG.map(cfg => ({ config: cfg, nodes: generateActNodes(cfg, rng) }));
  return {
    id: "run-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    seed: seed || Date.now(),
    currentAct: 0,
    currentNodeId: acts[0].nodes[0].id,
    acts, coins: 0, upgrades: [], maxLives: 5, lives: 5,
    totalScore: 0, totalKills: 0, startTime: Date.now(),
    completed: false, victory: false,
  };
}

export function getCurrentActNodes(run) { return run.acts[run.currentAct] ? run.acts[run.currentAct].nodes : []; }

export function getCurrentNode(run) {
  const nodes = getCurrentActNodes(run);
  return nodes.find(n => n.id === run.currentNodeId) || nodes[0];
}

export function getAvailableChoices(run) {
  const current = getCurrentNode(run);
  if (!current) return [];
  const nodes = getCurrentActNodes(run);
  return current.connections.map(id => nodes.find(n => n.id === id)).filter(Boolean);
}

export function selectNode(run, nodeId) {
  const available = getAvailableChoices(run);
  if (!available.some(n => n.id === nodeId)) return run;
  const nodes = getCurrentActNodes(run);
  const newNodes = nodes.map(n => {
    if (n.id === run.currentNodeId) return { ...n, current: false };
    if (n.id === nodeId) return { ...n, current: true, available: false };
    return { ...n, available: false };
  });
  const selected = newNodes.find(n => n.id === nodeId);
  if (selected) {
    for (const connId of selected.connections) {
      const n = newNodes.find(nd => nd.id === connId);
      if (n) n.available = true;
    }
  }
  const newActs = [...run.acts];
  newActs[run.currentAct] = { ...newActs[run.currentAct], nodes: newNodes };
  return { ...run, currentNodeId: nodeId, acts: newActs };
}

export function completeCurrentNode(run, result) {
  result = result || {};
  const nodes = getCurrentActNodes(run);
  const newNodes = nodes.map(n => {
    if (n.id === run.currentNodeId) return { ...n, completed: true, current: false };
    return n;
  });
  const current = newNodes.find(n => n.id === run.currentNodeId);
  if (current) {
    for (const connId of current.connections) {
      const n = newNodes.find(nd => nd.id === connId);
      if (n) n.available = true;
    }
  }
  const newActs = [...run.acts];
  newActs[run.currentAct] = { ...newActs[run.currentAct], nodes: newNodes };
  return { ...run, acts: newActs, coins: run.coins + (result.coinsEarned || 0), totalScore: run.totalScore + (result.score || 0), totalKills: run.totalKills + (result.kills || 0) };
}

export function advanceToNextAct(run) {
  const nextAct = run.currentAct + 1;
  if (nextAct >= run.acts.length) return { ...run, completed: true, victory: true };
  const newRun = { ...run, currentAct: nextAct };
  const nodes = getCurrentActNodes(newRun);
  if (nodes.length > 0) {
    newRun.currentNodeId = nodes[0].id;
    const newNodes = nodes.map(n => n.id === nodes[0].id ? { ...n, current: true, completed: true, available: false } : n);
    for (const connId of nodes[0].connections) {
      const n = newNodes.find(nd => nd.id === connId);
      if (n) n.available = true;
    }
    const newActs = [...newRun.acts];
    newActs[nextAct] = { ...newActs[nextAct], nodes: newNodes };
    newRun.acts = newActs;
  }
  return newRun;
}

export function getShopOffers(run, rng) {
  const rand = rng || Math.random;
  const owned = new Map(run.upgrades.map(u => [u.id, u.stacks]));
  const available = UPGRADE_DEFS.filter(u => {
    const stacks = owned.get(u.id) || 0;
    return !u.maxStack || stacks < u.maxStack;
  });
  const shuffled = [...available].sort(() => rand() - 0.5);
  return shuffled.slice(0, 4).map(u => ({ ...u, currentStacks: owned.get(u.id) || 0 }));
}

export function purchaseUpgrade(run, upgradeId) {
  const def = UPGRADE_DEFS.find(u => u.id === upgradeId);
  if (!def) return { run, success: false, reason: "not_found" };
  if (run.coins < def.cost) return { run, success: false, reason: "insufficient_coins" };
  const existing = run.upgrades.find(u => u.id === upgradeId);
  if (existing && def.maxStack && existing.stacks >= def.maxStack) return { run, success: false, reason: "max_stacks" };
  let newUpgrades;
  if (existing) {
    newUpgrades = run.upgrades.map(u => u.id === upgradeId ? { ...u, stacks: u.stacks + 1 } : u);
  } else {
    newUpgrades = [...run.upgrades, { id: upgradeId, stacks: 1 }];
  }
  return { run: { ...run, coins: run.coins - def.cost, upgrades: newUpgrades }, success: true };
}

export function restAction(run, choice) {
  if (choice === "heal") {
    const healAmount = Math.ceil(run.maxLives * 0.3);
    return { ...run, lives: Math.min(run.maxLives, run.lives + healAmount) };
  }
  if (choice === "upgrade" && run.upgrades.length > 0) {
    const stackable = run.upgrades.filter(u => {
      const def = UPGRADE_DEFS.find(d => d.id === u.id);
      return def && def.stackable && (!def.maxStack || u.stacks < def.maxStack);
    });
    if (stackable.length > 0) {
      const target = stackable[Math.floor(Math.random() * stackable.length)];
      return { ...run, upgrades: run.upgrades.map(u => u.id === target.id ? { ...u, stacks: u.stacks + 1 } : u) };
    }
  }
  return run;
}

export const EVENTS = [
  { id: "mysterious_fountain", nameZh: "神秘喷泉", description: "你发现了一座闪烁的喷泉...", choices: [
    { labelZh: "饮下泉水", effect: "heal", value: 2, description: "恢复2生命" },
    { labelZh: "投入金币", effect: "coin", value: -20, description: "失去20金币，获得一个随机升级", giveUpgrade: true },
  ]},
  { id: "ancient_altar", nameZh: "远古祭坛", description: "一座远古祭坛散发着微光...", choices: [
    { labelZh: "献祭生命", effect: "heal", value: -1, description: "失去1生命，获得100金币", giveCoins: 100 },
    { labelZh: "祈祷", effect: "coin", value: 30, description: "获得30金币" },
  ]},
  { id: "wandering_merchant", nameZh: "流浪商人", description: "一位神秘的商人出现了...", choices: [
    { labelZh: "交易", effect: "coin", value: -50, description: "花费50金币，获得一个稀有升级", giveUpgrade: true, rarityFilter: "rare" },
    { labelZh: "离开", effect: "coin", value: 10, description: "获得10金币" },
  ]},
];

export function processEvent(run, eventDef, choiceIndex) {
  const choice = eventDef.choices[choiceIndex];
  if (!choice) return run;
  let newRun = { ...run };
  if (choice.effect === "heal") newRun.lives = Math.max(1, Math.min(newRun.maxLives, newRun.lives + choice.value));
  if (choice.giveCoins) newRun.coins += choice.giveCoins;
  if (choice.effect === "coin") newRun.coins = Math.max(0, newRun.coins + choice.value);
  if (choice.giveUpgrade) {
    const pool = UPGRADE_DEFS.filter(u => {
      if (choice.rarityFilter && u.rarity !== choice.rarityFilter) return false;
      const existing = newRun.upgrades.find(e => e.id === u.id);
      return !existing || !u.maxStack || existing.stacks < u.maxStack;
    });
    if (pool.length > 0) {
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const existing = newRun.upgrades.find(u => u.id === picked.id);
      if (existing) {
        newRun.upgrades = newRun.upgrades.map(u => u.id === picked.id ? { ...u, stacks: u.stacks + 1 } : u);
      } else {
        newRun.upgrades = [...newRun.upgrades, { id: picked.id, stacks: 1 }];
      }
    }
  }
  return newRun;
}

export function getEncounterConfig(node, actConfig) {
  const base = actConfig.difficultyBase;
  const wordRange = actConfig.wordLengthRange;
  switch (node.type) {
    case "combat":
      return { waveCount: 2 + Math.floor(base * 2), difficultyMod: base, wordLengthRange: wordRange, enemyCountMod: 1.0, rewardCoins: 15 + Math.floor(base * 15) };
    case "elite":
      return { waveCount: 3 + Math.floor(base * 2), difficultyMod: base * 1.3, wordLengthRange: [wordRange[0] + 1, wordRange[1] + 2], enemyCountMod: 1.3, rewardCoins: 35 + Math.floor(base * 20) };
    case "boss":
      return { waveCount: 1, difficultyMod: base * 1.5, wordLengthRange: [wordRange[0] + 2, wordRange[1] + 3], enemyCountMod: 1.0, isBoss: true, bossHp: actConfig.bossHp, bossNameZh: actConfig.bossNameZh, rewardCoins: 60 + Math.floor(base * 30) };
    default:
      return { waveCount: 2, difficultyMod: base, wordLengthRange: wordRange, enemyCountMod: 1.0, rewardCoins: 15 };
  }
}

export function getRunStats(run) {
  const elapsed = Date.now() - run.startTime;
  const completedNodes = run.acts.flatMap(a => a.nodes).filter(n => n.completed).length;
  const totalNodes = run.acts.flatMap(a => a.nodes).length;
  return {
    elapsed, completedNodes, totalNodes, coins: run.coins, lives: run.lives, maxLives: run.maxLives,
    upgradeCount: run.upgrades.length, totalScore: run.totalScore, totalKills: run.totalKills,
    currentAct: run.currentAct + 1, totalActs: run.acts.length,
    actName: run.acts[run.currentAct] ? run.acts[run.currentAct].config.nameZh : "", completed: run.completed, victory: run.victory,
  };
}