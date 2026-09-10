// 航模 - 2D伪3D版(俯视+高度模拟)
// 沙滩航模大战 V1.0
//
// 移动逻辑:
// - 船在世界XZ平面移动(2D俯视)
// - 转向用旋转角度
// - 速度 = 马达速度 * (1 - 沙子惩罚)
// - 渲染时通过Pseudo3D变换到屏幕坐标

import { Component, Node, Graphics, Sprite, SpriteFrame, Color, math, UITransform } from 'cc';
import { GameConfig, CollisionLayer } from '../data/GameConfig';
import { PartData, BoatConfig } from '../data/PartData';
import { Pseudo3D, WorldPos } from '../core/Pseudo3D';
import { ModelRenderer } from '../core/ModelRenderer';
import { Damageable } from '../core/Damageable';
import { AssetLoader, KenneyAssets } from '../core/AssetLoader';

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
    private _sprite: Sprite | null = null;   // 船只俯视精灵(可能为空, 回退白模)
    private _useSprite: boolean = false;     // 是否已成功加载船只精灵
    private _selected: boolean = false;

    // 阵营染色(覆盖在精灵上, 区分玩家A/B)
    private static readonly TEAM_TINT_A = new Color(255, 200, 150, 255);
    private static readonly TEAM_TINT_B = new Color(150, 200, 255, 255);

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

        // 船只精灵节点(叠在 Graphics 之上, 朝向跟随 _angle)
        const sNode = new Node('BoatSprite');
        this.node.addChild(sNode);
        this._sprite = sNode.addComponent(Sprite);
        // Kenney 船图原尺寸较大, 缩放到约 38px 宽以匹配白模比例
        sNode.setScale(0.15, 0.15, 1);
        // 尝试立即套用(若资源已预加载); 否则等 GameManager ready 后调用
        this.applySpriteFrame();
        this._redraw();
    }

    // 从 AssetLoader 取对应阵营的船只 SpriteFrame 套用
    applySpriteFrame(): void {
        if (!this._sprite) return;
        const path = this.team === 0 ? KenneyAssets.SHIP_A : KenneyAssets.SHIP_B;
        const sf = AssetLoader.get(path);
        if (sf) {
            this._sprite.spriteFrame = sf;
            this._sprite.color = this.team === 0 ? Boat.TEAM_TINT_A : Boat.TEAM_TINT_B;
            this._useSprite = true;
            this._redraw();
        }
    }

    set position(wp: WorldPos) { this._pos = wp; this._updateNodePos(); }
    get position(): WorldPos { return this._pos; }

    set angle(a: number) { this._angle = a; this._updateSpriteRotation(); }
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
        this._updateSpriteRotation();

        // 开火
        if (this.fireRequested) {
            this.fireRequested = false;
            this.fire();
        }
    }

    // 精灵朝向跟随 _angle (假设 Kenney 船图船头朝 -y/上, angle=0 不旋转)
    // 若实际朝向偏移, 调整 SHIP_ANGLE_OFFSET 即可
    private static readonly SHIP_ANGLE_OFFSET: number = 0;
    private _updateSpriteRotation(): void {
        if (!this._sprite) return;
        const deg = math.radToDeg(this._angle) + Boat.SHIP_ANGLE_OFFSET;
        this._sprite.node.setRotationFromEuler(0, 0, deg);
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
        if (this._useSprite) {
            // 已用船只精灵: Graphics 仅画阴影 + 选中框 + 血条(船身由精灵渲染)
            this._graphics.fillColor = new Color(0, 0, 0, 80);
            this._graphics.ellipse(0, 0, 24, 10);
            this._graphics.fill();
        } else {
            // 回退白模: 完整程序化船身
            const c = this.team === 0 ? new Color(230, 200, 150) : new Color(150, 200, 230);
            ModelRenderer.drawBoat(this._graphics, c, 20);
        }
        if (this._selected) {
            ModelRenderer.drawSelectionRing(this._graphics,
                this.team === 0 ? Color.YELLOW : Color.CYAN);
        }
        ModelRenderer.drawHpBar(this._graphics, -16, 22, 32, 4,
            this._hp / this.maxHp, this.team === 0 ? Color.GREEN : Color.RED);
    }

    protected onDestroyed(): void {
        if (this.onDestroyCb) this.onDestroyCb(this);
        // 销毁动画: 优先用爆炸精灵, 否则回退程序化爆炸
        const sf = AssetLoader.get(KenneyAssets.EXPLOSION_1);
        if (sf && this._sprite) {
            this._sprite.spriteFrame = sf;
            this._sprite.color = Color.WHITE;
            this._sprite.node.setScale(0.25, 0.25, 1); // 爆炸图放大
            this._graphics.clear();
        } else {
            const g = this._graphics;
            if (g) ModelRenderer.drawExplosion(g, 0, 0, 30);
        }
        this.schedule(() => {
            this.node.destroy();
        }, 0, 0, 0.3);
    }
}
