// 结算UI - 胜负面板 + 重启
// 沙滩航模大战 V1.0

import { Component, Node, Graphics, Color, Label, Button, UITransform } from 'cc';

export class ResultUI extends Component {
    onRestart: (() => void) | null = null;

    onLoad(): void {
        const w = 1280, h = 720;
        const bg = this.node.addComponent(Graphics);
        bg.fillColor = new Color(0, 0, 0, 180);
        bg.rect(-w / 2, -h / 2, w, h);
        bg.fill();

        const titleNode = new Node('Title');
        this.node.addChild(titleNode);
        const title = titleNode.addComponent(Label);
        title.text = '';
        title.fontSize = 64;
        title.color = Color.WHITE;
        titleNode.setPosition(0, 50, 0);
        const tt = titleNode.addComponent(UITransform);
        tt.setContentSize(600, 80);
        tt.setAnchorPoint(0.5, 0.5);

        const btnNode = new Node('Btn');
        this.node.addChild(btnNode);
        const g = btnNode.addComponent(Graphics);
        g.fillColor = new Color(60, 80, 120, 255);
        g.roundRect(-120, -30, 240, 60, 8);
        g.fill();
        const btn = btnNode.addComponent(Button);
        btn.node.on('click', () => { if (this.onRestart) this.onRestart(); }, this);
        const lbl = btnNode.addComponent(Label);
        lbl.text = '重新开始';
        lbl.fontSize = 24;
        lbl.color = Color.WHITE;
        btnNode.setPosition(0, -80, 0);
    }

    setWinner(winner: number): void {
        const title = this.node.getChildByName('Title')!.getComponent(Label)!;
        if (winner === 0) {
            title.text = '玩家 A 胜利！';
            title.color = new Color(255, 200, 100);
        } else {
            title.text = '玩家 B 胜利！';
            title.color = new Color(100, 200, 255);
        }
    }
}
