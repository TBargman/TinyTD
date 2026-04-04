"use strict";

import {CanvasSetup} from "./CanvasSetup.js";
import * as levels from "./levels.js";
import {Tile} from "./tiles.js";
import {Enemy} from "./enemies.js";
import * as Towers from "./towers.js";

const w = window.innerWidth;
const h = window.innerHeight / 2;
const canvas = new CanvasSetup(document.querySelector("canvas"), w, h);
const ctx = canvas.get2D();

const towerMenu = document.querySelector("#towerMenu");
const logEl = document.querySelector("#debugText");


/*********************** STATE ***********************/

const clock = canvas.clock;

let drawScale = 1;
let tileSize, xOffset, yOffset;
const maxMargin = 30;
const topMarginMin = 50;

let selectedLevel = "test";
let levelData, enemyPath;
let pathStartX, pathStartY;

const tileData = [];
let selectedTile = null;

let runningWaves = [];
let enemyIdCount = 0;
let towerIdCount = 0;
let waveCount = 0;

let lives = 20;
let money = 200;
let enemies = [];
const towers = [];


// debug
const drawTileGrid = true;



/****************** HELPER FUNCTIONS *****************/

const log = str => console.log(str);
const log2 = str => logEl.innerHTML = str;
const err = str => console.error(str);
const max = (a, b) => (a > b ? a : b);
const min = (a, b) => (a < b ? a : b);
const getLevelData = () => levels.levelData[selectedLevel];

function getPathScreenCoord(path) {
    const pathCoords = [];
    for (let point of path) {
        const x = tileData[point[0]].cx;
        const y = tileData[point[0]].cy;
        pathCoords.push([x, y]);
    }
    return pathCoords;
}



/*************** POINTER HANDLING ***************/

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


/******************** MENU FUNCTIONS *******************/

const btnAddBasicTower = document.querySelector("#btnBasicTower");

function selectTile(i) {
    const tile = tileData[i];
    // is a tower space?
    if (tile.type === 4) {
        if (tile.selected) {
            // deselect
            tile.selected = false;
            selectedTile = null;
            towerMenu.style.visibility = "hidden";
        } else {
            // select
            if (selectedTile) selectedTile.selected = false;
            tile.selected = true;
            selectedTile = tile;
            towerMenu.style.visibility = "visible";
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
            }
        }
    } else {
        // deselect
        selectedTile.selected = false;
        selectedTile = null;
        towerMenu.style.visibility = "hidden";
    }
}

function updateTowerMenu() {
    
}

btnAddBasicTower.addEventListener("click", () => {
    if (selectedTile && !selectedTile.tower) {
        const t = new Towers.BasicTower(selectedTile);
        selectedTile.tower = t;
        t.x = selectedTile.cx;
        t.y = selectedTile.cy;
        t.id = towerIdCount;
        towerIdCount++;
        towers.push(t);
    }
});


/******************** GAME FUNCTIONS *******************/

function startWave(enemy_type, waveTime, spawnTime, spawn_delay) {
    runningWaves.push({
        startTime: clock.ts,
        waveEndTime: clock.ts + waveTime,
        spawnEndTime: clock.ts + spawnTime,
        enemyType: enemy_type,
        spawnDelay: spawn_delay,
        numSpawned: 0
    });
    waveCount++;
}

function waveUpdate() {
    for (let wave of runningWaves) {
        
        // spawn enemies
        const elapsed = clock.ts - wave.startTime;
        const nEnemies = Math.floor(elapsed / wave.spawnDelay);
        while (wave.numSpawned < nEnemies && elapsed < wave.spawnEndTime) {
            const enemy = new Enemy(wave.enemyType);
            
            // place at start point & set direction
            enemy.id = enemyIdCount;
            enemy.path = JSON.parse(JSON.stringify(enemyPath));
            enemy.x = enemy.path[0][0];
            enemy.y = enemy.path[0][1];
            enemy.path.shift();
            enemy.nextX = enemy.path[0][0];
            enemy.nextY = enemy.path[0][1];
            const dx = enemy.nextX - enemy.x;
            const dy = enemy.nextY - enemy.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            enemy.dx = dx / d;
            enemy.dy = dy / d;
            enemies.push(enemy);
            enemyIdCount++;
            wave.numSpawned++;
        }
    }
    
    runningWaves = runningWaves.filter(w => clock.ts < w.waveEndTime);
}

function updateEnemies() {
    for (let e of enemies) {
        // check if path point reached:
        // project enemy and next path point
        // onto movement vector and compare
        const p1 = e.x * e.dx + e.y * e.dy;
        const p2 = e.nextX * e.dx + e.nextY * e.dy;
        if (p1 > p2) {
            // reached path point, change dir
            e.path.shift();
            if (e.path.length) {
                e.nextX = e.path[0][0];
                e.nextY = e.path[0][1];
                const dx = e.nextX - e.x;
                const dy = e.nextY - e.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                e.dx = dx / d;
                e.dy = dy / d;
            } else {
                // reached the end
                e.endReached = true;
                lives--;
            }
        }
        
        e.update();
        if (e.health <= 0) money += e.money;
    }
    enemies = enemies.filter(e => !e.endReached && e.health > 0);
}


/******************* CANVAS FUNCTIONS ******************/

function setDimensions() {
    const sideMargin = min(min(w, h) * 0.05, maxMargin);
    const gridW = w - sideMargin * 2;
    const gridH = h - sideMargin - max(sideMargin, topMarginMin);
    
    tileSize = min(gridW, gridH) / max(levelData.width, levelData.height);
    xOffset = gridH > gridW ? sideMargin : (w - tileSize * levelData.width) / 2;
    yOffset = max(sideMargin, topMarginMin);
}

function getTileScreenCoord(i) {
    const x = (i % levelData.width) * tileSize + xOffset;
    const y = Math.floor(i / levelData.height) * tileSize + yOffset;
    return [x, y];
}

function getTileCenter(i) {
    const [x, y] = getTileScreenCoord(i);
    return [x + tileSize / 2, y + tileSize / 2];
}

function drawSelection() {
    if (selectedTile) {
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(selectedTile.x, selectedTile.y, tileSize, tileSize);
    }
}

function drawHUD() {
    ctx.font = "600 16px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    const y = yOffset - 12;
    const livesSt = `Lives: ${lives}`;
    const waveSt = `Wave ${waveCount}`;
    const moneySt = `$${money}`;
    
    ctx.textAlign = "left";
    ctx.strokeText(livesSt, xOffset, y);
    ctx.fillText(livesSt, xOffset, y);
    ctx.textAlign = "center";
    ctx.strokeText(waveSt, w / 2, y);
    ctx.fillText(waveSt, w / 2, y);
    ctx.textAlign = "right";
    ctx.strokeText(moneySt, w - xOffset, y);
    ctx.fillText(moneySt, w - xOffset, y);
}

function drawGrid() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00000066";
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


// Debug

function drawArrow(length, sx, sy, ux, uy) {
    const ex = sx + ux * length;
    const ey = sy + uy * length;
    const v1x = sx + ux * (length - 6) - uy * 5;
    const v1y = sy + uy * (length - 6) + ux * 5;
    const v2x = sx + ux * (length - 6) + uy * 5;
    const v2y = sy + uy * (length - 6) - ux * 5;

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffff00";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(v1x, v1y);
    ctx.lineTo(ex, ey);
    ctx.lineTo(v2x, v2y);
    ctx.stroke();
}

function drawPath() {
    for (let p of enemyPath) {
        const dir = p[1];
        if (dir === "start") continue;

        const i = p[0];
        const tx = (i % levelData.width) * tileSize + xOffset;
        const ty = Math.floor(i / levelData.height) * tileSize + yOffset;

        let sx, sy, ux, uy;
        switch (dir) {
            case "up":
                sx = tx + tileSize * 0.5;
                sy = ty + tileSize * 0.7;
                ux = 0;
                uy = -1;
                break;
            case "down":
                sx = tx + tileSize * 0.5;
                sy = ty + tileSize * 0.3;
                ux = 0;
                uy = 1;
                break;
            case "left":
                sx = tx + tileSize * 0.7;
                sy = ty + tileSize * 0.5;
                ux = -1;
                uy = 0;
                break;
            case "right":
                sx = tx + tileSize * 0.3;
                sy = ty + tileSize * 0.5;
                ux = 1;
                uy = 0;
                break;
            case "up-right":
                sx = tx + tileSize * 0.35;
                sy = ty + tileSize * 0.65;
                ux = 0.707;
                uy = -0.707;
                break;
            case "up-left":
                sx = tx + tileSize * 0.65;
                sy = ty + tileSize * 0.65;
                ux = -0.707;
                uy = -0.707;
                break;
            case "down-right":
                sx = tx + tileSize * 0.35;
                sy = ty + tileSize * 0.35;
                ux = 0.707;
                uy = 0.707;
                break;
            case "down-left":
                sx = tx + tileSize * 0.65;
                sy = ty + tileSize * 0.35;
                ux = -0.707;
                uy = 0.707;
                break;
        }
        drawArrow(tileSize * 0.4, sx, sy, ux, uy);
    }
}



/*************** GAME LOOP: CANVAS **************/

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
    ctx.fillStyle = "#209318";
    ctx.fillRect(0, 0, w, h);
    
    for (let t of tileData) t.draw(ctx, drawScale);
    //drawPath();
    if (drawTileGrid) drawGrid();
    drawSelection();
    
    for (let e of enemies) e.draw(ctx, drawScale);
    for (let t of towers) t.draw(ctx, drawScale);
    
    drawHUD();
}


/*********************** INIT ************************/

function setTiles() {
    for (let i = 0; i < levelData.tiles.length; i++) {
        const tile = new Tile(levelData.tiles[i], i, tileSize);
        const [x, y] = getTileScreenCoord(i);
        const [cx, cy] = getTileCenter(i);
        tile.x = x;
        tile.y = y;
        tile.cx = cx;
        tile.cy = cy;
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


initLevel();
canvas.onUpdate = update;
canvas.onDraw = draw;
startWave("basic", 300000, 300000, 800);