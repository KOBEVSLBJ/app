// 游戏全局常量配置
// 沙滩航模大战 V1.0 - Cocos 2D伪3D

export const GameConfig = {
    // 预算
    BUDGET: 500,
    MAX_BOATS: 5,
    MAX_TURRETS: 2,

    // 地图
    MAP_WIDTH: 1280,       // 世界宽度
    MAP_HEIGHT: 720,       // 世界高度
    WATER_RX: 380,         // 水域椭圆半径X
    WATER_RZ: 220,         // 水域椭圆半径Y
    SAND_WIDTH: 180,       // 沙滩宽度

    // 伪3D
    PERSPECTIVE_Y: 0.45,   // Y轴压缩比(斜俯视角)
    HEIGHT_SCALE: 1.0,     // 高度缩放

    // 物理
    GRAVITY: 9.8,

    // 基地
    BASE_HP: 300,
    BASE_DEFENSE: 0.2,
    BASE_WIDTH: 120,
    BASE_HEIGHT: 90,

    // 炮台
    TURRET_HP: 80,
    TURRET_DEFENSE: 0.1,
    TURRET_RANGE: 200,
    TURRET_DAMAGE: 10,
    TURRET_COOLDOWN: 1.5,
    TURRET_PROJ_SPEED: 180,
    TURRET_GRAVITY: 9.8,

    // 分屏
    SPLIT_WIDTH: 640,
    SPLIT_HEIGHT: 720,
};

export enum GameState {
    BUILD,
    DEPLOY,
    BATTLE,
    RESULT,
}

export enum PlayerId {
    A = 0,
    B = 1,
}

// 碰撞层级
export const CollisionLayer = {
    BOAT: 1,
    TURRET: 2,
    BASE: 4,
    MOUND: 8,
};
