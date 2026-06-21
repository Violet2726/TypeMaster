/**
 * Performance Optimizer - Rendering and memory optimization
 * 
 * Apple philosophy: smooth 60fps experience is essential.
 * Features:
 * 1. Object pooling for frequent allocations
 * 2. Render batching to reduce draw calls
 * 3. Memory monitoring and cleanup
 * 4. FPS-based quality adjustment
 */

// ---------------------------------------------------------------------------
// Object Pool
// ---------------------------------------------------------------------------

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;
  
  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 10, maxSize: number = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
    
    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }
  
  release(obj: T): void {
    this.reset(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }
  
  clear(): void {
    this.pool.length = 0;
  }
  
  get size(): number {
    return this.pool.length;
  }
}

// ---------------------------------------------------------------------------
// Render Batcher
// ---------------------------------------------------------------------------

export class RenderBatcher {
  private batches: Map<string, Array<() => void>> = new Map();
  private currentBatch: string = 'default';
  
  startBatch(name: string): void {
    this.currentBatch = name;
    if (!this.batches.has(name)) {
      this.batches.set(name, []);
    }
  }
  
  addToBatch(drawCall: () => void): void {
    const batch = this.batches.get(this.currentBatch);
    if (batch) {
      batch.push(drawCall);
    }
  }
  
  flushBatch(name: string): void {
    const batch = this.batches.get(name);
    if (batch) {
      batch.forEach(call => call());
      batch.length = 0;
    }
  }
  
  flushAll(): void {
    this.batches.forEach(batch => {
      batch.forEach(call => call());
      batch.length = 0;
    });
  }
  
  clear(): void {
    this.batches.clear();
  }
}

// ---------------------------------------------------------------------------
// Memory Monitor
// ---------------------------------------------------------------------------

export class MemoryMonitor {
  private lastCheck: number = 0;
  private checkInterval: number = 5000; // 5 seconds
  private memoryUsage: number = 0;
  private objectCounts: Map<string, number> = new Map();
  
  update(dt: number): void {
    const now = performance.now();
    if (now - this.lastCheck > this.checkInterval) {
      this.checkMemory();
      this.lastCheck = now;
    }
  }
  
  private checkMemory(): void {
    // Check if performance.memory is available
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.memoryUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB
    }
  }
  
  trackObject(type: string, count: number): void {
    this.objectCounts.set(type, count);
  }
  
  getMemoryUsage(): number {
    return this.memoryUsage;
  }
  
  getObjectCounts(): Map<string, number> {
    return this.objectCounts;
  }
  
  isMemoryPressure(): boolean {
    return this.memoryUsage > 100; // > 100MB
  }
}

// ---------------------------------------------------------------------------
// FPS Quality Adjuster
// ---------------------------------------------------------------------------

export class FpsQualityAdjuster {
  private targetFps: number = 60;
  private currentFps: number = 60;
  private qualityLevel: number = 1.0; // 0.0 - 1.0
  private adjustmentCooldown: number = 0;
  
  update(fps: number, dt: number): void {
    this.currentFps = fps;
    this.adjustmentCooldown -= dt;
    
    if (this.adjustmentCooldown <= 0) {
      this.adjustQuality();
      this.adjustmentCooldown = 1.0; // Check every second
    }
  }
  
  private adjustQuality(): void {
    const fpsRatio = this.currentFps / this.targetFps;
    
    if (fpsRatio < 0.8) {
      // Below 80% of target, reduce quality
      this.qualityLevel = Math.max(0.3, this.qualityLevel - 0.1);
    } else if (fpsRatio > 0.95) {
      // Above 95% of target, increase quality
      this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
    }
  }
  
  getQualityLevel(): number {
    return this.qualityLevel;
  }
  
  shouldReduceEffects(): boolean {
    return this.qualityLevel < 0.7;
  }
  
  shouldReduceParticles(): boolean {
    return this.qualityLevel < 0.5;
  }
  
  getMaxParticles(): number {
    return Math.floor(100 * this.qualityLevel);
  }
  
  getMaxEnemies(): number {
    return Math.floor(20 * this.qualityLevel);
  }
}

// ---------------------------------------------------------------------------
// Performance Manager
// ---------------------------------------------------------------------------

export class PerformanceManager {
  private objectPool: ObjectPool<any>;
  private renderBatcher: RenderBatcher;
  private memoryMonitor: MemoryMonitor;
  private fpsAdjuster: FpsQualityAdjuster;
  
  constructor() {
    this.objectPool = new ObjectPool(
      () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 }),
      (obj) => { obj.x = 0; obj.y = 0; obj.vx = 0; obj.vy = 0; obj.life = 0; },
      50,
      200
    );
    this.renderBatcher = new RenderBatcher();
    this.memoryMonitor = new MemoryMonitor();
    this.fpsAdjuster = new FpsQualityAdjuster();
  }
  
  update(fps: number, dt: number): void {
    this.memoryMonitor.update(dt);
    this.fpsAdjuster.update(fps, dt);
  }
  
  getObjectPool<T>(): ObjectPool<T> {
    return this.objectPool as unknown as ObjectPool<T>;
  }
  
  getRenderBatcher(): RenderBatcher {
    return this.renderBatcher;
  }
  
  getMemoryMonitor(): MemoryMonitor {
    return this.memoryMonitor;
  }
  
  getFpsAdjuster(): FpsQualityAdjuster {
    return this.fpsAdjuster;
  }
  
  getQualityLevel(): number {
    return this.fpsAdjuster.getQualityLevel();
  }
  
  shouldReduceEffects(): boolean {
    return this.fpsAdjuster.shouldReduceEffects();
  }
  
  shouldReduceParticles(): boolean {
    return this.fpsAdjuster.shouldReduceParticles();
  }
  
  getMaxParticles(): number {
    return this.fpsAdjuster.getMaxParticles();
  }
  
  getMaxEnemies(): number {
    return this.fpsAdjuster.getMaxEnemies();
  }
  
  clear(): void {
    this.objectPool.clear();
    this.renderBatcher.clear();
  }
}
