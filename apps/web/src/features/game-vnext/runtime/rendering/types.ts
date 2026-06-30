import type { LoadedGameAssets } from '../asset-loader';
import type { GameCamera } from '../camera';
import type { GameEnemySnapshot, GameSnapshot } from '../../../../types/game';

export type EnemyView = GameEnemySnapshot;

export type RenderContext = {
    assets: LoadedGameAssets | null;
    camera: GameCamera;
};

export type SnapshotView = GameSnapshot | null | undefined;

