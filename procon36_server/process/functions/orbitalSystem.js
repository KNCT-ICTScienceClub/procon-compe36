const Procon = require("./proconUtility");

class Lampyrisma extends Procon {
    garden;

    width;

    depth;

    constructor(element, width, depth) {
        super(element);
        this.width = width;
        this.depth = depth;
        this.garden = new Garden(this.board);
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