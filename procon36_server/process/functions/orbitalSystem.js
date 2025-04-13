const Procon = require("./proconUtility").Procon;
const ReceiveData = require("./proconUtility").ReceiveData;

class Lampyrisma extends Procon {
    garden;

    position;

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
        this.position = [...Array(this.size * this.size)];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.position[this.board[i][j]] = [j, i];
            }
        }
    }

    calcCenter(value) {
        let vector = [this.position[value % 2 == 0 ? value + 1 : value - 1][0] - this.position[value][0], -this.position[value % 2 == 0 ? value + 1 : value - 1][1] + this.position[value][1]];
        if (Math.abs(vector[0]) > 1 || Math.abs(vector[1]) > 1 || (Math.abs(vector[0]) == 1 && Math.abs(vector[1]) == 1)) {
            let center=this.position[value];
            let direction = (vector[0] > 0 ? 2 : (vector[0] != 0) ? 5 : 1) * (vector[1] > 0 ? 7 : (vector[1] != 0) ? 3 : 1);
            console.log(vector);
            console.log(direction);
            switch (direction) {
                case 15:
                    center[0] += 1;
                case 35:
                    center += [0,0];
                case 14:
                    center += [0, 0];
            }
            if (direction % 2 == 0) {
                center[0] += this.position[value][0];
                center[1] += this.position[value][1];
            }
            if (direction % 3 == 0) {
                center[0] += this.position[value][0] + vector[1];
                center[1] += this.position[value][1];
            }
            if (direction % 5 == 0) {
                center[0] += this.position[value][0] + vector[0];
                center[1] += this.position[value][1] - vector[0];
            }
            if (direction % 7 == 0) {
                center[0] += this.position[value][0]
                center[1] += this.position[value][1] + vector[1];
            }
            return { center: center, size: Math.abs(vector[0]) + Math.abs(vector[1]) };
        }
        return false;
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
                    this.position[area[j][i]] = [j, i];
                }
                else {
                    board[i + position[1]][j + position[0]] = area[i][j];
                    this.position[area[i][j]] = [i, j];
                }
            }
        }
    }

    decodeBoard() {
        this.board = this.board.map(array => array.map(element => Math.floor(element / 2)));
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