const colors = {
    0: "#209318", // empty
    1: "#1584ce", // path start
    2: "#795a31", // path
    3: "#99371a", // path end
    4: "#949a9e", // tower space
};

export class Tile {
    constructor(type, index, size) {
        this.type = type;
        this.index = index;
        this.tower = null;
        this.selected = false;
        this.color = colors[type];
        this.size = size;
        this.x = 0;
        this.y = 0;
        this.cx = 0; // center
        this.cy = 0;
    }
    draw(ctx, scale) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.5;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.strokeRect(this.x, this.y, this.size, this.size);
    }
}