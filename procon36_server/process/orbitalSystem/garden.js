const EntityInfo = require("./entityInfo");

class Garden {
    board;
    size;
    entity;
    branch = [];
    score;
    depth;
    index;

    constructor(board, entity, depth, index) {
        this.size = board.length;
        this.board = board.map(array => [...array]);
        this.entity = new EntityInfo();
        this.entity.copyInfo(entity);
        console.log(board);
        this.score = 0;
        this.depth = depth;
        this.index = index;
    }

    extendBranch() {
        let twig = [];
        for (let i = 0; i < this.size * this.size; i++) {
            let result = this.entity.matching(i);
            if (result) {
                if (result.target[0] < 0 || this.size < result.target[0] + result.size || result.target[1] < 0 || this.size < result.target[1] + result.size) {
                    //twig.push(result);
                }
                else {
                    twig.unshift(result);
                }
            }
        }
        console.log(twig);
        twig.map(element => {
            this.engage(element.target, element.size);
            this.branch.push(new Garden(this.board, this.entity, 1, 1));
            this.engage(element.target, element.size, true);
        });
        this.branch.map(element => {
            element.evaluation()
        });
    }

    engage(position, size, reverse = false) {
        if ((position?.length ?? 0) < 2) {
            throw new RangeError("positionの要素数は2つ必要です.\n問題箇所--->engage(board=<object>,position=" + position + "...");
        }
        else if (position[0] < 0 || this.size < position[0] + size || position[1] < 0 || this.size < position[1] + size) {
            throw new RangeError("選択範囲がboardからはみ出しています.\n問題箇所--->engage(board=<object>,position=" + position + ",size=" + size + "...");
        }
        let area = new Array(size).fill(0).map(() => [...Array(size)]);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (reverse) {
                    area[i][j] = this.board[i + position[1]][j + position[0]];
                }
                else {
                    area[i][j] = this.board[j + position[1]][i + position[0]];
                }
            }
        }
        area = area.map(array => array.reverse());
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (reverse) {
                    this.board[i + position[1]][j + position[0]] = area[j][i];
                    this.entity.position[area[j][i]] = [i + position[1], j + position[0]];
                    this.entity.update(area[j][i]);
                }
                else {
                    this.board[i + position[1]][j + position[0]] = area[i][j];
                    this.entity.position[area[i][j]] = [j + position[0], i + position[1]];
                    this.entity.update(area[i][j]);
                }
            }
        }
    }

    evaluation() {
        let continuity = {
            horizon: {
                head: 1,
                end: 1
            },
            vertical: {
                head: 1,
                end: 1
            }
        };
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.entity.distance[this.board[i][j]] == 1) {
                    this.score += 1;
                    if (continuity.horizon.head) {
                        this.score += 1;
                    }
                }
                else if (continuity.horizon.head) {
                    continuity.horizon.head = 2;
                }
                if (continuity.horizon.end) {
                    if (this.entity.distance[this.board[this.size - i - 1][this.size - j - 1]] == 1) {
                        this.score += 1;
                    }
                    else {
                        continuity.horizon.end = 2;
                    }
                }
                if (continuity.vertical.head) {
                    if (this.entity.distance[this.board[j][i]] == 1) {
                        this.score += 1;
                    }
                    else {
                        continuity.vertical.head = 2;
                    }
                }
                if (continuity.vertical.end) {
                    if (this.entity.distance[this.board[this.size - j - 1][this.size - i - 1]] == 1) {
                        this.score += 1;
                    }
                    else {
                        continuity.vertical.end = 2;
                    }
                }
            }
            if (continuity.horizon.head == 2) {
                continuity.horizon.head = 0;
            }
            if (continuity.horizon.end == 2) {
                continuity.horizon.end = 0;
            }
            if (continuity.vertical.head == 2) {
                continuity.vertical.head = 0;
            }
            if (continuity.vertical.end == 2) {
                continuity.vertical.end = 0;
            }
        }
    }
}

module.exports = Garden;