# 可受伤基础节点 - 船、炮台、基地都继承此类
# 沙滩航模大战 V1.0

class_name Damageable
extends CharacterBody3D

signal hp_changed(hp: float, max_hp: float)
signal destroyed()

@export var max_hp: float = 100.0
@export var defense: float = 0.0   # 伤害减免百分比 0~1
@export var is_base: bool = false   # 是否是基地(基地只受火炮伤害)

var hp: float = 100.0
var dead: bool = false

func _ready() -> void:
	hp = max_hp

# 受到伤害，source: "cannon" 火炮, "ram" 撞击
func take_damage(amount: float, source: String = "cannon") -> void:
	if dead:
		return
	# 基地只受火炮伤害
	if is_base and source != "cannon":
		return
	var dmg: float = amount * (1.0 - defense)
	hp -= dmg
	hp_changed.emit(hp, max_hp)
	if hp <= 0.0:
		hp = 0.0
		dead = true
		destroyed.emit()
		_on_destroyed()

func _on_destroyed() -> void:
	# 子类可重写
	pass
