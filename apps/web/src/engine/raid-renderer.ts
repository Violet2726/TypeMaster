type MonsterType = 'nib' | 'mossback' | 'blink' | 'echo' | 'glyph' | 'bloom' | 'guardian';

type RaidEnemyView = {
    id: string;
    type: MonsterType;
    word: string;
    typed: string;
    xRatio: number;
    y: number;
    hp: number;
    maxHp: number;
    isTarget: boolean;
    shielded?: boolean;
    elite?: boolean;
};

type RaidParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
};

const MONSTER_COLORS: Record<MonsterType, string> = {
    nib: '#64d2ff',
    mossback: '#34c759',
    blink: '#bf8cff',
    echo: '#ffd60a',
    glyph: '#ff9f0a',
    bloom: '#7ee198',
    guardian: '#ff453a'
};

const MONSTER_RADIUS: Record<MonsterType, number> = {
    nib: 18,
    mossback: 27,
    blink: 21,
    echo: 23,
    glyph: 22,
    bloom: 24,
    guardian: 42
};

const BG_TOP = '#07080c';
const BG_BOTTOM = '#14161d';

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function easeOut(value: number) {
    return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
}

export class MonsterRaidRenderer {
    private width = 800;
    private height = 600;
    private particles: RaidParticle[] = [];
    private lastFeedbackKey = '';
    private reducedMotion = false;
    private quality = 1;

    resize(width: number, height: number, dpr = 1) {
        this.width = width;
        this.height = height;
        this.quality = Math.max(0.45, Math.min(1, 1.2 - Math.max(0, dpr - 1) * 0.2));
    }

    setReducedMotion(value: boolean) {
        this.reducedMotion = value;
    }

    handleEvents(events: any[], snapshot: any) {
        if (this.reducedMotion) return;

        events.forEach((event) => {
            const supported = ['monster_defeated', 'monster_shield_broken', 'char_error', 'monster_leaked', 'guardian_phase', 'enemy_defeated'].includes(event.type);
            if (!supported) return;

            const enemy = snapshot?.arena?.enemies?.find((item: RaidEnemyView) => item.id === event.enemyId);
            const xRatio = enemy?.xRatio ?? event.xRatio;
            const yRatio = enemy?.y ?? event.y;
            const enemyType = (enemy?.type ?? event.enemyType ?? 'nib') as MonsterType;
            const x = typeof xRatio === 'number' ? xRatio * this.width : this.width / 2;
            const y = typeof yRatio === 'number' ? this.mapArenaY(yRatio) : this.height * 0.74;
            const color = event.type === 'char_error' ? '#ff453a' : (MONSTER_COLORS[enemyType] || '#ffffff');
            const count = event.type === 'monster_defeated' || event.type === 'enemy_defeated'
                ? (event.elite ? 34 : 20)
                : event.type === 'monster_leaked'
                    ? 12
                    : event.type === 'monster_shield_broken'
                        ? 16
                        : 7;

            this.emit(x, y, color, count);
        });
    }

    render(ctx: CanvasRenderingContext2D, snapshot: any, deltaTime: number) {
        this.updateFeedback(snapshot);
        this.updateParticles(deltaTime);
        this.drawBackground(ctx, snapshot);
        this.drawLanes(ctx);
        this.drawDangerBand(ctx, snapshot);
        this.drawEnemies(ctx, snapshot?.arena?.enemies || []);
        this.drawParticles(ctx);
    }

    private updateFeedback(snapshot: any) {
        const feedback = snapshot?.arena?.feedback;
        if (!feedback) return;
        const key = `${feedback.kind}:${feedback.enemyId || ''}:${feedback.at || 0}`;
        if (key === this.lastFeedbackKey) return;
        this.lastFeedbackKey = key;

        if (this.reducedMotion) return;
        const enemy = snapshot?.arena?.enemies?.find((item: RaidEnemyView) => item.id === feedback.enemyId);
        if (!enemy) return;
        const x = enemy.xRatio * this.width;
        const y = this.mapArenaY(enemy.y);
        const color = feedback.kind === 'error' ? '#ff453a' : MONSTER_COLORS[enemy.type];
        const count = feedback.kind === 'kill' ? (enemy.elite ? 36 : 24) : feedback.kind === 'shield' ? 16 : feedback.kind === 'segment' ? 14 : 5;
        this.emit(x, y, color, count);
    }

    private emit(x: number, y: number, color: string, count: number) {
        const cap = this.quality < 0.7 ? 60 : 180;
        const safeCount = Math.floor(count * this.quality);

        for (let index = 0; index < safeCount; index += 1) {
            if (this.particles.length >= cap) {
                this.particles.shift();
            }

            const angle = (Math.PI * 2 * index) / Math.max(1, safeCount) + (Math.random() - 0.5) * 0.45;
            const speed = 36 + Math.random() * 92;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.42 + Math.random() * 0.36,
                maxLife: 0.8,
                size: 2 + Math.random() * 3,
                color
            });
        }
    }

    private updateParticles(deltaTime: number) {
        if (this.reducedMotion) {
            this.particles = [];
            return;
        }

        this.particles = this.particles
            .map((particle) => ({
                ...particle,
                x: particle.x + particle.vx * deltaTime,
                y: particle.y + particle.vy * deltaTime,
                vy: particle.vy + 84 * deltaTime,
                life: particle.life - deltaTime
            }))
            .filter((particle) => particle.life > 0);
    }

    private drawBackground(ctx: CanvasRenderingContext2D, snapshot: any) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, BG_TOP);
        gradient.addColorStop(1, BG_BOTTOM);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        const pressure = snapshot?.hud?.pressureScore || 0;
        const threat = snapshot?.hud?.threatLevel || 1;
        const glow = ctx.createRadialGradient(
            this.width * 0.5,
            this.height * 0.82,
            this.height * 0.05,
            this.width * 0.5,
            this.height * 0.82,
            this.height * 0.76
        );
        glow.addColorStop(0, `rgba(52,199,89,${0.045 + pressure * 0.055})`);
        glow.addColorStop(0.5, `rgba(10,132,255,${0.028 + Math.min(threat, 10) * 0.004})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    private getArenaTop() {
        if (this.width <= 520) {
            return Math.min(250, Math.max(190, this.height * 0.28));
        }

        return 88;
    }

    private getArenaBottom() {
        return Math.min(this.height - 36, Math.max(this.getArenaTop() + 220, this.height - 56));
    }

    private mapArenaY(yRatio: number) {
        const top = this.getArenaTop();
        const bottom = this.getArenaBottom();
        return top + yRatio * (bottom - top);
    }

    private drawLanes(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.052)';
        ctx.lineWidth = 1;
        const laneCount = 7;
        const arenaTop = this.getArenaTop();
        const arenaBottom = this.getArenaBottom();
        for (let index = 1; index < laneCount; index += 1) {
            const x = (this.width / laneCount) * index;
            ctx.beginPath();
            ctx.moveTo(x, arenaTop);
            ctx.lineTo(x, arenaBottom + 8);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.11)';
        ctx.beginPath();
        ctx.moveTo(0, arenaBottom);
        ctx.lineTo(this.width, arenaBottom);
        ctx.stroke();
        ctx.restore();
    }

    private drawDangerBand(ctx: CanvasRenderingContext2D, snapshot: any) {
        const maxY = Math.max(0, ...(snapshot?.arena?.enemies || []).map((enemy: RaidEnemyView) => enemy.y));
        if (maxY < 0.72) return;
        const alpha = clamp((maxY - 0.72) / 0.25, 0, 1) * 0.26;
        const gradient = ctx.createLinearGradient(0, this.height * 0.65, 0, this.height);
        gradient.addColorStop(0, 'rgba(255,69,58,0)');
        gradient.addColorStop(1, `rgba(255,69,58,${alpha})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    private drawEnemies(ctx: CanvasRenderingContext2D, enemies: RaidEnemyView[]) {
        enemies.forEach((enemy) => {
            const x = enemy.xRatio * this.width;
            const y = this.mapArenaY(enemy.y);
            const radius = MONSTER_RADIUS[enemy.type] || 22;
            const color = MONSTER_COLORS[enemy.type] || MONSTER_COLORS.nib;
            const scale = enemy.y < 0 ? easeOut((enemy.y + 0.1) / 0.1) : 1;

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            this.drawMonsterAura(ctx, enemy, radius, color);
            this.drawMonsterBody(ctx, enemy, radius, color);
            this.drawMonsterWord(ctx, enemy, radius, color);
            ctx.restore();
        });
    }

    private drawMonsterAura(ctx: CanvasRenderingContext2D, enemy: RaidEnemyView, radius: number, color: string) {
        if (!enemy.isTarget && !enemy.shielded && !enemy.elite) return;
        ctx.save();
        ctx.strokeStyle = enemy.shielded ? '#7ee198' : color;
        ctx.lineWidth = enemy.elite ? 3 : 2;
        ctx.globalAlpha = enemy.isTarget ? 0.42 : 0.25;
        ctx.beginPath();
        ctx.arc(0, 0, radius + (enemy.elite ? 18 : 14), 0, Math.PI * 2);
        ctx.stroke();
        if (enemy.shielded) {
            ctx.globalAlpha = 0.18;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 24, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawMonsterBody(ctx: CanvasRenderingContext2D, enemy: RaidEnemyView, radius: number, color: string) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = enemy.isTarget ? 24 : 12;
        this.drawMonsterShape(ctx, enemy, radius, color);
        ctx.shadowBlur = 0;
        this.drawMonsterFace(ctx, enemy, radius);
        this.drawMonsterHp(ctx, enemy, radius, color);
        ctx.restore();
    }

    private drawMonsterShape(ctx: CanvasRenderingContext2D, enemy: RaidEnemyView, radius: number, color: string) {
        const gradient = ctx.createRadialGradient(-radius * 0.28, -radius * 0.32, 0, 0, 0, radius * 1.22);
        gradient.addColorStop(0, 'rgba(255,255,255,0.92)');
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(1, 'rgba(255,255,255,0.1)');
        ctx.fillStyle = gradient;
        ctx.strokeStyle = enemy.isTarget ? 'rgba(255,255,255,0.86)' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = enemy.isTarget ? 2.5 : 1.2;

        if (enemy.type === 'nib') {
            this.pathNib(ctx, radius);
        } else if (enemy.type === 'mossback') {
            this.pathMossback(ctx, radius);
        } else if (enemy.type === 'blink') {
            this.pathBlink(ctx, radius);
        } else if (enemy.type === 'echo') {
            this.pathEcho(ctx, radius);
        } else if (enemy.type === 'glyph') {
            this.pathGlyph(ctx, radius);
        } else if (enemy.type === 'bloom') {
            this.pathBloom(ctx, radius);
        } else {
            this.pathGuardian(ctx, radius);
        }

        ctx.fill();
        ctx.stroke();
    }

    private drawMonsterFace(ctx: CanvasRenderingContext2D, enemy: RaidEnemyView, radius: number) {
        ctx.save();
        ctx.fillStyle = 'rgba(8,10,14,0.82)';
        const eyeY = enemy.type === 'guardian' ? -radius * 0.12 : -radius * 0.08;
        const eyeOffset = enemy.type === 'glyph' ? radius * 0.18 : radius * 0.28;
        ctx.beginPath();
        ctx.arc(-eyeOffset, eyeY, Math.max(2.2, radius * 0.1), 0, Math.PI * 2);
        ctx.arc(eyeOffset, eyeY, Math.max(2.2, radius * 0.1), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(8,10,14,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.18, radius * 0.2);
        ctx.lineTo(radius * 0.18, radius * 0.2);
        ctx.stroke();
        ctx.restore();
    }

    private drawMonsterHp(ctx: CanvasRenderingContext2D, enemy: RaidEnemyView, radius: number, color: string) {
        if (enemy.maxHp <= 1) return;
        const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 7, -Math.PI / 2, Math.PI * 1.5);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.stroke();
        ctx.restore();
    }

    private drawMonsterWord(ctx: CanvasRenderingContext2D, enemy: RaidEnemyView, radius: number, color: string) {
        const y = radius + 25;
        ctx.save();
        ctx.font = `${enemy.elite ? 18 : 15}px "SF Pro Text", Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const width = Math.max(56, ctx.measureText(enemy.word).width + 25);
        ctx.fillStyle = 'rgba(8,10,14,0.76)';
        ctx.strokeStyle = enemy.isTarget ? `${color}cc` : 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-width / 2, y - 16, width, 32, 10);
        ctx.fill();
        ctx.stroke();

        const typed = enemy.typed || '';
        const remaining = enemy.word.slice(typed.length);
        const typedWidth = ctx.measureText(typed).width;
        const remainingWidth = ctx.measureText(remaining).width;
        const start = -(typedWidth + remainingWidth) / 2;

        ctx.fillStyle = color;
        ctx.fillText(typed, start + typedWidth / 2, y);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(remaining, start + typedWidth + remainingWidth / 2, y);
        ctx.restore();
    }

    private drawParticles(ctx: CanvasRenderingContext2D) {
        this.particles.forEach((particle) => {
            const alpha = clamp(particle.life / particle.maxLife, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    private pathNib(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.moveTo(-radius * 0.5, -radius * 0.68);
        ctx.lineTo(-radius * 0.92, -radius * 1.16);
        ctx.lineTo(-radius * 0.2, -radius * 0.9);
        ctx.moveTo(radius * 0.5, -radius * 0.68);
        ctx.lineTo(radius * 0.92, -radius * 1.16);
        ctx.lineTo(radius * 0.2, -radius * 0.9);
    }

    private pathMossback(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        ctx.roundRect(-radius * 1.12, -radius * 0.82, radius * 2.24, radius * 1.64, radius * 0.62);
        ctx.moveTo(-radius * 0.64, -radius * 0.58);
        ctx.lineTo(-radius * 0.3, -radius * 1.02);
        ctx.lineTo(radius * 0.08, -radius * 0.6);
        ctx.moveTo(radius * 0.18, -radius * 0.6);
        ctx.lineTo(radius * 0.58, -radius * 1.04);
        ctx.lineTo(radius * 0.88, -radius * 0.54);
    }

    private pathBlink(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.18);
        ctx.lineTo(radius * 0.95, -radius * 0.18);
        ctx.lineTo(radius * 0.44, radius * 0.92);
        ctx.lineTo(-radius * 0.44, radius * 0.92);
        ctx.lineTo(-radius * 0.95, -radius * 0.18);
        ctx.closePath();
    }

    private pathEcho(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        ctx.arc(-radius * 0.34, 0, radius * 0.78, 0, Math.PI * 2);
        ctx.arc(radius * 0.34, 0, radius * 0.78, 0, Math.PI * 2);
    }

    private pathGlyph(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        for (let index = 0; index < 6; index += 1) {
            const angle = Math.PI / 6 + index * Math.PI / 3;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    private pathBloom(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        for (let index = 0; index < 6; index += 1) {
            const angle = index * Math.PI / 3;
            const x = Math.cos(angle) * radius * 0.55;
            const y = Math.sin(angle) * radius * 0.55;
            ctx.moveTo(x + radius * 0.52, y);
            ctx.arc(x, y, radius * 0.52, 0, Math.PI * 2);
        }
        ctx.moveTo(radius * 0.6, 0);
        ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
    }

    private pathGuardian(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.moveTo(-radius * 0.58, -radius * 0.68);
        ctx.lineTo(-radius * 1.08, -radius * 1.18);
        ctx.lineTo(-radius * 0.3, -radius * 0.98);
        ctx.moveTo(radius * 0.58, -radius * 0.68);
        ctx.lineTo(radius * 1.08, -radius * 1.18);
        ctx.lineTo(radius * 0.3, -radius * 0.98);
        ctx.moveTo(-radius * 0.5, radius * 0.58);
        ctx.lineTo(0, radius * 1.16);
        ctx.lineTo(radius * 0.5, radius * 0.58);
    }
}

export const RaidRenderer = MonsterRaidRenderer;
