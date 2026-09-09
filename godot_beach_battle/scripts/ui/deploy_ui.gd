# 部署阶段 UI - 提示 + 确认
# 沙滩航模大战 V1.0

extends CanvasLayer

class_name DeployUI

signal deploy_confirmed()

var root: VBoxContainer
var info_label: Label

func _ready() -> void:
	layer = 10
	var panel: Panel = Panel.new()
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(panel)
	var margin: MarginContainer = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 30)
	margin.add_theme_constant_override("margin_right", 30)
	margin.add_theme_constant_override("margin_top", 30)
	margin.add_theme_constant_override("margin_bottom", 30)
	panel.add_child(margin)
	root = VBoxContainer.new()
	margin.add_child(root)

	var title: Label = Label.new()
	title.text = "部署阶段"
	title.add_theme_font_size_override("font_size", 26)
	root.add_child(title)

	info_label = Label.new()
	info_label.add_theme_font_size_override("font_size", 18)
	info_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info_label.custom_minimum_size = Vector2(800, 0)
	root.add_child(info_label)

	var hint: Label = Label.new()
	hint.text = "操作: 鼠标左键点击己方半场放置下一艘船 / 炮台"
	hint.add_theme_font_size_override("font_size", 16)
	root.add_child(hint)

	var confirm: Button = Button.new()
	confirm.text = "确认部署，开始战斗"
	confirm.pressed.connect(func(): deploy_confirmed.emit())
	root.add_child(confirm)

func set_info(text: String) -> void:
	info_label.text = text
