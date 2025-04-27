const EntityInfo = require("./entityInfo");

class Garden {
    board;
    size;
    entity;
    branch = [];
    score = 0;
    width;
    index = [];
    order;

    constructor(board, entity, order, width) {
        this.size = board.length;
        this.board = board.map(array => [...array]);
        this.entity = new EntityInfo();
        this.entity.copyInfo(entity);
        this.evaluation();
        this.order = order;
        this.width = width;
    }

    makeTrunk(depth) {
        if (depth != 0) {
            this.makeBranch(this.index, false);
            this.branch.map(element => element.makeTrunk(depth - 1));
        }
    }

    extendBranch(depth) {
        if (depth == 1) {
            this.makeBranch(this.index);
        }
        else {
            this.branch.map(element => element.extendBranch(depth - 1));
        }
    }

    makeBranch(index, adjust = true) {
        let suggest = [];
        for (let i = this.entity.continuity.horizon.head; i < this.size - this.entity.continuity.horizon.end; i++) {
            for (let j = this.entity.continuity.vertical.head; j < this.size - this.entity.continuity.vertical.end; j++) {
                /*if (2 <= i && 2 == j) {
                    if (this.size - this.entity.continuity.horizon.head - this.entity.continuity.horizon.end - 2 - i > 0) {
                        j += this.size - this.entity.continuity.vertical.head - this.entity.continuity.vertical.end - 4 > 0 ? this.size - this.entity.continuity.vertical.head - this.entity.continuity.vertical.end - 4 : 0;
                    }
                }*/
                if (this.entity.distance[this.board[i][j]] != 1) {
                    let target = this.entity.matching(this.board[i][j]);
                    if (0 <= target.position[0] && target.position[0] + target.size <= this.size && 0 <= target.position[1] && target.position[1] + target.size <= this.size) {
                        suggest.push(target);
                    }
                }
            }
        }
        if (adjust) {
            for (let i = this.entity.continuity.horizon.head + 1; i < this.size - this.entity.continuity.horizon.end - 1; i++) {
                for (let j = this.entity.continuity.vertical.head + 1; j < this.size - this.entity.continuity.vertical.end - 1; j++) {
                    if (this.board[i][j] % 2 == 0 && this.entity.distance[this.board[i][j]] == 1) {
                        let target = this.entity.adjusting(this.board[i][j]);
                        if (target.size == 2) {
                            if ([[0, 0], [0, 1], [1, 0], [1, 1]].filter(element => this.entity.distance[this.board[target.position[1] + element[1]][target.position[0] + element[0]]] == 1).length != 4) {
                                suggest.push(target);
                            }
                        }
                        else {
                            suggest.push(target);
                        }
                    }
                }
            }
        }
        suggest.sort((a, b) => a.position[0] == b.position[0] ? (a.position[1] == b.position[1] ? a.size - b.size : a.position[1] - b.position[1]) : a.position[0] - b.position[0]);
        for (let i = 0; i < suggest.length - 1; i++) {
            if (suggest[i].position[0] == suggest[i + 1].position[0] && suggest[i].position[1] == suggest[i + 1].position[1] && suggest[i].size == suggest[i + 1].size) {
                delete suggest[i];
            }
        }
        suggest.map(element => {
            if (element.position[0] != this.order.position[0] || element.position[1] != this.order.position[1] || element.size != this.order.size) {
                this.engage(element.position, element.size);
                this.branch.push(new Garden(this.board, this.entity, element, this.width));
                this.engage(element.position, element.size, true);
            }
        });
        this.branch = this.branch.toSorted((a, b) => b.score - a.score).slice(0, this.width);
        for (let i = 0; i < this.branch.length; i++) {
            this.branch[i].index = index.slice(1);
            this.branch[i].index.push(i);
        }
    }

    pruning(array, depth, goal) {
        if (depth == 1) {
            if (this.branch[0]?.score == this.size * this.size * 5) {
                goal.push(this.branch[0].index);
            }
            else {
                array.push({ index: this.branch[0]?.index[0], score: this.branch[0]?.score });
            }
        }
        else {
            this.branch.map(element => element.pruning(array, depth - 1, goal));
        }
    }

    engage(position, size, reverse = false) {
        if ((position?.length ?? 0) < 2) {
            throw new RangeError("positionの要素数は2つ必要です.\n問題箇所--->engage(board=<object>,position=" + position + "...");
        }
        else if (position[0] < 0 || this.size < position[0] + size || position[1] < 0 || this.size < position[1] + size) {
            throw new RangeError("選択範囲がboardからはみ出しています.\n問題箇所--->engage(board=<object>,position=" + position + ",size=" + size + "...");
        }
        else if (size < 2) {
            throw new RangeError("sizeは2以上の値を選択してください.\n問題箇所--->engage(board=<object>,position=...,size=" + size + "...");
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
                    this.entity.position[area[j][i]] = [j + position[0], i + position[1]];
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
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.entity.distance[this.board[i][j]] == 1) {
                    this.score++;
                }
                if (this.entity.continuity.horizon.headFlag) {
                    if (this.entity.distance[this.board[i][j]] == 1) {
                        if (this.entity.continuity.horizon.headFlag == 2) {
                            this.score++;
                        }
                    }
                    else {
                        this.entity.continuity.horizon.headFlag = 2;
                    }
                }
                if (this.entity.continuity.horizon.endFlag) {
                    if (this.entity.distance[this.board[this.size - i - 1][this.size - j - 1]] == 1) {
                        if (this.entity.continuity.horizon.endFlag == 2) {
                            this.score++;
                        }
                    }
                    else {
                        this.entity.continuity.horizon.endFlag = 2;
                    }
                }
                if (this.entity.continuity.vertical.headFlag) {
                    if (this.entity.distance[this.board[j][i]] == 1) {
                        if (this.entity.continuity.vertical.headFlag == 2) {
                            this.score++;
                        }
                    }
                    else {
                        this.entity.continuity.vertical.headFlag = 2;
                    }
                }
                if (this.entity.continuity.vertical.endFlag) {
                    if (this.entity.distance[this.board[this.size - j - 1][this.size - i - 1]] == 1) {
                        if (this.entity.continuity.vertical.endFlag == 2) {
                            this.score++;
                        }
                    }
                    else {
                        this.entity.continuity.vertical.endFlag = 2;
                    }
                }
            }
            switch (this.entity.continuity.horizon.headFlag) {
                case 1:
                    this.entity.continuity.horizon.head++;
                    break;
                case 2:
                    this.entity.continuity.horizon.headFlag = false;
                    break;
            }
            switch (this.entity.continuity.horizon.endFlag) {
                case 1:
                    this.entity.continuity.horizon.end++;
                    break;
                case 2:
                    this.entity.continuity.horizon.endFlag = false;
                    break;
            }
            switch (this.entity.continuity.vertical.headFlag) {
                case 1:
                    this.entity.continuity.vertical.head++;
                    break;
                case 2:
                    this.entity.continuity.vertical.headFlag = false;
                    break;
            }
            switch (this.entity.continuity.vertical.endFlag) {
                case 1:
                    this.entity.continuity.vertical.end++;
                    break;
                case 2:
                    this.entity.continuity.vertical.endFlag = false;
                    break;
            }
        }
        this.score += (this.entity.continuity.horizon.head + this.entity.continuity.horizon.end + this.entity.continuity.vertical.head + this.entity.continuity.vertical.end) * this.size;
    }
}

module.exports = Garden;