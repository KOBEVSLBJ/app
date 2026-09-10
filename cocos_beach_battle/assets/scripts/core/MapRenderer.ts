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
    }

    // 水域中心平铺水面 tile(6x2=12 个, 每个 128x64, 覆盖 768x128)
    private _placeWaterTiles(): void {
        const sf = AssetLoader.get(KenneyAssets.TILE_WATER);
        if (!sf) return; // 资源未就绪, 回退纯程序化水面
        const tileW = 128;
        const tileH = 64 * GameConfig.PERSPECTIVE_Y; // Y 轴压缩匹配伪3D
        const cols = 6;
        const rows = 2;
        const startX = -(cols * tileW) / 2 + tileW / 2;
        const startY = -(rows * tileH) / 2 + tileH / 2;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const n = new Node(`wt_${r}_${c}`);
                this._waterTilesNode.addChild(n);
                n.setPosition(startX + c * tileW, startY + r * tileH, 0);
                const sp = n.addComponent(Sprite);
                sp.spriteFrame = sf;
                sp.color = new Color(60, 130, 190, 200); // 偏蓝, 与程序化水面融合
                n.setScale(tileW / 64, tileH / 64, 1);   // 64x64 原图 → 128x29
            }
        }
    }

    // 资源加载完成后补铺水面 tile(GameManager 调用)
    refreshTiles(): void {
        if (this._waterTilesNode.children.length > 0) return;
        this._placeWaterTiles();
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
