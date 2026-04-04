const tau = Math.PI * 2;

export const enemies = {
    basic: {
        health: 50,
        speed: 0.75,
        money: 5,
        size: 8 // for drawing
    }
};


export class Enemy {
    constructor(type, healthMult = 1, speedMult = 1, moneyMult = 1) {
        this.id = 0;
        this.type = type;
        this.maxHealth = enemies[type].health * healthMult;
        this.health = this.maxHealth;
        this.speed = enemies[type].speed * speedMult;
        this.money = enemies[type].money * moneyMult;
        this.size = enemies[type].size;
        this.targetRadius = this.size;
        
        this.path = [];
        this.x = null;
        this.y = null;
        this.dx = 0;
        this.dy = 0;
        this.nextX = null; // used to calculate next dir
        this.nextY = null; // once a path point is reached
        this.endReached = false;
    }
    update(dt) {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }
    draw(ctx, scale) {
        ctx.lineWidth = 2;
        switch (this.type) {
            case "basic":
                ctx.strokeStyle = "#006132";
                ctx.fillStyle = "#0c9352";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, tau);
                ctx.fill();
                ctx.stroke();
                break;
        }
        // health bar
        if (this.health < this.maxHealth) {
            const length = 20;
            const hp = length * this.health / this.maxHealth;
            const x = this.x - length / 2;
            const y = this.y - this.size - 5;
            
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 0.5;
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(x, y, length, 3);
            ctx.fillStyle = "#00ff00";
            ctx.fillRect(x, y, hp, 3);
            ctx.strokeRect(x, y, length, 3);
        }
    }
}
