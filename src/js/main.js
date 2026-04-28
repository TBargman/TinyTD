/*********************************
 *            TO DO:
 * 
 * Main menu
 * Level select
 * More enemies, towers, levels
 * Tower sell btn
 * 
 * Make it pretty
 * Draw the level less like a grid
 * Path interpolation or something
 * Balancing
 * Responsive scaling (WIP)
 * 
 * 
 * 
 ********************************/


"use strict";

import {CanvasSetup} from "./CanvasSetup.js";
import * as levels from "./levels.js";
import * as GO from "./GameObjs.js";
import * as TowerMenu from "./TowerMenu.js";
import * as WaveDisp from "./WaveDisplay.js";


/******************* CANVAS SETUP ********************/

const w = window.innerWidth;
const h = window.innerHeight / 2;
const canvas = new CanvasSetup(document.querySelector("canvas"), w, h);
const ctx = canvas.get2D();
const clock = canvas.clock;
let drawScale = 1;

let tileSize, xOffset, yOffset, levelW, levelH;
const maxMargin = 30;
const topMarginMin = 50;


/*********************** STATE ***********************/

let selectedLevel = "test";
let levelData, enemyPath;
let pathStartX, pathStartY;

const tileData = [];
let selectedTile = null;

let waveQueue = [];
let runningWaves = [];
let waveCount = 0;
const waveCooldown = 15000;
let waveBonus = 0;

let gameMode = "health"; // lives || health
let fortHealth = 1000;
let lives = 20;
let money = 120;
let enemies = [];
let towers = [];
let enemyIdCount = 0;
let towerIdCount = 0;

let menuOpen = false;


// debug
let test = 0;
const drawTileGrid = false;



/****************** HELPER FUNCTIONS *****************/

const log = str => console.log(str);
const err = str => console.error(str);
const max = (a, b) => (a > b ? a : b);
const min = (a, b) => (a < b ? a : b);
const deepCopy = obj => JSON.parse(JSON.stringify(obj));
const rndBetween = (low, high) => Math.random() * (high - low) + low;
const choice = arr => arr[Math.floor(Math.random() * arr.length)];
const getLevelData = () => levels.levelData[selectedLevel];
const towerIsSelected = () => selectedTile && selectedTile.tower;

// Wave progression math
const healthInc = () => 1 + waveCount ** 1.8 / 50;
const speedInc = () => 1 + waveCount ** 1.01 / 100;
const moneyInc = () => 1 + waveCount ** 1.1 / 30;


/****************** POINTER HANDLING ******************/

const ptr = canvas.pointer;

function handleDown() {
    // tile select
    const tx = Math.floor((ptr.x - xOffset) / tileSize);
    const ty = Math.floor((ptr.y - yOffset) / tileSize);
    const i = ty * levelData.width + tx;
    selectTile(i);
}

function handleMove() {}

function handleUp() {}

ptr.onDown = handleDown;
ptr.onMove = handleMove;
ptr.onUp = handleUp;


/**************** MENU FUNCTIONS/EVENTS ***************/

function selectTile(i) {
    const tile = tileData[i];
    // is a tower space?
    if (tile.type === 4) {
        if (tile.selected) {
            // deselect
            tile.selected = false;
            selectedTile = null;
            TowerMenu.closeMenu();
            menuOpen = false;
        } else {
            // select
            if (selectedTile) selectedTile.selected = false;
            tile.selected = true;
            selectedTile = tile;
            // move tower to array end to draw last
            if (selectedTile.tower) {
                let ind, t;
                for (let i = 0; i < towers.length; i++) {
                    if (towers[i].id === selectedTile.tower.id) {
                        ind = i;
                        break;
                    }
                }
                towers.push(towers.splice(ind, 1)[0]);
                TowerMenu.updateMenu(money, selectedTile);
                TowerMenu.openUpgradeMenu();
            } else {
                TowerMenu.updateMenu(money);
                TowerMenu.openBuildMenu();
            }
            menuOpen = true;
        }
    } else {
        // deselect
        if (selectedTile) selectedTile.selected = false;
        selectedTile = null;
        TowerMenu.closeMenu();
        menuOpen = false;
    }
}

for (let tower in TowerMenu.buildTowerBtns) {
    const btn = TowerMenu.buildTowerBtns[tower];
    const price = GO.TowerStats[tower].price;
    btn.addEventListener("click", () => {
        if (selectedTile && !selectedTile.tower && money >= price) {
            const t = new GO.Towers[tower](selectedTile);
            selectedTile.tower = t;
            t.id = towerIdCount;
            towers.push(t);
            towerIdCount++;
            money -= price;
            TowerMenu.updateMenu(money, selectedTile);
            TowerMenu.openUpgradeMenu();
        }
    });
}

for (let attr in TowerMenu.upgradeBtns) {
    const btn = TowerMenu.upgradeBtns[attr];
    btn.addEventListener("click", () => {
        if (towerIsSelected() &&
            selectedTile.tower.upgradePrice < money) {
                money -= selectedTile.tower.upgradePrice;
                selectedTile.tower.attrLevelUp(attr);
                TowerMenu.updateMenu(money, selectedTile);
            }
    });
}

for (let radio of TowerMenu.targetingRadios) {
    radio.addEventListener("change", () => {
        if (towerIsSelected()) {
            selectedTile.tower.targeting = 
                document.querySelector(".targetRadio:checked").value;
        }
    });
}

WaveDisp.pauseBtn.addEventListener("click", togglePaused);

WaveDisp.nextWaveBtn.addEventListener("click", startNextWave);

// handle back button to deselect tile & close the menu
window.addEventListener("popstate", e => {
    if (history.length > 1) history.back();
    if (menuOpen) {
        selectedTile.selected = false;
        selectedTile = null;
        TowerMenu.closeMenu();
    }
});



/******************** GAME FUNCTIONS *******************/

function initWaveQ() {
    for (let i = 0; i < 6; i++) {
        genWave();
    }
    WaveDisp.updateValues(waveQueue);
}

function genWave() {
    waveCount++;
    const eType = GO.chooseEnemy();
    const time = Math.round(Math.random() * 5) * 1000 + 5000;
    const speedIndex = Math.floor(rndBetween(0, GO.EnemyStats[eType].spawnSpeeds.length));
    const delay = GO.EnemyStats[eType].spawnSpeeds[speedIndex];
    const healthMult = healthInc();
    const speedMult = speedInc();
    const moneyMult = moneyInc();
    GO.updateSpawnChance();
    
    waveQueue.push({
        waveNum: waveCount,
        enemyType: eType,
        waveTime: time + waveCooldown,
        spawnTime: time,
        spawnDelay: delay,
        iconNum: speedIndex,
        healthMult: healthMult,
        speedMult: speedMult,
        moneyMult: moneyMult,
        enemyHealth: GO.EnemyStats[eType].health * healthMult,
        numSpawned: 0
    });
}

function startNextWave() {
    if (!WaveDisp.animating) {
        money += waveBonus;
        const wave = waveQueue.shift();
        wave.startTime = clock.ts;
        wave.endTime = clock.ts + wave.waveTime;
        runningWaves.push(wave);
        setWaveBonus();
        genWave();
        WaveDisp.animateUpdate(waveQueue);
    }
}

function waveUpdate() {
    for (let wave of runningWaves) {
        
        // spawn enemies
        const elapsed = clock.ts - wave.startTime;
        const nEnemies = Math.floor(elapsed / wave.spawnDelay);
        while (wave.numSpawned < nEnemies && elapsed < wave.spawnTime) {
            const enemy = new GO.Enemies[wave.enemyType](
                wave.healthMult,
                wave.speedMult,
                wave.moneyMult);
            enemy.id = enemyIdCount;
            const path = deepCopy(enemyPath);
            enemy.setPath(path);
            enemies.push(enemy);
            enemyIdCount++;
            wave.numSpawned++;
        }
    }
    
    setWaveBonus();
    runningWaves = runningWaves.filter(w => clock.ts < w.endTime);
    if (!runningWaves.length) startNextWave();
}

function updateEnemies() {
    // handles direction changes in path,
    // fort damaging and enemy death/animation
    
    for (let e of enemies) {
        if (e.health <= 0) {
            if (e.deathAnim) {
                e.animateDeath();
                continue;
            }
            e.deathAnim = true;
            money += e.money;
            TowerMenu.updateMenu(money, selectedTile);
            continue;
        }
        if (e.endReached) {
            if (clock.ts > e.lastAttackTs + e.attackCD) {
                e.lastAttackTs = clock.ts;
                fortHealth -= e.damage;
            }
            continue;
        }
        e.move();
        // check if path point reached
        const p1 = e.x * e.dirx + e.y * e.diry;
        const p2 = e.nextX * e.dirx + e.nextY * e.diry;
        if (p1 > p2) {
            e.path.shift();
            if (e.path.length) {
                const nextX = e.path[0][0];
                const nextY = e.path[0][1];
                const dx = nextX - e.x;
                const dy = nextY - e.y;
                if (gameMode === "health" && e.path.length === 1) {
                    // reached 2nd-to-last path point
                    // randomly stagger last path point
                    // to spread out enemies at the end
                    const dxHalf = dx / 2;
                    const dyHalf = dy / 2;
                    const halfX = e.x + dxHalf;
                    const halfY = e.y + dyHalf;
                    e.nextX = halfX + rndBetween(-dyHalf, dyHalf);
                    e.nextY = halfY - rndBetween(-dxHalf, dxHalf);
                    const newdx = e.nextX - e.x;
                    const newdy = e.nextY - e.y;
                    const newD = Math.sqrt(newdx * newdx + newdy * newdy);
                    e.dirx = newdx / newD;
                    e.diry = newdy / newD;
                } else {
                    // change dir to next path point
                    const d = Math.sqrt(dx * dx + dy * dy);
                    e.dirx = dx / d;
                    e.diry = dy / d;
                    e.nextX = nextX;
                    e.nextY = nextY;
                }
            } else {
                // reached the end
                e.endReached = true;
                if (gameMode === "lives") {
                    lives--;
                } else {
                    e.speed = 0;
                    // update dir for directionally-drawn enemies
                    // like "fast" enemy
                    const lastPoint = enemyPath.at(-1);
                    const dx = lastPoint[0] - e.x;
                    const dy = lastPoint[1] - e.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    e.dirx = dx / d;
                    e.diry = dy / d;
                }
            }
        }
    }
    if (gameMode === "lives") {
        enemies = enemies.filter(e => !e.endReached && !e.dead);
    } else {
        enemies = enemies.filter(e => !e.dead);
    }
}

function setWaveBonus() {
    const last = runningWaves.at(-1);
    if (last) {
        const remaining = last.endTime - clock.ts;
        waveBonus = Math.floor(remaining / 1000 - 1);
        WaveDisp.waveBonus.textContent = waveBonus > 0 ? `+$${waveBonus}` : "";
    }
}

function togglePaused() {
    if (clock.paused) {
        WaveDisp.pauseBtn.classList.remove("glow");
        canvas.resume();
        WaveDisp.pauseBtn.textContent = "|  |"; // ▮▮
        WaveDisp.pauseBtn.classList.add("pauseBtn");
    } else {
        canvas.pause();
        WaveDisp.pauseBtn.textContent = "▶";
        WaveDisp.pauseBtn.classList.remove("pauseBtn");
    }
}


/******************* CANVAS FUNCTIONS ******************/


function getTileScreenCoord(i) {
    const x = (i % levelData.width) * tileSize + xOffset;
    const y = Math.floor(i / levelData.height) * tileSize + yOffset;
    return [x, y];
}

function getPathScreenCoord(path, div = 1) {
    const pathCoords = [];
    for (let p = 0; p < path.length; p++) {
        const curr = tileData[path[p][0]];
        if (p + 1 < path.length) {
            // create subdivisions
            const next = tileData[path[p + 1][0]];
            const xmult = (next.cx - curr.cx) / div;
            const ymult = (next.cy - curr.cy) / div;
            for (let i = 0; i < div; i++) {
                const x = xmult * i + curr.cx;
                const y = ymult * i + curr.cy;
                pathCoords.push([x, y]);
            }
        } else {
            // last point in path
            pathCoords.push([curr.cx, curr.cy]);
        }
    }
    return pathCoords;
}

function getTileCenter(i) {
    const [x, y] = getTileScreenCoord(i);
    return [x + tileSize / 2, y + tileSize / 2];
}

function drawSelection() {
    if (selectedTile) {
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 2 * drawScale;
        ctx.strokeRect(selectedTile.x, selectedTile.y, tileSize, tileSize);
    }
}

function drawHUD() {
    ctx.font = "600 16px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    const wave = runningWaves.at(-1);
    const y = yOffset - 12;
    const leftSt = gameMode === "lives" ? `Lives: ${lives}` : `HP: ${fortHealth}`;
    const waveSt = wave ? `Wave ${wave.waveNum}` : "";
    const moneySt = `$${money}`;
    
    // text
    ctx.textAlign = "left";
    ctx.strokeText(leftSt, xOffset, y);
    ctx.fillText(leftSt, xOffset, y);
    ctx.strokeText(waveSt, w / 2 - 18, y);
    ctx.fillText(waveSt, w / 2 - 18, y);
    ctx.textAlign = "right";
    ctx.strokeText(moneySt, w - xOffset, y);
    ctx.fillText(moneySt, w - xOffset, y);
    
    // enemy count: to do?
    /*
    let sum = 0;
    if (runningWaves.length) {
        for (let wave of runningWaves) {
            sum += Math.floor(wave.spawnTime / wave.spawnDelay);
        }
        ctx.textAlign = "center";
        ctx.strokeText(sum, 0, 0);
        ctx.fillText(sum, 0, 0);
    }
    /**/

    // clock
    if (wave) {
        const cx = w / 2 - 36;
        const cy = y - 5;
        const radius = 8;
        const remaining = (wave.waveTime - (clock.ts - wave.startTime)) / wave.waveTime;
        const hue = remaining * 120;
        const start = (1 - remaining) * Math.PI * 2 - (Math.PI / 2);
        const sx = cx + Math.cos(start) * radius;
        const sy = cy + Math.sin(start) * radius;
        ctx.fillStyle = `hsl(${hue}, 100%, 45%)`;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        ctx.beginPath();8
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.arc(cx, cy, radius, start, Math.PI * 1.5);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function drawGrid() {
    ctx.lineWidth = 2 * drawScale;
    ctx.strokeStyle = "#0a3d0722";
    const w = levelData.width * tileSize;
    const h = levelData.height * tileSize;
    for (let x = 0; x < levelData.width + 1; x++) {
        const xpos = x * tileSize + xOffset;
        ctx.beginPath();
        ctx.moveTo(xpos, yOffset);
        ctx.lineTo(xpos, h + yOffset);
        ctx.stroke();
    }
    for (let y = 0; y < levelData.height + 1; y++) {
        const ypos = y * tileSize + yOffset;
        ctx.beginPath();
        ctx.moveTo(xOffset, ypos);
        ctx.lineTo(w + xOffset, ypos);
        ctx.stroke();
    }
}

function fillBg() {
    ctx.lineWidth = 2 * drawScale;
    ctx.strokeStyle = "#0a3d07";
    ctx.fillStyle = "#214c1e";
    // outside
    ctx.fillRect(0, 0, xOffset, h);
    ctx.fillRect(xOffset + levelW, 0, xOffset, h);
    ctx.fillRect(xOffset, 0, levelW, yOffset);
    ctx.fillRect(xOffset, yOffset + levelH, levelW, yOffset);
    // level border
    ctx.strokeRect(xOffset, yOffset, levelW, levelH);
}


// Debug

function drawArrow(sx, sy, ex, ey) {
    const dx = ex - sx;
    const dy = ey - sy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / d;
    const uy = dy / d;
    const ex2 = sx + ux * (d - 3);
    const ey2 = sy + uy * (d - 3);
    const v1x = sx + ux * (d - 9) - uy * 5;
    const v1y = sy + uy * (d - 9) + ux * 5;
    const v2x = sx + ux * (d - 9) + uy * 5;
    const v2y = sy + uy * (d - 9) - ux * 5;

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffff00";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex2, ey2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(v1x, v1y);
    ctx.lineTo(ex2, ey2);
    ctx.lineTo(v2x, v2y);
    ctx.stroke();
}

function drawPath() {
    for (let p = 0; p < enemyPath.length - 1; p++) {
        drawArrow(
            enemyPath[p][0],
            enemyPath[p][1],
            enemyPath[p+1][0],
            enemyPath[p+1][1]
        );
    }
}

function drawTs() {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.textAlign = "left";
    ctx.strokeText(clock.ts, 4, h - 4);
    ctx.fillText(clock.ts, 4, h - 4);
}



/********************* GAME LOOP *********************/

function update(dt) {
    // dt = canvas.updateTime
    waveUpdate();
    updateEnemies();
    for (let t of towers) {
        t.findTarget(enemies);
        t.update(clock.ts);
    }
}

function draw() {
    //ctx.clearRect(0, 0, w, h);
    
    for (let t of tileData) t.draw(ctx, drawScale);
    //drawPath();
    
    for (let e of enemies) e.draw(ctx, drawScale);
    for (let t of towers) t.draw(ctx, drawScale);
    
    if (drawTileGrid) drawGrid();
    fillBg();
    drawSelection();
    
    drawHUD();
    //drawTs();
}


/*********************** INIT ************************/

function setDimensions() {
    const sideMargin = min(min(w, h) * 0.05, maxMargin);
    const gridW = w - sideMargin * 2;
    const gridH = h - sideMargin - max(sideMargin, topMarginMin);
    
    tileSize = min(gridW, gridH) / max(levelData.width, levelData.height);
    xOffset = gridH > gridW ? sideMargin : (w - tileSize * levelData.width) / 2;
    yOffset = max(sideMargin, topMarginMin);
    levelW = tileSize * levelData.width;
    levelH = tileSize * levelData.height;
    
    drawScale = tileSize / GO.TILE_METRIC;
    GO.setDrawScale(drawScale);
    log(`Draw scale: ${drawScale}`);
}

function setTiles() {
    for (let i = 0; i < levelData.tiles.length; i++) {
        const tile = new GO.Tile(levelData.tiles[i], i);
        const [x, y] = getTileScreenCoord(i);
        tile.x = x;
        tile.y = y;
        tileData.push(tile);
    }
}

function initLevel() {
    levelData = getLevelData();
    setDimensions(levelData);
    setTiles();
    const path = levels.getEnemyPath(levelData);
    if (!path) {
        err("Invalid enemy path; could not initialize level.");
        return;
    }
    enemyPath = getPathScreenCoord(path);
}


window.onload = function() {
    history.replaceState({menu: "closed"}, "", "");
    canvas.onUpdate = update;
    canvas.onDraw = draw;
    initLevel();
    initWaveQ();
    togglePaused();
};