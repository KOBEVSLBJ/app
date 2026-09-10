// 战斗HUD - 双方信息
// 沙滩航模大战 V1.0

import { Component, Node, Graphics, Color, Label, UITransform } from 'cc';

export class BattleHUD extends Component {
    private _labelA!: Label;
    private _labelB!: Label;

    onLoad(): void {
        const w = 1280;
        // 左侧(A)
        const aNode = new Node('HUD_A');
        this.node.addChild(aNode);
        aNode.setPosition(-w / 2 + 10, 350, 0);
        this._labelA = aNode.addComponent(Label);
        this._labelA.fontSize = 14;
        this._labelA.color = new Color(255, 200, 150, 255);
        const at = aNode.addComponent(UITransform);
        at.setContentSize(600, 120);
        at.setAnchorPoint(0, 0.5);

        // 右侧(B)
        const bNode = new Node('HUD_B');
        this.node.addChild(bNode);
        bNode.setPosition(w / 2 - 10, 350, 0);
        this._labelB = bNode.addComponent(Label);
        this._labelB.fontSize = 14;
        this._labelB.color = new Color(150, 200, 255, 255);
        const bt = bNode.addComponent(UITransform);
        bt.setContentSize(600, 120);
        bt.setAnchorPoint(1, 0.5);

        // 控制说明
        const helpNode = new Node('Help');
        this.node.addChild(helpNode);
        helpNode.setPosition(0, -340, 0);
        const help = helpNode.addComponent(Label);
        help.text = 'A: WASD移动转向 空格开火 Tab切换船 | B: 方向键移动转向 回车开火 R切换船';
        help.fontSize = 12;
        help.color = new Color(180, 180, 180, 255);
        const ht = helpNode.addComponent(UITransform);
        ht.setContentSize(1200, 20);
        ht.setAnchorPoint(0.5, 0.5);
    }

    updateText(textA: string, textB: string): void {
        this._labelA.text = textA;
        this._labelB.text = textB;
    }
}
