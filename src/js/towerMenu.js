import {stats} from "./towers.js";


const mainEl = document.querySelector("#towerMenu");
mainEl.style.visibility = "hidden";

function newE(parent, type, id, className, content) {
    const e = document.createElement(type);
    if (parent) parent.appendChild(e);
    if (id) e.id = id;
    if (className) e.className = className;
    if (content) e.innerHTML = content;
    if (type === "button") e.type = "button";
    return e;
}

function newRadioGroup(parent, name, className, ...labels) {
    const inputs = [];
    for (let i = 0; i < labels.length; i++) {
        const l = labels[i];
        const id = `${name}${i}`;
        const input = newE(parent, "input", id, className);
        const label = newE(parent, "label", null, null, l);
        input.type = "radio";
        input.name = name;
        input.value = l.toLowerCase();
        label.htmlFor = id;
        inputs.push(input);
    }
    return inputs;
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

const upgradeMenu = newE(mainEl, "div", "upgradeMenu");
upgradeMenu.style.display = "none";

// level status + icon
const upgradeTowerIconCont = newE(upgradeMenu, "div", null, "upgradeTowerIconCont");
const towerLvlDisp = newE(upgradeTowerIconCont, "div", null, "towerLvlDisp");
const menuTowerIcon = newE(upgradeTowerIconCont, "img", null, "towerIcon");
const expBar = newE(upgradeTowerIconCont, "div", null, "expBar");
menuTowerIcon.src = `./icons/basic.png`;

// upgrades
const upgradesCont = newE(upgradeMenu, "div", null, "upgradesCont");
const upgradesHeader = newE(upgradesCont, "div", null, "upgradesHeader", "Next upgrade: ");
const upgradePrice = newE(upgradesHeader, "span");
const upDamageBtn = newE(upgradesCont, "button", null, "upgradeBtn", "damage");
const upDamageBtnText = newE(upgradesCont, "span", null, "upgradeBtnText", "damage");
const upSpeedBtn = newE(upgradesCont, "button", null, "upgradeBtn", "speed");
const upSpeedBtnText = newE(upgradesCont, "span", null, "upgradeBtnText", "speed");
const upRangeBtn = newE(upgradesCont, "button", null, "upgradeBtn", "range");
const upRangeBtnText = newE(upgradesCont, "span", null, "upgradeBtnText", "range");

// targeting
const targetingHeader = newE(upgradeMenu, "div", null, "menu-separator", "Targeting");
const targetingCont = newE(upgradeMenu, "div", null, "targetingRadiosCont");
export const targetingRadios = newRadioGroup(targetingCont, "targetSelect", "targetRadio",
                                      "First", "Last", "Strongest", "Weakest", "Nearest");
targetingRadios[0].checked = true;
export const upgradeBtns = {
    damage: upDamageBtn,
    speed: upSpeedBtn,
    range: upRangeBtn
};


/******************** Menu functions ******************/

export function closeMenu() {
    mainEl.style.visibility = "hidden";
}

export function openBuildMenu() {
    mainEl.style.visibility = "visible";
    buildMenu.style.display = "grid";
    upgradeMenu.style.display = "none";
}

export function openUpgradeMenu() {
    mainEl.style.visibility = "visible";
    buildMenu.style.display = "none";
    upgradeMenu.style.display = "grid";
}

export function updatePrices(moneyState, selectedTower) {
    
}

export function updateStatus(selectedTower) {
    
}

export function updateMenu(moneyState, selectedTower) {
    
    // build menu
    for (let tower in buildTowerBtns) {
        const cont = buildTowerBtns[tower];
        if (moneyState < stats[tower].price) {
            cont.classList.add("disabled");
        } else {
            cont.classList.remove("disabled");
        }
    }
    // upgrade menu
    if (selectedTower) {
        const expPerc = selectedTower.expAmount / selectedTower.expReq * 100;
        expBar.style.width = expPerc + "%";
        towerLvlDisp.textContent = `Lvl ${selectedTower.expLevel}`;
        //expBar.textContent = `Exp: ${selectedTower.expAmount} / ${selectedTower.expReq}`;
        upgradePrice.textContent = `$${selectedTower.upgradePrice}`;
        upDamageBtn.textContent = `Damage Lv${selectedTower.damageLevel}`;
        upSpeedBtn.textContent = `Speed Lv${selectedTower.speedLevel}`;
        upRangeBtn.textContent = `Range Lv${selectedTower.rangeLevel}`;
        upDamageBtnText.textContent = String(selectedTower.damage);
        upSpeedBtnText.textContent = `${selectedTower.speed}/min`;
        upRangeBtnText.textContent = `${selectedTower.radius}px`;
    }
}
