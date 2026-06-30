export type GameParticle = {
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    maxLife: number,
    size: number,
    color: string,
};

export function emitParticles(particles: GameParticle[], x: number, y: number, color: string, count: number) {
    const safeCount = Math.min(42, Math.max(4, count));
    for (let index = 0; index < safeCount; index += 1) {
        const angle = (Math.PI * 2 * index) / safeCount + (Math.random() - 0.5) * 0.5;
        const speed = 34 + Math.random() * 120;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.45 + Math.random() * 0.38,
            maxLife: 0.85,
            size: 2 + Math.random() * 4,
            color
        });
    }

    while (particles.length > 180) particles.shift();
}

export function updateParticles(particles: GameParticle[], deltaTime: number) {
    return particles
        .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx * deltaTime,
            y: particle.y + particle.vy * deltaTime,
            vy: particle.vy + 74 * deltaTime,
            life: particle.life - deltaTime
        }))
        .filter((particle) => particle.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: GameParticle[]) {
    particles.forEach((particle) => {
        const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

