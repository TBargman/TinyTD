import {stats} from "./towers.js";


let mode = "build"; // build | upgrade
let menuOpen = true;

const mainEl = document.querySelector("#towerMenu");
mainEl.style.visibility = "hidden";

function newE(parent, type, id, className, content) {
    const e = document.createElement(type);
    if (parent) parent.appendChild(e);
    if (id) e.id = id;
    if (className) e.className = className;
    if (content) e.HTMLcontent = content;
    return e;
}


/***************** "Build Tower" Menu ****************/

export const buildTowerBtns = {};
const buildMenu = newE(mainEl, "div", "buildTowerMenu");
buildMenu.style.display = "none";

for (let tower in stats) {
    const cont = newE(buildMenu, "div", null, "towerIconGridItem");
    const title = newE(cont, "div", null, "towerIconTitle");
    const icon = newE(cont, "img", null, "towerIcon");
    const price = newE(cont, "div", null, "towerIconPrice");
    title.textContent = tower;
    icon.src = `./icons/${tower}.png`;
    price.textContent = `$${stats[tower].price}`;
    buildTowerBtns[tower] = cont;
}



/******************** Upgrade Menu ********************/

export const upgradeBtns = {};
const upgradeMenu = newE(mainEl, "div", "upgradeMenu");
upgradeMenu.style.display = "none";

const upgradeTowerIconCont = newE(upgradeMenu, "div", null, "upgradeTowerIconCont");
const towerLvlDisp = newE(upgradeTowerIconCont, "div", null, "towerLvlDisp");
const menuTowerIcon = newE(upgradeTowerIconCont, "img", null, "towerIcon");
const expBar = newE(upgradeTowerIconCont, "div", null, "expBar");

menuTowerIcon.src = `./icons/basic.png`;


export function closeMenu() {
    menuOpen = false;
    mainEl.style.visibility = "hidden";
}

export function openBuildMenu() {
    menuOpen = true;
    mainEl.style.visibility = "visible";
    buildMenu.style.display = "grid";
    upgradeMenu.style.display = "none";
}

export function openUpgradeMenu() {
    menuOpen = true;
    mainEl.style.visibility = "visible";
    buildMenu.style.display = "none";
    upgradeMenu.style.display = "block";
}

export function updateMenu(moneyState, selectedTower) {
    // build menu
    for (let tower in buildTowerBtns) {
        const cont = buildTowerBtns[tower];
        if (moneyState >= stats[tower].price) {
            cont.classList.remove("disabled");
        } else {
            cont.classList.add("disabled");
        }
    }
    // upgrade menu
    if (selectedTower) {
        console.log(selectedTower)
        const expPerc = selectedTower.expAmount / selectedTower.expReq * 100;
        console.log(expPerc);
        expBar.style.width = expPerc + "%";
    }
}