// 土堆 - 静态障碍物, 阻挡船只和炮弹
// 沙滩航模大战 V1.0

import { Node, Graphics } from 'cc';
import { Pseudo3D, WorldPos } from '../core/Pseudo3D';
import { ModelRenderer } from '../core/ModelRenderer';

export class Mound {
    pos: WorldPos;
    node: Node;
    radius: number = 22;

    constructor(parentNode: Node, wp: WorldPos) {
        this.pos = wp;
        this.node = new Node('Mound');
        parentNode.addChild(this.node);
        const gNode = new Node('MoundGfx');
        this.node.addChild(gNode);
        const g = gNode.addComponent(Graphics);
        ModelRenderer.drawMound(g);
        const screen = Pseudo3D.worldToScreen(wp);
        this.node.setPosition(screen.x, screen.y, 0);
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
