// 土堆 - 静态障碍物, 阻挡船只和炮弹
// 沙滩航模大战 V1.0

import { Node, Graphics, Sprite, Color } from 'cc';
import { Pseudo3D, WorldPos } from '../core/Pseudo3D';
import { ModelRenderer } from '../core/ModelRenderer';
import { AssetLoader, KenneyAssets } from '../core/AssetLoader';

export class Mound {
    pos: WorldPos;
    node: Node;
    radius: number = 22;
    private _sprite: Sprite | null = null;
    private _graphics!: Graphics;

    constructor(parentNode: Node, wp: WorldPos) {
        this.pos = wp;
        this.node = new Node('Mound');
        parentNode.addChild(this.node);
        const gNode = new Node('MoundGfx');
        this.node.addChild(gNode);
        this._graphics = gNode.addComponent(Graphics);
        // 精灵节点(叠在 Graphics 阴影上)
        const sNode = new Node('MoundSprite');
        this.node.addChild(sNode);
        this._sprite = sNode.addComponent(Sprite);
        sNode.setScale(0.35, 0.18, 1); // 64x64 压成椭圆俯视土堆 ~22x11
        sNode.setPosition(0, 0, 0);
        this.applySprite();
        // 资源未加载时回退程序化土堆
        if (!this._sprite.spriteFrame) {
            ModelRenderer.drawMound(this._graphics);
        } else {
            // 已加载: 仅画阴影
            this._graphics.fillColor = new Color(0, 0, 0, 70);
            this._graphics.ellipse(2, 2, 24, 9);
            this._graphics.fill();
        }
        const screen = Pseudo3D.worldToScreen(wp);
        this.node.setPosition(screen.x, screen.y, 0);
    }

    // 套用 nest 精灵(若资源已加载)
    applySprite(): void {
        if (!this._sprite) return;
        const sf = AssetLoader.get(KenneyAssets.NEST);
        if (sf) {
            this._sprite.spriteFrame = sf;
            this._sprite.color = new Color(180, 150, 100, 255); // 沙色 tint
        }
    }

    // 资源就绪后补套+重绘阴影
    refresh(): void {
        if (this._sprite && this._sprite.spriteFrame) return;
        this.applySprite();
        if (this._sprite && this._sprite.spriteFrame && this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(0, 0, 0, 70);
            this._graphics.ellipse(2, 2, 24, 9);
            this._graphics.fill();
        }
    }

    // 碰撞检测(圆)
    contains(x: number, y: number): boolean {
        const dx = x - this.pos.x;
        const dy = y - this.pos.y;
        return (dx * dx + dy * dy) < (this.radius * this.radius);
    }

    // 射线检测(是否遮挡)
    blocksRay(from: WorldPos, to: WorldPos): boolean {
        // 简易: 检查线段是否经过土堆圆
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.1) return false;
        const ux = dx / len;
        const uy = dy / len;
        // 投影
        const t = ((this.pos.x - from.x) * ux + (this.pos.y - from.y) * uy);
        if (t < 0 || t > len) return false;
        const closestX = from.x + ux * t;
        const closestY = from.y + uy * t;
        const dist = Math.sqrt((closestX - this.pos.x) ** 2 + (closestY - this.pos.y) ** 2);
        return dist < this.radius;
    }

    destroy(): void {
        this.node.destroy();
    }
}
