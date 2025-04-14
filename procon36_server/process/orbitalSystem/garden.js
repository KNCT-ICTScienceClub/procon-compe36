class Garden {
    board;
    branch;
    entities;
    score;
    depth;
    index;

    constructor(board, entities, depth, index) {
        this.board = board;
        this.score = 0;
        this.depth = depth;
        this.index = index;
        this.entities = entities;
    }

    addBranch() {
        this.branch.push(new Garden(this.board, this.entities));
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

module.exports = Garden;