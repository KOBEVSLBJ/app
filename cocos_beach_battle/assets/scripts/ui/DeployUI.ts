// 部署阶段UI - 提示文字 + 确认按钮
// 沙滩航模大战 V1.0

import { Component, Node, Graphics, Color, Label, Button, UITransform } from 'cc';

export class DeployUI extends Component {
    private _infoLabel!: Label;
    onConfirmed: (() => void) | null = null;

    onLoad(): void {
        const w = 1280, h = 720;
        const bg = this.node.addComponent(Graphics);
        bg.fillColor = new Color(20, 30, 50, 180);
        bg.roundRect(-300, -h / 2 + 100, 600, 120, 10);
        bg.fill();

        const title = this.node.addComponent(Label);
        title.text = '部署阶段';
        title.fontSize = 28;
        title.color = Color.WHITE;
        this.node.setPosition(0, h / 2 - 140, 0);
        const tt = this.node.addComponent(UITransform);
        tt.setContentSize(600, 40);
        tt.setAnchorPoint(0.5, 0.5);

        const infoNode = new Node('Info');
        this.node.addChild(infoNode);
        this._infoLabel = infoNode.addComponent(Label);
        this._infoLabel.fontSize = 18;
        this._infoLabel.color = Color.CYAN;
        infoNode.setPosition(0, h / 2 - 180, 0);
        const it = infoNode.addComponent(UITransform);
        it.setContentSize(800, 80);
        it.setAnchorPoint(0.5, 0.5);

        const btnNode = new Node('Confirm');
        this.node.addChild(btnNode);
        const g = btnNode.addComponent(Graphics);
        g.fillColor = new Color(60, 80, 120, 255);
        g.roundRect(-100, -20, 200, 40, 5);
        g.fill();
        const btn = btnNode.addComponent(Button);
        btn.node.on('click', () => { if (this.onConfirmed) this.onConfirmed(); }, this);
        const lbl = btnNode.addComponent(Label);
        lbl.text = '确认部署 → 战斗';
        lbl.fontSize = 18;
        lbl.color = Color.WHITE;
        btnNode.setPosition(0, h / 2 - 240, 0);
    }

    setInfo(text: string): void {
        this._infoLabel.text = text;
    }
}
