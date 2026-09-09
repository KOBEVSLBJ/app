# 抛物线炮弹 - 显式重力抛物线公式，非刚体
# 沙滩航模大战 V1.0

extends Node3D

class_name Projectile

var damage: float = 10.0
var gravity: float = 9.8
var velocity: Vector3 = Vector3.ZERO
var owner_team: int = 0   # 0=玩家A, 1=玩家B
var range: float = 30.0
var traveled: float = 0.0
var start_pos: Vector3 = Vector3.ZERO
var alive: bool = true

const COLLISION_LAYER_BOAT := 2
const COLLISION_LAYER_TURRET := 4
const COLLISION_LAYER_BASE := 8
const COLLISION_LAYER_MOUND := 16

func setup(p_damage: float, p_velocity: Vector3, p_gravity: float, p_team: int, p_range: float) -> void:
	damage = p_damage
	velocity = p_velocity
	gravity = p_gravity
	owner_team = p_team
	range = p_range
	start_pos = global_position
	alive = true
	# 创建碰撞体(球)用于命中检测
	_create_collision()

func _create_collision() -> void:
	var area: Area3D = Area3D.new()
	area.name = "HitArea"
	area.collision_layer = 0
	area.collision_mask = COLLISION_LAYER_BOAT | COLLISION_LAYER_TURRET | COLLISION_LAYER_BASE | COLLISION_LAYER_MOUND
	var shape: CollisionShape3D = CollisionShape3D.new()
	var sphere: SphereShape3D = SphereShape3D.new()
	sphere.radius = 0.4
	shape.shape = sphere
	area.add_child(shape)
	add_child(area)
	area.body_entered.connect(_on_body_entered)

func _physics_process(delta: float) -> void:
	if not alive:
		return
	var prev: Vector3 = global_position
	velocity.y -= gravity * delta
	global_position += velocity * delta
	traveled = global_position.distance_to(start_pos)
	# 超出射程或掉到地面以下则销毁
	if traveled > range or global_position.y < -1.0:
		_destroy()
		return
	# 射线检测沿运动路径的命中(处理高速炮弹)
	var space: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(prev, global_position)
	query.collision_mask = COLLISION_LAYER_MOUND | COLLISION_LAYER_BOAT | COLLISION_LAYER_TURRET | COLLISION_LAYER_BASE
	var result: Dictionary = space.intersect_ray(query)
	if result:
		var collider: Object = result.collider
		_handle_hit(collider)

func _on_body_entered(body: Node3D) -> void:
	_handle_hit(body)

func _handle_hit(collider: Object) -> void:
	if not alive:
		return
	if collider == null:
		return
	# 找到 Damageable 组件(可能在父节点上)
	var target: Node = collider
	while target and not target is Damageable:
		target = target.get_parent()
	if target and target is Damageable:
		# 不打自己人
		var dmg: Damageable = target as Damageable
		if dmg.has_meta("team") and dmg.get_meta("team") == owner_team:
			return
		dmg.take_damage(damage, "cannon")
	# 土堆阻挡
	if collider.has_meta("is_mound"):
		pass
	_destroy()

func _destroy() -> void:
	alive = false
	# 简单爆炸效果(缩放消失)
	var tween: Tween = create_tween()
	tween.tween_property(self, "scale", Vector3(1.5, 1.5, 1.5), 0.15)
	tween.tween_callback(queue_free)
