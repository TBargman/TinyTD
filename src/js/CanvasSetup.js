export class CanvasSetup {
    
    constructor(element, w, h) {
        this.element = element;
        this._w = w ? w : window.innerWidth;
        this._h = h ? h : window.innerHeight;
        this.centerX = this._w / 2;
        this.centerY = this._h / 2;
        this.onUpdate = () => {};
        this.onDraw = () => {};
        this.updateTime = 1000 / 60;

        this.clock = {
            ts: 0,
            pts: 0,
            acc: 0,
            hold: 0
        };
        
        // pointer state from events
        const p = {
            x: 0,
            y: 0,
            px: 0, // previous
            py: 0
        };
        // pointer state synced to canvas updates
        this.pointer = {
            isDown: false,
            speed: 0,
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            startX: null,
            startY: null,
            offsetX: 0,
            offsetY: 0,
            onDown: () => {},
            onMove: () => {},
            onUp: () => {}
        };
        const handleDown = e => {
            this.pointer.isDown = true;
            if ("touches" in e) {
                this.pointer.x = e.touches[0].offsetX;
                this.pointer.y = e.touches[0].offsetY;
            } else {
                this.pointer.x = e.offsetX;
                this.pointer.y = e.offsetY;
            }
            this.pointer.startX = this.pointer.x;
            this.pointer.startY = this.pointer.y;
            p.px = this.pointer.x;
            p.py = this.pointer.y;
            p.x = this.pointer.x;
            p.y = this.pointer.y;
            this.pointer.onDown();
        };
        const handleMove = e => {
            if ("touches" in e) {
                p.x = e.touches[0].offsetX;
                p.y = e.touches[0].offsetY;
            } else if (this.pointer.isDown) {
                p.x = e.offsetX;
                p.y = e.offsetY;
            } else return;
            this.pointer.onMove();
        };
        const handleUp = e => {
            this.pointer.dx = 0;
            this.pointer.dy = 0;
            this.pointer.startX = null;
            this.pointer.startY = null;
            this.pointer.offsetX = 0;
            this.pointer.offsetY = 0;
            this.pointer.speed = 0;
            this.pointer.isDown = false;
            this.pointer.onUp();
        };
        const updatePointer = () => {
            this.pointer.x = p.x;
            this.pointer.y = p.y;
            this.pointer.dx = this.pointer.x - p.px;
            this.pointer.dy = this.pointer.y - p.py;
            p.px = this.pointer.x;
            p.py = this.pointer.y;
            this.pointer.speed = Math.sqrt(this.pointer.dx ** 2 + this.pointer.dy ** 2);
        };

        // run
        const run = ts => {
            this.clock.ts = ts;
            this.clock.acc += ts - this.clock.pts;
            this.clock.pts = ts;

            while (this.clock.acc >= this.updateTime) {
                updatePointer();
                this.onUpdate(ts, this.updateTime);
                this.clock.acc -= this.updateTime;
            }
            this.onDraw(this.clock.acc / this.updateTime);
            requestAnimationFrame(run);
        };

        // init
        this.resize();
        if (!w && !h) window.addEventListener("resize", this.resize);
        this.element.addEventListener("pointerdown", handleDown);
        this.element.addEventListener("pointermove", handleMove);
        this.element.addEventListener("pointerup", handleUp);
        this.element.addEventListener("touchmove", handleMove);
        this.element.addEventListener("touchend", handleUp);

        requestAnimationFrame(ts => (this.clock.pts = ts));
        requestAnimationFrame(run);
    }
    
    get width() {
        return this._w;
    }
    get height() {
        return this._h;
    }
    set width(w) {
        this._w = w;
        this.resize();
    }
    set height(h) {
        this._h = h;
        this.resize();
    }
    
    resize(w, h) {
        if (w && h) {
            this._w = w;
            this._h = h;
        }
        const dpr = window.devicePixelRatio;
        this.element.width = this._w * dpr;
        this.element.height = this._h * dpr;
        this.element.getContext("2d").scale(dpr, dpr);
        this.element.style.width = this._w + "px";
        this.element.style.height = this._h + "px";
        this.centerX = this._w / 2;
        this.centerY = this._h / 2;
        this._w *= dpr;
        this._h *= dpr;
    }
    
    get2D() {
        return this.element.getContext("2d");
    }
}
