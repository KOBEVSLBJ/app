// 基地 - 仅受火炮伤害, 血量归0触发胜负
// 沙滩航模大战 V1.0

import { Node, Graphics, Color } from 'cc';
import { GameConfig } from '../data/GameConfig';
import { Pseudo3D, WorldPos } from '../core/Pseudo3D';
import { ModelRenderer } from '../core/ModelRenderer';
import { Damageable } from '../core/Damageable';

export class Base extends Damageable {
    private _pos: WorldPos = { x: 0, y: 0, z: 0 };
    private _graphics!: Graphics;
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
        this._redraw();
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
        this._graphics.clear();
        ModelRenderer.drawExplosion(this._graphics, 0, 0, 40);
    }
}
