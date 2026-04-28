function newE(parent, type, className) {
    const e = document.createElement(type);
    if (type === "button") e.type = "button";
    if (parent) parent.appendChild(e);
    if (className) e.className = className;
    return e;
}

const main = document.querySelector("#waveQueue");
const controls = newE(main, "div", "waveControls");
export const pauseBtn = newE(controls, "button", "btn glow");
export const waveBonus = newE(controls, "div", "waveBonus");
export const nextWaveBtn = newE(controls, "button", "btn");
pauseBtn.textContent = "|  |"; // ▮▮
nextWaveBtn.textContent = "Next Wave >";

const waveContEls = [];
const nextWaveCont = newE(main, "div", "waveCont nextWave");
const futureWavesCont = newE(main, "div", "futureWaves");
const lastWaveCont = newE(main, "div", "waveCont lastWave");

// wave #, enemy type + num, time, health
function newWaveCont(parent) {
    const num = newE(parent, "div", "waveNum");
    const iconCont = newE(parent, "div", "waveIconCont");
    const enemy = newE(iconCont, "img", "waveEnemyIcon");
    const time = newE(parent, "div", "waveTime");
    const health = newE(parent, "div", "waveHealth");
    waveContEls.push({
        "num": num,
        "enemy": enemy,
        "time": time,
        "health": health
    });
}



////// INIT //////

newWaveCont(nextWaveCont);
for (let i = 0; i < 4; i++) {
    const waveCont = newE(futureWavesCont, "div", "waveCont");
    newWaveCont(waveCont);
}
newWaveCont(lastWaveCont);



//////// UPDATE + ANIMATION ////////

export let animating = false;
let updateQueue;

export function animateUpdate(queue) {
    updateQueue = queue;
    startAnimation();
}

function startAnimation() {
    animating = true;
    nextWaveCont.classList.add("animate");
    futureWavesCont.classList.add("animate");
    lastWaveCont.classList.add("animate");
}

export function updateValues(queue) {
    for (let i = 0; i < queue.length; i++) {
        const wave = queue[i];
        const nEnemies = Math.floor(wave.spawnTime / wave.spawnDelay);
        waveContEls[i].num.textContent = `${wave.waveNum}.`;
        waveContEls[i].enemy.src = `../icons/${wave.enemyType}${wave.iconNum}.png`;
        waveContEls[i].time.textContent = `${Math.round(wave.spawnTime / 1000)} sec`;
        waveContEls[i].health.textContent = `${Math.round(wave.enemyHealth)} HP`;
    }
}

function endAnimation() {
    updateValues(updateQueue);
    nextWaveCont.classList.remove("animate");
    futureWavesCont.classList.remove("animate");
    lastWaveCont.classList.remove("animate");
    animating = false;
}

lastWaveCont.addEventListener("transitionend", endAnimation);