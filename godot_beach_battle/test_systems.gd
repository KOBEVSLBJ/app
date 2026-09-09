# 自动化测试脚本 - 验证核心系统运行时无错误
# 运行: godot --headless --script test_systems.gd

extends SceneTree

func _init() -> void:
	print("=== 沙滩航模大战 核心系统测试 ===")
	var ok: bool = true
	ok = ok and _test_parts()
	ok = ok and _test_boat()
	ok = ok and _test_trajectory()
	ok = ok and _test_turret_angle()
	if ok:
		print("\n=== 所有测试通过 ===")
	else:
		print("\n=== 部分测试失败 ===")
	quit()

func _test_parts() -> bool:
	print("\n[1] 测试零件资源加载...")
	var db: PartsDB = PartsDB.new()
	# 手动调用加载
	for p in db.PART_PATHS["hull"]:
		var r = load(p)
		if r == null:
			print("  FAIL: 无法加载 ", p)
			return false
		print("  OK: ", r.part_name, " $", r.price, " hp=", r.hull_hp)
	db._load_all()
	print("  船身:", db.hulls.size(), " 马达:", db.motors.size(), " 遥控:", db.remotes.size(), " 沙子:", db.sands.size(), " 火炮:", db.cannons.size())
	return true

func _test_boat() -> bool:
	print("\n[2] 测试船只属性计算...")
	var hull: PartData = load("res://resources/hull_wood.tres")
	var motor: PartData = load("res://resources/motor_advanced.tres")
	var remote: PartData = load("res://resources/remote_advanced.tres")
	var sand: PartData = load("res://resources/sand_heavy.tres")
	var cannon: PartData = load("res://resources/cannon_basic.tres")
	var boat: Boat = preload("res://scripts/boat.gd").new()
	boat.hull = hull
	boat.motor = motor
	boat.remote = remote
	boat.sand = sand
	boat.cannon = cannon
	boat.team = 0
	boat._compute_stats()
	print("  血量:", boat.max_hp, " 防御:", boat.defense, " 速度:", boat.move_speed, " 转向:", boat.turn_rate, " 撞击:", boat.ram_damage)
	assert(boat.max_hp == 120.0)
	assert(boat.move_speed == 14.0 * (1.0 - 0.2))
	print("  OK: 船只属性计算正确")
	return true

func _test_trajectory() -> bool:
	print("\n[3] 测试抛物线落点计算...")
	var turret: Turret = preload("res://scripts/turret.gd").new()
	turret.projectile_speed = 18.0
	turret.gravity = 9.8
	var angle: float = turret._calc_fire_angle(20.0)
	print("  距离20时发射角度(弧度):", angle, " 度:", rad_to_deg(angle))
	# 验证: v^2 * sin(2a) / g 应接近 20
	var calc_dist: float = (18.0 * 18.0) * sin(2.0 * angle) / 9.8
	print("  反算距离:", calc_dist, " (应接近20)")
	assert(abs(calc_dist - 20.0) < 0.5)
	print("  OK: 抛物线公式正确")
	return true

func _test_turret_angle() -> bool:
	print("\n[4] 测试超远射程角度钳制...")
	var turret: Turret = preload("res://scripts/turret.gd").new()
	turret.projectile_speed = 10.0
	turret.gravity = 9.8
	var angle: float = turret._calc_fire_angle(100.0)  # 超出射程
	print("  超远角度:", rad_to_deg(angle), " (sin值被钳制)")
	assert(not is_nan(angle))
	print("  OK: 未出现NaN")
	return true
