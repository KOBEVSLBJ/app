// 航模 - 2D伪3D版(俯视+高度模拟)
// 沙滩航模大战 V1.0
//
// 移动逻辑:
// - 船在世界XZ平面移动(2D俯视)
// - 转向用旋转角度
// - 速度 = 马达速度 * (1 - 沙子惩罚)
// - 渲染时通过Pseudo3D变换到屏幕坐标

import { Component, Node, Graphics, Color, math } from 'cc';
import { GameConfig, CollisionLayer } from '../data/GameConfig';
import { PartData, BoatConfig } from '../data/PartData';
import { Pseudo3D, WorldPos } from '../core/Pseudo3D';
import { ModelRenderer } from '../core/ModelRenderer';
import { Damageable } from '../core/Damageable';

export class Boat extends Damageable {
    // 零件
    hull!: PartData;
    motor!: PartData;
    remote!: PartData;
    sand: PartData | null = null;
    cannon!: PartData;

    // 运行时
    private _pos: WorldPos = { x: 0, y: 0, z: 0 };
    private _angle: number = 0;      // 朝向(弧度, 0=朝-y方向)
    private _speed: number = 0;
    private _moveSpeed: number = 0;
    private _turnRate: number = 0;
    private _ramDamage: number = 0;
    private _cooldown: number = 0;

    // 输入
    inputThrottle: number = 0;   // -1~1
    inputTurn: number = 0;       // -1~1
    fireRequested: boolean = false;

    // 渲染
    private _graphics!: Graphics;
    private _selected: boolean = false;

    // 回调
    onFireCannon: ((boat: Boat, angle: number) => void) | null = null;
    onDestroyCb: ((boat: Boat) => void) | null = null;

    onLoad(): void {
        super.onLoad();
        this._computeStats();
        this._setupVisual();
    }

    private _computeStats(): void {
        this.maxHp = this.hull.hullHp!;
        this._hp = this.maxHp;
        this.defense = this.hull.hullDefense!;

        let penalty = 0;
        if (this.sand) {
            penalty = this.sand.sandSpeedPenalty!;
            this._ramDamage = this.sand.sandRamDamage!;
        }
        this._moveSpeed = this.motor.motorSpeed! * (1 - penalty);
        this._turnRate = this.remote.remoteTurnRate!;
    }

    private _setupVisual(): void {
        const gNode = new Node('BoatGfx');
        this.node.addChild(gNode);
        this._graphics = gNode.addComponent(Graphics);
        this._redraw();
    }

    set position(wp: WorldPos) { this._pos = wp; this._updateNodePos(); }
    get position(): WorldPos { return this._pos; }

    set angle(a: number) { this._angle = a; }
    get angle(): number { return this._angle; }

    set selected(v: boolean) {
        this._selected = v;
        this._redraw();
    }

    private _updateNodePos(): void {
        const screen = Pseudo3D.worldToScreen(this._pos);
        this.node.setPosition(screen.x, screen.y, 0);
    }

    update(dt: number): void {
        if (this._dead) return;
        if (this._cooldown > 0) this._cooldown -= dt;

        // 转向
        this._angle += this.inputTurn * this._turnRate * dt;

        // 加减速
        const target = this.inputThrottle * this._moveSpeed;
        const accel = this.motor.motorAccel!;
        if (Math.abs(target - this._speed) < accel * dt) {
            this._speed = target;
        } else {
            this._speed += Math.sign(target - this._speed) * accel * dt;
        }

        // 移动(朝-y方向前进, y增大=远离)
        const dx = Math.sin(this._angle) * this._speed * dt;
        const dy = -Math.cos(this._angle) * this._speed * dt;
        this._pos.x += dx;
        this._pos.y += dy;

        // 边界
        this._clampToWater();
        this._updateNodePos();

        // 开火
        if (this.fireRequested) {
            this.fireRequested = false;
            this.fire();
        }
    }

    private _clampToWater(): void {
        const rx = GameConfig.WATER_RX + 20;
        const ry = GameConfig.WATER_RZ + 20;
        const val = (this._pos.x * this._pos.x) / (rx * rx) +
                    (this._pos.y * this._pos.y) / (ry * ry);
        if (val > 1.0) {
            const ang = Math.atan2(this._pos.y, this._pos.x);
            this._pos.x = Math.cos(ang) * rx;
            this._pos.y = Math.sin(ang) * ry;
        }
    }

    fire(): void {
        if (this._cooldown > 0 || !this.cannon) return;
        this._cooldown = this.cannon.cannonCooldown!;
        if (this.onFireCannon) this.onFireCannon(this, this._angle);
    }

    get trajectoryPoints(): WorldPos[] {
        if (!this.cannon) return [];
        const points: WorldPos[] = [];
        const angle = this._angle;
        const launchAngle = Math.PI / 4; // 45度
        const spd = this.cannon.cannonProjSpeed!;
        // 水平方向速度
        const hSpeed = spd * Math.cos(launchAngle);
        const vSpeed = spd * Math.sin(launchAngle);
        // 起始位置
        let wx = this._pos.x + Math.sin(angle) * 15;
        let wy = this._pos.y - Math.cos(angle) * 15;
        let wz = 10;
        let vx = Math.sin(angle) * hSpeed;
        let vy = -Math.cos(angle) * hSpeed;
        let vz = vSpeed;
        const g = this.cannon.cannonGravity! * 30; // 缩放到像素
        const dt = 0.03;
        const maxT = this.cannon.cannonRange! / hSpeed * 2;
        let t = 0;
        while (t < maxT) {
            points.push({ x: wx, y: wy, z: wz });
            wx += vx * dt;
            wy += vy * dt;
            wz += vz * dt;
            vz -= g * dt;
            if (wz < 0) break;
            t += dt;
        }
        return points;
    }

    // 撞击
    handleRam(other: Boat): void {
        if (!other || other._dead) return;
        if (this._ramDamage > 0) {
            other.takeDamage(this._ramDamage, "ram");
        }
    }

    takeDamage(amount: number, source: string = "cannon"): void {
        super.takeDamage(amount, source);
        this._redraw();
    }

    private _redraw(): void {
        if (!this._graphics) return;
        this._graphics.clear();
        const c = this.team === 0 ? new Color(230, 200, 150) : new Color(150, 200, 230);
        ModelRenderer.drawBoat(this._graphics, c, 20);
        if (this._selected) {
            ModelRenderer.drawSelectionRing(this._graphics,
                this.team === 0 ? Color.YELLOW : Color.CYAN);
        }
        ModelRenderer.drawHpBar(this._graphics, -16, 22, 32, 4,
            this._hp / this.maxHp, this.team === 0 ? Color.GREEN : Color.RED);
    }

    protected onDestroyed(): void {
        if (this.onDestroyCb) this.onDestroyCb(this);
        // 销毁动画
        const g = this._graphics;
        if (g) {
            ModelRenderer.drawExplosion(g, 0, 0, 30);
        }
        this.schedule(() => {
            this.node.destroy();
        }, 0, 0, 0.3);
    }
}
