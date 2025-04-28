const EntityInfo = require("./entityInfo");

class Garden {
    board;
    size;
    entity;
    branch = [];
    score = new Score();
    width;
    index = [];
    order;

    constructor(board, entity, order, width) {
        this.size = board.length;
        this.board = board.map(array => [...array]);
        this.entity = new EntityInfo();
        this.entity.copyInfo(entity);
        this.evaluation();
        this.entity.score=this.score;
        this.order = order;
        this.width = width;
    }

    pruning(array, depth, goal) {
        if (depth == 1) {
            if (this.branch[0]?.score.compound == this.size * this.size * 5) {
                goal.push(this.branch[0].index);
            }
            else {
                array.push({ index: this.branch[0]?.index[0], score: this.branch[0]?.score.compound });
            }
        }
        else {
            this.branch.map(element => element.pruning(array, depth - 1, goal));
        }
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
        this.matchSuggest(suggest,2);
        if (adjust) {
            this.adjustSuggest(suggest);
        }
        suggest.sort((a, b) => a.position[0] == b.position[0] ? (a.position[1] == b.position[1] ? a.size - b.size : a.position[1] - b.position[1]) : a.position[0] - b.position[0]);
        for (let i = 0; i < suggest.length - 1; i++) {
            if (suggest[i].position[0] == suggest[i + 1].position[0] && suggest[i].position[1] == suggest[i + 1].position[1] && suggest[i].size == suggest[i + 1].size) {
                delete suggest[i];
            }
        }
        suggest.map(element => {
            this.engage(element.position, element.size);
            let twig = new Garden(this.board, this.entity, element, this.width);
            if (element.type == 2) {
                if (twig.score.compound > this.score.compound) {
                    this.branch.push(twig);
                }
            }
            else {
                this.branch.push(twig);
            }
            this.engage(element.position, element.size, true);
        });
        this.branch = this.branch.toSorted((a, b) => b.score.compound - a.score.compound).slice(0, this.width);
        for (let i = 0; i < this.branch.length; i++) {
            this.branch[i].index = index.slice(1);
            this.branch[i].index.push(i);
        }
    }

    matchSuggest(suggest,limit = this.size) {
        for (let i = this.score.horizon.headLine; i < this.size - this.score.horizon.endLine; i++) {
            for (let j = this.score.vertical.headLine; j < this.size - this.score.vertical.endLine; j++) {
                if (limit <= i && limit == j) {
                    if (this.size - this.score.horizon.headLine - this.score.horizon.endLine - limit - i > 0) {
                        j += this.size - this.score.vertical.headLine -this.score.vertical.endLine - limit * 2 > 0 ? this.size - this.score.vertical.headLine -this.score.vertical.endLine - limit * 2 : 0;
                    }
                }
                if (this.entity.distance[this.board[i][j]] != 1) {
                    let target = this.entity.matching(this.board[i][j]);
                    if (0 <= target.position[0] && target.position[0] + target.size <= this.size && 0 <= target.position[1] && target.position[1] + target.size <= this.size) {
                        suggest.push(target);
                    }
                }
            }
        }
    }

    adjustSuggest(suggest) {
        for (let i = this.score.horizon.headLine + 1; i < this.size - this.score.horizon.endLine - 1; i++) {
            for (let j = this.score.vertical.headLine + 1; j < this.size - this.score.vertical.endLine - 1; j++) {
                if (this.entity.distance[this.board[i][j]] == 1) {
                    suggest.push(this.entity.adjusting(this.board[i][j]));
                }
            }
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
                    this.score.match++;
                }
                if (this.score.horizon.headFlag) {
                    if (this.entity.distance[this.board[i][j]] == 1) {
                        this.score.horizon.head++;
                    }
                    else {
                        this.score.horizon.headFlag = 2;
                    }
                }
                if (this.score.horizon.endFlag) {
                    if (this.entity.distance[this.board[this.size - i - 1][this.size - j - 1]] == 1) {
                        this.score.horizon.end++;
                    }
                    else {
                        this.score.horizon.endFlag = 2;
                    }
                }
                if (this.score.vertical.headFlag) {
                    if (this.entity.distance[this.board[j][i]] == 1) {
                        this.score.vertical.head++;
                    }
                    else {
                        this.score.vertical.headFlag = 2;
                    }
                }
                if (this.score.vertical.endFlag) {
                    if (this.entity.distance[this.board[this.size - j - 1][this.size - i - 1]] == 1) {
                        this.score.vertical.end++;
                    }
                    else {
                        this.score.vertical.endFlag = 2;
                    }
                }
            }
            if (this.score.horizon.headFlag == 2) {
                this.score.horizon.headFlag = false;
            }
            if (this.score.horizon.endFlag == 2) {
                this.score.horizon.endFlag = false;
            }
            if (this.score.vertical.headFlag == 2) {
                this.score.vertical.headFlag = false;
            }
            if (this.score.vertical.endFlag == 2) {
                this.score.vertical.endFlag = false;
            }
        }
        this.score.horizon.headLine = Math.floor(this.score.horizon.head / this.size);
        this.score.horizon.endLine = Math.floor(this.score.horizon.end / this.size);
        this.score.vertical.headLine = Math.floor(this.score.vertical.head / this.size);
        this.score.vertical.endLine = Math.floor(this.score.vertical.end / this.size);
        this.score.compound = this.score.match + this.score.horizon.head + this.score.horizon.end + this.score.vertical.head + this.score.vertical.end;
    }
}

class Score {
    match = 0;
    horizon = {
        head: 0,
        headLine: 0,
        headFlag: 1,
        end: 0,
        endLine: 0,
        endFlag: 1
    };
    vertical = {
        head: 0,
        headLine: 0,
        headFlag: 1,
        end: 0,
        endLine: 0,
        endFlag: 1
    };
    compound;
}

module.exports = Garden;