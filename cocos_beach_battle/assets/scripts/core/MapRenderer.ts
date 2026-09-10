// 地图渲染器 - 绘制水面/沙滩/土堆/基地(静态背景层)
// 沙滩航模大战 V1.0 - Cocos 2D伪3D

import { Node, Graphics, Color } from 'cc';
import { GameConfig } from '../data/GameConfig';
import { ModelRenderer } from '../core/ModelRenderer';
import { Pseudo3D } from '../core/Pseudo3D';

export class MapRenderer {
    private _root: Node;
    private _bgGfx!: Graphics;

    constructor(parentNode: Node) {
        this._root = new Node('Map');
        parentNode.addChild(this._root);
        const bgNode = new Node('Background');
        this._root.addChild(bgNode);
        this._bgGfx = bgNode.addComponent(Graphics);
        this._drawBackground();
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
