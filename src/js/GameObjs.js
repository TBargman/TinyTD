

export const TILE_METRIC = 40;
export let SCALE = 1;
let CW, CH; // canvas width/height
const tau = Math.PI * 2;

export function setDrawScale(x) {
    SCALE = x;
}

let drawTargetCircle = false;



/*******************************************************
******************* PROPERTIES/STATS *******************
*******************************************************/

const TileColors = {
    0: "#209318", // empty
    1: "#1584ce", // path start
    2: "#795a31", // path
    3: "#99371a", // path end
    4: "#949a9e", // tower space
};


export const TowerStats = {
    "basic": {
        damage: 10,
        speed: 120, // shots per min
        radius: 90,
        maxDamageLevel: 5,
        maxSpeedLevel: 5,
        maxRangeLevel: 3,
        price: 40,
        projectileSpeed: 15,
        projectileSize: 1.5
    },
    "heavy": {
        damage: 30,
        speed: 70, // shots per min
        radius: 60,
        maxDamageLevel: 5,
        maxSpeedLevel: 5,
        maxRangeLevel: 3,
        price: 60,
        projectileSpeed: 3,
        projectileSize: 3.5
    },
    "sniper": {
        damage: 90,
        speed: 25,
        radius: 150,
        price: 100,
    }
};


export const EnemyStats = {
    "basic": {
        health: 49,
        speed: 0.65,
        money: 3,
        exp: 3,
        spawnSpeeds: [1000, 750, 500],
        spawnTimes: [],
    },
    "heavy": {
        health: 89,
        speed: 0.3,
        money: 5,
        exp: 4,
        spawnSpeeds: [1500, 900],
        spawnTimes: []
    },
    "fast": {
        health: 24,
        speed: 1.1,
        money: 4,
        exp: 3,
        spawnSpeeds: [700, 500],
        spawnTimes: []
    }
};




/*****************************************************/
/********************** CLASSES **********************/
/*****************************************************/


export class Tile {
    constructor(type, index) {
        this.type = type;
        this.index = index;
        this.tower = null;
        this.selected = false;
        this.x = 0;
        this.y = 0;
    }
    get size() {
        return 40 * SCALE;
    }
    get cx() { // center x
        return this.x + this.size / 2;
    }
    get cy() { // center y
        return this.y + this.size / 2;
    }
    draw(ctx) {
        const color = TileColors[this.type];
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.strokeRect(this.x, this.y, this.size, this.size);
    }
}




/*********************** Towers ***********************/


class Tower {
    
    baseExpReq = 60;
    expReqMult = 2.5;
    // increases base levels:
    expLvlMult = 1.1;
    // increases multipliers:
    damageLvlMult = 1.4;
    speedLvlMult = 1.1;
    rangeLvlMult = 1.1;
    
    constructor(type, tile) {
        this.id = 0;
        this.type = type;
        this.tile = tile;
        
        this.damageLevel = 1;
        this.speedLevel = 1;
        this.rangeLevel = 1;
        this.baseDamage = TowerStats[type].damage;
        this.baseSpeed = TowerStats[type].speed;
        this.baseRange = TowerStats[type].radius;
        this.damageMult = 1;
        this.speedMult = 1;
        this.rangeMult = 1;
        this.numUpgrades = 0;
        
        this.expLevel = 1;
        this.expAmount = 0;
        this.expReq = this.baseExpReq;
        
        // targets:
        // first, last, weakest, strongest, nearest
        this.targeting = "first";
        this.targetEnemy = null;
        this.lastFireTime = 0;
        this.x = 0;
        this.y = 0;
        this.dirx = 0;
        this.diry = -1;
        
        // neat trick
        const c = document.querySelector("canvas");
        CW = parseFloat(c.style.width);
        CH = parseFloat(c.style.height);
    }
    get damage() {
        return Math.floor(this.baseDamage * this.damageMult);
    }
    get speed() {
        return Math.floor(this.baseSpeed * this.speedMult);
    }
    get fireDelay() {
        return 1000 / (this.speed / 60);
    }
    get radius() {
        return Math.floor(this.baseRange * this.rangeMult * SCALE);
    }
    get size() {
        return 20 * SCALE;
    }
    get upgradePrice() {
        const p = TowerStats[this.type].price;
        return Math.floor(p * 0.6 + (p * this.numUpgrades * 0.2));
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
                    this.targetEnemy = inRange[0][0];
                    //console.warn("Tower.targeting set incorrectly. Targeting first.");
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
    damageEnemy() {
        this.targetEnemy.health -= this.damage;
        if (this.targetEnemy.health <= 0) {
            this.expAmount += this.targetEnemy.exp;
            if (this.expAmount >= this.expReq) this.expLevelUp();
        }
    }
    drawRangeCircle(ctx) {
        if (this.tile.selected) {
            ctx.fillStyle = "#ffffff33";
            ctx.strokeStyle = "#ffffff66";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.tile.cx, this.tile.cy, this.radius + 8, 0, tau);
            ctx.fill();
            ctx.stroke();
        }
    }
    expLevelUp() {
        this.expLevel++;
        this.expAmount = 0;
        this.expReq += this.baseExpReq * this.expLvlMult * this.expLevel;
        this.baseDamage *= this.expLvlMult;
        this.baseSpeed *= this.expLvlMult;
        this.baseRange *= this.expLvlMult;
        /*this.baseDamage = Math.floor(this.baseDamage);
        this.baseSpeed = Math.floor(this.baseSpeed);
        this.baseRange = Math.floor(this.baseRange);*/
    }
    attrLevelUp(attr) {
        this.numUpgrades++;
        if (attr === "damage") {
            this.damageMult *= this.damageLvlMult;
            this.damageLevel++;
        } else if (attr === "speed") {
            this.speedMult *= this.speedLvlMult;
            this.speedLevel++;
        } else if (attr === "range") {
            this.rangeMult *= this.rangeLvlMult;
            this.rangeLevel++;
        }
    }
}


class ProjectileTower extends Tower {
    constructor(type, tile) {
        super(type, tile);
        this.projectiles = [];
        this.projectileSpeed = TowerStats[type].projectileSpeed;
        this.projectileSize = TowerStats[type].projectileSize;
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
    updateProjectiles() {
        if (this.projectiles.length) {
            // simple collision check
            // !! PROJECTILES CAN STILL GO THROUGH ENEMIES !!
            // check if enemy is still alive first
            if (this.targetEnemy) {
                // just check the first proj;
                // others likely not close enough to hit
                const proj = this.projectiles[0];
                const p1 = proj.x * proj.dirx + proj.y * proj.diry;
                const p2 = this.targetEnemy.x * proj.dirx + this.targetEnemy.y * proj.diry;
                // +projSpeed for overshoot compensation
                if (p1 + this.projectileSpeed * 1.3 * SCALE > p2) {
                    proj.hit = true;
                    this.damageEnemy();
                }
            }
            this.projectiles = this.projectiles.filter(p =>
                !p.hit &&
                p.x > 0 && p.y > 0 &&
                p.x < CW && p.y < CH
            );
            for (let p of this.projectiles) {
                p.x += p.dx * SCALE;
                p.y += p.dy * SCALE;
            }
        }
    }
    update(ts) {
        this.updateProjectiles();
        if (this.targetEnemy) {
            this.setDirection();
            this.fire(ts);
        }
    }
    drawProjectiles(ctx) {
        ctx.fillStyle = "#74712e";
        ctx.fillStyle = "#000000";
        const length = this.projectileSize > this.projectileSpeed * 0.5 ?
            this.projectileSize : this.projectileSpeed * 0.5;
        for (let p of this.projectiles) {
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, this.projectileSize * SCALE, length * SCALE, p.rot, 0, tau);
            ctx.fill();
        }
    }
}

class BasicTower extends ProjectileTower {
    constructor(tile) {
        super("basic", tile);
    }
    draw(ctx) {
        const cx = this.tile.cx;
        const cy = this.tile.cy;
        // range circle
        this.drawRangeCircle(ctx);
        // base
        const size = 20 * SCALE;
        const x = cx - size / 2;
        const y = cy - size / 2;
        ctx.fillStyle = "#2a83ba";
        ctx.strokeStyle = "#246b94";
        ctx.lineWidth = 2 * SCALE;
        ctx.beginPath();
        ctx.roundRect(x, y, this.size, this.size, 6 * SCALE);
        ctx.fill();
        ctx.stroke();
        // projectiles
        this.drawProjectiles(ctx);
        // weapon
        const ex = cx + this.dirx * 14 * SCALE;
        const ey = cy + this.diry * 14 * SCALE;
        ctx.strokeStyle = "#124869";
        ctx.lineWidth = 4 * SCALE;
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // the uhhhhh top... thing
        ctx.lineWidth = 2 * SCALE;
        ctx.fillStyle = "#4b9acc";
        ctx.strokeStyle = "#175f8b";
        ctx.beginPath();
        ctx.arc(cx, cy, 6 * SCALE, 0, tau);
        ctx.fill();
        ctx.stroke();
    }
}

class HeavyTower extends ProjectileTower {
    constructor(tile) {
        super("heavy", tile);
    }
    draw(ctx) {
        const cx = this.tile.cx;
        const cy = this.tile.cy;
        // range circle
        this.drawRangeCircle(ctx);
        // base
        const size = 20 * SCALE;
        const x = cx - size / 2;
        const y = cy - size / 2;
        ctx.fillStyle = "#c35b0c";
        ctx.strokeStyle = "#7c3d0e";
        ctx.lineWidth = 2 * SCALE;
        ctx.beginPath();
        ctx.roundRect(x, y, this.size, this.size, 2 * SCALE);
        ctx.fill();
        ctx.stroke();
        // projectiles
        this.drawProjectiles(ctx);
        // weapon
        const ex = cx + this.dirx * 14 * SCALE;
        const ey = cy + this.diry * 14 * SCALE;
        ctx.strokeStyle = "#592804";
        ctx.lineWidth = 7 * SCALE;
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // the uhhhhh top... thing
        ctx.lineWidth = 2 * SCALE;
        ctx.fillStyle = "#d46714";
        ctx.strokeStyle = "#703002";
        ctx.beginPath();
        ctx.arc(cx, cy, 6 * SCALE, 0, tau);
        ctx.fill();
        ctx.stroke();
    }
}

class SniperTower extends Tower {
    constructor(tile) {
        super("sniper", tile);
        this.fireLine = null;
    }
    fire(ts) {
        if (ts - this.lastFireTime > this.fireDelay) {
            this.lastFireTime = ts;
            this.fireLine = {
                sx: this.tile.cx,
                sy: this.tile.cy,
                ex: this.targetEnemy.x,
                ey: this.targetEnemy.y,
                alpha: 1
            }
            this.damageEnemy();
        }
    }
    drawShot(ctx) {
        if (this.fireLine) {
            if (this.fireLine.alpha <= 0) {
                this.fireLine = null;
                return;
            }
            this.fireLine.alpha -= 0.08;
            ctx.lineWidth = 1.5 * SCALE;
            ctx.strokeStyle = `rgba(255,255,255,${this.fireLine.alpha})`;
            ctx.beginPath();
            ctx.moveTo(this.fireLine.sx, this.fireLine.sy);
            ctx.lineTo(this.fireLine.ex, this.fireLine.ey);
            ctx.stroke();
        }
    }
    update(ts) {
        if (this.targetEnemy) {
            this.setDirection();
            this.fire(ts);
        }
    }
    draw(ctx) {
        const cx = this.tile.cx;
        const cy = this.tile.cy;
        const scale8 = SCALE * 10;
        this.drawRangeCircle(ctx);
        // base
        ctx.fillStyle = "hsl(242,54%,58%)"
        ctx.strokeStyle = "hsl(242,28%,38%)";
        ctx.lineWidth = 2 * SCALE;
        ctx.lineCap = "square";
        ctx.beginPath();
        ctx.moveTo(cx, cy - scale8);
        ctx.lineTo(cx + scale8, cy);
        ctx.lineTo(cx, cy + scale8);
        ctx.lineTo(cx - scale8, cy);
        ctx.lineTo(cx, cy - scale8);
        ctx.fill();
        ctx.stroke();
        // shot
        this.drawShot(ctx);
        // weapon
        const ex = cx + this.dirx * 14 * SCALE;
        const ey = cy + this.diry * 14 * SCALE;
        ctx.strokeStyle = "hsl(242,28%,28%)";
        ctx.lineWidth = 3 * SCALE;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // idk
        ctx.strokeStyle = "hsl(242,28%,31%)";
        ctx.fillStyle = "hsl(242,54%,64%)";
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.arc(cx, cy, 4 * SCALE, 0, tau);
        ctx.fill();
        ctx.stroke();
    }
}




/********************** Enemies **********************/


class Enemy {
    constructor(type, healthMult = 1, speedMult = 1, moneyMult = 1, expMult = 1) {
        this.id = 0;
        this.type = type;
        this.maxHealth = Math.floor(EnemyStats[type].health * healthMult);
        this.health = this.maxHealth;
        this.speed = EnemyStats[type].speed * speedMult;
        this.money = Math.floor(EnemyStats[type].money * moneyMult);
        this.exp = EnemyStats[type].exp * expMult;
        this.targetRadius = 8;
        
        this.path = [];
        this.x = null;
        this.y = null;
        this.dirx = 1;
        this.diry = 0;
        this.nextX = null; // used to calculate next dir
        this.nextY = null; // once a path point is reached
        this.endReached = false;
    }
    move() {
        this.x += this.dirx * this.speed * SCALE;
        this.y += this.diry * this.speed * SCALE;
    }
    update() {}
    drawCommon(ctx) {
        // health bar
        if (this.health < this.maxHealth) {
            const width = 20 * SCALE;
            const height = 3 * SCALE;
            const hp = width * this.health / this.maxHealth;
            const x = this.x - width / 2;
            const y = this.y - (this.targetRadius + 5) * SCALE;
            
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 0.5 * SCALE;
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(x, y, width, height);
            ctx.fillStyle = "#00ff00";
            if (hp > 0) ctx.fillRect(x, y, hp, height);
            ctx.strokeRect(x, y, width, height);
        }
        // targetting circle
        if (drawTargetCircle) {
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = SCALE;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.targetRadius, 0, tau);
            ctx.stroke();
        }
    }
}

class BasicEnemy extends Enemy {
    constructor(healthMult = 1, speedMult = 1, moneyMult = 1, expMult = 1) {
        super("basic", healthMult, speedMult, moneyMult, expMult);
    }
    draw(ctx) {
        ctx.lineWidth = 2 * SCALE;
        ctx.strokeStyle = "#006132";
        ctx.fillStyle = "#0c9352";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8 * SCALE, 0, tau);
        ctx.fill();
        ctx.stroke();
        this.drawCommon(ctx);
    }
}

class HeavyEnemy extends Enemy {
    constructor(healthMult = 1, speedMult = 1, moneyMult = 1, expMult = 1) {
        super("heavy", healthMult, speedMult, moneyMult, expMult);
    }
    draw(ctx) {
        const size = 15 * SCALE;
        const x = this.x - size / 2;
        const y = this.y - size / 2;
        ctx.lineWidth = 2 * SCALE;
        ctx.strokeStyle = "#6a1b00";
        ctx.fillStyle = "#a53c17";
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 3 * SCALE);
        ctx.fill();
        ctx.stroke();
        this.drawCommon(ctx);
    }
}

class FastEnemy extends Enemy {
    constructor(healthMult = 1, speedMult = 1, moneyMult = 1, expMult = 1) {
        super("fast", healthMult, speedMult, moneyMult, expMult);
    }
    draw(ctx){
        // set vertices
        const scale5 = SCALE * 4;
        const scale6 = SCALE * 6;
        const scale9 = SCALE * 8;
        const v1x = this.x + this.dirx * scale9;
        const v1y = this.y + this.diry * scale9;
        const ex = this.x - this.dirx * scale5;
        const ey = this.y - this.diry * scale5;
        const v2x = ex + this.diry * scale6;
        const v2y = ey - this.dirx * scale6;
        const v3x = this.x;
        const v3y = this.y;
        const v4x = ex - this.diry * scale6;
        const v4y = ey + this.dirx * scale6;
        
        ctx.lineWidth = SCALE * 3;
        ctx.lineCap = "square";
        ctx.strokeStyle = "#423800";
        ctx.fillStyle = "#ffda17";
        ctx.beginPath();
        ctx.moveTo(v3x, v3y);
        ctx.lineTo(v4x, v4y);
        ctx.lineTo(v1x, v1y);
        ctx.lineTo(v2x, v2y);
        ctx.lineTo(v3x, v3y);
        ctx.stroke();
        ctx.fill();
        this.drawCommon(ctx);
    }
}



// easy referencing

export const Towers = {
    basic: BasicTower,
    heavy: HeavyTower,
    sniper: SniperTower
}

export const Enemies = {
    basic: BasicEnemy,
    heavy: HeavyEnemy,
    fast: FastEnemy
}