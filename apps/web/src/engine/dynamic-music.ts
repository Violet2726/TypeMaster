/**
 * Dynamic Music System - Adaptive soundtrack
 * 
 * Apple philosophy: music should enhance, not distract.
 * Features:
 * 1. Adaptive intensity based on gameplay
 * 2. Smooth transitions between states
 * 3. Combo-reactive layers
 * 4. Ambient environment sounds
 */

type MusicState = 'idle' | 'playing' | 'intense' | 'boss' | 'victory' | 'gameover';

interface MusicLayer {
  name: string;
  volume: number;
  targetVolume: number;
  fadeSpeed: number;
}

// ---------------------------------------------------------------------------
// Dynamic Music Manager
// ---------------------------------------------------------------------------

export class DynamicMusicManager {
  private currentState: MusicState = 'idle';
  private layers: Map<string, MusicLayer> = new Map();
  private transitionProgress = 0;
  private isTransitioning = false;
  
  // Intensity tracking
  private intensity = 0;
  private comboBoost = 0;
  private waveBoost = 0;
  
  constructor() {
    this.initLayers();
  }
  
  private initLayers(): void {
    this.layers.set('bass', { name: 'bass', volume: 0, targetVolume: 0, fadeSpeed: 0.02 });
    this.layers.set('pad', { name: 'pad', volume: 0, targetVolume: 0, fadeSpeed: 0.015 });
    this.layers.set('arp', { name: 'arp', volume: 0, targetVolume: 0, fadeSpeed: 0.025 });
    this.layers.set('perc', { name: 'perc', volume: 0, targetVolume: 0, fadeSpeed: 0.03 });
    this.layers.set('ambient', { name: 'ambient', volume: 0, targetVolume: 0, fadeSpeed: 0.01 });
  }
  
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  
  setState(newState: MusicState): void {
    if (this.currentState === newState) return;
    
    this.currentState = newState;
    this.isTransitioning = true;
    this.transitionProgress = 0;
    
    // Update target volumes based on state
    this.updateTargetVolumes();
  }
  
  private updateTargetVolumes(): void {
    const stateVolumes: Record<MusicState, Record<string, number>> = {
      idle: { bass: 0.02, pad: 0.03, arp: 0, perc: 0, ambient: 0.05 },
      playing: { bass: 0.08, pad: 0.06, arp: 0.04, perc: 0.03, ambient: 0.02 },
      intense: { bass: 0.12, pad: 0.1, arp: 0.08, perc: 0.06, ambient: 0.01 },
      boss: { bass: 0.15, pad: 0.12, arp: 0.1, perc: 0.08, ambient: 0 },
      victory: { bass: 0.04, pad: 0.08, arp: 0.06, perc: 0, ambient: 0.03 },
      gameover: { bass: 0.02, pad: 0.02, arp: 0, perc: 0, ambient: 0.04 },
    };
    
    const volumes = stateVolumes[this.currentState];
    this.layers.forEach((layer, name) => {
      layer.targetVolume = volumes[name] || 0;
    });
  }
  
  // ---------------------------------------------------------------------------
  // Intensity Updates
  // ---------------------------------------------------------------------------
  
  updateIntensity(combo: number, wave: number): void {
    this.comboBoost = Math.min(combo / 20, 1) * 0.3;
    this.waveBoost = Math.min(wave / 15, 1) * 0.2;
    this.intensity = Math.min(1, this.comboBoost + this.waveBoost);
  }
  
  // ---------------------------------------------------------------------------
  // Layer Management
  // ---------------------------------------------------------------------------
  
  update(dt: number): void {
    // Update layer volumes
    this.layers.forEach(layer => {
      const diff = layer.targetVolume - layer.volume;
      if (Math.abs(diff) > 0.001) {
        layer.volume += diff * layer.fadeSpeed * dt * 60;
      }
    });
    
    // Update transition
    if (this.isTransitioning) {
      this.transitionProgress += dt * 2; // 0.5 second transition
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        this.transitionProgress = 1;
      }
    }
  }
  
  getLayerVolume(layerName: string): number {
    const layer = this.layers.get(layerName);
    if (!layer) return 0;
    
    // Apply intensity boost
    const boost = this.intensity * 0.2;
    return Math.min(1, layer.volume + boost);
  }
  
  getState(): MusicState {
    return this.currentState;
  }
  
  getIntensity(): number {
    return this.intensity;
  }
  
  isTransitionInProgress(): boolean {
    return this.isTransitioning;
  }
  
  // ---------------------------------------------------------------------------
  // Special Effects
  // ---------------------------------------------------------------------------
  
  triggerVictory(): void {
    this.setState('victory');
  }
  
  triggerGameOver(): void {
    this.setState('gameover');
  }
  
  triggerBoss(): void {
    this.setState('boss');
  }
  
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  
  clear(): void {
    this.layers.forEach(layer => {
      layer.volume = 0;
      layer.targetVolume = 0;
    });
    this.currentState = 'idle';
    this.intensity = 0;
    this.isTransitioning = false;
  }
}
