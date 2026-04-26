import {TowerStats} from "./GameObjs.js";


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

for (let tower in TowerStats) {
    const cont = newE(buildMenu, "div", null, "towerIconGridItem");
    const title = newE(cont, "div", null, "towerIconTitle");
    const icon = newE(cont, "img", null, "towerIcon");
    const price = newE(cont, "div", null, "towerIconPrice");
    icon.draggable = false;
    title.textContent = tower;
    icon.src = `./icons/${tower}-big.png`;
    price.textContent = `$${TowerStats[tower].price}`;
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
menuTowerIcon.src = `./icons/basic-big.png`;

// upgrades
const upgradesCont = newE(upgradeMenu, "div", null, "upgradesCont");
const upgradesHeader = newE(upgradesCont, "div", null, "upgradesHeader", "Next upgrade: ");
const upgradePrice = newE(upgradesHeader, "span");
const upDamageBtn = newE(upgradesCont, "button", null, "btn", "damage");
const upDamageBtnText = newE(upgradesCont, "span", null, "upgradeBtnText", "damage");
const upSpeedBtn = newE(upgradesCont, "button", null, "btn", "speed");
const upSpeedBtnText = newE(upgradesCont, "span", null, "upgradeBtnText", "speed");
const upRangeBtn = newE(upgradesCont, "button", null, "btn", "range");
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
    if (history.length > 1) history.back();
}

export function openBuildMenu() {
    mainEl.style.visibility = "visible";
    buildMenu.style.display = "grid";
    upgradeMenu.style.display = "none";
    history.pushState({menu: "open"}, "", "");
}

export function openUpgradeMenu() {
    mainEl.style.visibility = "visible";
    buildMenu.style.display = "none";
    upgradeMenu.style.display = "grid";
    history.pushState({menu: "open"}, "", "");
}

export function updatePrices(moneyState, selectedTower) {
    
}

export function updateStatus(selectedTower) {
    
}

export function updateMenu(moneyState, selectedTile) {
    
    // build menu
    for (let tower in buildTowerBtns) {
        const cont = buildTowerBtns[tower];
        if (moneyState < TowerStats[tower].price) {
            cont.classList.add("disabled");
        } else {
            cont.classList.remove("disabled");
        }
    }
    // upgrade menu
    if (selectedTile && selectedTile.tower) {
        const tower = selectedTile.tower;
        const expPerc = tower.expAmount / tower.expReq * 100;
        menuTowerIcon.src = `./icons/${tower.type}-big.png`;
        expBar.style.width = expPerc + "%";
        //expBar.textContent = `Exp: ${tower.expAmount} / ${tower.expReq}`;
        towerLvlDisp.textContent = `Lvl ${tower.expLevel}`;
        upgradePrice.textContent = `$${tower.upgradePrice}`;
        upgradePrice.style.color = tower.upgradePrice > moneyState ? "#ff0000" : "#ffce02";
        upDamageBtn.textContent = `Damage Lv${tower.damageLevel}`;
        upSpeedBtn.textContent = `Speed Lv${tower.speedLevel}`;
        upRangeBtn.textContent = `Range Lv${tower.rangeLevel}`;
        upDamageBtnText.textContent = String(tower.damage);
        upSpeedBtnText.textContent = `${tower.speed}/min`;
        upRangeBtnText.textContent = `${tower.radius}px`;
        document.querySelector(`.targetRadio[value="${tower.targeting}"]`).checked = true;
        
        if (moneyState < tower.upgradePrice) {
            upDamageBtn.disabled = true;
            upSpeedBtn.disabled = true;
            upRangeBtn.disabled = true;
        } else {
            upDamageBtn.disabled = false;
            upSpeedBtn.disabled = false;
            upRangeBtn.disabled = false;
        }
    }
}
