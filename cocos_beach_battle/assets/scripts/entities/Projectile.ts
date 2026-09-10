// 抛物线炮弹 - 2D伪3D(有高度z的2D飞行)
// 沙滩航模大战 V1.0
//
// 伪3D炮弹:
// - 在世界XZ平面移动 + Y轴飞行高度
// - 屏幕渲染: x=worldX, y=worldY*压缩 - z*高度
// - 阴影: x=worldX, y=worldY*压缩 (z=0平面)

import { Component, Node, Graphics, Color } from 'cc';
import { Pseudo3D, WorldPos } from '../core/Pseudo3D';
import { ModelRenderer } from '../core/ModelRenderer';

// 使用 any 避免 Boat ↔ Projectile 循环依赖
type DamageableLike = { dead: boolean; team: number; position: WorldPos; takeDamage(amount: number, source?: string): void };

export class Projectile extends Component {
    damage: number = 10;
    gravity: number = 9.8 * 30; // 像素缩放
    team: number = 0;
    range: number = 200;
    ownerTeam: number = 0;

    private _pos: WorldPos = { x: 0, y: 0, z: 0 };
    private _vel: WorldPos = { x: 0, y: 0, z: 0 };
    private _start: WorldPos = { x: 0, y: 0, z: 0 };
    private _alive: boolean = true;
    private _traveled: number = 0;
    private _graphics!: Graphics;
    private _shadowGfx!: Graphics;
    private _getTargets!: () => DamageableLike[];

    setup(dmg: number, vel: WorldPos, g: number, team: number, range: number, getTargets: () => DamageableLike[]): void {
        this.damage = dmg;
        this._vel = vel;
        this.gravity = g * 30;
        this.team = team;
        this.range = range;
        this.ownerTeam = team;
        this._getTargets = getTargets;
        this._start = { ...this._pos };
        this._alive = true;
    }

    set position(wp: WorldPos) {
        this._pos = wp;
        this._updateNodePos();
    }
    get position(): WorldPos { return this._pos; }

    onLoad(): void {
        const gfxNode = new Node('ProjGfx');
        this.node.addChild(gfxNode);
        this._graphics = gfxNode.addComponent(Graphics);

        const shadowNode = new Node('ProjShadow');
        this.node.addChild(shadowNode);
        this._shadowGfx = shadowNode.addComponent(Graphics);
    }

    private _updateNodePos(): void {
        const screen = Pseudo3D.worldToScreen(this._pos);
        const shadow = Pseudo3D.shadowPos(this._pos);
        this._graphics.node.setPosition(screen.x, screen.y, 0);
        this._shadowGfx.node.setPosition(shadow.x, shadow.y, 0);
    }

    update(dt: number): void {
        if (!this._alive) return;

        const prev = { ...this._pos };
        this._vel.z -= this.gravity * dt;
        this._pos.x += this._vel.x * dt;
        this._pos.y += this._vel.y * dt;
        this._pos.z += this._vel.z * dt;

        this._traveled = Pseudo3D.distanceXZ(this._pos, this._start);
        if (this._traveled > this.range || this._pos.z < 0) {
            this._destroy();
            return;
        }

        this._updateNodePos();
        this._redraw();

        // 碰撞检测
        this._checkCollision(prev);
    }

    private _checkCollision(prev: WorldPos): void {
        if (!this._getTargets) return;
        const targets = this._getTargets();
        for (const t of targets) {
            if (t.dead) continue;
            if (t.team === this.ownerTeam) continue;
            const tp = (t as any).position as WorldPos;
            if (!tp) continue;
            const dist = Pseudo3D.distanceXZ(this._pos, tp);
            if (dist < 25) {
                t.takeDamage(this.damage, "cannon");
                this._destroy();
                return;
            }
        }
    }

    private _redraw(): void {
        this._graphics.clear();
        ModelRenderer.drawProjectile(this._graphics, 0, 0);
        // 阴影
        this._shadowGfx.clear();
        this._shadowGfx.fillColor = new Color(0, 0, 0, 80);
        this._shadowGfx.circle(0, 0, 5);
        this._shadowGfx.fill();
    }

    private _destroy(): void {
        this._alive = false;
        // 爆炸效果
        this._graphics.clear();
        ModelRenderer.drawExplosion(this._graphics, 0, 0, 12);
        this.schedule(() => {
            this.node.destroy();
        }, 0, 0, 0.15);
    }
}
