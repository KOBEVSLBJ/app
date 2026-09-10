// 游戏主控 - 地图/相机/状态机/输入/部署/战斗/胜负
// 沙滩航模大战 V1.0 - Cocos 2D伪3D
//
// 伪3D分屏策略:
// - Build/Deploy/Result阶段: 单屏全景
// - Battle阶段: 左右分屏(两台Camera, 各跟随一方舰队)
//
// 伪3D深度排序: 每帧按世界Y重排所有单位节点

import { Component, Node, Graphics, Color, Label, Camera, Canvas, UITransform, Vec2, Vec3, math, input, sys, find } from 'cc';
import { GameConfig, GameState, PlayerId, CollisionLayer } from './data/GameConfig';
import { PartData, BoatConfig, getCatalog } from './data/PartData';
import { Pseudo3D, WorldPos } from './core/Pseudo3D';
import { MapRenderer } from './core/MapRenderer';
import { ModelRenderer } from './core/ModelRenderer';
import { Boat } from './entities/Boat';
import { Turret } from './entities/Turret';
import { Base } from './entities/Base';
import { Mound } from './entities/Mound';
import { Projectile } from './entities/Projectile';
import { BuildUI } from './ui/BuildUI';
import { DeployUI } from './ui/DeployUI';
import { BattleHUD } from './ui/BattleHUD';
import { ResultUI } from './ui/ResultUI';

export class GameManager extends Component {
    private _state: GameState = GameState.BUILD;

    // 世界节点
    private _worldNode!: Node;
    private _entityNode!: Node;  // 可排序单位
    private _projectileNode!: Node;
    private _uiNode!: Node;

    // 地图
    private _mapRenderer!: MapRenderer;
    private _mounds: Mound[] = [];

    // 单位
    private _boatsA: Boat[] = [];
    private _boatsB: Boat[] = [];
    private _turretsA: Turret[] = [];
    private _turretsB: Turret[] = [];
    private _baseA!: Base;
    private _baseB!: Base;

    // 舰队配置
    private _fleetA: BoatConfig[] = [];
    private _fleetB: BoatConfig[] = [];

    // 选中
    private _selA: number = 0;
    private _selB: number = 0;

    // 相机
    private _mainCam!: Camera;
    private _camA!: Camera;
    private _camB!: Camera;
    private _camNodeA!: Node;
    private _camNodeB!: Node;
    private _splitScreen: boolean = false;

    // UI
    private _buildUI!: BuildUI;
    private _deployUI!: DeployUI;
    private _battleHUD!: BattleHUD;
    private _resultUI!: ResultUI;

    // 部署状态
    private _deployPlayer: number = 0;
    private _deployBoatIdx: number = 0;
    private _deployingTurret: boolean = false;
    private _turretsPlacedA: number = 0;
    private _turretsPlacedB: number = 0;

    // 输入
    private _keys: Set<number> = new Set();

    onLoad(): void {
        this._worldNode = new Node('World');
        this.node.addChild(this._worldNode);
        this._entityNode = new Node('Entities');
        this._worldNode.addChild(this._entityNode);
        this._projectileNode = new Node('Projectiles');
        this._worldNode.addChild(this._projectileNode);
        this._uiNode = new Node('UI');
        this.node.addChild(this._uiNode);

        this._setupMap();
        this._setupCamera();
        this._setupInput();
        this._enterBuild();
    }

    // ================= 地图 =================
    private _setupMap(): void {
        this._mapRenderer = new MapRenderer(this._worldNode);

        // 土堆
        const moundPositions: WorldPos[] = [
            { x: -80, y: -80, z: 0 },
            { x: 0, y: 0, z: 0 },
            { x: 80, y: 80, z: 0 },
            { x: -120, y: 100, z: 0 },
            { x: 120, y: -100, z: 0 },
            { x: 0, y: -140, z: 0 },
        ];
        for (const p of moundPositions) {
            this._mounds.push(new Mound(this._entityNode, p));
        }

        // 基地
        const baseANode = new Node('BaseA');
        this._entityNode.addChild(baseANode);
        this._baseA = baseANode.addComponent(Base);
        this._baseA.team = 0;
        this._baseA.position = { x: -420, y: 0, z: 0 };
        this._baseA.onDestroyCb = (b) => this._onBaseDestroyed(0);

        const baseBNode = new Node('BaseB');
        this._entityNode.addChild(baseBNode);
        this._baseB = baseBNode.addComponent(Base);
        this._baseB.team = 1;
        this._baseB.position = { x: 420, y: 0, z: 0 };
        this._baseB.onDestroyCb = (b) => this._onBaseDestroyed(1);
    }

    // ================= 相机 =================
    private _setupCamera(): void {
        // 主相机(全景)
        const camNode = new Node('MainCam');
        this._worldNode.addChild(camNode);
        camNode.setPosition(0, 0, -800);
        this._mainCam = camNode.addComponent(Camera);
        this._mainCam.orthoHeight = 400;
        this._mainCam.zoomRatio = 1.0;

        // 分屏相机(战斗阶段)
        this._camNodeA = new Node('CamA');
        this._worldNode.addChild(this._camNodeA);
        this._camNodeA.setPosition(-200, 0, -800);
        this._camA = this._camNodeA.addComponent(Camera);
        this._camA.orthoHeight = 200;

        this._camNodeB = new Node('CamB');
        this._worldNode.addChild(this._camNodeB);
        this._camNodeB.setPosition(200, 0, -800);
        this._camB = this._camNodeB.addComponent(Camera);
        this._camB.orthoHeight = 200;
        this._camNodeB.active = false;
    }

    private _enableSplitScreen(enabled: boolean): void {
        this._splitScreen = enabled;
        this._camNodeA.active = enabled;
        this._camNodeB.active = enabled;
    }

    // ================= 输入 =================
    private _setupInput(): void {
        // 键盘
        if (sys.isBrowser) {
            window.addEventListener('keydown', (e: KeyboardEvent) => {
                this._keys.add(e.keyCode);
                this._onKeyDown(e.keyCode);
            });
            window.addEventListener('keyup', (e: KeyboardEvent) => {
                this._keys.delete(e.keyCode);
            });
        }
        // 鼠标点击(部署阶段)
        this.node.on('touch-end', (e: any) => {
            if (this._state !== GameState.DEPLOY) return;
            const loc = e.getUILocation ? e.getUILocation() : { x: 0, y: 0 };
            this._handleDeployClick(loc);
        });
    }

    private _onKeyDown(code: number): void {
        if (this._state !== GameState.BATTLE) return;
        // P1切换船
        if (code === 9) { // Tab
            this._selA = (this._selA + 1) % Math.max(this._boatsA.length, 1);
            this._updateSelection();
        }
        if (code === 82) { // R
            this._selB = (this._selB + 1) % Math.max(this._boatsB.length, 1);
            this._updateSelection();
        }
    }

    private _isKeyDown(code: number): boolean {
        return this._keys.has(code);
    }

    // ================= 状态机 =================
    private _enterBuild(): void {
        this._state = GameState.BUILD;
        const buildNode = new Node('BuildUI');
        this._uiNode.addChild(buildNode);
        this._buildUI = buildNode.addComponent(BuildUI);
        this._buildUI.onConfirmed = (fleet, player) => {
            if (player === 0) {
                this._fleetA = fleet;
                buildNode.destroy();
                // 玩家B拼装
                const bNode = new Node('BuildUI_B');
                this._uiNode.addChild(bNode);
                this._buildUI = bNode.addComponent(BuildUI);
                this._buildUI.onConfirmed = (fleet2, player2) => {
                    this._fleetB = fleet2;
                    bNode.destroy();
                    this._enterDeploy();
                };
            }
        };
    }

    private _enterDeploy(): void {
        this._state = GameState.DEPLOY;
        this._deployPlayer = 0;
        this._deployBoatIdx = 0;
        this._deployingTurret = false;
        this._turretsPlacedA = 0;
        this._turretsPlacedB = 0;
        const deployNode = new Node('DeployUI');
        this._uiNode.addChild(deployNode);
        this._deployUI = deployNode.addComponent(DeployUI);
        this._deployUI.onConfirmed = () => {
            if (this._deployPlayer === 0) {
                this._deployPlayer = 1;
                this._deployBoatIdx = 0;
                this._deployingTurret = false;
            } else {
                deployNode.destroy();
                this._enterBattle();
            }
        };
        this._updateDeployInfo();
    }

    private _updateDeployInfo(): void {
        const pname = this._deployPlayer === 0 ? 'A' : 'B';
        const fleet = this._deployPlayer === 0 ? this._fleetA : this._fleetB;
        const obj = this._deployingTurret ? '炮台' : '船';
        const idx = this._deployBoatIdx + 1;
        const tcount = this._deployPlayer === 0 ? this._turretsPlacedA : this._turretsPlacedB;
        if (this._deployUI) {
            this._deployUI.setInfo(
                `玩家 ${pname} 部署\n放置: ${obj} ${idx}/${fleet.length}\n炮台: ${tcount}/${GameConfig.MAX_TURRETS}\n点击己方半场放置`
            );
        }
    }

    private _handleDeployClick(screenPos: Vec2): void {
        // 转换到世界坐标(简化: 直接用屏幕坐标偏移)
        const cam = this._mainCam;
        const wx = screenPos.x;
        const wy = (screenPos.y / GameConfig.PERSPECTIVE_Y) | 0;

        // 限制半场
        if (this._deployPlayer === 0 && wx >= 0) return;
        if (this._deployPlayer === 1 && wx <= 0) return;

        // 限制水域
        if (!Pseudo3D.isInWater(wx, wy)) return;

        if (this._deployingTurret) {
            this._placeTurret({ x: wx, y: wy, z: 0 });
        } else {
            this._placeBoat({ x: wx, y: wy, z: 0 });
        }
    }

    private _placeBoat(pos: WorldPos): void {
        const fleet = this._deployPlayer === 0 ? this._fleetA : this._fleetB;
        if (this._deployBoatIdx >= fleet.length) return;
        const cfg = fleet[this._deployBoatIdx];
        const boatNode = new Node(`Boat_${this._deployPlayer}_${this._deployBoatIdx}`);
        this._entityNode.addChild(boatNode);
        const boat = boatNode.addComponent(Boat);
        boat.hull = cfg.hull;
        boat.motor = cfg.motor;
        boat.remote = cfg.remote;
        boat.sand = cfg.sand;
        boat.cannon = cfg.cannon;
        boat.team = this._deployPlayer;
        boat.position = pos;
        boat.angle = this._deployPlayer === 0 ? 0 : Math.PI;
        boat.onFireCannon = (b, angle) => this._spawnProjectile(b, angle);
        boat.onDestroyCb = (b) => this._onBoatDestroyed(b);

        if (this._deployPlayer === 0) this._boatsA.push(boat);
        else this._boatsB.push(boat);

        this._deployBoatIdx++;
        if (this._deployBoatIdx >= fleet.length) {
            this._deployingTurret = true;
        }
        this._updateDeployInfo();
    }

    private _placeTurret(pos: WorldPos): void {
        const tcount = this._deployPlayer === 0 ? this._turretsPlacedA : this._turretsPlacedB;
        if (tcount >= GameConfig.MAX_TURRETS) return;
        const tNode = new Node(`Turret_${this._deployPlayer}_${tcount}`);
        this._entityNode.addChild(tNode);
        const turret = tNode.addComponent(Turret);
        turret.team = this._deployPlayer;
        turret.position = pos;
        turret.setGetEnemies(() => this._getAllEnemies(this._deployPlayer));
        turret.setOnFire((p, v, dmg, team, range) => this._spawnTurretProjectile(p, v, dmg, team, range));
        turret.onDestroyCb = (t) => this._onTurretDestroyed(t);

        if (this._deployPlayer === 0) {
            this._turretsA.push(turret);
            this._turretsPlacedA++;
        } else {
            this._turretsB.push(turret);
            this._turretsPlacedB++;
        }
        this._updateDeployInfo();
    }

    private _enterBattle(): void {
        this._state = GameState.BATTLE;
        this._selA = 0;
        this._selB = 0;
        this._updateSelection();
        this._enableSplitScreen(true);

        const hudNode = new Node('BattleHUD');
        this._uiNode.addChild(hudNode);
        this._battleHUD = hudNode.addComponent(BattleHUD);

        // 为炮台设置敌人获取器
        this._turretsA.forEach(t => t.setGetEnemies(() => this._getAllEnemies(0)));
        this._turretsB.forEach(t => t.setGetEnemies(() => this._getAllEnemies(1)));
    }

    private _enterResult(winner: number): void {
        this._state = GameState.RESULT;
        this._enableSplitScreen(false);
        const resultNode = new Node('ResultUI');
        this._uiNode.addChild(resultNode);
        this._resultUI = resultNode.addComponent(ResultUI);
        this._resultUI.setWinner(winner);
        this._resultUI.onRestart = () => {
            // 简易重启: 重新加载
            if (sys.isBrowser) {
                window.location.reload();
            }
        };
    }

    // ================= 抛物线炮弹 =================
    private _spawnProjectile(boat: Boat, angle: number): void {
        const cannon = boat.cannon;
        const launchAngle = Math.PI / 4;
        const spd = cannon.cannonProjSpeed!;
        const hSpd = spd * Math.cos(launchAngle);
        const vSpd = spd * Math.sin(launchAngle);

        const bp = boat.position;
        const projNode = new Node('Projectile');
        this._projectileNode.addChild(projNode);
        const proj = projNode.addComponent(Projectile);
        proj.position = {
            x: bp.x + Math.sin(angle) * 15,
            y: bp.y - Math.cos(angle) * 15,
            z: 10,
        };
        proj.setup(
            cannon.cannonDamage!,
            {
                x: Math.sin(angle) * hSpd,
                y: -Math.cos(angle) * hSpd,
                z: vSpd,
            },
            cannon.cannonGravity!,
            boat.team,
            cannon.cannonRange!,
            () => this._getAllTargets(boat.team)
        );
    }

    private _spawnTurretProjectile(pos: WorldPos, vel: WorldPos, dmg: number, team: number, range: number): void {
        const projNode = new Node('TurretProjectile');
        this._projectileNode.addChild(projNode);
        const proj = projNode.addComponent(Projectile);
        proj.position = pos;
        proj.setup(dmg, vel, 9.8, team, range, () => this._getAllTargets(team));
    }

    private _getAllTargets(team: number): any[] {
        const enemies = team === 0 ? this._boatsB : this._boatsA;
        return enemies.filter(b => !b.dead);
    }

    private _getAllEnemies(team: number): any[] {
        // 返回所有敌方可受伤单位(船+炮台+基地)
        const boats = team === 0 ? this._boatsB : this._boatsA;
        const turrets = team === 0 ? this._turretsB : this._turretsA;
        const base = team === 0 ? this._baseB : this._baseA;
        return [...boats, ...turrets, base].filter(u => !u.dead);
    }

    // ================= 主更新 =================
    update(dt: number): void {
        if (this._state !== GameState.BATTLE) return;

        // 清理死亡单位
        this._boatsA = this._boatsA.filter(b => b.isValid && !b.dead);
        this._boatsB = this._boatsB.filter(b => b.isValid && !b.dead);

        this._readInput();
        this._updateCameras();
        this._sortEntities();
        this._updateHUD();
        this._checkWin();
    }

    private _readInput(): void {
        // 玩家A: WASD + Space + Tab
        const boatA = this._selA < this._boatsA.length ? this._boatsA[this._selA] : null;
        if (boatA) {
            let throttle = 0, turn = 0;
            if (this._isKeyDown(87)) throttle += 1; // W
            if (this._isKeyDown(83)) throttle -= 1; // S
            if (this._isKeyDown(68)) turn += 1;     // D
            if (this._isKeyDown(65)) turn -= 1;     // A
            boatA.inputThrottle = throttle;
            boatA.inputTurn = turn;
            boatA.fireRequested = boatA.fireRequested || this._isKeyDown(32); // Space
        }
        // 玩家B: 方向键 + Enter + R
        const boatB = this._selB < this._boatsB.length ? this._boatsB[this._selB] : null;
        if (boatB) {
            let throttle = 0, turn = 0;
            if (this._isKeyDown(38)) throttle += 1; // Up
            if (this._isKeyDown(40)) throttle -= 1; // Down
            if (this._isKeyDown(39)) turn += 1;     // Right
            if (this._isKeyDown(37)) turn -= 1;      // Left
            boatB.inputThrottle = throttle;
            boatB.inputTurn = turn;
            boatB.fireRequested = boatB.fireRequested || this._isKeyDown(13); // Enter
        }
    }

    private _updateCameras(): void {
        // 相机A跟随A舰队中心
        const centerA = this._fleetCenter(this._boatsA);
        this._camNodeA.setPosition(centerA.x, centerA.y * GameConfig.PERSPECTIVE_Y, -800);
        const centerB = this._fleetCenter(this._boatsB);
        this._camNodeB.setPosition(centerB.x, centerB.y * GameConfig.PERSPECTIVE_Y, -800);
    }

    private _fleetCenter(boats: Boat[]): WorldPos {
        if (boats.length === 0) return { x: 0, y: 0, z: 0 };
        let sx = 0, sy = 0;
        for (const b of boats) { sx += b.position.x; sy += b.position.y; }
        return { x: sx / boats.length, y: sy / boats.length, z: 0 };
    }

    private _sortEntities(): void {
        // 按世界Y排序(越大越前 = 渲染在上层)
        const children = this._entityNode.children.slice();
        children.sort((a, b) => {
            const ay = (a as any).position ? (a as any).position.y : 0;
            const by = (b as any).position ? (b as any).position.y : 0;
            return ay - by;
        });
        for (let i = 0; i < children.length; i++) {
            this._entityNode.removeChild(children[i]);
        }
        for (let i = 0; i < children.length; i++) {
            this._entityNode.addChild(children[i]);
        }
    }

    private _updateSelection(): void {
        for (let i = 0; i < this._boatsA.length; i++) {
            this._boatsA[i].selected = (i === this._selA);
        }
        for (let i = 0; i < this._boatsB.length; i++) {
            this._boatsB[i].selected = (i === this._selB);
        }
    }

    private _updateHUD(): void {
        if (!this._battleHUD) return;
        const boatA = this._selA < this._boatsA.length ? this._boatsA[this._selA] : null;
        const boatB = this._selB < this._boatsB.length ? this._boatsB[this._selB] : null;
        let ta = `玩家A 船数:${this._boatsA.length} 基地:${Math.ceil(this._baseA.hp)}/${this._baseA.maxHp}`;
        if (boatA) ta += `\n选中船 HP:${Math.ceil(boatA.hp)}/${boatA.maxHp} 冷却:${boatA['cooldown']?.toFixed(1) ?? '0.0'}s`;
        let tb = `玩家B 船数:${this._boatsB.length} 基地:${Math.ceil(this._baseB.hp)}/${this._baseB.maxHp}`;
        if (boatB) tb += `\n选中船 HP:${Math.ceil(boatB.hp)}/${boatB.maxHp} 冷却:${boatB['cooldown']?.toFixed(1) ?? '0.0'}s`;
        this._battleHUD.updateText(ta, tb);
    }

    private _checkWin(): void {
        if (this._baseA.dead) this._enterResult(1);
        else if (this._baseB.dead) this._enterResult(0);
    }

    private _onBaseDestroyed(team: number): void {
        this._enterResult(1 - team);
    }

    private _onBoatDestroyed(boat: Boat): void {
        // 船在filter中自动清理
    }

    private _onTurretDestroyed(turret: Turret): void {
        // 从数组中移除
        this._turretsA = this._turretsA.filter(t => t !== turret);
        this._turretsB = this._turretsB.filter(t => t !== turret);
    }
}
