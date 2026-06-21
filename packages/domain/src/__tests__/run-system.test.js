import { describe, it, expect } from 'vitest';
import {
  generateRun, generateActNodes, getCurrentActNodes, getCurrentNode,
  getAvailableChoices, selectNode, completeCurrentNode, advanceToNextAct,
  getShopOffers, purchaseUpgrade, restAction, processEvent,
  getEncounterConfig, getRunStats, NODE_TYPES, UPGRADE_DEFS, ACT_CONFIG, EVENTS
} from '../run-system.js';

describe('Run System', () => {
  describe('generateRun', () => {
    it('creates a run with 3 acts', () => {
      const run = generateRun(12345);
      expect(run.acts.length).toBe(3);
      expect(run.completed).toBe(false);
      expect(run.victory).toBe(false);
      expect(run.lives).toBe(5);
      expect(run.coins).toBe(0);
      expect(run.upgrades.length).toBe(0);
    });

    it('generates different runs with different seeds', () => {
      const r1 = generateRun(111);
      const r2 = generateRun(999);
      const types1 = r1.acts[0].nodes.map(n => n.type).join(',');
      const types2 = r2.acts[0].nodes.map(n => n.type).join(',');
      expect(types1).not.toBe(types2);
    });
  });

  describe('navigation', () => {
    it('starts at the first node of act 1', () => {
      const run = generateRun(42);
      const current = getCurrentNode(run);
      expect(current).toBeDefined();
      expect(current.row).toBe(0);
      expect(current.completed).toBe(true);
    });

    it('provides available choices from current node', () => {
      const run = generateRun(42);
      const choices = getAvailableChoices(run);
      expect(choices.length).toBeGreaterThan(0);
      choices.forEach(c => expect(c.available).toBe(true));
    });

    it('selectNode moves to the chosen node', () => {
      const run = generateRun(42);
      const choices = getAvailableChoices(run);
      const target = choices[0];
      const newRun = selectNode(run, target.id);
      const current = getCurrentNode(newRun);
      expect(current.id).toBe(target.id);
      expect(current.current).toBe(true);
    });

    it('selectNode rejects invalid node id', () => {
      const run = generateRun(42);
      const newRun = selectNode(run, 'invalid-id');
      expect(newRun).toBe(run);
    });
  });

  describe('completeCurrentNode', () => {
    it('marks current node as completed and awards coins', () => {
      const run = generateRun(42);
      const choices = getAvailableChoices(run);
      let r = selectNode(run, choices[0].id);
      r = completeCurrentNode(r, { coinsEarned: 25, score: 100, kills: 5 });
      const current = getCurrentNode(r);
      expect(current.completed).toBe(true);
      expect(r.coins).toBe(25);
      expect(r.totalScore).toBe(100);
      expect(r.totalKills).toBe(5);
    });
  });

  describe('advanceToNextAct', () => {
    it('moves to the next act when all nodes are completed', () => {
      let run = generateRun(42);
      // Complete all nodes in act 0 by walking through
      let safety = 0;
      while (safety < 50) {
        const choices = getAvailableChoices(run);
        if (choices.length === 0) break;
        run = selectNode(run, choices[0].id);
        run = completeCurrentNode(run, { coinsEarned: 10 });
        safety++;
      }
      expect(getAvailableChoices(run).length).toBe(0);
      run = advanceToNextAct(run);
      expect(run.currentAct).toBe(1);
      const current = getCurrentNode(run);
      expect(current).toBeDefined();
    });

    it('completes the run after all 3 acts', () => {
      let run = generateRun(42);
      for (let act = 0; act < 3; act++) {
        let safety = 0;
        while (safety < 50) {
          const choices = getAvailableChoices(run);
          if (choices.length === 0) break;
          run = selectNode(run, choices[0].id);
          run = completeCurrentNode(run, { coinsEarned: 10 });
          safety++;
        }
        run = advanceToNextAct(run);
      }
      expect(run.completed).toBe(true);
      expect(run.victory).toBe(true);
    });
  });

  describe('upgrade system', () => {
    it('getShopOffers returns up to 4 upgrades', () => {
      const run = generateRun(42);
      const offers = getShopOffers(run, () => 0.5);
      expect(offers.length).toBeGreaterThan(0);
      expect(offers.length).toBeLessThanOrEqual(4);
    });

    it('purchaseUpgrade deducts coins and adds upgrade', () => {
      let run = { ...generateRun(42), coins: 200 };
      const result = purchaseUpgrade(run, 'double_score');
      expect(result.success).toBe(true);
      expect(result.run.coins).toBe(120);
      expect(result.run.upgrades.length).toBe(1);
      expect(result.run.upgrades[0].id).toBe('double_score');
    });

    it('purchaseUpgrade fails with insufficient coins', () => {
      let run = { ...generateRun(42), coins: 10 };
      const result = purchaseUpgrade(run, 'double_score');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('insufficient_coins');
    });
  });

  describe('rest system', () => {
    it('heal restores lives', () => {
      let run = { ...generateRun(42), lives: 2, maxLives: 5 };
      const result = restAction(run, 'heal');
      expect(result.lives).toBeGreaterThan(2);
      expect(result.lives).toBeLessThanOrEqual(5);
    });
  });

  describe('event system', () => {
    it('processEvent applies heal effect', () => {
      let run = { ...generateRun(42), lives: 2, maxLives: 5 };
      const event = EVENTS[0]; // mysterious_fountain
      const result = processEvent(run, event, 0); // drink water
      expect(result.lives).toBe(4); // 2 + 2
    });

    it('processEvent applies coin effect', () => {
      let run = { ...generateRun(42), coins: 50 };
      const event = EVENTS[1]; // ancient_altar
      const result = processEvent(run, event, 1); // pray
      expect(result.coins).toBe(80); // 50 + 30
    });
  });

  describe('encounter config', () => {
    it('generates combat encounter config', () => {
      const node = { type: 'combat' };
      const actConfig = ACT_CONFIG[0];
      const config = getEncounterConfig(node, actConfig);
      expect(config.waveCount).toBeGreaterThan(0);
      expect(config.rewardCoins).toBeGreaterThan(0);
      expect(config.isBoss).toBeUndefined();
    });

    it('generates boss encounter config', () => {
      const node = { type: 'boss' };
      const actConfig = ACT_CONFIG[0];
      const config = getEncounterConfig(node, actConfig);
      expect(config.isBoss).toBe(true);
      expect(config.bossHp).toBe(actConfig.bossHp);
    });
  });

  describe('run stats', () => {
    it('calculates run statistics', () => {
      const run = generateRun(42);
      const stats = getRunStats(run);
      expect(stats.currentAct).toBe(1);
      expect(stats.totalActs).toBe(3);
      expect(stats.lives).toBe(5);
      expect(stats.completed).toBe(false);
    });
  });

  describe('node types and upgrades', () => {
    it('has all 6 node types', () => {
      const types = Object.keys(NODE_TYPES);
      expect(types.length).toBe(6);
      expect(types).toContain('combat');
      expect(types).toContain('boss');
      expect(types).toContain('shop');
    });

    it('has 10 upgrade definitions', () => {
      expect(UPGRADE_DEFS.length).toBe(10);
    });

    it('has 3 act configurations', () => {
      expect(ACT_CONFIG.length).toBe(3);
    });

    it('has event definitions', () => {
      expect(EVENTS.length).toBeGreaterThan(0);
    });
  });
});