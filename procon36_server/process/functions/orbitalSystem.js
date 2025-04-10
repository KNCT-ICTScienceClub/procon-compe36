const Procon = require("./proconUtility").Procon;
const ReceiveData = require("./proconUtility").ReceiveData;

class Lampyrisma extends Procon {
    garden;

    width;

    depth;

    constructor(element, width, depth) {
        super(element);
        this.width = width;
        this.depth = depth;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.board[i][j] = new EntityInfo(this.board[i][j], [i, j]);
            }
        }
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
        let area = new Array(size).fill(0).map(() => new Array(size).fill(0));
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
                    board[i + position[1]][j + position[0]].position = [...area[j][i].position];
                    board[i + position[1]][j + position[0]] = area[j][i];
                }
                else {
                    board[i + position[1]][j + position[0]].position = [...area[i][j].position];
                    board[i + position[1]][j + position[0]] = area[i][j];
                }
            }
        }
    }

    get boardValue() {
        let array = new Array(this.size).fill([]);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                array[i].push(this.board.value);
            }
        }
        return array;
    }

    makeProblemFile() {
        let receiveData = new ReceiveData(this.boardValue);
        receiveData.problem.field.entities = receiveData.problem.field.entities.flat();
        fs.writeFileSync(`../informationLog/problem.json`, JSON.stringify(receiveData, undefined, ' '), 'utf-8', (err) => console.error(err));
    }
}

class EntityInfo {
    value;
    position;
    pairPosition
    get vector() {
        this.vector = [pairPosition[0] - position[0], pairPosition[1] - position[1]];
    }
    get direction() {
        this.direction = (this.vector[0] > 0 ? 2 : (this.vector[0] != 0) ? 5 : 1) * (this.vector[1] > 0 ? 7 : (this.vector[1] != 0) ? 3 : 1);
    }
    constructor(value, position) {
        this.value = value;
        this.position = position;
    }
    setPair(pairPosition) {
        this.pairPosition = pairPosition;
    }
    calcCenter(size) {
        let center = undefined;
        if (Math.abs(this.vector[0]) + Math.abs(this.vector[1]) == size) {
            switch (this.direction) {
                case 6:
                    center = [1, -1];
                case 15:
                    center = [0, -1];
                case 14:
                    center = [1, 0];
                default:
                    center = [0, 0];
            }
            if (this.direction % 2 == 0) {
                center[0] += this.position[0];
                center[1] += this.position[1];
            }
            if (this.direction % 3 == 0) {
                center[0] += this.position[0] + this.vector[1];
                center += this.position[1];
            }
            if (this.direction % 5 == 0) {
                center[0] += this.position[0] + this.vector[0];
                center[1] += this.position[1] - this.vector[0];
            }
            if (this.direction % 7 == 0) {
                center[0] += this.position[0]
                center[1] += this.position[1] + this.vector[1];
            }
        }
        return center;
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