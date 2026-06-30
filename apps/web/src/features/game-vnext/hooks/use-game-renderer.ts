import { useEffect, useRef, type RefObject } from 'react';
import { loadGameAssets } from '../runtime/asset-loader';
import { TypeRiftRenderer } from '../runtime/canvas-renderer';

export function useGameRenderer({
    canvasRef,
    containerRef
}: {
    canvasRef: RefObject<HTMLCanvasElement>;
    containerRef: RefObject<HTMLDivElement>;
}) {
    const rendererRef = useRef<TypeRiftRenderer | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const renderer = new TypeRiftRenderer();
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        renderer.setReducedMotion(reducedMotion.matches);
        rendererRef.current = renderer;

        loadGameAssets().then((assets) => {
            renderer.setAssets(assets);
        });

        function resize() {
            const rect = container!.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.floor(rect.width));
            const height = Math.max(1, Math.floor(rect.height));

            canvas!.width = Math.floor(width * dpr);
            canvas!.height = Math.floor(height * dpr);
            canvas!.style.width = `${width}px`;
            canvas!.style.height = `${height}px`;

            const ctx = canvas!.getContext('2d');
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            renderer.resize(width, height, dpr);
        }

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        resize();

        function handleReducedMotionChange(event: MediaQueryListEvent) {
            renderer.setReducedMotion(event.matches);
        }

        reducedMotion.addEventListener('change', handleReducedMotionChange);

        return () => {
            resizeObserver.disconnect();
            reducedMotion.removeEventListener('change', handleReducedMotionChange);
            rendererRef.current = null;
        };
    }, [canvasRef, containerRef]);

    return rendererRef;
}

