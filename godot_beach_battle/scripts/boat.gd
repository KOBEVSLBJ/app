# 航模 - 船身+马达+遥控+配重+火炮 的组合实体
# 沙滩航模大战 V1.0

extends Damageable

class_name Boat

@export var team: int = 0

# 零件引用
var hull: PartData
var motor: PartData
var remote: PartData
var sand: PartData = null   # 可空
var cannon: PartData

# 运行时属性
var move_speed: float = 0.0
var turn_rate: float = 0.0
var ram_damage: float = 0.0
var current_speed: float = 0.0
var cooldown_left: float = 0.0

# 输入(由控制器设置)
var input_throttle: float = 0.0   # -1~1
var input_turn: float = 0.0       # -1~1
var fire_requested: bool = false

var selected: bool = false
var hit_flash: float = 0.0

const COLLISION_LAYER_BOAT := 2
const COLLISION_LAYER_MOUND := 16

signal fired_cannon(boat: Boat)

func _ready() -> void:
	super._ready()
	set_meta("team", team)
	_compute_stats()
	_setup_visual()
	_setup_collision()

func _compute_stats() -> void:
	max_hp = hull.hull_hp
	hp = max_hp
	defense = hull.hull_defense
	var penalty: float = 0.0
	if sand:
		penalty = sand.sand_speed_penalty
		ram_damage = sand.sand_ram_damage
	move_speed = motor.motor_speed * (1.0 - penalty)
	turn_rate = remote.remote_turn_rate

func _setup_visual() -> void:
	# 船身白模(盒子)
	var hull_mesh: MeshInstance3D = MeshInstance3D.new()
	var box: BoxMesh = BoxMesh.new()
	box.size = Vector3(2.2, 0.6, 1.0)
	hull_mesh.mesh = box
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.albedo_color = Color(0.9, 0.8, 0.6) if team == 0 else Color(0.6, 0.8, 0.9)
	hull_mesh.material_override = mat
	add_child(hull_mesh)
	# 炮塔(小盒子在上方)
	var turret_mesh: MeshInstance3D = MeshInstance3D.new()
	var tbox: BoxMesh = BoxMesh.new()
	tbox.size = Vector3(0.6, 0.5, 1.4)
	turret_mesh.mesh = tbox
	turret_mesh.position = Vector3(0, 0.5, 0)
	var tmat: StandardMaterial3D = StandardMaterial3D.new()
	tmat.albedo_color = Color(0.3, 0.3, 0.3)
	turret_mesh.material_override = tmat
	add_child(turret_mesh)
	# 选中指示(圆环)
	var ring: MeshInstance3D = MeshInstance3D.new()
	ring.name = "SelectRing"
	var tor: TorusMesh = TorusMesh.new()
	tor.inner_radius = 0.1
	tor.outer_radius = 1.6
	ring.mesh = tor
	ring.position = Vector3(0, -0.2, 0)
	ring.visible = false
	add_child(ring)

func _setup_collision() -> void:
	var col: CollisionShape3D = CollisionShape3D.new()
	var shape: CapsuleShape3D = CapsuleShape3D.new()
	shape.radius = 0.7
	shape.height = 2.4
	col.shape = shape
	col.rotation.x = deg_to_rad(90.0)
	add_child(col)
	collision_layer = COLLISION_LAYER_BOAT
	collision_mask = COLLISION_LAYER_BOAT | COLLISION_LAYER_MOUND

func _physics_process(delta: float) -> void:
	if dead:
		return
	if cooldown_left > 0:
		cooldown_left -= delta
	# 转向
	rotation.y += input_turn * turn_rate * delta
	# 加减速
	var target: float = input_throttle * move_speed
	var accel: float = motor.motor_accel
	if abs(target - current_speed) < accel * delta:
		current_speed = target
	else:
		current_speed += sign(target - current_speed) * accel * delta
	# 移动 (CharacterBody3D velocity + move_and_slide)
	var forward: Vector3 = -global_transform.basis.z  # Godot中-z为前
	forward.y = 0.0
	forward = forward.normalized()
	velocity = forward * current_speed
	move_and_slide()
	# 撞击检测
	_check_ram_collisions()
	# 边界钳制
	_clamp_to_map()
	# 开火
	if fire_requested:
		fire_requested = false
		fire()
	if hit_flash > 0:
		hit_flash -= delta

func _check_ram_collisions() -> void:
	var count: int = get_slide_collision_count()
	for i in range(count):
		var col: KinematicCollision3D = get_slide_collision(i)
		var collider: Object = col.get_collider()
		if collider is Boat:
			var other: Boat = collider as Boat
			if other.team != team:
				handle_ram(other)
		# 撞到土堆则停止
		elif collider and collider.has_meta("is_mound"):
			current_speed *= 0.3

func _clamp_to_map() -> void:
	# 椭圆水域边界(近似)
	var px: float = global_position.x
	var pz: float = global_position.z
	var rx: float = 42.0
	var rz: float = 28.0
	var val: float = (px * px) / (rx * rx) + (pz * pz) / (rz * rz)
	if val > 1.0:
		var ang: float = atan2(pz, px)
		global_position.x = cos(ang) * rx
		global_position.z = sin(ang) * rz

func fire() -> void:
	if cooldown_left > 0 or cannon == null:
		return
	cooldown_left = cannon.cannon_cooldown
	# 以45度角沿朝向发射
	var forward: Vector3 = -global_transform.basis.z
	forward.y = 0.0
	forward = forward.normalized()
	var angle: float = deg_to_rad(45.0)
	var spd: float = cannon.cannon_projectile_speed
	var launch: Vector3 = forward * spd * cos(angle) + Vector3.UP * spd * sin(angle)
	var proj: Projectile = preload("res://scripts/projectile.gd").new()
	proj.global_position = global_position + Vector3(0, 0.6, 0) + forward * 1.2
	get_parent().add_child(proj)
	proj.setup(cannon.cannon_damage, launch, cannon.cannon_gravity, team, cannon.cannon_range)
	fired_cannon.emit(self)

# 获取落点预览点(用于UI绘制预览线)
func get_trajectory_points() -> PackedVector3Array:
	var points: PackedVector3Array = PackedVector3Array()
	if cannon == null:
		return points
	var forward: Vector3 = -global_transform.basis.z
	forward.y = 0.0
	forward = forward.normalized()
	var angle: float = deg_to_rad(45.0)
	var spd: float = cannon.cannon_projectile_speed
	var vel: Vector3 = forward * spd * cos(angle) + Vector3.UP * spd * sin(angle)
	var pos: Vector3 = global_position + Vector3(0, 0.6, 0)
	var g: float = cannon.cannon_gravity
	var dt: float = 0.05
	var t: float = 0.0
	while t < cannon.cannon_range / spd * 2.0:
		points.append(pos)
		pos += vel * dt
		vel.y -= g * dt
		if pos.y < 0:
			break
		t += dt
	return points

# 撞击
func handle_ram(other: Boat) -> void:
	if other == null or other.dead:
		return
	if ram_damage > 0:
		other.take_damage(ram_damage, "ram")

func take_damage(amount: float, source: String = "cannon") -> void:
	super.take_damage(amount, source)
	hit_flash = 0.15

func _on_destroyed() -> void:
	# 销毁动画
	var tween: Tween = create_tween()
	tween.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.3)
	tween.tween_callback(queue_free)
