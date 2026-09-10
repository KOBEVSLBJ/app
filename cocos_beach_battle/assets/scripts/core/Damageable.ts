// 可受伤基类 - 船/炮台/基地共用
// 沙滩航模大战 V1.0 - Cocos 2D伪3D

import { Component } from 'cc';

export abstract class Damageable extends Component {
    maxHp: number = 100;
    defense: number = 0;
    isBase: boolean = false;
    team: number = 0;

    protected _hp: number = 100;
    protected _dead: boolean = false;

    onLoad(): void {
        this._hp = this.maxHp;
    }

    get hp(): number { return this._hp; }
    get dead(): boolean { return this._dead; }

    // 受到伤害, source: "cannon" | "ram"
    takeDamage(amount: number, source: string = "cannon"): void {
        if (this._dead) return;
        if (this.isBase && source !== "cannon") return;
        const dmg = amount * (1 - this.defense);
        this._hp -= dmg;
        if (this._hp <= 0) {
            this._hp = 0;
            this._dead = true;
            this.onDestroyed();
        }
    }

    protected abstract onDestroyed(): void;
}
