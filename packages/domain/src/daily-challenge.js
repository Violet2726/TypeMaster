/**
 * Daily Challenge System v2
 */

export function dateToSeed(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) { h = ((h << 5) - h) + dateStr.charCodeAt(i); h = h & h; }
  return Math.abs(h);
}

export function seededRandom(seed) {
  let t = seed + 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function getTodayString() {
  const n = new Date();
  return n.getFullYear() + "-" + String(n.getMonth()+1).padStart(2,"0") + "-" + String(n.getDate()).padStart(2,"0");
}

const CHALLENGE_TYPES = [
  { id: "speed_run", name: "Speed Run", nameZh: "\u901f\u901f\u901a\u5173", desc: "Enemy speed +30%, score x2", speedMod: 1.3, scoreMod: 2.0, wordFilter: null, icon: "\u26A1" },
  { id: "precision", name: "Precision", nameZh: "\u7cbe\u51c6\u6d4b\u8bd5", desc: "Only tanks and bosses", speedMod: 0.8, scoreMod: 1.5, wordFilter: "long", icon: "\uD83C\uDFAF" },
  { id: "swarm", name: "Swarm", nameZh: "\u866b\u7fa4\u88ad\u51fb", desc: "Mass normal enemies, score x1.5", speedMod: 1.1, scoreMod: 1.5, wordFilter: "short", icon: "\uD83D\uDC1B" },
  { id: "boss_rush", name: "Boss Rush", nameZh: "Boss\u6311\u6218", desc: "Only bosses, score x3", speedMod: 1.0, scoreMod: 3.0, wordFilter: "boss", icon: "\uD83D\uDC79" },
  { id: "long_words", name: "Long Words", nameZh: "\u957f\u8bcd\u6311\u6218", desc: "8+ letter words, score x2", speedMod: 0.9, scoreMod: 2.0, wordFilter: "long", icon: "\uD83D\uDCDD" },
  { id: "marathon", name: "Marathon", nameZh: "\u9a6c\u62c9\u677e", desc: "20 waves, score x1.5", speedMod: 1.0, scoreMod: 1.5, wordFilter: null, icon: "\uD83C\uDFC3" },
  { id: "combo_master", name: "Combo Master", nameZh: "\u8fde\u51fb\u5927\u5e08", desc: "High combo bonus, score x2", speedMod: 1.0, scoreMod: 2.0, wordFilter: null, icon: "\uD83D\uDD25" },
];

export function getDailyChallenge(dateStr) {
  const ds = dateStr || getTodayString(); const seed = dateToSeed(ds); const type = CHALLENGE_TYPES[seed % CHALLENGE_TYPES.length];
  const rng = seededRandom(seed); const extraSpeedMod = 0.9 + rng * 0.2;
  return { id: "daily-" + ds, date: ds, type: type.id, name: type.name, nameZh: type.nameZh, desc: type.desc, icon: type.icon, speedMod: type.speedMod * extraSpeedMod, scoreMod: type.scoreMod, wordFilter: type.wordFilter, seed };
}

export function filterWordForChallenge(word, filter) {
  if (!filter) return true; if (filter === "short") return word.length <= 4; if (filter === "long") return word.length >= 6; return true;
}

const DK = "typing-raid-daily-scores"; const SK = "typing-raid-daily-streak";

export function loadDailyScores() { try { const r = localStorage.getItem(DK); if (r) return JSON.parse(r); } catch {} return {}; }

export function saveDailyScore(dateStr, score) { const s = loadDailyScores(); if (score > (s[dateStr]||0)) s[dateStr] = score; try { localStorage.setItem(DK, JSON.stringify(s)); } catch {} return s[dateStr]; }

export function getDailyBestScore(dateStr) { return loadDailyScores()[dateStr] || 0; }

export function loadStreak() { try { const r = localStorage.getItem(SK); if (r) return JSON.parse(r); } catch {} return { current: 0, best: 0, lastDate: null }; }

export function updateStreak(dateStr, score) {
  const s = loadStreak(); if (score <= 0 || s.lastDate === dateStr) return s;
  const y = new Date(); y.setDate(y.getDate()-1); const ys = y.getFullYear()+"-"+String(y.getMonth()+1).padStart(2,"0")+"-"+String(y.getDate()).padStart(2,"0");
  s.current = s.lastDate === ys ? s.current + 1 : 1; s.best = Math.max(s.best, s.current); s.lastDate = dateStr;
  try { localStorage.setItem(SK, JSON.stringify(s)); } catch {} return s;
}

export function getDailyHistory() { const scores = loadDailyScores(); return Object.keys(scores).sort().reverse().slice(0,7).map(d => ({ date: d, score: scores[d], challenge: getDailyChallenge(d) })); }