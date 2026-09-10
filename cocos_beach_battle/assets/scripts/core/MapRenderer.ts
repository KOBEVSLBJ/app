// 地图渲染器 - 绘制水面/沙滩/土堆/基地(静态背景层)
// 沙滩航模大战 V1.0 - Cocos 2D伪3D

import { Node, Graphics, Sprite, Color } from 'cc';
import { GameConfig } from '../data/GameConfig';
import { ModelRenderer } from '../core/ModelRenderer';
import { Pseudo3D } from '../core/Pseudo3D';
import { AssetLoader, KenneyAssets } from '../core/AssetLoader';

export class MapRenderer {
    private _root: Node;
    private _bgGfx!: Graphics;
    private _waterTilesNode!: Node;

    constructor(parentNode: Node) {
        this._root = new Node('Map');
        parentNode.addChild(this._root);
        const bgNode = new Node('Background');
        this._root.addChild(bgNode);
        this._bgGfx = bgNode.addComponent(Graphics);
        this._drawBackground();

        // 水面 tile 层(在背景之上, 水域中心平铺)
        this._waterTilesNode = new Node('WaterTiles');
        this._root.addChild(this._waterTilesNode);
        this._placeWaterTiles();
        // 左右沙滩 tile 层
        this._placeSandTiles();
    }

    // 左右沙滩贴 custom tile(交错排列)
    private _placeSandTiles(): void {
        const sf = AssetLoader.getWithFallback(KenneyAssets.TILE_SAND, KenneyAssets.TILE_SAND_FALLBACK);
        if (!sf) return;
        const isCustom = AssetLoader.has(KenneyAssets.TILE_SAND);
        const tileW = 128;
        const tileH = 64 * GameConfig.PERSPECTIVE_Y;
        const overlapY = tileH * 0.15;
        const stepY = tileH - overlapY;
        // 左沙滩: x 中心 -360, 宽度 SAND_WIDTH*2
        // 右沙滩: x 中心 +360
        for (const side of [-1, 1]) {
            const cx = side * 360;
            const cols = 2;
            const rows = 4;
            const startX = cx - (cols * tileW) / 2 + tileW / 2;
            const startY = -(rows * stepY) / 2 + stepY / 2;
            for (let r = 0; r < rows; r++) {
                const xOff = (r % 2) * (tileW / 2);
                for (let c = 0; c < cols; c++) {
                    const n = new Node(`st_${side}_${r}_${c}`);
                    this._waterTilesNode.addChild(n);
                    n.setPosition(startX + c * tileW + xOff, startY + r * stepY, 0);
                    const sp = n.addComponent(Sprite);
                    sp.spriteFrame = sf;
                    sp.color = isCustom ? new Color(255, 255, 255, 230)
                                        : new Color(220, 190, 130, 230);
                    n.setScale(tileW / 64, tileH / 64, 1);
                }
            }
        }
    }

    // 水域中心平铺水面 tile(优先 custom, 回退 Kenney)
    // 交错排列掩盖垂直接缝, 每行水平偏移半张, 轻微重叠盖住接缝
    private _placeWaterTiles(): void {
        const sf = AssetLoader.getWithFallback(KenneyAssets.TILE_WATER, KenneyAssets.TILE_WATER_FALLBACK);
        if (!sf) return; // 资源未就绪, 回退纯程序化水面
        const isCustom = AssetLoader.has(KenneyAssets.TILE_WATER);
        const tileW = 128;
        const tileH = (isCustom ? 64 : 64) * GameConfig.PERSPECTIVE_Y;
        const cols = 8;
        const rows = 3;
        const overlapY = tileH * 0.15; // 垂直重叠 15% 盖接缝
        const stepY = tileH - overlapY;
        const startX = -(cols * tileW) / 2 + tileW / 2;
        const startY = -(rows * stepY) / 2 + stepY / 2;
        for (let r = 0; r < rows; r++) {
            // 奇数行水平偏移半张, 交错排列掩盖垂直接缝
            const xOff = (r % 2) * (tileW / 2);
            for (let c = 0; c < cols; c++) {
                const n = new Node(`wt_${r}_${c}`);
                this._waterTilesNode.addChild(n);
                n.setPosition(startX + c * tileW + xOff, startY + r * stepY, 0);
                const sp = n.addComponent(Sprite);
                sp.spriteFrame = sf;
                // custom 图已含水面色, 不 tint; Kenney 才偏蓝 tint
                sp.color = isCustom ? new Color(255, 255, 255, 220)
                                    : new Color(60, 130, 190, 200);
                n.setScale(tileW / 64, tileH / 64, 1);
            }
        }
    }

    // 资源加载完成后补铺水面+沙滩 tile(GameManager 调用)
    refreshTiles(): void {
        if (this._waterTilesNode.children.length > 0) return;
        this._placeWaterTiles();
        this._placeSandTiles();
    }

    private _drawBackground(): void {
        const g = this._bgGfx;
        g.clear();

        // 整体底色(天)
        g.fillColor = new Color(100, 160, 200, 255);
        g.rect(-640, -360, 1280, 720);
        g.fill();

        // 水域椭圆
        g.fillColor = new Color(40, 110, 180, 255);
        g.ellipse(0, 0, GameConfig.WATER_RX * 2, GameConfig.WATER_RZ * GameConfig.PERSPECTIVE_Y * 2);
        g.fill();

        // 简易波浪
        g.strokeColor = new Color(70, 140, 200, 200);
        g.lineWidth = 1;
        for (let i = -4; i <= 4; i++) {
            const y = i * 30;
            g.moveTo(-GameConfig.WATER_RX, y);
            for (let x = -GameConfig.WATER_RX; x <= GameConfig.WATER_RX; x += 15) {
                g.lineTo(x, y + Math.sin(x * 0.03) * 2);
            }
        }
        g.stroke();

        // 左侧沙滩
        ModelRenderer.drawSand(g, -360, GameConfig.SAND_WIDTH * 2, 720);
        // 右侧沙滩
        ModelRenderer.drawSand(g, 360, GameConfig.SAND_WIDTH * 2, 720);
    }

    get root(): Node { return this._root; }
}
