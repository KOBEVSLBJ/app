// 窜天猴炮台 - 固定防守建筑, 自动锁定敌人抛物线开火
// 沙滩航模大战 V1.0

import { Component, Node, Graphics, Color, math } from 'cc';
import { GameConfig } from '../data/GameConfig';
import { Pseudo3D, WorldPos } from '../core/Pseudo3D';
import { ModelRenderer } from '../core/ModelRenderer';
import { Damageable } from '../core/Damageable';
import { Boat } from './Boat';

export class Turret extends Damageable {
    range: number = GameConfig.TURRET_RANGE;
    damage: number = GameConfig.TURRET_DAMAGE;
    cooldown: number = GameConfig.TURRET_COOLDOWN;
    projSpeed: number = GameConfig.TURRET_PROJ_SPEED;
    gravity: number = GameConfig.TURRET_GRAVITY;

    private _pos: WorldPos = { x: 0, y: 0, z: 0 };
    private _cooldown: number = 0;
    private _target: Damageable | null = null;
    private _barrelAngle: number = 0;
    private _graphics!: Graphics;
    private _getEnemies: (() => Damageable[]) | null = null;
    private _onFire: ((pos: WorldPos, vel: WorldPos, dmg: number, team: number, range: number) => void) | null = null;
    onDestroyCb: ((t: Turret) => void) | null = null;

    onLoad(): void {
        super.onLoad();
        this.maxHp = GameConfig.TURRET_HP;
        this._hp = this.maxHp;
        this.defense = GameConfig.TURRET_DEFENSE;
        this._setupVisual();
    }

    set position(wp: WorldPos) { this._pos = wp; this._updatePos(); }
    get position(): WorldPos { return this._pos; }

    setGetEnemies(fn: () => Damageable[]): void { this._getEnemies = fn; }
    setOnFire(fn: (pos: WorldPos, vel: WorldPos, dmg: number, team: number, range: number) => void): void {
        this._onFire = fn;
    }

    private _setupVisual(): void {
        const gNode = new Node('TurretGfx');
        this.node.addChild(gNode);
        this._graphics = gNode.addComponent(Graphics);
        this._redraw();
    }

    private _updatePos(): void {
        const screen = Pseudo3D.worldToScreen(this._pos);
        this.node.setPosition(screen.x, screen.y, 0);
    }

    private _redraw(): void {
        if (!this._graphics) return;
        this._graphics.clear();
        const c = this.team === 0 ? new Color(130, 100, 70) : new Color(70, 100, 130);
        ModelRenderer.drawTurret(this._graphics, c, this._barrelAngle);
        ModelRenderer.drawHpBar(this._graphics, -16, 18, 32, 3,
            this._hp / this.maxHp, Color.GREEN);
    }

    update(dt: number): void {
        if (this._dead) return;
        if (this._cooldown > 0) this._cooldown -= dt;
        this._findTarget();
        if (this._target && this._cooldown <= 0) {
            this._fire();
        }
        // 炮管缓动旋转
        this._redraw();
    }

    private _findTarget(): void {
        this._target = null;
        if (!this._getEnemies) return;
        const enemies = this._getEnemies();
        let bestDist = this.range * this.range;
        for (const e of enemies) {
            if (e.dead) continue;
            const ep = (e as any).position as WorldPos;
            if (!ep) continue;
            const dx = ep.x - this._pos.x;
            const dy = ep.y - this._pos.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist) {
                bestDist = d2;
                this._target = e;
            }
        }
    }

    private _fire(): void {
        if (!this._target) return;
        this._cooldown = this.cooldown;
        const tp = (this._target as any).position as WorldPos;
        const dx = tp.x - this._pos.x;
        const dy = tp.y - this._pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.1) return;
        const dir = { x: dx / dist, y: dy / dist, z: 0 };
        this._barrelAngle = Math.atan2(dir.x, -dir.y);

        // 抛物线解算
        const angle = this._calcFireAngle(dist);
        const launch = {
            x: dir.x * this.projSpeed * Math.cos(angle),
            y: dir.y * this.projSpeed * Math.cos(angle),
            z: this.projSpeed * Math.sin(angle),
        };
        if (this._onFire) {
            this._onFire(
                { x: this._pos.x + dir.x * 15, y: this._pos.y + dir.y * 15, z: 10 },
                launch, this.damage, this.team, this.range + 50
            );
        }
    }

    private _calcFireAngle(dist: number): number {
        const v2 = this.projSpeed * this.projSpeed;
        let val = dist * this.gravity * 30 / v2;
        val = Math.max(-1, Math.min(1, val));
        return Math.asin(val) / 2;
    }

    takeDamage(amount: number, source: string = "cannon"): void {
        super.takeDamage(amount, source);
        this._redraw();
    }

    protected onDestroyed(): void {
        if (this.onDestroyCb) this.onDestroyCb(this);
        this._graphics.clear();
        ModelRenderer.drawExplosion(this._graphics, 0, 0, 25);
        this.schedule(() => { this.node.destroy(); }, 0, 0, 0.3);
    }
}
