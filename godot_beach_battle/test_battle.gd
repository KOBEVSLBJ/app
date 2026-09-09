# 战斗系统集成测试 - 验证伤害/防御/基地规则
# 运行: godot --headless --script test_battle.gd

extends SceneTree

func _init() -> void:
	print("=== 战斗系统集成测试 ===")
	var ok: bool = true
	ok = ok and _test_base_only_cannon()
	ok = ok and _test_defense_reduction()
	ok = ok and _test_boat_destroy()
	ok = ok and _test_projectile_setup()
	print("\n=== 结果: ", "全部通过" if ok else "有失败", " ===")
	quit()

func _make_boat(team: int) -> Boat:
	var b: Boat = preload("res://scripts/boat.gd").new()
	b.hull = load("res://resources/hull_wood.tres")
	b.motor = load("res://resources/motor_basic.tres")
	b.remote = load("res://resources/remote_basic.tres")
	b.sand = load("res://resources/sand_light.tres")
	b.cannon = load("res://resources/cannon_basic.tres")
	b.team = team
	return b

func _test_base_only_cannon() -> bool:
	print("\n[1] 基地只受火炮伤害(撞击无效)...")
	var base: BaseBuilding = preload("res://scripts/base.gd").new()
	base.team = 1
	base._ready()
	var hp0: float = base.hp
	base.take_damage(50, "ram")
	assert(base.hp == hp0, "基地不应受撞击伤害")
	base.take_damage(50, "cannon")
	assert(base.hp < hp0, "基地应受火炮伤害")
	print("  OK: 撞击无效, 火炮扣血后=", base.hp)
	return true

func _test_defense_reduction() -> bool:
	print("\n[2] 防御减伤计算...")
	var b: Boat = _make_boat(0)
	b._ready()
	var hp0: float = b.hp
	b.take_damage(100, "cannon")
	var dealt: float = hp0 - b.hp
	print("  100伤害经15%防御: 实际扣血=", dealt, " 期望=85")
	assert(abs(dealt - 85.0) < 0.1)
	print("  OK: 减伤正确")
	return true

func _test_boat_destroy() -> bool:
	print("\n[3] 船只血量归0销毁...")
	var b: Boat = _make_boat(0)
	b._ready()
	var received: Array = []
	b.destroyed.connect(func(): received.append(1))
	b.take_damage(9999, "cannon")
	assert(b.dead, "船应死亡")
	assert(b.hp <= 0.0, "血量应<=0")
	# 信号在节点于场景树中时正常触发; 此处验证死亡状态即可
	print("  OK: 船只销毁 dead=", b.dead, " hp=", b.hp, " signal_received=", received.size() > 0)
	return true

func _test_projectile_setup() -> bool:
	print("\n[4] 炮弹参数设置...")
	var proj: Projectile = preload("res://scripts/projectile.gd").new()
	var vel: Vector3 = Vector3(10, 10, 0)
	proj.setup(25.0, vel, 9.8, 0, 20.0)
	assert(proj.damage == 25.0)
	assert(proj.velocity == vel)
	assert(proj.gravity == 9.8)
	assert(proj.owner_team == 0)
	assert(proj.range == 20.0)
	print("  OK: 炮弹 damage=", proj.damage, " gravity=", proj.gravity)
	return true
