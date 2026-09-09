# 游戏主控 - 地图/相机/状态机/输入/部署/胜负
# 沙滩航模大战 V1.0

extends Node3D

class_name GameManager

enum State { BUILD, DEPLOY, BATTLE, RESULT }

const BUDGET: int = 500
const MAP_HALF_X: float = 50.0
const MAP_HALF_Z: float = 30.0
const WATER_RX: float = 42.0
const WATER_RZ: float = 28.0

var state: State = State.BUILD
var parts_db: PartsDB
var world_root: Node3D

# 舰队配置
var fleet_a: Array = []
var fleet_b: Array = []

# 已部署单位
var boats_a: Array[Boat] = []
var boats_b: Array[Boat] = []
var turrets_a: Array[Turret] = []
var turrets_b: Array[Turret] = []
var base_a: BaseBuilding
var base_b: BaseBuilding

# 当前选中船索引
var sel_idx_a: int = 0
var sel_idx_b: int = 0

# 相机
var overview_cam: Camera3D
var cam_a: Camera3D
var cam_b: Camera3D
var vp_a: SubViewport
var vp_b: SubViewport
var preview_a: MeshInstance3D
var preview_b: MeshInstance3D
var preview_mesh_a: ImmediateMesh
var preview_mesh_b: ImmediateMesh

# UI
var build_ui: BuildUI
var deploy_ui: DeployUI
var battle_hud: BattleHUD
var result_ui: ResultUI

# 部署阶段状态
var deploy_player: int = 0
var deploy_boat_index: int = 0
var deploying_turret: bool = false
var turrets_placed_a: int = 0
var turrets_placed_b: int = 0
const MAX_TURRETS: int = 2

func _ready() -> void:
	randomize()
	world_root = Node3D.new()
	world_root.name = "World"
	add_child(world_root)
	# 零件库
	parts_db = PartsDB.new()
	add_child(parts_db)
	# 地图
	_build_map()
	# 相机系统
	_build_cameras()
	# 初始进入拼装
	_enter_build()

# ================= 地图构建 =================
func _build_map() -> void:
	# 水面
	var water: MeshInstance3D = MeshInstance3D.new()
	var plane: PlaneMesh = PlaneMesh.new()
	plane.size = Vector2(100, 60)
	water.mesh = plane
	water.name = "Water"
	var wmat: ShaderMaterial = ShaderMaterial.new()
	wmat.shader = _make_water_shader()
	water.material_override = wmat
	world_root.add_child(water)
	# 沙滩(左)
	_add_sand(-30.0)
	# 沙滩(右)
	_add_sand(30.0)
	# 土堆
	var mound_positions: Array = [
		Vector3(-8, 0, -8), Vector3(0, 0, 0), Vector3(8, 0, 8),
		Vector3(-12, 0, 10), Vector3(12, 0, -10), Vector3(0, 0, -14),
	]
	for pos in mound_positions:
		var mound: Mound = preload("res://scripts/mound.gd").new()
		mound.position = pos
		world_root.add_child(mound)
	# 基地
	base_a = preload("res://scripts/base.gd").new()
	base_a.team = 0
	base_a.position = Vector3(-42, 0, 0)
	base_a.base_destroyed.connect(_on_base_destroyed)
	world_root.add_child(base_a)
	base_b = preload("res://scripts/base.gd").new()
	base_b.team = 1
	base_b.position = Vector3(42, 0, 0)
	base_b.base_destroyed.connect(_on_base_destroyed)
	world_root.add_child(base_b)
	# 光照
	var light: DirectionalLight3D = DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-45, 30, 0)
	light.light_energy = 1.0
	world_root.add_child(light)
	var ambient: WorldEnvironment = WorldEnvironment.new()
	var env: Environment = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.5, 0.75, 0.9)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.6, 0.6, 0.6)
	env.ambient_light_energy = 0.6
	ambient.environment = env
	world_root.add_child(ambient)

func _add_sand(center_x: float) -> void:
	var sand: MeshInstance3D = MeshInstance3D.new()
	var plane: PlaneMesh = PlaneMesh.new()
	plane.size = Vector2(20, 56)
	sand.mesh = plane
	sand.position = Vector3(center_x, 0.02, 0)
	var smat: StandardMaterial3D = StandardMaterial3D.new()
	smat.albedo_color = Color(0.85, 0.78, 0.55)
	sand.material_override = smat
	world_root.add_child(sand)

func _make_water_shader() -> Shader:
	var shader: Shader = Shader.new()
	shader.code = """
shader_type spatial;
uniform float wave_amplitude : hint_range(0, 2) = 0.15;
uniform float wave_frequency : hint_range(0, 20) = 4.0;
uniform float wave_speed : hint_range(0, 10) = 1.5;
uniform vec4 water_color : source_color = vec4(0.2, 0.5, 0.8, 1.0);
void vertex() {
	float t = TIME * wave_speed;
	float wave = sin(VERTEX.x * wave_frequency + t) * cos(VERTEX.y * wave_frequency * 0.7 + t * 1.3) * wave_amplitude;
	VERTEX.z += wave;
}
void fragment() {
	ALBEDO = water_color.rgb;
	ROUGHNESS = 0.3;
	METALLIC = 0.1;
}
"""
	return shader

# ================= 相机构建 =================
func _build_cameras() -> void:
	# 总览相机(部署阶段用)
	overview_cam = Camera3D.new()
	overview_cam.position = Vector3(0, 70, 0.1)
	overview_cam.rotation_degrees = Vector3(-90, 0, 0)
	overview_cam.current = true
	world_root.add_child(overview_cam)

	# 分屏系统
	var screen: Control = Control.new()
	screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	screen.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(screen)

	var left: SubViewportContainer = SubViewportContainer.new()
	left.anchor_right = 0.5
	left.anchor_bottom = 1.0
	left.mouse_filter = Control.MOUSE_FILTER_IGNORE
	screen.add_child(left)
	vp_a = SubViewport.new()
	vp_a.size = Vector2i(640, 720)
	vp_a.own_world_3d = false
	left.add_child(vp_a)
	cam_a = Camera3D.new()
	cam_a.current = true
	vp_a.add_child(cam_a)

	var right: SubViewportContainer = SubViewportContainer.new()
	right.anchor_left = 0.5
	right.anchor_right = 1.0
	right.anchor_bottom = 1.0
	right.mouse_filter = Control.MOUSE_FILTER_IGNORE
	screen.add_child(right)
	vp_b = SubViewport.new()
	vp_b.size = Vector2i(640, 720)
	vp_b.own_world_3d = false
	right.add_child(vp_b)
	cam_b = Camera3D.new()
	cam_b.current = true
	vp_b.add_child(cam_b)

	# 共享世界
	vp_a.world_3d = get_viewport().world_3d
	vp_b.world_3d = get_viewport().world_3d

	# 初始隐藏分屏(部署阶段用总览)
	screen.visible = false

func _get_split_screen() -> Control:
	for c in get_children():
		if c is Control and c.get_child_count() == 2 and c.get_child(0) is SubViewportContainer:
			return c
	return null

# ================= 状态机 =================
func _enter_build() -> void:
	state = State.BUILD
	build_ui = preload("res://scripts/ui/build_ui.gd").new()
	add_child(build_ui)
	build_ui.setup(parts_db, 0)
	build_ui.fleet_confirmed.connect(_on_fleet_a_confirmed)

func _on_fleet_a_confirmed(fleet: Array) -> void:
	fleet_a = fleet
	build_ui.queue_free()
	build_ui = null
	# 玩家B拼装
	build_ui = preload("res://scripts/ui/build_ui.gd").new()
	add_child(build_ui)
	build_ui.setup(parts_db, 1)
	build_ui.fleet_confirmed.connect(_on_fleet_b_confirmed)

func _on_fleet_b_confirmed(fleet: Array) -> void:
	fleet_b = fleet
	build_ui.queue_free()
	build_ui = null
	_enter_deploy()

func _enter_deploy() -> void:
	state = State.DEPLOY
	overview_cam.current = true
	var ss: Control = _get_split_screen()
	if ss: ss.visible = false
	deploy_ui = preload("res://scripts/ui/deploy_ui.gd").new()
	add_child(deploy_ui)
	deploy_ui.deploy_confirmed.connect(_on_deploy_confirmed)
	deploy_player = 0
	deploy_boat_index = 0
	deploying_turret = false
	turrets_placed_a = 0
	turrets_placed_b = 0
	_update_deploy_info()

func _update_deploy_info() -> void:
	var pname: String = ["A", "B"][deploy_player]
	var fleet: Array = fleet_a if deploy_player == 0 else fleet_b
	var obj: String = "炮台" if deploying_turret else "船"
	var idx: int = deploy_boat_index + 1
	var total: int = fleet.size()
	var tcount: int = turrets_placed_a if deploy_player == 0 else turrets_placed_b
	var msg: String = "玩家 %s 部署阶段\n正在放置: %s %d/%d\n已放置炮台: %d/%d\n点击己方半场(玩家A左侧x<0, 玩家B右侧x>0)放置" % [
		pname, obj, idx, total, tcount, MAX_TURRETS
	]
	if deploy_ui:
		deploy_ui.set_info(msg)

func _on_deploy_confirmed() -> void:
	# 切换到下一个玩家或进入战斗
	if deploy_player == 0:
		deploy_player = 1
		deploy_boat_index = 0
		deploying_turret = false
		_update_deploy_info()
	else:
		deploy_ui.queue_free()
		deploy_ui = null
		_enter_battle()

func _enter_battle() -> void:
	state = State.BATTLE
	# 启用分屏
	var ss: Control = _get_split_screen()
	if ss: ss.visible = true
	overview_cam.current = false
	cam_a.current = true
	cam_b.current = true
	# 默认选中第一艘船
	sel_idx_a = 0
	sel_idx_b = 0
	_update_selection()
	# 落点预览线(ImmediateMesh)
	preview_mesh_a = ImmediateMesh.new()
	preview_a = MeshInstance3D.new()
	preview_a.mesh = preview_mesh_a
	var mat_a: StandardMaterial3D = StandardMaterial3D.new()
	mat_a.albedo_color = Color(1, 0.8, 0.3)
	mat_a.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	preview_a.material_override = mat_a
	world_root.add_child(preview_a)
	preview_mesh_b = ImmediateMesh.new()
	preview_b = MeshInstance3D.new()
	preview_b.mesh = preview_mesh_b
	var mat_b: StandardMaterial3D = StandardMaterial3D.new()
	mat_b.albedo_color = Color(0.3, 0.8, 1)
	mat_b.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	preview_b.material_override = mat_b
	world_root.add_child(preview_b)
	# HUD
	battle_hud = preload("res://scripts/ui/battle_hud.gd").new()
	add_child(battle_hud)

func _enter_result(winner: int) -> void:
	state = State.RESULT
	result_ui = preload("res://scripts/ui/result_ui.gd").new()
	add_child(result_ui)
	result_ui.set_winner(winner)
	result_ui.restart_pressed.connect(_restart)

func _restart() -> void:
	get_tree().reload_current_scene()

# ================= 输入处理 =================
func _unhandled_input(event: InputEvent) -> void:
	if state == State.DEPLOY:
		if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_handle_deploy_click(event.position)
		return
	if state != State.BATTLE:
		return
	# 切换船
	if event.is_action_pressed("p1_next"):
		sel_idx_a = (sel_idx_a + 1) % max(boats_a.size(), 1)
		_update_selection()
	if event.is_action_pressed("p2_next"):
		sel_idx_b = (sel_idx_b + 1) % max(boats_b.size(), 1)
		_update_selection()

func _handle_deploy_click(screen_pos: Vector2) -> void:
	# 射线到地面 y=0
	var cam: Camera3D = overview_cam
	var from: Vector3 = cam.project_ray_origin(screen_pos)
	var dir: Vector3 = cam.project_ray_normal(screen_pos)
	if dir.y >= 0:
		return
	var t: float = -from.y / dir.y
	var hit: Vector3 = from + dir * t
	# 限制在半场
	if deploy_player == 0 and hit.x >= -2:
		return
	if deploy_player == 1 and hit.x <= 2:
		return
	# 放在水域内
	var val: float = (hit.x * hit.x) / (WATER_RX * WATER_RX) + (hit.z * hit.z) / (WATER_RZ * WATER_RZ)
	if val > 1.0:
		return
	if deploying_turret:
		_place_turret(hit)
	else:
		_place_boat(hit)

func _place_boat(pos: Vector3) -> void:
	var fleet: Array = fleet_a if deploy_player == 0 else fleet_b
	if deploy_boat_index >= fleet.size():
		return
	var cfg: Dictionary = fleet[deploy_boat_index]
	var boat: Boat = preload("res://scripts/boat.gd").new()
	boat.team = deploy_player
	boat.hull = cfg.hull
	boat.motor = cfg.motor
	boat.remote = cfg.remote
	boat.sand = cfg.sand
	boat.cannon = cfg.cannon
	boat.position = pos
	boat.rotation.y = deg_to_rad(90) if deploy_player == 0 else deg_to_rad(-90)
	world_root.add_child(boat)
	if deploy_player == 0:
		boats_a.append(boat)
	else:
		boats_b.append(boat)
	deploy_boat_index += 1
	# 船放完后问是否放炮台
	var fleet2: Array = fleet_a if deploy_player == 0 else fleet_b
	if deploy_boat_index >= fleet2.size():
		deploying_turret = true
	_update_deploy_info()

func _place_turret(pos: Vector3) -> void:
	var tcount: int = turrets_placed_a if deploy_player == 0 else turrets_placed_b
	if tcount >= MAX_TURRETS:
		return
	var turret: Turret = preload("res://scripts/turret.gd").new()
	turret.team = deploy_player
	turret.position = pos
	world_root.add_child(turret)
	if deploy_player == 0:
		turrets_a.append(turret)
		turrets_placed_a += 1
	else:
		turrets_b.append(turret)
		turrets_placed_b += 1
	_update_deploy_info()

# ================= 战斗更新 =================
func _process(delta: float) -> void:
	if state != State.BATTLE:
		return
	# 清理死亡船只
	boats_a = _filter_dead(boats_a)
	boats_b = _filter_dead(boats_b)
	_read_input()
	_update_cameras()
	_update_previews()
	_update_hud()
	_check_win()

func _filter_dead(arr: Array[Boat]) -> Array[Boat]:
	var result: Array[Boat] = []
	for b in arr:
		if is_instance_valid(b) and not b.dead:
			result.append(b)
	return result

func _read_input() -> void:
	# 玩家A
	var boat_a: Boat = boats_a[sel_idx_a] if sel_idx_a < boats_a.size() else null
	if boat_a:
		boat_a.input_throttle = Input.get_axis("p1_backward", "p1_forward")
		boat_a.input_turn = Input.get_axis("p1_right", "p1_left")
		boat_a.fire_requested = boat_a.fire_requested or Input.is_action_just_pressed("p1_fire")
	# 玩家B
	var boat_b: Boat = boats_b[sel_idx_b] if sel_idx_b < boats_b.size() else null
	if boat_b:
		boat_b.input_throttle = Input.get_axis("p2_backward", "p2_forward")
		boat_b.input_turn = Input.get_axis("p2_right", "p2_left")
		boat_b.fire_requested = boat_b.fire_requested or Input.is_action_just_pressed("p2_fire")

func _update_cameras() -> void:
	# 相机A跟随玩家A选中船(斜俯视)
	var target_a: Vector3 = _fleet_center(boats_a)
	cam_a.position = target_a + Vector3(0, 22, 16)
	cam_a.look_at(target_a, Vector3.UP)
	var target_b: Vector3 = _fleet_center(boats_b)
	cam_b.position = target_b + Vector3(0, 22, 16)
	cam_b.look_at(target_b, Vector3.UP)

func _fleet_center(boats: Array[Boat]) -> Vector3:
	if boats.size() == 0:
		return Vector3.ZERO
	var sum: Vector3 = Vector3.ZERO
	for b in boats:
		sum += b.global_position
	return sum / boats.size()

func _update_previews() -> void:
	_draw_preview(preview_mesh_a, boats_a, sel_idx_a)
	_draw_preview(preview_mesh_b, boats_b, sel_idx_b)

func _draw_preview(mesh: ImmediateMesh, boats: Array[Boat], idx: int) -> void:
	mesh.clear_surfaces()
	var boat: Boat = boats[idx] if idx < boats.size() else null
	if boat == null or boat.cannon == null:
		return
	var pts: PackedVector3Array = boat.get_trajectory_points()
	if pts.size() < 2:
		return
	mesh.surface_begin(Mesh.PRIMITIVE_LINE_STRIP)
	for p in pts:
		mesh.surface_add_vertex(p)
	mesh.surface_end()

func _update_selection() -> void:
	for i in range(boats_a.size()):
		var ring: Node3D = boats_a[i].get_node_or_null("SelectRing")
		if ring: ring.visible = (i == sel_idx_a)
	for i in range(boats_b.size()):
		var ring: Node3D = boats_b[i].get_node_or_null("SelectRing")
		if ring: ring.visible = (i == sel_idx_b)

func _update_hud() -> void:
	if battle_hud == null:
		return
	var a_boat: Boat = boats_a[sel_idx_a] if sel_idx_a < boats_a.size() else null
	var b_boat: Boat = boats_b[sel_idx_b] if sel_idx_b < boats_b.size() else null
	var ta: String = "玩家A | 船数:%d | 基地:%.0f/%.0f" % [boats_a.size(), base_a.hp, base_a.max_hp]
	if a_boat:
		ta += "\n选中船 血量:%.0f/%.0f 冷却:%.1fs" % [a_boat.hp, a_boat.max_hp, max(a_boat.cooldown_left, 0.0)]
	var tb: String = "玩家B | 船数:%d | 基地:%.0f/%.0f" % [boats_b.size(), base_b.hp, base_b.max_hp]
	if b_boat:
		tb += "\n选中船 血量:%.0f/%.0f 冷却:%.1fs" % [b_boat.hp, b_boat.max_hp, max(b_boat.cooldown_left, 0.0)]
	battle_hud.update_hud(ta, tb)

func _check_win() -> void:
	if base_a.dead:
		_enter_result(1)
	elif base_b.dead:
		_enter_result(0)

func _on_base_destroyed(team: int) -> void:
	# winner 是对方
	_enter_result(1 - team)
