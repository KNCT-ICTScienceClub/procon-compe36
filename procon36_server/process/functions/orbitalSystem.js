const Procon = require("./proconUtility").Procon;
const ReceiveData = require("./proconUtility").ReceiveData;

class Lampyrisma extends Procon {
    garden;
    entities;
    width;
    depth;

    constructor(element, width, depth) {
        super(element);
        let flag = [...Array(this.size * this.size).fill(false)];
        this.board = this.board.map(array => array.map(element => {
            if (!flag[element]) {
                flag[element] = true;
                return Math.abs(element) * 2;
            }
            else {
                return Math.abs(element) * 2 + 1;
            }
        }));
        this.width = width;
        this.depth = depth;
        this.entities = new EntityInfo(this.board);
    }

    engage(board, position, size, reverse = false) {
        if (!board[0]?.length) {
            throw new TypeError("boardの引数は2次元配列を指定してください.\n問題箇所--->engage(board=" + board + "...");
        }
        else if ((position?.length ?? 0) < 2) {
            throw new RangeError("positionの要素数は2つ必要です.\n問題箇所--->engage(board=<object>,position=" + position + "...");
        }
        else if (board[0].length < position[0] + size || board.length < position[1] + size) {
            throw new RangeError("選択範囲がboardからはみ出しています.\n問題箇所--->engage(board=<object>,position=" + position + ",size=" + size + "...");
        }
        let area = new Array(size).fill(0).map(() => [...Array(size)]);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (reverse) {
                    area[i][j] = board[i + position[1]][j + position[0]];
                }
                else {
                    area[i][j] = board[j + position[1]][i + position[0]];
                }
            }
        }
        area = area.map(array => array.reverse());
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (reverse) {
                    board[i + position[1]][j + position[0]] = area[j][i];
                    this.entities.position[area[j][i]] = [i, j];
                    this.entities.update(area[j][i]);
                }
                else {
                    board[i + position[1]][j + position[0]] = area[i][j];
                    this.entities.position[area[i][j]] = [j, i];
                    this.entities.update(area[i][j]);
                }
            }
        }
    }

    decodeBoard() {
        this.board = this.board.map(array => array.map(element => element != 0 ? Math.floor(element / 2) : 0));
    }
}

class EntityInfo {
    position;
    vector;
    direction;
    distance;

    constructor(board) {
        let size = board.length;
        this.position = new Array(size * size);
        this.vector = new Array(size * size);
        this.direction = new Array(size * size);
        this.distance = new Array(size * size);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                this.position[board[i][j]] = [j, i];
            }
        }
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] % 2 == 0) {
                    this.update(board[i][j]);
                }
            }
        }
    }

    update(value) {
        let pair = (value % 2 == 0 ? value + 1 : value - 1);
        this.vector[value] = [this.position[pair][0] - this.position[value][0], -this.position[pair][1] + this.position[value][1]];
        this.vector[pair] = [-this.vector[value][0], -this.vector[value][1]];
        this.distance[value] = Math.abs(this.vector[value][0]) + Math.abs(this.vector[value][1]);
        this.distance[pair] = this.distance[value];
        this.direction[value] = (this.vector[value][0] > 0 ? 2 : (this.vector[value][0] != 0) ? 5 : 1) * (this.vector[value][1] > 0 ? 7 : (this.vector[value][1] != 0) ? 3 : 1);
        this.direction[pair] = (this.vector[pair][0] > 0 ? 2 : (this.vector[pair][0] != 0) ? 5 : 1) * (this.vector[pair][1] > 0 ? 7 : (this.vector[pair][1] != 0) ? 3 : 1);
    }

    matching(value) {
        console.log(this.vector[value]);
        if (this.distance != 1) {
            let center = [...this.position[value]];
            switch (this.direction) {
                case 15:
                    center[0] += 1;
                case 35:

                case 14:

            }
            if (this.direction % 3 == 0) {
                center[0] += this.vector[value][1];
            }
            if (this.direction % 5 == 0) {
                center[0] += this.vector[value][0];
                center[1] -= this.vector[value][0];
            }
            if (this.direction % 7 == 0) {
                center[1] += this.vector[value][1];
            }
            return { center: center, size: this.distance[value] };
        }
        return false;
    }
}

class Garden {
    board = [];
    branch;
    score = 0;
    constructor(board) {
        board.map(array => this.board.push([...array]));
        this.evaluation();
        console.log(this.score);
    }
    addBranch() {
        this.branch.push(new Garden(this.board));
    }
    evaluation() {
        let height = this.board.length;
        let width = this.board[0].length;
        let vertical = new Array(height).fill(0);
        let horizonContinuity = 0;
        let horizonContinuityFlag = true;
        for (let i = 0; i < height; i++) {
            let horizon = 0;
            for (let j = 0; j < width; j++) {
                if (i < (height - 1) && this.board[i][j] == this.board[i + 1][j]) {
                    this.score += 2;
                    horizon += 1;
                    vertical[i] += 2;
                }
                if (j < (width - 1) && this.board[i][j] == this.board[i][j + 1]) {
                    this.score += 2;
                    horizon += 2;
                    vertical[i] += 1;
                }
            }
            if (horizon == width) {
                horizonContinuity++;
            }
            else {
                if (horizonContinuityFlag) {
                    this.score += horizonContinuity;
                    horizonContinuityFlag = false;
                }
                horizonContinuity = 0;
            }
        }
        this.score += horizonContinuity;
        let verticalContinuity = 0;
        let verticalContinuityFlag = true;
        vertical.map(element => {
            if (element == height) {
                verticalContinuity++;
            }
            else {
                if (verticalContinuityFlag) {
                    this.score += verticalContinuity;
                    verticalContinuityFlag = false;
                }
                verticalContinuity = 0;
            }
        });
        this.score += verticalContinuity;
    }
}

module.exports = Lampyrisma;