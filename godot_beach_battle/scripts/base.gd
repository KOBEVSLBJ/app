# 基地 - 仅受火炮伤害，血量归0触发胜负
# 沙滩航模大战 V1.0

extends Damageable

class_name BaseBuilding

@export var team: int = 0

signal base_destroyed(team: int)

const COLLISION_LAYER_BASE := 8

func _ready() -> void:
	super._ready()
	is_base = true
	set_meta("team", team)
	max_hp = 300.0
	hp = 300.0
	defense = 0.2
	_setup_visual()
	_setup_collision()

func _setup_visual() -> void:
	var base_mesh: MeshInstance3D = MeshInstance3D.new()
	var box: BoxMesh = BoxMesh.new()
	box.size = Vector3(5.0, 3.0, 4.0)
	base_mesh.mesh = box
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.albedo_color = Color(0.85, 0.7, 0.5) if team == 0 else Color(0.5, 0.7, 0.85)
	base_mesh.material_override = mat
	base_mesh.position.y = 1.5
	add_child(base_mesh)
	# 旗帜
	var pole: MeshInstance3D = MeshInstance3D.new()
	var cyl: CylinderMesh = CylinderMesh.new()
	cyl.top_radius = 0.08
	cyl.bottom_radius = 0.08
	cyl.height = 4.0
	pole.mesh = cyl
	pole.position = Vector3(0, 3.5, 0)
	add_child(pole)
	var flag: MeshInstance3D = MeshInstance3D.new()
	var fbox: BoxMesh = BoxMesh.new()
	fbox.size = Vector3(1.5, 1.0, 0.05)
	flag.mesh = fbox
	flag.position = Vector3(0.8, 4.8, 0)
	var fmat: StandardMaterial3D = StandardMaterial3D.new()
	fmat.albedo_color = Color(1.0, 0.3, 0.3) if team == 0 else Color(0.3, 0.3, 1.0)
	flag.material_override = fmat
	add_child(flag)

func _setup_collision() -> void:
	var col: CollisionShape3D = CollisionShape3D.new()
	var shape: BoxShape3D = BoxShape3D.new()
	shape.size = Vector3(5.0, 3.0, 4.0)
	col.position.y = 1.5
	add_child(col)
	collision_layer = COLLISION_LAYER_BASE
	collision_mask = 0

func _on_destroyed() -> void:
	base_destroyed.emit(team)
