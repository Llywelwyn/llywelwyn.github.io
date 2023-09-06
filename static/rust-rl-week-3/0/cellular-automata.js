import Vue from '/vue.esm.browser.js'

const gridCols = 50;
const gridRows = 30;
let positions = [];
let states = [];

for (let x = 0; x < gridCols; x++) {
    for (let y = 0; y < gridRows; y++) {
        positions.push({ x, y });
    }
}

function randomise(states) {
    for (let i = 0; i < positions.length; i++) {
        let x = i % gridCols;
        let y = i / gridCols | 0;
        if (x == 0 || y == 0 || x == gridCols - 1 || y == gridRows - 1) { states[i] = true; } else {
            states[i] = Math.random() > 0.55;
        }

    }
    return states;
}

states = randomise(states);

new Vue({
    el: "#diagram",
    data: {
        scale: 10,
        gridCols,
        gridRows,
        positions,
        states,
    },
    methods: {
        state(tile) {
            const idx = tile.y * gridCols + tile.x;
            return this.states[idx];
        },
        randomise() {
            this.$set(this.states, randomise(this.states));
        },
        step() {
            let new_states = [];
            function count_neighbours(states, x, y) {
                let count = 0;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx == 0 && dy == 0) continue;
                        let nx = x + dx;
                        let ny = y + dy;
                        if (nx <= 0 || nx >= gridCols) continue;
                        if (ny <= 0 || ny >= gridRows) continue;
                        if (states[ny * gridCols + nx]) count++;
                    }
                }
                console.log(count);
                return count;
            }
            for (let y = 0; y < gridRows; y++) {
                for (let x = 0; x < gridCols; x++) {
                    const idx = y * gridCols + x;
                    if (x == 0 || y == 0 || x == gridCols - 1 || y == gridRows - 1) {
                        new_states[idx] = true;
                        continue;
                    }
                    const neighbours = count_neighbours(this.states, x, y);
                    if ((this.states[idx] && neighbours >= 4) || (!this.states[idx] && neighbours >= 5 || neighbours === 0)) {
                        new_states[idx] = true;
                    } else {
                        new_states[idx] = false;
                    }
                }
            }
            for (let i = 0; i < this.states.length; i++) {
                this.$set(this.states, i, new_states[i]);
            }
        }
    }
});