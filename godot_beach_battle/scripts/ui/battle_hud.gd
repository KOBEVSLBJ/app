# 战斗阶段 HUD - 双方血量/选中提示/控制说明
# 沙滩航模大战 V1.0

extends CanvasLayer

class_name BattleHUD

var root: Control
var label_a: Label
var label_b: Label

func _ready() -> void:
	layer = 10
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(root)

	# 玩家A 左侧信息
	label_a = Label.new()
	label_a.position = Vector2(10, 10)
	label_a.add_theme_font_size_override("font_size", 16)
	label_a.add_theme_color_override("font_color", Color(1, 0.8, 0.6))
	root.add_child(label_a)

	# 玩家B 右侧信息
	label_b = Label.new()
	label_b.position = Vector2(650, 10)
	label_b.add_theme_font_size_override("font_size", 16)
	label_b.add_theme_color_override("font_color", Color(0.6, 0.8, 1))
	root.add_child(label_b)

	# 中间分屏线
	var line: ColorRect = ColorRect.new()
	line.color = Color(1, 1, 1, 0.3)
	line.position = Vector2(639, 0)
	line.size = Vector2(2, 720)
	root.add_child(line)

	# 控制说明
	var help: Label = Label.new()
	help.text = "A: WASD移动转向 空格开火 Tab切换船 | B: 方向键移动转向 回车开火 RShift切换船"
	help.position = Vector2(10, 700)
	help.add_theme_font_size_override("font_size", 13)
	help.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	root.add_child(help)

func update_hud(text_a: String, text_b: String) -> void:
	label_a.text = text_a
	label_b.text = text_b
