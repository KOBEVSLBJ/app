// 程序化白模绘制器 - 用 Graphics 组件绘制低多边形风格
// 沙滩航模大战 V1.0 - Cocos 2D伪3D
//
// 伪3D绘制策略:
// - 物体底部 = 水面阴影(扁椭圆)
// - 物体身 = 中间矩形/多边形
// - 物体顶 = 稍小的顶面(模拟高度)

import { Graphics, Color } from 'cc';

export class ModelRenderer {
    // 绘制航模(俯视小船)
    static drawBoat(g: Graphics, color: Color, height: number = 20): void {
        // 阴影(扁椭圆在水面上)
        g.fillColor = new Color(0, 0, 0, 80);
        g.ellipse(0, 0, 24, 10);
        g.fill();

        // 船身(俯视菱形)
        g.fillColor = color;
        g.moveTo(0, -14);
        g.lineTo(18, 0);
        g.lineTo(0, 14);
        g.lineTo(-18, 0);
        g.close();
        g.fill();

        // 高度侧面(下方暗色条)
        g.fillColor = new Color(
            Math.max(color.r - 40, 0),
            Math.max(color.g - 40, 0),
            Math.max(color.b - 40, 0),
            color.a
        );
        g.moveTo(-18, 0);
        g.lineTo(0, 14);
        g.lineTo(0, 14 + height);
        g.lineTo(-18, height);
        g.close();
        g.fill();
        g.moveTo(18, 0);
        g.lineTo(0, 14);
        g.lineTo(0, 14 + height);
        g.lineTo(18, height);
        g.close();
        g.fill();

        // 甲板(顶部)
        g.fillColor = new Color(
            Math.min(color.r + 30, 255),
            Math.min(color.g + 30, 255),
            Math.min(color.b + 30, 255),
            color.a
        );
        g.moveTo(0, height - 14);
        g.lineTo(18, height);
        g.lineTo(0, height + 14);
        g.lineTo(-18, height);
        g.close();
        g.fill();

        // 炮塔(小方块在甲板上)
        g.fillColor = new Color(60, 60, 60, 255);
        g.rect(-5, height + 5, 10, 10);
        g.fill();
    }

    // 绘制选中圆环
    static drawSelectionRing(g: Graphics, color: Color): void {
        g.strokeColor = color;
        g.lineWidth = 2;
        g.ellipse(0, 0, 26, 11);
        g.stroke();
    }

    // 绘制血条
    static drawHpBar(g: Graphics, x: number, y: number, w: number, h: number, ratio: number, color: Color): void {
        // 背景
        g.fillColor = new Color(20, 20, 20, 180);
        g.rect(x, y, w, h);
        g.fill();
        // 前景
        g.fillColor = color;
        g.rect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
        g.fill();
        // 边框
        g.strokeColor = new Color(255, 255, 255, 180);
        g.lineWidth = 1;
        g.rect(x, y, w, h);
        g.stroke();
    }

    // 绘制基地(带高度的建筑)
    static drawBase(g: Graphics, color: Color, w: number, h: number, height: number = 60): void {
        // 阴影
        g.fillColor = new Color(0, 0, 0, 80);
        g.ellipse(0, 0, w * 0.7, w * 0.25);
        g.fill();

        // 底面
        g.fillColor = color;
        g.rect(-w / 2, 0, w, h);
        g.fill();

        // 侧面(暗)
        const dark = new Color(
            Math.max(color.r - 50, 0),
            Math.max(color.g - 50, 0),
            Math.max(color.b - 50, 0),
            color.a
        );
        g.fillColor = dark;
        g.moveTo(-w / 2, 0);
        g.lineTo(-w / 2, height);
        g.lineTo(w / 2, height);
        g.lineTo(w / 2, 0);
        g.lineTo(w / 2 - 10, -h);
        g.lineTo(-w / 2 + 10, -h);
        g.close();
        g.fill();

        // 顶面(亮)
        const light = new Color(
            Math.min(color.r + 40, 255),
            Math.min(color.g + 40, 255),
            Math.min(color.b + 40, 255),
            color.a
        );
        g.fillColor = light;
        g.rect(-w / 2 + 10, height - h, w - 20, h);
        g.fill();

        // 旗杆
        g.strokeColor = new Color(80, 80, 80, 255);
        g.lineWidth = 2;
        g.moveTo(0, height);
        g.lineTo(0, height + 30);
        g.stroke();
        // 旗帜
        g.fillColor = color;
        g.rect(0, height + 20, 15, 10);
        g.fill();
    }

    // 绘制炮台(固定建筑)
    static drawTurret(g: Graphics, color: Color, angle: number = 0): void {
        // 阴影
        g.fillColor = new Color(0, 0, 0, 80);
        g.ellipse(0, 0, 18, 8);
        g.fill();

        // 底座
        g.fillColor = color;
        g.rect(-12, -12, 24, 24);
        g.fill();

        // 侧面暗色
        g.fillColor = new Color(
            Math.max(color.r - 40, 0),
            Math.max(color.g - 40, 0),
            Math.max(color.b - 40, 0),
            color.a
        );
        g.rect(-12, 0, 24, 8);
        g.fill();

        // 炮管(旋转)
        const barrelLen = 20;
        const bx = Math.sin(angle) * barrelLen;
        const by = -Math.cos(angle) * barrelLen;
        g.strokeColor = new Color(50, 50, 50, 255);
        g.lineWidth = 5;
        g.moveTo(0, -2);
        g.lineTo(bx, by - 2);
        g.stroke();
    }

    // 绘制土堆(圆形障碍)
    static drawMound(g: Graphics): void {
        // 阴影
        g.fillColor = new Color(0, 0, 0, 60);
        g.ellipse(2, 2, 24, 10);
        g.fill();
        // 主体
        g.fillColor = new Color(140, 115, 75, 255);
        g.ellipse(0, 0, 22, 9);
        g.fill();
        // 顶部高光
        g.fillColor = new Color(165, 140, 95, 255);
        g.ellipse(0, -3, 16, 6);
        g.fill();
    }

    // 绘制沙滩
    static drawSand(g: Graphics, centerX: number, width: number, height: number): void {
        g.fillColor = new Color(217, 200, 140, 255);
        g.rect(centerX - width / 2, -height / 2, width, height);
        g.fill();
    }

    // 绘制水面(静态平面)
    static drawWater(g: Graphics, width: number, height: number): void {
        g.fillColor = new Color(50, 128, 200, 255);
        g.rect(-width / 2, -height / 2, width, height);
        g.fill();
        // 简易波浪线条
        g.strokeColor = new Color(80, 148, 210, 200);
        g.lineWidth = 1;
        for (let i = -5; i <= 5; i++) {
            const y = i * 60;
            g.moveTo(-width / 2, y);
            for (let x = -width / 2; x <= width / 2; x += 20) {
                g.lineTo(x, y + Math.sin(x * 0.02) * 3);
            }
        }
        g.stroke();
    }

    // 绘制炮弹(小圆)
    static drawProjectile(g: Graphics, x: number, y: number): void {
        g.fillColor = new Color(255, 180, 40, 255);
        g.circle(x, y, 4);
        g.fill();
        // 光晕
        g.fillColor = new Color(255, 200, 80, 100);
        g.circle(x, y, 7);
        g.fill();
    }

    // 绘制爆炸效果
    static drawExplosion(g: Graphics, x: number, y: number, radius: number): void {
        g.fillColor = new Color(255, 100, 30, 200);
        g.circle(x, y, radius);
        g.fill();
        g.fillColor = new Color(255, 200, 50, 180);
        g.circle(x, y, radius * 0.6);
        g.fill();
    }
}
