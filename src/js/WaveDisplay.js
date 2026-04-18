function newE(parent, type, className) {
    const e = document.createElement(type);
    if (type === "button") e.type = "button";
    if (parent) parent.appendChild(e);
    if (className) e.className = className;
    return e;
}

const main = document.querySelector("#waveQueue");
const header = newE(main, "div", "waveQHeader");
export const pauseBtn = newE(header, "button", "btn");
export const nextWaveBtn = newE(header, "button", "btn");
pauseBtn.textContent = "| |";
nextWaveBtn.textContent = "Next Wave >";

// time, num enemies, health
export function updateWaveDisp(count, queue) {
    main.innerHTML = "";
    main.appendChild(header);
    for (let i = 0; i < queue.length; i++) {
        const cont = newE(main, "div", "waveCont");
        const num = newE(cont, "div", "waveNum");
        const enemy = newE(cont, "div", "waveEnemy");
        const time = newE(cont, "div", "waveTime");
        const health = newE(cont, "div", "waveHealth");
        
        const wave = queue[i];
        const nEnemies = Math.floor(wave.spawnTime / wave.spawnDelay);
        num.textContent = `${count + i + 1}.`;
        enemy.textContent = `${wave.enemyType} x${nEnemies}`;
        time.textContent = `${Math.round(wave.spawnTime / 1000)} sec`;
        health.textContent = `${Math.round(wave.enemyHealth)} HP`;
    }
}