/**
 * Boss Battle System
 * Transforms Boss fights to cinematic multi-phase battles.
 */

export const BOSS_PHASES = [
  { name: "Guardian", nameZh: "守护者", hpThreshold: 1.0, speedMult: 1.0, wordRange: [5, 7], color: "#3b82f6", shieldActive: false, weakPointActive: false, counterInterval: 0, counterDamage: 0, descriptionZh: "Boss以稳定攻击守护自身。" },
  { name: "Shield Bearer", nameZh: "持盾者", hpThreshold: 0.6, speedMult: 1.15, wordRange: [6, 8], color: "#f59e0b", shieldActive: true, shieldWords: 2, weakPointActive: false, counterInterval: 0, counterDamage: 0, descriptionZh: "Boss举起护盾。输入护盾词破防。" },
  { name: "Berserker", nameZh: "狂战士", hpThreshold: 0.3, speedMult: 1.35, wordRange: [7, 10], color: "#ef4444", shieldActive: false, weakPointActive: true, weakPointDuration: 3.0, weakPointCooldown: 5.0, weakPointDamageMult: 3.0, counterInterval: 4.0, counterDamage: 1, descriptionZh: "Boss暴露弱点,同时发动反击!" },
];

export function getBossBattlePhase(hpRatio) {
  for (let i = BOSS_PHASES.length - 1; i >= 0; i--) {
    if (hpRatio <= BOSS_PHASES[i].hpThreshold) return i;
  }
  return 0;
}

export class BossBattleState {
  constructor() { this.phase = 0; this.shieldHp = 0; this.shieldMaxHp = 0; this.weakPointActive = false; this.weakPointTimer = 0; this.weakPointCooldown = 0; this.counterTimer = 0; this.shieldBreakPending = false; this.phaseTransitioning = false; this.phaseTransitionTimer = 0; }
  reset() { this.phase = 0; this.shieldHp = 0; this.shieldMaxHp = 0; this.weakPointActive = false; this.weakPointTimer = 0; this.weakPointCooldown = 0; this.counterTimer = 0; this.shieldBreakPending = false; this.phaseTransitioning = false; this.phaseTransitionTimer = 0; }
  update(dt, bossHp, bossMaxHp) {
    const newPhase = getBossBattlePhase(bossHp / bossMaxHp);
    if (newPhase > this.phase) this.onPhaseTransition(newPhase);
    const phaseConfig = BOSS_PHASES[this.phase];
    if (this.phaseTransitioning) { this.phaseTransitionTimer -= dt; if (this.phaseTransitionTimer <= 0) this.phaseTransitioning = false; }
    if (phaseConfig.weakPointActive) {
      if (!this.weakPointActive) { this.weakPointCooldown -= dt; if (this.weakPointCooldown <= 0) { this.weakPointActive = true; this.weakPointTimer = phaseConfig.weakPointDuration || 3.0; } }
      else { this.weakPointTimer -= dt; if (this.weakPointTimer <= 0) { this.weakPointActive = false; this.weakPointCooldown = phaseConfig.weakPointCooldown || 5.0; } }
    }
    if (phaseConfig.counterInterval > 0) { this.counterTimer -= dt; if (this.counterTimer <= 0) { this.counterTimer = phaseConfig.counterInterval; return { type: "counter_attack", damage: phaseConfig.counterDamage }; } }
    return null;
  }
  onPhaseTransition(newPhase) { this.phase = newPhase; this.phaseTransitioning = true; this.phaseTransitionTimer = 1.5; const c = BOSS_PHASES[newPhase]; if (c.shieldActive) { this.shieldHp = c.shieldWords || 2; this.shieldMaxHp = this.shieldHp; } if (c.weakPointActive) this.weakPointCooldown = c.weakPointCooldown || 5.0; if (c.counterInterval > 0) this.counterTimer = c.counterInterval; }
  onShieldWordTyped() { if (this.shieldHp > 0) { this.shieldHp--; if (this.shieldHp <= 0) { this.shieldBreakPending = true; return true; } } return false; }
  getDamageMultiplier() { const c = BOSS_PHASES[this.phase]; if (this.weakPointActive && c.weakPointActive) return c.weakPointDamageMult || 3.0; return 1.0; }
  isShieldActive() { return this.shieldHp > 0; }
  isWeakPointActive() { return this.weakPointActive; }
}