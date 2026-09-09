# 零件数据库 - 加载所有 .tres 零件资源，提供分类目录
# 沙滩航模大战 V1.0

extends Node

class_name PartsDB

# 零件资源路径
const PART_PATHS := {
	"hull": [
		"res://resources/hull_foam.tres",
		"res://resources/hull_wood.tres",
		"res://resources/hull_metal.tres",
	],
	"motor": [
		"res://resources/motor_basic.tres",
		"res://resources/motor_advanced.tres",
	],
	"remote": [
		"res://resources/remote_basic.tres",
		"res://resources/remote_advanced.tres",
	],
	"sand": [
		"res://resources/sand_light.tres",
		"res://resources/sand_heavy.tres",
	],
	"cannon": [
		"res://resources/cannon_basic.tres",
		"res://resources/cannon_heavy.tres",
	],
}

var hulls: Array[PartData] = []
var motors: Array[PartData] = []
var remotes: Array[PartData] = []
var sands: Array[PartData] = []
var cannons: Array[PartData] = []

func _ready() -> void:
	_load_all()

func _load_all() -> void:
	for p in PART_PATHS["hull"]:
		hulls.append(load(p))
	for p in PART_PATHS["motor"]:
		motors.append(load(p))
	for p in PART_PATHS["remote"]:
		remotes.append(load(p))
	for p in PART_PATHS["sand"]:
		sands.append(load(p))
	for p in PART_PATHS["cannon"]:
		cannons.append(load(p))

# 按类型返回目录
func get_catalog(part_type: int) -> Array[PartData]:
	match part_type:
		PartData.PartType.HULL: return hulls
		PartData.PartType.MOTOR: return motors
		PartData.PartType.REMOTE: return remotes
		PartData.PartType.SAND: return sands
		PartData.PartType.CANNON: return cannons
	return []
