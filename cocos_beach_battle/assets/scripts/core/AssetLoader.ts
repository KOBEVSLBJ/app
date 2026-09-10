// 资源加载器 - 异步预加载 + 同步缓存 SpriteFrame
// 沙滩航模大战 V1.0 - Cocos 2D伪3D
//
// 资源来源: Kenney Pirate Pack (CC0 1.0, https://kenney.nl/assets/pirate-pack)
// 镜像: https://github.com/ETdoFresh/kenney.nl (kenney_piratepack)
// 文件已置于 assets/resources/kenney/ 下, 由 Cocos 编辑器自动导入
// 运行时通过 resources.load 按 "kenney/<dir>/<name>/spriteFrame" 路径加载

import { SpriteFrame, resources } from 'cc';

// Kenney Pirate Pack 资源路径常量
// 加载 SpriteFrame 子资源用 "/spriteFrame" 后缀
export const KenneyAssets = {
    // 船只俯视图(按阵营选不同造型)
    SHIP_A: 'kenney/ships/ship_1/spriteFrame',       // 玩家A 用
    SHIP_B: 'kenney/ships/ship_2/spriteFrame',       // 玩家B 用
    SHIP_DINGHY: 'kenney/ships/dinghySmall1/spriteFrame', // 备选小艇

    // 炮弹
    CANNON_BALL: 'kenney/parts/cannonBall/spriteFrame',

    // 爆炸/火焰特效
    EXPLOSION_1: 'kenney/effects/explosion1/spriteFrame',
    EXPLOSION_2: 'kenney/effects/explosion2/spriteFrame',
    EXPLOSION_3: 'kenney/effects/explosion3/spriteFrame',
    FIRE_1: 'kenney/effects/fire1/spriteFrame',

    // 零件图标(BuildUI 用)
    CANNON: 'kenney/parts/cannon/spriteFrame',
    CANNON_MOBILE: 'kenney/parts/cannonMobile/spriteFrame',
    HULL_SMALL_1: 'kenney/parts/hullSmall_1/spriteFrame',
    HULL_LARGE_1: 'kenney/parts/hullLarge_1/spriteFrame',
    SAIL_LARGE_1: 'kenney/parts/sailLarge_1/spriteFrame',
    POLE: 'kenney/parts/pole/spriteFrame',
    FLAG_1: 'kenney/parts/flag_1/spriteFrame',
    NEST: 'kenney/parts/nest/spriteFrame',

    // 地形 tile(MapRenderer 可选)
    TILE_WATER: 'kenney/tiles/tile_01/spriteFrame',
    TILE_SAND: 'kenney/tiles/tile_06/spriteFrame',
};

// 预加载路径清单(供 GameManager 启动时统一预取)
export const PRELOAD_PATHS: string[] = [
    KenneyAssets.SHIP_A, KenneyAssets.SHIP_B,
    KenneyAssets.CANNON_BALL,
    KenneyAssets.EXPLOSION_1, KenneyAssets.EXPLOSION_2, KenneyAssets.EXPLOSION_3,
    KenneyAssets.CANNON, KenneyAssets.CANNON_MOBILE,
    KenneyAssets.HULL_SMALL_1, KenneyAssets.HULL_LARGE_1,
    KenneyAssets.SAIL_LARGE_1, KenneyAssets.POLE, KenneyAssets.FLAG_1, KenneyAssets.NEST,
];

export class AssetLoader {
    private static _cache: Map<string, SpriteFrame> = new Map();
    private static _pending: Set<string> = new Set();
    static ready: boolean = false;

    // 预加载所有给定路径, 全部完成后回调(失败路径静默跳过, 回退白模)
    static preload(paths: string[], onDone?: () => void): void {
        let remaining = paths.length;
        if (remaining === 0) { this.ready = true; onDone && onDone(); return; }
        const finishOne = () => {
            remaining--;
            if (remaining <= 0) {
                this.ready = true;
                onDone && onDone();
            }
        };
        for (const p of paths) this._loadOne(p, finishOne);
    }

    private static _loadOne(path: string, cb: () => void): void {
        if (this._cache.has(path)) { cb(); return; }
        if (this._pending.has(path)) { cb(); return; }
        this._pending.add(path);
        try {
            resources.load(path, SpriteFrame, (err, sf) => {
                this._pending.delete(path);
                if (!err && sf) this._cache.set(path, sf);
                cb();
            });
        } catch {
            this._pending.delete(path);
            cb();
        }
    }

    // 同步取已加载的 SpriteFrame; 未加载返回 null(调用方应回退白模)
    static get(path: string): SpriteFrame | null {
        return this._cache.get(path) ?? null;
    }

    static has(path: string): boolean {
        return this._cache.has(path);
    }
}
