# 零件数据资源定义 - 所有零件属性写在 Resource 中，方便数值调整
# 沙滩航模大战 V1.0

class_name PartData
extends Resource

enum PartType { HULL, MOTOR, REMOTE, SAND, CANNON }

@export var part_type: PartType = PartType.HULL
@export var part_name: String = ""
@export var price: int = 0

# 船身属性
@export var hull_hp: float = 0.0        # 船体血量
@export var hull_defense: float = 0.0   # 防御百分比(0~1)减免伤害

# 动力属性
@export var motor_speed: float = 0.0    # 基础移动速度(单位/秒)
@export var motor_accel: float = 0.0    # 加速度

# 遥控属性
@export var remote_turn_rate: float = 0.0  # 转向速率(弧度/秒)

# 配重(沙子)属性
@export var sand_ram_damage: float = 0.0    # 撞击伤害加成
@export var sand_speed_penalty: float = 0.0 # 速度惩罚比例(0~1)

# 火炮属性
@export var cannon_damage: float = 0.0   # 炮弹伤害
@export var cannon_range: float = 0.0    # 射程
@export var cannon_cooldown: float = 0.0 # 冷却(秒)
@export var cannon_projectile_speed: float = 0.0 # 炮弹初速度
@export var cannon_gravity: float = 9.8  # 炮弹重力(用于抛物线)
