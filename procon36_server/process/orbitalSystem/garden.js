const EntityInfo = require("./entityInfo");

class Garden {
    board;
    size;
    entity;
    branch = [];
    score = 0;
    width;
    depth;
    index = [];
    order;
    continuity;

    constructor(board, entity, order, width, depth) {
        this.size = board.length;
        this.board = board.map(array => [...array]);
        this.entity = new EntityInfo();
        this.entity.copyInfo(entity);
        this.continuity = {
            horizon: new Line(),
            vertical: new Line()
        };
        this.evaluation();
        this.order = order;
        this.width = width;
        this.depth = depth;
    }

    extendBranch(depth) {
        if (depth == 1) {
            this.makeBranch(this.index);
        }
        else {
            this.branch.map(element => element.extendBranch(depth - 1));
        }
    }

    makeBranch(index) {
        let suggest = [];
        for (let i = 0; i < this.size * this.size; i++) {
            if (this.entity.distance[i] != 1) {
                let target = this.entity.matching(i);
                if (0 <= target.position[0] && target.position[0] + target.size <= this.size && 0 <= target.position[1] && target.position[1] + target.size <= this.size) {
                    suggest.push(target);
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
            this.engage(element.position, element.size);
            this.branch.push(new Garden(this.board, this.entity, element, this.width, this.depth + 1));
            this.engage(element.position, element.size, true);
        });
        this.branch = this.branch.filter(element => element).toSorted((a, b) => b.score - a.score).slice(0, this.width);
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
                if (this.continuity.horizon.headFlag) {
                    if (this.entity.distance[this.board[i][j]] == 1) {
                        if (this.continuity.horizon.headFlag == 2) {
                            this.score++;
                        }
                    }
                    else {
                        this.continuity.horizon.headFlag = 2;
                    }
                }
                if (this.continuity.horizon.endFlag) {
                    if (this.entity.distance[this.board[this.size - i - 1][this.size - j - 1]] == 1) {
                        if (this.continuity.horizon.endFlag == 2) {
                            this.score++;
                        }
                    }
                    else {
                        this.continuity.horizon.endFlag = 2;
                    }
                }
                if (this.continuity.vertical.headFlag) {
                    if (this.entity.distance[this.board[j][i]] == 1) {
                        if (this.continuity.vertical.headFlag == 2) {
                            this.score++;
                        }
                    }
                    else {
                        this.continuity.vertical.headFlag = 2;
                    }
                }
                if (this.continuity.vertical.endFlag) {
                    if (this.entity.distance[this.board[this.size - j - 1][this.size - i - 1]] == 1) {
                        if (this.continuity.vertical.endFlag == 2) {
                            this.score++;
                        }
                    }
                    else {
                        this.continuity.vertical.endFlag = 2;
                    }
                }
            }
            switch (this.continuity.horizon.headFlag) {
                case 1:
                    this.continuity.horizon.head++;
                    break;
                case 2:
                    this.continuity.horizon.headFlag = false;
                    break;
            }
            switch (this.continuity.horizon.endFlag) {
                case 1:
                    this.continuity.horizon.end++;
                    break;
                case 2:
                    this.continuity.horizon.endFlag = false;
                    break;
            }
            switch (this.continuity.vertical.headFlag) {
                case 1:
                    this.continuity.vertical.head++;
                    break;
                case 2:
                    this.continuity.vertical.headFlag = false;
                    break;
            }
            switch (this.continuity.vertical.endFlag) {
                case 1:
                    this.continuity.vertical.end++;
                    break;
                case 2:
                    this.continuity.vertical.endFlag = false;
                    break;
            }
        }
        this.score += (this.continuity.horizon.head + this.continuity.horizon.end + this.continuity.vertical.head + this.continuity.vertical.end) * this.size;

    }
}

class Trunk extends Garden {
    extendTrunk(depth) {
        if (depth != 0) {
            this.makeTrunk(this.index);
            this.branch.map(element => element.extendTrunk(depth - 1));
        }
    }

    makeTrunk(index) {
        let suggest = [];
        for (let i = 0; i < this.size * this.size; i++) {
            if (this.entity.distance[i] != 1) {
                let target = this.entity.matching(i);
                if (0 <= target.position[0] && target.position[0] + target.size <= this.size && 0 <= target.position[1] && target.position[1] + target.size <= this.size) {
                    suggest.push(target);
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
            this.engage(element.position, element.size);
            this.branch.push(new Trunk(this.board, this.entity, element, this.width, this.depth + 1));
            this.engage(element.position, element.size, true);
        });
        for (let i = 0; i < this.branch.length; i++) {
            if (this.branch[i].score <= this.score) {
                delete this.branch[i];
            }
        }
        this.branch = this.branch.filter(element => element).toSorted((a, b) => b.score - a.score).slice(0, this.width);
        for (let i = 0; i < this.branch.length; i++) {
            this.branch[i].index = index.slice(1);
            this.branch[i].index.push(i);
        }
    }
}

class Line {
    head = 0;
    end = 0;
    headFlag = 1;
    endFlag = 1;
}

module.exports = Trunk;