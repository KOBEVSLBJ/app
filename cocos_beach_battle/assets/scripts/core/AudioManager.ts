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
    // 背景音乐(放入 assets/resources/audio/bgm.ogg 即可启用, 无则静默)
    BGM: 'audio/bgm',
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
    private _bgmSource: AudioSource | null = null;
    private _ready: boolean = false;

    onLoad(): void {
        // 用 unknown 中转绕过 cc 类型声明的 protected 限制(运行时 Cocos 正常)
        this._source = this.node.addComponent(AudioSource as unknown as { new (): Component }) as unknown as AudioSource;
        this._source.volume = 0.7;
        this._preloadAll();
    }

    // 预加载背景音乐(单独的 BGM AudioSource 循环播放)
    private _loadBgm(): void {
        resources.load(SfxPaths.BGM, AudioClip, (err, clip) => {
            if (err || !clip) return; // 无 BGM 文件, 静默跳过
            // 创建独立 BGM AudioSource
            const bgmNode = new Node('BgmSource');
            this.node.addChild(bgmNode);
            this._bgmSource = bgmNode.addComponent(AudioSource as unknown as { new (): Component }) as unknown as AudioSource;
            this._bgmSource.clip = clip;
            this._bgmSource.volume = 0.35;
            this._bgmSource.loop = true;
            this._bgmSource.play();
        });
    }

    // 设置 BGM 音量(0~1)
    setBgmVolume(v: number): void {
        if (this._bgmSource) this._bgmSource.volume = v;
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
                    this._loadBgm(); // 音效加载完后再加载 BGM
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
