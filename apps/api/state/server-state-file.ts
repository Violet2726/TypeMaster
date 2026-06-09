import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { z } from 'zod';
import { createEmptyServerState } from '@typemaster/contracts';
import { ServerStateSchema, normalizeServerState } from '@typemaster/contracts/server-state';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'server-state.json');

export type ServerState = z.infer<typeof ServerStateSchema>;

function ensureStoreFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(STORE_PATH)) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(createEmptyServerState(), null, 2));
    }
}

export function readStore(): ServerState {
    ensureStoreFile();

    try {
        return normalizeServerState(JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')));
    } catch {
        return normalizeServerState(createEmptyServerState());
    }
}

export function writeStore(store: ServerState) {
    ensureStoreFile();
    fs.writeFileSync(STORE_PATH, JSON.stringify(normalizeServerState(store), null, 2), 'utf-8');
}

export function createStoreId(prefix: string) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
