// 拼装阶段UI - 零件选择/预算校验/舰队配置
// 沙滩航模大战 V1.0 - Cocos 2D伪3D

import { Component, Node, Graphics, Color, Label, Button, Vec2, UITransform } from 'cc';
import { GameConfig } from '../data/GameConfig';
import { PartData, PartType, BoatConfig, getCatalog, PartsCatalog } from '../data/PartData';

export class BuildUI extends Component {
    private _player: number = 0;
    private _fleet: BoatConfig[] = [];

    // 当前选中零件索引
    private _selHull: number = 0;
    private _selMotor: number = 0;
    private _selRemote: number = 0;
    private _selSand: number = -1;
    private _selCannon: number = 0;

    private _budgetLabel!: Label;
    private _previewLabel!: Label;
    private _fleetLabel!: Label;
    private _confirmBtn!: Button;

    onConfirmed: ((fleet: BoatConfig[], player: number) => void) | null = null;

    onLoad(): void {
        this._player = this.node.name.includes('B') ? 1 : 0;
        this._buildUI();
    }

    private _buildUI(): void {
        const w = 1280;
        const h = 720;

        // 背景面板
        const bgNode = new Node('BG');
        this.node.addChild(bgNode);
        const bg = bgNode.addComponent(Graphics);
        bg.fillColor = new Color(20, 30, 50, 220);
        bg.rect(-w / 2, -h / 2, w, h);
        bg.fill();
        bg.fillColor = new Color(40, 50, 70, 255);
        bg.rect(-w / 2, h / 2 - 80, w, 80);
        bg.fill();

        // 标题
        const titleNode = new Node('Title');
        this.node.addChild(titleNode);
        const title = titleNode.addComponent(Label);
        title.text = `拼装阶段 - 玩家 ${this._player === 0 ? 'A' : 'B'}`;
        title.fontSize = 36;
        title.color = Color.WHITE;
        titleNode.setPosition(0, h / 2 - 50, 0);
        const tt = titleNode.addComponent(UITransform);
        tt.setContentSize(600, 50);
        tt.setAnchorPoint(0.5, 0.5);

        // 预算标签
        const budgetNode = new Node('Budget');
        this.node.addChild(budgetNode);
        this._budgetLabel = budgetNode.addComponent(Label);
        this._budgetLabel.fontSize = 22;
        this._budgetLabel.color = Color.YELLOW;
        budgetNode.setPosition(0, h / 2 - 120, 0);
        const bt = budgetNode.addComponent(UITransform);
        bt.setContentSize(1000, 40);
        bt.setAnchorPoint(0.5, 0.5);

        // 零件选择列
        const partTypes = [
            { name: '船身', type: PartType.HULL, sel: '_selHull' as keyof BuildUI },
            { name: '马达', type: PartType.MOTOR, sel: '_selMotor' as keyof BuildUI },
            { name: '遥控', type: PartType.REMOTE, sel: '_selRemote' as keyof BuildUI },
            { name: '沙子', type: PartType.SAND, sel: '_selSand' as keyof BuildUI },
            { name: '火炮', type: PartType.CANNON, sel: '_selCannon' as keyof BuildUI },
        ];
        const colW = 220;
        const startX = -(colW * partTypes.length) / 2 + colW / 2;
        for (let i = 0; i < partTypes.length; i++) {
            const pt = partTypes[i];
            const col = this._makePartColumn(pt.name, pt.type, pt.sel, startX + i * colW);
        }

        // 当前船预览
        const previewNode = new Node('Preview');
        this.node.addChild(previewNode);
        this._previewLabel = previewNode.addComponent(Label);
        this._previewLabel.fontSize = 18;
        this._previewLabel.color = Color.WHITE;
        previewNode.setPosition(0, -100, 0);
        const pt2 = previewNode.addComponent(UITransform);
        pt2.setContentSize(1200, 40);
        pt2.setAnchorPoint(0.5, 0.5);

        // 添加船按钮
        const addBtnNode = this._makeButton('addBtn', '添加此船到舰队', -80, -180);
        addBtnNode.addComponent(Button);
        const addBtn = addBtnNode.getComponent(Button)!;
        addBtn.node.on('click', this._onAddBoat, this);

        // 舰队列表
        const fleetNode = new Node('Fleet');
        this.node.addChild(fleetNode);
        this._fleetLabel = fleetNode.addComponent(Label);
        this._fleetLabel.fontSize = 16;
        this._fleetLabel.color = Color.WHITE;
        fleetNode.setPosition(0, -240, 0);
        const ft = fleetNode.addComponent(UITransform);
        ft.setContentSize(1200, 200);
        ft.setAnchorPoint(0.5, 0.5);

        // 确认按钮
        const confirmNode = this._makeButton('confirmBtn', '确认舰队 → 部署', 200, -180);
        this._confirmBtn = confirmNode.addComponent(Button);
        this._confirmBtn.node.on('click', this._onConfirm, this);

        this._refresh();
    }

    private _makePartColumn(title: string, type: PartType, prop: keyof BuildUI, x: number): Node {
        const col = new Node(`col_${title}`);
        this.node.addChild(col);
        col.setPosition(x, 50, 0);

        // 标题
        const lblNode = new Node('lbl');
        col.addChild(lblNode);
        const lbl = lblNode.addComponent(Label);
        lbl.text = title;
        lbl.fontSize = 18;
        lbl.color = Color.CYAN;
        lblNode.setPosition(0, 60, 0);

        // 零件列表(文字列表)
        const catalog = getCatalog(type);
        const isSand = type === PartType.SAND;
        const listNode = new Node('list');
        col.addChild(listNode);
        const listGfx = listNode.addComponent(Graphics);
        listGfx.fillColor = new Color(30, 40, 60, 200);
        listGfx.roundRect(-100, -80, 200, 160, 5);
        listGfx.fill();

        // 绘制每个零件
        const entries: { part: PartData; index: number }[] = [];
        if (isSand) {
            entries.push({ part: null as any, index: -1 }); // "无"
        }
        catalog.forEach((p, i) => entries.push({ part: p, index: i }));

        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const itemNode = new Node(`item_${i}`);
            col.addChild(itemNode);
            itemNode.setPosition(0, 50 - i * 30, 0);
            const itemLabel = itemNode.addComponent(Label);
            if (e.index === -1) {
                itemLabel.text = '无';
            } else {
                itemLabel.text = `${e.part.name} $${e.part.price}`;
            }
            itemLabel.fontSize = 14;
            itemLabel.color = Color.WHITE;
            // 点击切换
            itemNode.on('touch-end', () => {
                (this as any)[prop] = e.index;
                this._refresh();
            });
            // 选中高亮
            if ((this as any)[prop] === e.index) {
                itemLabel.color = Color.YELLOW;
            }
        }
        return col;
    }

    private _makeButton(name: string, text: string, x: number, y: number): Node {
        const btnNode = new Node(name);
        this.node.addChild(btnNode);
        btnNode.setPosition(x, y, 0);
        const g = btnNode.addComponent(Graphics);
        g.fillColor = new Color(60, 80, 120, 255);
        g.roundRect(-90, -20, 180, 40, 5);
        g.fill();
        const lbl = btnNode.addComponent(Label);
        lbl.text = text;
        lbl.fontSize = 18;
        lbl.color = Color.WHITE;
        const t = btnNode.addComponent(UITransform);
        t.setContentSize(180, 40);
        t.setAnchorPoint(0.5, 0.5);
        return btnNode;
    }

    private _currentBoatPrice(): number {
        let total = 0;
        total += PartsCatalog.hull[this._selHull].price;
        total += PartsCatalog.motor[this._selMotor].price;
        total += PartsCatalog.remote[this._selRemote].price;
        if (this._selSand >= 0) total += PartsCatalog.sand[this._selSand].price;
        total += PartsCatalog.cannon[this._selCannon].price;
        return total;
    }

    private _fleetPrice(): number {
        return this._fleet.reduce((s, b) => s + b.price, 0);
    }

    private _refresh(): void {
        if (!this._budgetLabel) return;
        const hullP = PartsCatalog.hull[this._selHull];
        const curCost = this._currentBoatPrice();
        const fleetCost = this._fleetPrice();
        const remaining = GameConfig.BUDGET - fleetCost - curCost;

        this._budgetLabel.text = `预算: $${fleetCost + curCost} / $${GameConfig.BUDGET}  |  舰队: $${fleetCost}  此船: $${curCost}  剩余: $${remaining}`;
        this._budgetLabel.color = remaining < 0 ? Color.RED : Color.WHITE;

        const sandTxt = this._selSand >= 0 ? PartsCatalog.sand[this._selSand].name : '无';
        const ramDmg = this._selSand >= 0 ? PartsCatalog.sand[this._selSand].sandRamDamage : 0;
        this._previewLabel.text = `船: ${hullP.name}(HP${hullP.hullHp}/防${Math.round(hullP.hullDefense! * 100)}%) 撞击${ramDmg} → $${curCost}`;

        let fleetText = '当前舰队:\n';
        if (this._fleet.length === 0) fleetText += '  (空)';
        this._fleet.forEach((b, i) => {
            fleetText += `船${i + 1}: ${b.hull.name}+${b.motor.name}+${b.remote.name}+${b.sand ? b.sand.name : '无沙'}+${b.cannon.name} $${b.price}\n`;
        });
        this._fleetLabel.text = fleetText;
    }

    private _onAddBoat(): void {
        const cfg: BoatConfig = {
            hull: PartsCatalog.hull[this._selHull],
            motor: PartsCatalog.motor[this._selMotor],
            remote: PartsCatalog.remote[this._selRemote],
            sand: this._selSand >= 0 ? PartsCatalog.sand[this._selSand] : null,
            cannon: PartsCatalog.cannon[this._selCannon],
            price: this._currentBoatPrice(),
        };
        if (this._fleetPrice() + cfg.price > GameConfig.BUDGET) return;
        this._fleet.push(cfg);
        this._refresh();
    }

    private _onConfirm(): void {
        if (this._fleet.length < 1) return;
        if (this._fleetPrice() > GameConfig.BUDGET) return;
        if (this.onConfirmed) this.onConfirmed(this._fleet, this._player);
    }
}
