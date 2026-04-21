function newE(parent, type, className) {
    const e = document.createElement(type);
    if (type === "button") e.type = "button";
    if (parent) parent.appendChild(e);
    if (className) e.className = className;
    return e;
}

const main = document.querySelector("#waveQueue");
const controls = newE(main, "div", "waveControls");
export const pauseBtn = newE(controls, "button", "btn");
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
    const enemy = newE(parent, "div", "waveEnemy");
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
let updateCount, updateQueue;

export function animateUpdate(count, queue) {
    updateCount = count;
    updateQueue = queue;
    startAnimation();
}

function startAnimation() {
    animating = true;
    nextWaveCont.classList.add("animate");
    futureWavesCont.classList.add("animate");
    lastWaveCont.classList.add("animate");
}

export function updateValues(count, queue) {
    for (let i = 0; i < queue.length; i++) {
        const wave = queue[i];
        const nEnemies = Math.floor(wave.spawnTime / wave.spawnDelay);
        waveContEls[i].num.textContent = `${count + i + 1}.`;
        waveContEls[i].enemy.textContent = `${wave.enemyType} x${nEnemies}`;
        waveContEls[i].time.textContent = `${Math.round(wave.spawnTime / 1000)} sec`;
        waveContEls[i].health.textContent = `${Math.round(wave.enemyHealth)} HP`;
    }
}

function endAnimation() {
    updateValues(updateCount, updateQueue);
    nextWaveCont.classList.remove("animate");
    futureWavesCont.classList.remove("animate");
    lastWaveCont.classList.remove("animate");
    animating = false;
}

lastWaveCont.addEventListener("transitionend", endAnimation);