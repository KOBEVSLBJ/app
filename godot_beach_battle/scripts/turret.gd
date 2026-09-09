# 窜天猴炮台 - 固定防守建筑，范围内自动锁定敌人并抛物线开火
# 沙滩航模大战 V1.0

extends Damageable

class_name Turret

@export var team: int = 0
@export var range: float = 20.0
@export var damage: float = 10.0
@export var cooldown: float = 1.5
@export var projectile_speed: float = 18.0
@export var gravity: float = 9.8

var cooldown_left: float = 0.0
var target: Damageable = null

const COLLISION_LAYER_TURRET := 4

func _ready() -> void:
	super._ready()
	set_meta("team", team)
	max_hp = 80.0
	hp = 80.0
	defense = 0.1
	_setup_visual()
	_setup_collision()

func _setup_visual() -> void:
	var base_mesh: MeshInstance3D = MeshInstance3D.new()
	var box: BoxMesh = BoxMesh.new()
	box.size = Vector3(1.2, 0.8, 1.2)
	base_mesh.mesh = box
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.albedo_color = Color(0.5, 0.4, 0.3) if team == 0 else Color(0.3, 0.4, 0.5)
	base_mesh.material_override = mat
	add_child(base_mesh)
	# 炮管
	var barrel: MeshInstance3D = MeshInstance3D.new()
	barrel.name = "Barrel"
	var cyl: CylinderMesh = CylinderMesh.new()
	cyl.top_radius = 0.15
	cyl.bottom_radius = 0.2
	cyl.height = 1.6
	barrel.mesh = cyl
	barrel.rotation.x = deg_to_rad(90.0)
	barrel.position = Vector3(0, 0.6, 0)
	add_child(barrel)

func _setup_collision() -> void:
	var col: CollisionShape3D = CollisionShape3D.new()
	var shape: BoxShape3D = BoxShape3D.new()
	shape.size = Vector3(1.2, 1.2, 1.2)
	col.shape = shape
	col.position.y = 0.4
	add_child(col)
	collision_layer = COLLISION_LAYER_TURRET
	collision_mask = 0

func _physics_process(delta: float) -> void:
	if dead:
		return
	if cooldown_left > 0:
		cooldown_left -= delta
	_find_target()
	if target and cooldown_left <= 0:
		_fire()

func _find_target() -> void:
	target = null
	var best_dist: float = range * range
	# 遍历场景中的敌方船只和炮台
	var parent: Node = get_parent()
	if parent == null:
		return
	for child in parent.get_children():
		if child is Boat:
			var b: Boat = child as Boat
			if b.team != team and not b.dead:
				var d: float = global_position.distance_squared_to(b.global_position)
				if d < best_dist:
					best_dist = d
					target = b
		elif child is Turret:
			var t: Turret = child as Turret
			if t.team != team and not t.dead:
				var d: float = global_position.distance_squared_to(t.global_position)
				if d < best_dist:
					best_dist = d
					target = t

func _fire() -> void:
	if target == null:
		return
	cooldown_left = cooldown
	var to_target: Vector3 = target.global_position - global_position
	to_target.y = 0.0
	var dist: float = to_target.length()
	if dist < 0.1:
		return
	var dir: Vector3 = to_target.normalized()
	# 旋转炮管朝向目标
	var barrel: Node3D = get_node("Barrel")
	barrel.look_at(global_position + dir, Vector3.UP)
	# 抛物线计算: 解初速度角度使炮弹命中目标
	# 使用45度若射程够，否则调整
	var angle: float = _calc_fire_angle(dist)
	var launch: Vector3 = dir * projectile_speed * cos(angle) + Vector3.UP * projectile_speed * sin(angle)
	var proj: Projectile = preload("res://scripts/projectile.gd").new()
	proj.global_position = global_position + Vector3(0, 1.0, 0) + dir * 0.8
	get_parent().add_child(proj)
	proj.setup(damage, launch, gravity, team, range + 5.0)

# 计算发射角度使炮弹水平飞行dist距离后落地(y=0)
# 公式: dist = (v^2 * sin(2a)) / g  =>  sin(2a) = dist*g/v^2
func _calc_fire_angle(dist: float) -> float:
	var v2: float = projectile_speed * projectile_speed
	var val: float = dist * gravity / v2
	if val > 1.0:
		val = 1.0
	if val < -1.0:
		val = -1.0
	return asin(val) / 2.0

func _on_destroyed() -> void:
	var tween: Tween = create_tween()
	tween.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.3)
	tween.tween_callback(queue_free)
