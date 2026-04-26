// Icon creation

import * as GO from "./GameObjs.js";

const enabled = false;
let baseSize = 24;
let scale = 3;

// sizes
// enemies 24, 3
// towers 32, 5


// ----------------------------‐---------------


const menu = document.createElement("div");
document.body.appendChild(menu);
menu.id = "iconMenu";
menu.style.display = enabled ? "block" : "none";
menu.innerHTML = "Get Icons<br>";

const canvas2 = document.createElement("canvas");
const ctx2 = canvas2.getContext("2d");
const dpr = window.devicePixelRatio;
canvas2.style.position = "absolute";
canvas2.style.top = "0";
canvas2.style.left = "0";
if (enabled) document.body.appendChild(canvas2);

let iconW, iconH, cx, cy;
function resize(widthMult = 1) {
    iconW = Math.floor(baseSize * scale * widthMult);
    iconH = Math.floor(baseSize * scale);
    cx = iconW / 2;
    cy = iconH / 2;
    canvas2.style.width = iconW + "px";
    canvas2.style.height = iconH + "px";
    canvas2.style.backgroundColor = "#ffffff";
    canvas2.width = iconW * dpr;
    canvas2.height = iconH * dpr;
    ctx2.scale(dpr, dpr);
}

resize();
if (enabled) GO.setDrawScale(scale);

const tile = {x: 0, y: 0, cx: cx, cy: cy, size: iconH};

for (let type in GO.Towers) {
    const tower = new GO.Towers[type](tile);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.display = "inline";
    btn.style.padding = "10px 12px";
    btn.style.margin = "8px";
    btn.textContent = type;
    menu.appendChild(btn);
    btn.addEventListener("click", () => {
        baseSize = 32;
        scale = 5;
        resize();
        ctx2.clearRect(0, 0, iconW, iconH);
        tower.draw(ctx2);

        const link = document.createElement("a");
        link.href = canvas2.toDataURL("image/png");
        link.download = type + ".png";
        link.click();
    });
}

for (let e in GO.Enemies) {
    const enemy = GO.Enemies[e];
    
    for (let i = 1; i < 4; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.display = "inline";
        btn.style.padding = "10px 12px";
        btn.style.margin = "6px";
        btn.textContent = `Enemy (${e}) x${i}`;
        menu.appendChild(btn);
        
        const toDraw = [];
        for (let j = 0; j < i; j++) toDraw.push(new enemy());
        for (let nme of toDraw) { nme.y = cy; }
        //const wMult = i === 2 ? 1.8 : i === 3 ? 2 : 1;
        const wMult = 2;
        
        btn.addEventListener("click", function() {
            baseSize = 24;
            scale = 3;
            resize(wMult);
            switch (toDraw.length) {
                case 1:
                    toDraw[0].x = cx;
                    break;
                case 2:
                    toDraw[0].x = cx - 10 * scale;
                    toDraw[1].x = cx + 10 * scale;
                    break;
                case 3:
                    toDraw[0].x = cx - 12 * scale;
                    toDraw[1].x = cx;
                    toDraw[2].x = cx + 12 * scale;
                    break;
            }
            ctx2.clearRect(0, 0, iconW, iconH);
            for (let obj of toDraw) {
                obj.draw(ctx2);
            }

            const link = document.createElement("a");
            link.href = canvas2.toDataURL("image/png");
            link.download = `${e}${i-1}.png`;
            link.click();
        });
    }
}
