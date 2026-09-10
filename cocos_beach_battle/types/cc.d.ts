// Cocos Creator 3.x API 精简类型声明 (用于 tsc 离线检查)
// 实际运行时由引擎提供完整实现

declare module 'cc' {
  export class Asset { }
  export class JsonAsset extends Asset { json: any; }
  export class ScriptAsset extends Asset { }

  export class Component {
    node: Node;
    isValid: boolean;
    protected onLoad(): void {}
    protected start(): void {}
    protected update(dt: number): void {}
    protected onDestroy(): void {}
    schedule(callback: Function, interval?: number, repeat?: number, delay?: number): void;
    unschedule(callback: Function): void;
  }

  export class Node extends BaseNode {
    constructor(name?: string);
    name: string;
    active: boolean;
    children: Node[];
    parent: Node | null;
    components: Component[];
    addComponent<T extends Component>(classConstructor: { new (): T }): T;
    getComponent<T extends Component>(classConstructor: { new (): T }): T | null;
    getComponent(name: string): Component | null;
    getComponentsInChildren<T extends Component>(classConstructor: new () => T): T[];
    addChild(child: Node): void;
    removeChild(child: Node): void;
    removeAllChildren(): void;
    setPosition(x: number, y: number, z?: number): void;
    getPosition(): Vec3;
    setRotationFromEuler(x: number, y: number, z: number): void;
    setRotation(quat: Quat): void;
    getWorldPosition(): Vec3;
    setWorldPosition(pos: Vec3): void;
    on(type: string, callback: Function, target?: any): void;
    off(type: string, callback: Function, target?: any): void;
    destroy(): void;
    isValid: boolean;
    getChildByName(name: string): Node | null;
  }

  export class BaseNode {
    uuid: string;
    name: string;
  }

  export class Vec2 {
    constructor(x?: number, y?: number);
    x: number; y: number;
    static ZERO: Vec2;
    static ONE: Vec2;
    add(v: Vec2): Vec2;
    sub(v: Vec2): Vec2;
    scale(n: number): Vec2;
    length(): number;
    normalize(): Vec2;
  }

  export class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    x: number; y: number; z: number;
    static ZERO: Vec3;
    static UP: Vec3;
    static RIGHT: Vec3;
    add(v: Vec3): Vec3;
    sub(v: Vec3): Vec3;
    scale(n: number): Vec3;
    length(): number;
    normalize(): Vec3;
    dot(v: Vec3): number;
    clone(): Vec3;
  }

  export class Quat {
    constructor(x?: number, y?: number, z?: number, w?: number);
  }

  export class Color {
    constructor(r?: number, g?: number, b?: number, a?: number);
    r: number; g: number; b: number; a: number;
    static WHITE: Color;
    static RED: Color;
    static GREEN: Color;
    static BLUE: Color;
    static YELLOW: Color;
    static BLACK: Color;
    static GRAY: Color;
    static CYAN: Color;
  }

  export class MathUtils {
    static degToRad(deg: number): number;
    static radToDeg(rad: number): number;
    static clamp(val: number, min: number, max: number): number;
    static lerp(a: number, b: number, t: number): number;
    static random(): number;
    static randomRange(min: number, max: number): number;
  }

  export class UITransform extends Component {
    contentSize: { width: number; height: number };
    setContentSize(w: number, h: number): void;
    setAnchorPoint(x: number, y: number): void;
  }

  export class Sprite extends Component {
    spriteFrame: SpriteFrame | null;
    color: Color;
  }

  export class SpriteFrame extends Asset {
  }

  export class Graphics extends Component {
    lineWidth: number;
    strokeColor: Color;
    fillColor: Color;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
    circle(cx: number, cy: number, r: number): void;
    rect(x: number, y: number, w: number, h: number): void;
    roundRect(x: number, y: number, w: number, h: number, radius: number): void;
    ellipse(cx: number, cy: number, rx: number, ry: number): void;
    close(): void;
    stroke(): void;
    fill(): void;
    clear(): void;
  }

  export class Label extends Component {
    text: string;
    fontSize: number;
    color: Color;
    string: string;
  }

  export class Camera extends Component {
    orthoHeight: number;
    zoomRatio: number;
  }

  export class Canvas extends Component {
    cameraComponent: Camera | null;
  }

  export class Button extends Component {
  }

  export class EditBox extends Component {
    string: string;
  }

  export class ProgressBar extends Component {
    progress: number;
  }

  export class Toggle extends Component {
    isChecked: boolean;
  }

  export class Layout extends Component {
    type: number;
  }

  export class ScrollView extends Component {
  }

  export class UIOpacity extends Component {
    opacity: number;
  }

  export class Animation extends Component {
  }

  export class tween<T> {
    constructor(target: T);
    to(duration: number, props: Object, opts?: Object): tween<T>;
    call(callback: Function): tween<T>;
    delay(duration: number): tween<T>;
    start(): tween<T>;
    by(duration: number, props: Object, opts?: Object): tween<T>;
  }
  export function tween<T>(target: T): tween<T>;

  export class input {
    static on(type: string, callback: Function, target?: any): void;
    static off(type: string, callback: Function, target?: any): void;
    static isEnabled(): boolean;
  }
  export namespace input {
    enum EventTouch { TOUCH_START, TOUCH_MOVE, TOUCH_END, TOUCH_CANCEL }
    class Event {
      type: string;
      getLocation(): Vec2;
      getUILocation(): Vec2;
    }
    class Touch {
      getLocation(): Vec2;
      getID(): number;
    }
  }

  export class EventTouch { }

  export function find(path: string): Node | null;

  export class director {
    static getScene(): Scene | null;
    static loadScene(name: string): void;
    static getDeltaTime(): number;
  }

  export class Scene extends BaseNode { }

  export class resources {
    static load<T extends Asset>(path: string, type: new () => T, callback: (err: Error | null, data: T) => void): void;
    static load(path: string, callback: (err: Error | null, data: Asset) => void): void;
  }

  export class sys {
    static platform: number;
    static isMobile: boolean;
    static isBrowser: boolean;
  }

  export const macro: {
    KEY: { [k: string]: number };
  };

  export class KeyCode {
    static A: number; static B: number; static C: number; static D: number;
    static E: number; static F: number; static G: number; static H: number;
    static SPACE: number; static TAB: number; static ENTER: number;
    static UP: number; static DOWN: number; static LEFT: number; static RIGHT: number;
    static SHIFT: number; static R: number; static W: number; static S: number;
  }

  export class math {
    static degToRad(d: number): number;
    static radToDeg(r: number): number;
    static clamp(v: number, min: number, max: number): number;
    static lerp(a: number, b: number, t: number): number;
    static random(): number;
    static randomRange(min: number, max: number): number;
    static atan2(y: number, x: number): number;
    static sin(a: number): number;
    static cos(a: number): number;
    static sqrt(v: number): number;
    static abs(v: number): number;
    static pow(v: number, n: number): number;
  }

  export class Rect {
    constructor(x?: number, y?: number, w?: number, h?: number);
    x: number; y: number; width: number; height: number;
    contains(point: Vec2): boolean;
  }

  export class screen {
    static windowSize: { width: number; height: number };
  }

  export const view: {
    getVisibleSize(): Vec2;
    getDesignResolutionSize(): Vec2;
  };

  export class Enum<T> { }
  export function Enum<T extends Record<string, string | number>>(o: T): T;

  // decorators
  export function ccclass(name?: string): ClassDecorator;
  export function property(options?: any): PropertyDecorator;
  export function executeInEditMode(): ClassDecorator;
}
