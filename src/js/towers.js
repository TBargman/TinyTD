let W, H; // thamk u closures

const towers = {
    "basic": {
        damage: 10,
        speed: 120, // shots per min
        radius: 100,
        maxDamageLevel: 5,
        maxSpeedLevel: 5,
        maxRangeLevel: 3
    }
};

class Tower {
    size = 20;
    constructor(type, tile) {
        this.id = 0;
        this.type = type;
        this.tile = tile;
        
        this.expLevel = 1;
        this.damageLevel = 1;
        this.speedLevel = 1;
        this.rangeLevel = 1;
        this.baseDamage = towers[type].damage;
        this.baseSpeed = towers[type].speed;
        this.baseRange = towers[type].radius;
        this.damageMult = 1;
        this.speedMult = 1;
        this.rangeMult = 1;
        
        this.targeting = "nearest";
        this.targetEnemy = null;
        this.lastFireTime = 0;
        this.x = 0;
        this.y = 0;
        this.dirx = 0;
        this.diry = -1;
        
        // neat trick
        const c = document.querySelector("canvas");
        W = parseFloat(c.style.width);
        H = parseFloat(c.style.height);
    }
    get damage() {
        return this.baseDamage * this.damageMult;
    }
    get fireDelay() {
        return 1000 / (this.baseSpeed * this.speedMult / 60);
    }
    get radius() {
        return this.baseRange * this.rangeMult;
    }
    findTarget(enemyArr) {
        const inRange = [];
        for (let e of enemyArr) {
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const d = dx * dx + dy * dy;
            const rsum = this.radius + e.targetRadius;
            if (d < rsum * rsum) inRange.push([e, d]);
        }
        if (inRange.length) {
            switch(this.targeting) {
                case "first":
                    this.targetEnemy = inRange[0][0];
                    break;
                case "last":
                    this.targetEnemy = inRange.at(-1)[0];
                    break;
                case "weakest":
                    let minH = Infinity;
                    let weakest;
                    for (let e of inRange) {
                        if (e[0].health < minH) {
                            minH = e[0].health;
                            weakest = e[0];
                        }
                    }
                    this.targetEnemy = weakest;
                    break;
                case "strongest":
                    let maxH = 0;
                    let strongest;
                    for (let e of inRange) {
                        if (e[0].health > maxH) {
                            maxH = e[0].health;
                            strongest = e[0];
                        }
                    }
                    this.targetEnemy = strongest;
                    break;
                case "nearest":
                    let minD = Infinity;
                    let nearest;
                    for (let e of inRange) {
                        if (e[1] < minD) {
                            minD = e[1];
                            nearest = e[0];
                        }
                        this.targetEnemy = nearest;
                    }
                    break;
                default:
                    this.targetEnemy = inRange[0];
                    console.warn("Tower.targeting set incorrectly. Targeting first.");
                    break;
            }
        } else {
            this.targetEnemy = null;
        }
    }
    setDirection() {
        const dx = this.targetEnemy.x - this.x;
        const dy = this.targetEnemy.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        this.dirx = dx / d;
        this.diry = dy / d;
    }
}

export class BasicTower extends Tower {
    constructor(tile) {
        super("basic", tile);
        this.projectiles = [];
        this.projectileSpeed = 15;
    }
    fire(ts) {
        if (ts - this.lastFireTime > this.fireDelay) {
            this.lastFireTime = ts;
            this.projectiles.push({
                x: this.x + this.dirx * this.size / 2,
                y: this.y + this.diry * this.size / 2,
                dirx: this.dirx,
                diry: this.diry,
                dx: this.dirx * this.projectileSpeed,
                dy: this.diry * this.projectileSpeed,
                rot: Math.atan(-this.dirx / this.diry),
                hit: false
            });
        }
    }
    handleProjectiles() {
        if (this.projectiles.length) {
            // simple collision check
            // check if enemy is still alive first
            if (this.targetEnemy) {
                // just check the first proj;
                // others likely not close enough to hit
                const proj = this.projectiles[0];
                const p1 = proj.x * proj.dirx + proj.y * proj.diry;
                const p2 = this.targetEnemy.x * proj.dirx + this.targetEnemy.y * proj.diry;
                // +20 for overshoot compensation
                if (p1 + 20 > p2) {
                    proj.hit = true;
                    this.targetEnemy.health -= this.damage;
                }
            }
            this.projectiles = this.projectiles.filter(p =>
                !p.hit &&
                p.x > 0 && p.y > 0 &&
                p.x < W && p.y < H
            );
            for (let p of this.projectiles) {
                p.x += p.dx;
                p.y += p.dy;
            }
        }
    }
    update(ts) {
        this.handleProjectiles();
        if (this.targetEnemy) {
            this.setDirection();
            this.fire(ts);
        }
    }
    draw(ctx, scale) {
        const cx = this.tile.x + this.tile.size / 2;
        const cy = this.tile.y + this.tile.size / 2;
        // range circle
        if (this.tile.selected) {
            ctx.fillStyle = "#ffffff33";
            ctx.strokeStyle = "#ffffff66";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        // base
        const size = 20;
        const x = cx - size / 2;
        const y = cy - size / 2;
        ctx.fillStyle = "#2a83ba";
        ctx.strokeStyle = "#246b94";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, this.size, this.size, 6);
        ctx.fill();
        ctx.stroke();
        // projectiles
        ctx.fillStyle = "#74712e";
        ctx.fillStyle = "#000000";
        for (let p of this.projectiles) {
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 1.5, 8, p.rot, 0, Math.PI * 2);
            ctx.fill();
        }
        // weapon
        const ex = cx + this.dirx * 14;
        const ey = cy + this.diry * 14;
        ctx.strokeStyle = "#124869";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // the uhhhhh top... thing
        ctx.lineWidth = 2;
        ctx.fillStyle = "#4b9acc";
        ctx.strokeStyle = "#175f8b";
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}