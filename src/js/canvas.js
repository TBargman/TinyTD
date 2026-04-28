/************************************************

Contains functions for drawing/interacting with game canvas,
and associated constants for colors, dimensions, etc.

************************************************/

import {CanvasSetup} from "./CanvasSetup.js";
import {getLevelData} from "./levels.js";

const c = document.querySelector("canvas");
const w = window.innerWidth;
const h = window.innerHeight / 2;

export const canvas = new CanvasSetup(c, w, h);
const ctx = canvas.get2D();
const ptr = canvas.pointer;

const max = (a, b) => (a > b ? a : b);
const min = (a, b) => (a < b ? a : b);

const maxMargin = 20;
let viewW, viewH, xOffset, yOffset;
let tileSize;

// debug
const drawTileGrid = true;



/*************** CANVAS CONTROL ***************/

export function setUpdate(f) { canvas.onUpdate = f; }
export function setDraw(f) { canvas.onDraw = f; }

/***************** TILES *****************/

const tileColors = {
    0: "#209318", // empty
    1: "#1584ce", // path start
    2: "#5f4624", // path
    3: "#99371a", // path end
    4: "#949a9e", // tower space
};





/***************** POINTER HANDLING ******************/





/*************** DEBUG DRAWING **************/

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

export function drawPath(level, path) {
    for (let p of path) {
        const dir = p[1];
        if (dir === "start") continue;

        const i = p[0];
        const tx = (i % level.width) * tileSize + xOffset;
        const ty = Math.floor(i / level.height) * tileSize + yOffset;

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
