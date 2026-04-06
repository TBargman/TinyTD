// Icon creation

import * as t from "./towers.js";


const showDLbtns = false;
const baseSize = 36;
const scale = 1;

const iconSize = Math.floor(baseSize * scale);

const menu = document.querySelector("#debugText");
if (showDLbtns) menu.innerHTML = "Get Icons<br>";

const canvas2 = document.createElement("canvas");
const ctx2 = canvas2.getContext("2d");
const dpr = window.devicePixelRatio;
canvas2.style.position = "absolute";
canvas2.style.top = "0";
canvas2.style.left = "0";
canvas2.style.width = iconSize + "px";
canvas2.style.height = iconSize + "px";
canvas2.style.backgroundColor = "#ffffff";
canvas2.width = iconSize * dpr;
canvas2.height = iconSize * dpr;
ctx2.scale(dpr, dpr);
if (showDLbtns) document.body.appendChild(canvas2);


const tile = {x: 0, y: 0, cx: iconSize / 2, cy: iconSize / 2, size: iconSize};
const btns = [];
const towers = [
    ["basic", new t.BasicTower(tile)]
];


for (let tower of towers) {
    const [type, obj] = tower;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.display = "inline";
    btn.style.padding = "16px";
    btn.style.margin = "8px";
    btn.textContent = type;
    btns.push(btn);
    menu.appendChild(btn);
    btn.addEventListener("click", () => {
        ctx2.clearRect(0, 0, iconSize, iconSize);
        obj.draw(ctx2);
    
        const link = document.createElement("a");
        link.href = canvas2.toDataURL("image/png");
        link.download = type + ".png";
        link.click();
    });
}

for (let btn of btns) btn.style.visibility = showDLbtns ? "visible" : "hidden";
