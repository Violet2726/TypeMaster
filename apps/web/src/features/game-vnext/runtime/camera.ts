export type GameCamera = {
    width: number,
    height: number,
    dpr: number,
};

export function createCamera(): GameCamera {
    return { width: 800, height: 600, dpr: 1 };
}

export function resizeCamera(camera: GameCamera, width: number, height: number, dpr = 1) {
    camera.width = width;
    camera.height = height;
    camera.dpr = dpr;
}

export function arenaTop(camera: GameCamera) {
    return camera.width <= 560 ? Math.min(360, Math.max(220, camera.height * 0.38)) : 92;
}

export function arenaBottom(camera: GameCamera) {
    return Math.min(camera.height - 42, Math.max(arenaTop(camera) + 240, camera.height - 62));
}

export function mapArenaY(camera: GameCamera, yRatio: number) {
    const top = arenaTop(camera);
    return top + yRatio * (arenaBottom(camera) - top);
}
