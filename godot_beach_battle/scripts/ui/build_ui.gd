# 拼装阶段 UI - 零件选择、预算校验、舰队配置
# 沙滩航模大战 V1.0

extends CanvasLayer

class_name BuildUI

signal fleet_confirmed(fleet: Array)
signal cancel_pressed()

const BUDGET: int = 500

var parts_db: PartsDB
var player: int = 0  # 0=A, 1=B
var fleet: Array = []  # 数组里每个元素是 {hull, motor, remote, sand, cannon}

# 当前选中零件(索引)
var sel_hull: int = 0
var sel_motor: int = 0
var sel_remote: int = 0
var sel_sand: int = -1  # -1 表示不加沙子
var sel_cannon: int = 0

var root: VBoxContainer
var budget_label: Label
var confirm_btn: Button
var fleet_list: VBoxContainer

func _ready() -> void:
	_build_ui()

func setup(p_parts_db: PartsDB, p_player: int) -> void:
	parts_db = p_parts_db
	player = p_player
	_refresh()

func _build_ui() -> void:
	layer = 10
	var panel: Panel = Panel.new()
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(panel)
	var margin: MarginContainer = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_bottom", 20)
	panel.add_child(margin)
	root = VBoxContainer.new()
	margin.add_child(root)

	var title: Label = Label.new()
	title.text = "拼装阶段 - 玩家 %s" % ["A", "B"][player]
	title.add_theme_font_size_override("font_size", 28)
	root.add_child(title)

	budget_label = Label.new()
	budget_label.add_theme_font_size_override("font_size", 20)
	root.add_child(budget_label)

	# 零件选择区
	var parts_row: HBoxContainer = HBoxContainer.new()
	root.add_child(parts_row)
	parts_row.add_child(_make_part_column("船身", PartData.PartType.HULL, "sel_hull"))
	parts_row.add_child(_make_part_column("马达", PartData.PartType.MOTOR, "sel_motor"))
	parts_row.add_child(_make_part_column("遥控", PartData.PartType.REMOTE, "sel_remote"))
	parts_row.add_child(_make_part_column("沙子(可选)", PartData.PartType.SAND, "sel_sand"))
	parts_row.add_child(_make_part_column("火炮", PartData.PartType.CANNON, "sel_cannon"))

	# 当前船预览
	var cur_label: Label = Label.new()
	cur_label.name = "CurPreview"
	root.add_child(cur_label)

	# 添加到舰队
	var add_btn: Button = Button.new()
	add_btn.text = "添加此船到舰队"
	add_btn.pressed.connect(_on_add_boat)
	root.add_child(add_btn)

	# 舰队列表
	var fl_label: Label = Label.new()
	fl_label.text = "当前舰队:"
	root.add_child(fl_label)
	fleet_list = VBoxContainer.new()
	root.add_child(fleet_list)

	# 底部按钮
	var bottom: HBoxContainer = HBoxContainer.new()
	root.add_child(bottom)
	var remove_btn: Button = Button.new()
	remove_btn.text = "移除最后一艘"
	remove_btn.pressed.connect(_on_remove_last)
	bottom.add_child(remove_btn)
	confirm_btn = Button.new()
	confirm_btn.text = "确认舰队，进入部署"
	confirm_btn.pressed.connect(_on_confirm)
	bottom.add_child(confirm_btn)

func _make_part_column(title: String, part_type: int, prop_name: String) -> VBoxContainer:
	var col: VBoxContainer = VBoxContainer.new()
	var lbl: Label = Label.new()
	lbl.text = title
	col.add_child(lbl)
	var list: OptionButton = OptionButton.new()
	list.name = prop_name
	col.add_child(list)
	return col

func _refresh() -> void:
	if parts_db == null:
		return
	_populate_option("sel_hull", parts_db.hulls)
	_populate_option("sel_motor", parts_db.motors)
	_populate_option("sel_remote", parts_db.remotes)
	_populate_sand()
	_populate_option("sel_cannon", parts_db.cannons)
	_update_preview()

func _populate_option(prop: String, catalog: Array) -> void:
	var opt: OptionButton = root.find_child(prop, true, false)
	if opt == null:
		return
	opt.clear()
	for i in range(catalog.size()):
		var p: PartData = catalog[i]
		opt.add_item("%s ($%d)" % [p.part_name, p.price], i)
	var cur: int = get(prop)
	if cur >= 0 and cur < catalog.size():
		opt.select(cur)
	# 连接信号(只连一次)
	if not opt.item_selected.is_connected(_on_part_changed):
		opt.item_selected.connect(_on_part_changed.bind(prop))

func _populate_sand() -> void:
	var opt: OptionButton = root.find_child("sel_sand", true, false)
	if opt == null:
		return
	opt.clear()
	opt.add_item("无", -1)
	for i in range(parts_db.sands.size()):
		var p: PartData = parts_db.sands[i]
		opt.add_item("%s ($%d)" % [p.part_name, p.price], i)
	if sel_sand >= 0:
		opt.select(sel_sand + 1)  # +1 because "无" is at index 0
	else:
		opt.select(0)
	if not opt.item_selected.is_connected(_on_part_changed):
		opt.item_selected.connect(_on_part_changed.bind("sel_sand"))

func _on_part_changed(index: int, prop: String) -> void:
	var opt: OptionButton = root.find_child(prop, true, false)
	var id: int = opt.get_item_id(index)
	set(prop, id)
	_update_preview()

func _current_boat_price() -> int:
	var total: int = 0
	total += parts_db.hulls[sel_hull].price
	total += parts_db.motors[sel_motor].price
	total += parts_db.remotes[sel_remote].price
	if sel_sand >= 0:
		total += parts_db.sands[sel_sand].price
	total += parts_db.cannons[sel_cannon].price
	return total

func _fleet_price() -> int:
	var total: int = 0
	for boat in fleet:
		total += boat.price
	return total

func _update_preview() -> void:
	var cur: Label = root.find_child("CurPreview", true, false)
	if cur:
		var hull_p: PartData = parts_db.hulls[sel_hull]
		var sand_txt: String = "无"
		if sel_sand >= 0:
			sand_txt = parts_db.sands[sel_sand].part_name
		cur.text = "当前船: 船身=%s 血量=%.0f 防御=%.0f%% | 撞击伤害=%s | 此船花费:$%d" % [
			hull_p.part_name, hull_p.hull_hp, hull_p.hull_defense * 100,
			parts_db.sands[sel_sand].sand_ram_damage if sel_sand >= 0 else 0,
			_current_boat_price()
		]
	var fleet_cost: int = _fleet_price()
	var cur_cost: int = _current_boat_price()
	var remaining: int = BUDGET - fleet_cost - cur_cost
	budget_label.text = "预算: $%d / $500  |  舰队已花: $%d  |  此船: $%d  |  剩余: $%d" % [
		fleet_cost + cur_cost, fleet_cost, cur_cost, remaining
	]
	# 确认按钮: 至少1艘船，舰队花费<=500
	confirm_btn.disabled = fleet.size() < 1 or fleet_cost > BUDGET
	if remaining < 0:
		budget_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
	else:
		budget_label.add_theme_color_override("font_color", Color(0.9, 0.9, 0.9))

func _on_add_boat() -> void:
	var boat_cfg: Dictionary = {
		"hull": parts_db.hulls[sel_hull],
		"motor": parts_db.motors[sel_motor],
		"remote": parts_db.remotes[sel_remote],
		"sand": parts_db.sands[sel_sand] if sel_sand >= 0 else null,
		"cannon": parts_db.cannons[sel_cannon],
		"price": _current_boat_price(),
	}
	# 校验预算
	if _fleet_price() + boat_cfg.price > BUDGET:
		return
	fleet.append(boat_cfg)
	_refresh_fleet_list()
	_update_preview()

func _on_remove_last() -> void:
	if fleet.size() > 0:
		fleet.pop_back()
		_refresh_fleet_list()
		_update_preview()

func _refresh_fleet_list() -> void:
	for c in fleet_list.get_children():
		c.queue_free()
	for i in range(fleet.size()):
		var b: Dictionary = fleet[i]
		var lbl: Label = Label.new()
		lbl.text = "船%d: %s + %s + %s + %s + %s  ($%d)" % [
			i + 1, b.hull.part_name, b.motor.part_name, b.remote.part_name,
			b.sand.part_name if b.sand else "无沙", b.cannon.part_name, b.price
		]
		fleet_list.add_child(lbl)

func _on_confirm() -> void:
	if fleet.size() < 1:
		return
	if _fleet_price() > BUDGET:
		return
	fleet_confirmed.emit(fleet)
