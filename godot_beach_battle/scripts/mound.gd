# 土堆 - 静态障碍物，阻挡船只和炮弹
# 沙滩航模大战 V1.0

extends StaticBody3D

class_name Mound

const COLLISION_LAYER_MOUND := 16

func _ready() -> void:
	set_meta("is_mound", true)
	collision_layer = COLLISION_LAYER_MOUND
	collision_mask = 0
	_setup()

func _setup() -> void:
	var mesh: MeshInstance3D = MeshInstance3D.new()
	var sphere: SphereMesh = SphereMesh.new()
	sphere.radius = 1.8
	sphere.height = 3.6
	mesh.mesh = sphere
	mesh.position.y = 1.2
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.albedo_color = Color(0.55, 0.45, 0.3)
	mesh.material_override = mat
	add_child(mesh)
	var col: CollisionShape3D = CollisionShape3D.new()
	var shape: SphereShape3D = SphereShape3D.new()
	shape.radius = 1.8
	col.shape = shape
	col.position.y = 1.2
	add_child(col)
