// 基地 - 仅受火炮伤害, 血量归0触发胜负
// 沙滩航模大战 V1.0

import { Node, Graphics, Sprite, Color } from 'cc';
import { GameConfig } from '../data/GameConfig';
import { Pseudo3D, WorldPos } from '../core/Pseudo3D';
import { ModelRenderer } from '../core/ModelRenderer';
import { Damageable } from '../core/Damageable';
import { AssetLoader, KenneyAssets } from '../core/AssetLoader';

export class Base extends Damageable {
    private _pos: WorldPos = { x: 0, y: 0, z: 0 };
    private _graphics!: Graphics;
    private _flagSprite: Sprite | null = null;
    private _poleSprite: Sprite | null = null;
    onDestroyCb: ((base: Base) => void) | null = null;

    onLoad(): void {
        super.onLoad();
        this.isBase = true;
        this.maxHp = GameConfig.BASE_HP;
        this._hp = this.maxHp;
        this.defense = GameConfig.BASE_DEFENSE;
        this._setupVisual();
    }

    set position(wp: WorldPos) { this._pos = wp; this._updatePos(); }
    get position(): WorldPos { return this._pos; }

    private _setupVisual(): void {
        const gNode = new Node('BaseGfx');
        this.node.addChild(gNode);
        this._graphics = gNode.addComponent(Graphics);

        // 旗杆 sprite(在建筑顶上方)
        // Kenney pole.png 64x64, 缩放到约 8x40 像素(细长旗杆)
        const poleNode = new Node('PoleSprite');
        this.node.addChild(poleNode);
        poleNode.setPosition(0, 60, 0); // 建筑顶部
        this._poleSprite = poleNode.addComponent(Sprite);
        poleNode.setScale(0.12, 0.6, 1);
        this._applyPole();

        // 旗帜 sprite(旗杆上方, 阵营染色)
        const flagNode = new Node('FlagSprite');
        this.node.addChild(flagNode);
        flagNode.setPosition(6, 85, 0); // 旗杆右侧上方
        this._flagSprite = flagNode.addComponent(Sprite);
        flagNode.setScale(0.25, 0.2, 1);
        this._applyFlag();

        this._redraw();
    }

    // 套用旗杆精灵
    private _applyPole(): void {
        if (!this._poleSprite) return;
        const sf = AssetLoader.get(KenneyAssets.POLE);
        if (sf) {
            this._poleSprite.spriteFrame = sf;
            this._poleSprite.color = new Color(120, 100, 80, 255);
        }
    }

    // 套用旗帜精灵 + 阵营染色
    private _applyFlag(): void {
        if (!this._flagSprite) return;
        const path = this.team === 0 ? KenneyAssets.FLAG_1 : KenneyAssets.FLAG_2;
        const sf = AssetLoader.get(path);
        if (sf) {
            this._flagSprite.spriteFrame = sf;
            this._flagSprite.color = this.team === 0
                ? new Color(230, 180, 120, 255)  // 暖色 A
                : new Color(120, 180, 230, 255); // 冷色 B
        }
    }

    // 资源就绪后补套旗帜
    applySprites(): void {
        this._applyPole();
        this._applyFlag();
    }

    private _updatePos(): void {
        const screen = Pseudo3D.worldToScreen(this._pos);
        this.node.setPosition(screen.x, screen.y, 0);
    }

    private _redraw(): void {
        if (!this._graphics) return;
        this._graphics.clear();
        const c = this.team === 0 ? new Color(217, 180, 127) : new Color(127, 180, 217);
        ModelRenderer.drawBase(this._graphics, c, GameConfig.BASE_WIDTH, GameConfig.BASE_HEIGHT, 50);
        ModelRenderer.drawHpBar(this._graphics,
            -GameConfig.BASE_WIDTH / 2, 20,
            GameConfig.BASE_WIDTH, 6,
            this._hp / this.maxHp, Color.GREEN);
    }

    takeDamage(amount: number, source: string = "cannon"): void {
        super.takeDamage(amount, source);
        this._redraw();
    }

    protected onDestroyed(): void {
        if (this.onDestroyCb) this.onDestroyCb(this);
        // 基地被毁: 旗杆倾倒+旗帜消失, 建筑画爆炸
        if (this._flagSprite) this._flagSprite.node.active = false;
        if (this._poleSprite) {
            this._poleSprite.node.setRotationFromEuler(0, 0, 70); // 倾倒
        }
        // 优先用爆炸 sprite 覆盖建筑主体
        const sf = AssetLoader.get(KenneyAssets.EXPLOSION_2);
        if (sf && this._flagSprite) {
            // 复用 flag 节点位置画大爆炸
            this._flagSprite.node.active = true;
            this._flagSprite.spriteFrame = sf;
            this._flagSprite.color = Color.WHITE;
            this._flagSprite.node.setPosition(0, 20, 0);
            this._flagSprite.node.setScale(0.5, 0.5, 1);
            this._graphics.clear();
        } else {
            this._graphics.clear();
            ModelRenderer.drawExplosion(this._graphics, 0, 0, 40);
        }
    }
}
