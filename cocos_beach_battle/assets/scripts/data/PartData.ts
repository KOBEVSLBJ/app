// 零件数据定义 - Cocos 2D伪3D版
// 所有零件属性用纯数据对象，方便后续调整为Cocos Resource

export enum PartType {
    HULL = 0,
    MOTOR = 1,
    REMOTE = 2,
    SAND = 3,
    CANNON = 4,
}

export interface PartData {
    type: PartType;
    name: string;
    price: number;
    // 船身
    hullHp?: number;
    hullDefense?: number;     // 0~1
    // 动力
    motorSpeed?: number;      // 像素/秒
    motorAccel?: number;      // 像素/秒²
    // 遥控
    remoteTurnRate?: number;  // 弧度/秒
    // 配重
    sandRamDamage?: number;
    sandSpeedPenalty?: number; // 0~1
    // 火炮
    cannonDamage?: number;
    cannonRange?: number;      // 像素
    cannonCooldown?: number;    // 秒
    cannonProjSpeed?: number;  // 像素/秒
    cannonGravity?: number;
}

// 零件目录(数据驱动，方便调整)
export const PartsCatalog: Record<string, PartData[]> = {
    hull: [
        { type: PartType.HULL, name: "泡沫板船身", price: 30, hullHp: 60, hullDefense: 0.0 },
        { type: PartType.HULL, name: "木板船身", price: 60, hullHp: 120, hullDefense: 0.15 },
        { type: PartType.HULL, name: "铁皮船身", price: 100, hullHp: 200, hullDefense: 0.35 },
    ],
    motor: [
        { type: PartType.MOTOR, name: "基础马达", price: 25, motorSpeed: 80, motorAccel: 120 },
        { type: PartType.MOTOR, name: "强力马达", price: 55, motorSpeed: 140, motorAccel: 180 },
    ],
    remote: [
        { type: PartType.REMOTE, name: "普通遥控", price: 20, remoteTurnRate: 2.2 },
        { type: PartType.REMOTE, name: "精准遥控", price: 45, remoteTurnRate: 3.6 },
    ],
    sand: [
        { type: PartType.SAND, name: "轻沙袋", price: 10, sandRamDamage: 8, sandSpeedPenalty: 0.08 },
        { type: PartType.SAND, name: "重沙袋", price: 25, sandRamDamage: 20, sandSpeedPenalty: 0.2 },
    ],
    cannon: [
        { type: PartType.CANNON, name: "轻型火炮", price: 35, cannonDamage: 12, cannonRange: 220, cannonCooldown: 1.2, cannonProjSpeed: 180, cannonGravity: 9.8 },
        { type: PartType.CANNON, name: "重型火炮", price: 70, cannonDamage: 28, cannonRange: 320, cannonCooldown: 2.0, cannonProjSpeed: 240, cannonGravity: 9.8 },
    ],
};

export function getCatalog(type: PartType): PartData[] {
    switch (type) {
        case PartType.HULL: return PartsCatalog.hull;
        case PartType.MOTOR: return PartsCatalog.motor;
        case PartType.REMOTE: return PartsCatalog.remote;
        case PartType.SAND: return PartsCatalog.sand;
        case PartType.CANNON: return PartsCatalog.cannon;
        default: return [];
    }
}

// 船配置(拼装结果)
export interface BoatConfig {
    hull: PartData;
    motor: PartData;
    remote: PartData;
    sand: PartData | null;
    cannon: PartData;
    price: number;
}
