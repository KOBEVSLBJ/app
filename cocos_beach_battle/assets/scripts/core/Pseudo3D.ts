// 伪3D渲染核心 - 2D斜俯视角坐标变换 + 高度模拟 + 深度排序
// 沙滩航模大战 V1.0
//
// 伪3D原理:
// 1. 世界坐标系: x=水平, y=深度(远近), z=高度
// 2. 屏幕投影: screenX = worldX, screenY = worldY * PERSPECTIVE_Y - worldZ * HEIGHT_SCALE
// 3. 深度排序: 按世界Y排序(越大越靠前覆盖)
// 4. 高度: 物体"高度"通过将精灵上半部分向上偏移实现视觉立体感

import { GameConfig } from '../data/GameConfig';

export interface WorldPos {
    x: number;  // 世界水平
    y: number;  // 世界深度(远近, 越大越近)
    z: number;  // 世界高度(向上)
}

export class Pseudo3D {
    // 世界坐标 → 屏幕坐标
    static worldToScreen(wp: WorldPos): { x: number; y: number } {
        return {
            x: wp.x,
            y: wp.y * GameConfig.PERSPECTIVE_Y - wp.z * GameConfig.HEIGHT_SCALE,
        };
    }

    // 世界Y → 渲染深度值(越大越在前)
    static depthOf(wp: WorldPos): number {
        return wp.y + wp.z * 0.01; // 高度轻微影响排序
    }

    // 计算阴影位置(物体在水面上的投影)
    static shadowPos(wp: WorldPos): { x: number; y: number } {
        return {
            x: wp.x,
            y: wp.y * GameConfig.PERSPECTIVE_Y,
        };
    }

    // 给定高度z,计算其屏幕Y偏移(用于绘制有高度的物体)
    static heightToScreenY(z: number): number {
        return -z * GameConfig.HEIGHT_SCALE;
    }

    // 抛物线炮弹轨迹点(世界坐标数组 → 屏幕坐标数组)
    static trajectoryToScreen(points: WorldPos[]): { x: number; y: number }[] {
        return points.map(p => Pseudo3D.worldToScreen(p));
    }

    // 两个世界位置的水平距离(忽略高度)
    static distanceXZ(a: WorldPos, b: WorldPos): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 椭圆水域边界检测
    static isInWater(x: number, y: number): boolean {
        const val = (x * x) / (GameConfig.WATER_RX * GameConfig.WATER_RX) +
                    (y * y) / (GameConfig.WATER_RZ * GameConfig.WATER_RZ);
        return val <= 1.0;
    }

    // 判断点是否在玩家半场
    static isPlayerSide(x: number, player: number): boolean {
        if (player === 0) return x < 0;
        return x > 0;
    }
}
