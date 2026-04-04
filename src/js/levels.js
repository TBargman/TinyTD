/**************************************************

Level tile maps & key for tile ids.
Will default to 8x8 for now.


Templates:

const template8x8 = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0];

const template12x12 = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    

const template16x16 = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


*****************************************************/


const log = str => console.log(str);
const err = str => console.error(str);

/*  TILE KEY

0 = empty space
1 = enemy path start
2 = enemy path
3 = enemy path end
4 = tower space
5...z = ?

*/

export const levelData = {
    "test": {
        width: 8,
        height: 8,
        tiles: [
        0, 2, 2, 4, 4, 0, 0, 0,
        0, 2, 4, 2, 2, 4, 4, 4,
        0, 2, 2, 4, 2, 2, 2, 3,
        0, 0, 2, 4, 4, 4, 4, 4,
        4, 4, 4, 2, 4, 0, 0, 0,
        1, 2, 4, 4, 2, 0, 0, 0,
        4, 4, 2, 2, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0]
    },
    "test2": {
        width: 6,
        height: 3,
        tiles: [
        1, 0, 0, 0, 2, 0,
        0, 2, 0, 2, 0, 3,
        0, 0, 2, 0, 0, 0]
    }
};


//////////////////////////////////////////////////



export function getEnemyPath(level) {
    // Plots enemy movements and validates path
    // find start + end
    let start = null;
    let end = null;
    for (let i = 0; i < level.tiles.length; i++) {
        const tile = level.tiles[i];
        if (tile === 1) {
            if (start === null) {
                start = i;
            } else {
                err("Level has > 1 starting position");
                return;
            }
        }
        if (tile === 3) {
            if (end === null) {
                end = i;
            } else {
                err("Level has > 1 end position");
                return;
            }
        }
    }
    if (start === null) {
        err("Level is missing start point");
        return;
    }
    if (end === null) {
        err("Level is missing end point");
        return;
    }
    
    // plot path
    // diagonal moves are allowed but horizontal moves take priority
    const path = [[start]]; // fmt: [tile index, move]
    const w = level.width;
    const checkAdjacent = function(i) {
        //log("---------‐----‐--‐-----------------> CHECKING " + i);
        const axes = ["up", "down", "left", "right"];
        const moves = {
            "up":         i - w,
            "down":       i + w,
            "left":       i - 1,
            "right":      i + 1,
            "up-left":    i - w - 1,
            "up-right":   i - w + 1,
            "down-left":  i + w - 1,
            "down-right": i + w + 1
        };
        
        const axisMoves = [
            i - w, // up
            i + w, // down
            i - 1, // left
            i + 1  // right
        ];
        const diagonalMoves = [
            i - w - 1, // up-left
            i - w + 1, // up-right
            i + w - 1, // down-left
            i + w + 1  // down-right
        ];
        
        let move;
        let nextTile;
        const prev = path.at(-2);
        //log("prev: " + (prev ? prev[0] : "none"));
        for (let dir in moves) {
            const mi = moves[dir];
            //log("looking " + dir + " to " + m);
            if (mi < 0 || mi >= level.tiles.length || (prev && prev[0] === mi)) continue;
            if (level.tiles[mi] === 2 || level.tiles[mi] === 3) {
                if (axes.includes(dir)) {
                    // axis move
                    if (!move) {
                        move = dir;
                        nextTile = mi;
                        //log("FOUND " + m + " (" + dir + ")");
                    } else {
                        err("Path error (branching). Branching paths are not currently supported");
                        return false;
                    }
                } else {
                    // diagonal move
                    if (!move || !axes.includes(move)) {
                        //log("FOUND " + m + " (" + dir + ")");
                        move = dir;
                        nextTile = mi;
                    }
                }
            }
        }
        if (!move) {
            err("Path error (couldn't find next move)");
            return false;
        }
        //log("chose: "+move+", "+nextIndex);
        path.at(-1).push(move);
        path.push([nextTile]);
        return true;
    };
    
    let c = 0; // prevent infinite loop
    while (path.at(-1)[0] !== end && c < 999) {
        const p = path.at(-1)[0];
        if (!checkAdjacent(path.at(-1)[0])) return false;
        c++;
    }
    if (c === 999) return;
    return path;
}

//console.log(getEnemyPath(level_default));