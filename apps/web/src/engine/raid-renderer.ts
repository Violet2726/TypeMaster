type RaidEnemyView = {
    id: string;
    type: 'scout' | 'guard' | 'bulwark' | 'signal' | 'boss';
    word: string;
    typed: string;
    xRatio: number;
    y: number;
    hp: number;
    maxHp: number;
    isTarget: boolean;
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

const TYPE_COLORS = {
    scout: '#64d2ff',
    guard: '#0a84ff',
    bulwark: '#ff9f0a',
    signal: '#34c759',
    boss: '#ff453a'
};

const TYPE_RADIUS = {
    scout: 18,
    guard: 22,
    bulwark: 27,
    signal: 22,
    boss: 42
};

const BG_TOP = '#07080c';
const BG_BOTTOM = '#14161d';

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function easeOut(value: number) {
    return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
}

export class RaidRenderer {
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
            if (event.type !== 'enemy_defeated' && event.type !== 'char_error' && event.type !== 'enemy_leaked') {
                return;
            }

            const enemy = snapshot?.arena?.enemies?.find((item: RaidEnemyView) => item.id === event.enemyId);
            const xRatio = enemy?.xRatio ?? event.xRatio;
            const yRatio = enemy?.y ?? event.y;
            const enemyType = enemy?.type ?? event.enemyType;
            const x = typeof xRatio === 'number' ? xRatio * this.width : this.width / 2;
            const y = typeof yRatio === 'number' ? yRatio * this.height : this.height * 0.75;
            const color = enemyType ? TYPE_COLORS[enemyType] : (event.type === 'char_error' ? '#ff453a' : '#ffffff');
            const count = event.type === 'enemy_defeated' ? 18 : event.type === 'enemy_leaked' ? 12 : 8;

            this.emit(x, y, color, count);
        });
    }

    render(ctx: CanvasRenderingContext2D, snapshot: any, deltaTime: number) {
        this.updateFeedback(snapshot);
        this.updateParticles(deltaTime);
        this.drawBackground(ctx, snapshot);
        this.drawGrid(ctx);
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
        const y = enemy.y * this.height;
        const color = feedback.kind === 'error' ? '#ff453a' : TYPE_COLORS[enemy.type];
        const count = feedback.kind === 'kill' ? 24 : feedback.kind === 'segment' ? 14 : 5;
        this.emit(x, y, color, count);
    }

    private emit(x: number, y: number, color: string, count: number) {
        const cap = this.quality < 0.7 ? 60 : 140;
        const safeCount = Math.floor(count * this.quality);

        for (let i = 0; i < safeCount; i += 1) {
            if (this.particles.length >= cap) {
                this.particles.shift();
            }

            const angle = (Math.PI * 2 * i) / Math.max(1, safeCount) + (Math.random() - 0.5) * 0.45;
            const speed = 40 + Math.random() * 90;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.45 + Math.random() * 0.35,
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
                vy: particle.vy + 90 * deltaTime,
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
        const glow = ctx.createRadialGradient(
            this.width * 0.5,
            this.height * 0.82,
            this.height * 0.05,
            this.width * 0.5,
            this.height * 0.82,
            this.height * 0.75
        );
        glow.addColorStop(0, `rgba(10,132,255,${0.08 + pressure * 0.08})`);
        glow.addColorStop(0.55, 'rgba(52,199,89,0.03)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    private drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.055)';
        ctx.lineWidth = 1;
        const laneCount = 7;
        for (let i = 1; i < laneCount; i += 1) {
            const x = (this.width / laneCount) * i;
            ctx.beginPath();
            ctx.moveTo(x, 88);
            ctx.lineTo(x, this.height - 44);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(0, this.height - 54);
        ctx.lineTo(this.width, this.height - 54);
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
            const y = enemy.y * this.height;
            const radius = TYPE_RADIUS[enemy.type] || 22;
            const color = TYPE_COLORS[enemy.type] || TYPE_COLORS.guard;
            const scale = enemy.y < 0 ? easeOut((enemy.y + 0.1) / 0.1) : 1;

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            this.drawEnemyBody(ctx, enemy, radius, color);
            this.drawEnemyWord(ctx, enemy, radius, color);

            ctx.restore();
        });
    }

    private drawEnemyBody(ctx: CanvasRenderingContext2D, enemy: RaidEnemyView, radius: number, color: string) {
        ctx.save();
        const activeBoost = enemy.isTarget ? 1 : 0;
        const gradient = ctx.createRadialGradient(-radius * 0.28, -radius * 0.32, 0, 0, 0, radius * 1.15);
        gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
        gradient.addColorStop(0.18, color);
        gradient.addColorStop(1, 'rgba(255,255,255,0.08)');

        ctx.shadowColor = color;
        ctx.shadowBlur = enemy.isTarget ? 26 : 14;
        ctx.fillStyle = gradient;

        if (enemy.type === 'scout') {
            this.pathDiamond(ctx, radius);
        } else if (enemy.type === 'bulwark') {
            this.pathHexagon(ctx, radius);
        } else if (enemy.type === 'signal') {
            ctx.beginPath();
            ctx.roundRect(-radius, -radius * 0.72, radius * 2, radius * 1.44, radius * 0.35);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = enemy.isTarget ? 'rgba(255,255,255,0.86)' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = enemy.isTarget ? 2.5 : 1;
        ctx.stroke();

        if (enemy.maxHp > 1) {
            const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 7, -Math.PI / 2, Math.PI * 1.5);
            ctx.stroke();
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
            ctx.stroke();
        }

        if (activeBoost) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.36;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 16, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    private drawEnemyWord(ctx: CanvasRenderingContext2D, enemy: RaidEnemyView, radius: number, color: string) {
        const y = radius + 24;
        ctx.save();
        ctx.font = `${enemy.type === 'boss' ? 18 : 15}px "SF Pro Text", Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const width = Math.max(54, ctx.measureText(enemy.word).width + 24);
        ctx.fillStyle = 'rgba(8,10,14,0.72)';
        ctx.strokeStyle = enemy.isTarget ? `${color}cc` : 'rgba(255,255,255,0.12)';
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
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
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

    private pathDiamond(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius * 0.9, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius * 0.9, 0);
        ctx.closePath();
    }

    private pathHexagon(ctx: CanvasRenderingContext2D, radius: number) {
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
            const angle = Math.PI / 6 + i * Math.PI / 3;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }
}
