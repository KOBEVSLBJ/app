// 音频管理器 - 加载和播放音效(炮声/爆炸/命中)
// 沙滩航模大战 V1.0 - Cocos 2D伪3D
//
// 设计:
// - 单例, 挂载在持久节点上
// - 启动时预加载所有 .ogg 音效
// - 提供 play(name) 接口, 找不到音效静默跳过
// - 复用单个 AudioSource + playOneShot 避免实例化多个组件

import { Component, Node, AudioClip, AudioSource, resources } from 'cc';

// 音效路径常量(.ogg 放在 assets/resources/audio/)
export const SfxPaths = {
    CANNON_FIRE: 'audio/cannon_fire',
    EXPLOSION: 'audio/explosion',
    HIT: 'audio/hit',
    BOAT_DESTROYED: 'audio/boat_destroyed',
};

// 音效别名 → 加载路径
const SFX_MAP: { [name: string]: string } = {
    'cannon_fire': SfxPaths.CANNON_FIRE,
    'explosion': SfxPaths.EXPLOSION,
    'hit': SfxPaths.HIT,
    'boat_destroyed': SfxPaths.BOAT_DESTROYED,
};

export class AudioManager extends Component {
    private _clips: Map<string, AudioClip> = new Map();
    private _source!: AudioSource;
    private _ready: boolean = false;

    onLoad(): void {
        // 用 unknown 中转绕过 cc 类型声明的 protected 限制(运行时 Cocos 正常)
        this._source = this.node.addComponent(AudioSource as unknown as { new (): Component }) as unknown as AudioSource;
        this._source.volume = 0.7;
        this._preloadAll();
    }

    // 预加载所有音效
    private _preloadAll(): void {
        const entries = Object.entries(SFX_MAP);
        let loaded = 0;
        for (const [name, path] of entries) {
            resources.load(path, AudioClip, (err, clip) => {
                loaded++;
                if (!err && clip) {
                    this._clips.set(name, clip);
                }
                if (loaded >= entries.length) {
                    this._ready = true;
                }
            });
        }
    }

    // 播放音效(找不到静默跳过)
    play(name: string, volumeScale: number = 1): void {
        if (!this._ready) return;
        const clip = this._clips.get(name);
        if (clip && this._source) {
            this._source.playOneShot(clip, volumeScale);
        }
    }

    // 快捷方法
    playCannonFire(): void { this.play('cannon_fire', 0.8); }
    playExplosion(): void { this.play('explosion', 1); }
    playHit(): void { this.play('hit', 0.6); }
    playBoatDestroyed(): void { this.play('boat_destroyed', 1); }
}
