# 结算阶段 UI - 胜负面板 + 重启
# 沙滩航模大战 V1.0

extends CanvasLayer

class_name ResultUI

signal restart_pressed()

func _ready() -> void:
	layer = 20
	var panel: Panel = Panel.new()
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	panel.modulate = Color(0, 0, 0, 0.6)
	add_child(panel)
	var center: CenterContainer = CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	panel.add_child(center)
	var vbox: VBoxContainer = VBoxContainer.new()
	center.add_child(vbox)
	var title: Label = Label.new()
	title.name = "Title"
	title.add_theme_font_size_override("font_size", 64)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)
	var btn: Button = Button.new()
	btn.text = "重新开始对局"
	btn.custom_minimum_size = Vector2(200, 50)
	btn.pressed.connect(func(): restart_pressed.emit())
	vbox.add_child(btn)

func set_winner(winner: int) -> void:
	var title: Label = find_child("Title", true, false)
	if winner == 0:
		title.text = "玩家 A 胜利！"
		title.add_theme_color_override("font_color", Color(1, 0.8, 0.4))
	else:
		title.text = "玩家 B 胜利！"
		title.add_theme_color_override("font_color", Color(0.4, 0.8, 1))
