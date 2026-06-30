/** @vitest-environment node */
import { existsSync, readFileSync } from 'node:fs';
import { normalize, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function webRoot() {
    return normalize(process.cwd()).endsWith(normalize('apps/web'))
        ? process.cwd()
        : resolve(process.cwd(), 'apps/web');
}

function readManifest() {
    const root = webRoot();
    const manifestPath = resolve(root, 'public/game/typerift/manifest.json');
    return {
        root,
        manifest: JSON.parse(readFileSync(manifestPath, 'utf8'))
    };
}

describe('TypeRift asset manifest', () => {
    it('declares the complete TypeRift product asset set', () => {
        const { manifest } = readManifest();

        expect(manifest.version ?? 1).toBeGreaterThanOrEqual(1);
        expect(Object.keys(manifest.backgrounds || {})).toHaveLength(5);
        expect(Object.keys(manifest.enemies || {})).toHaveLength(12);
        expect(Object.keys(manifest.bosses || {})).toHaveLength(5);
        expect(Object.keys(manifest.relics || {})).toHaveLength(24);
        expect(manifest.ui || {}).toEqual({});
    });

    it('points every declared asset at an existing file', () => {
        const { root, manifest } = readManifest();
        const groups = ['backgrounds', 'enemies', 'bosses', 'relics'] as const;

        groups.forEach((group) => {
            Object.values(manifest[group] || {}).forEach((src) => {
                const publicPath = String(src).replace(/^\//, '');
                expect(existsSync(resolve(root, 'public', publicPath))).toBe(true);
            });
        });
    });
});
