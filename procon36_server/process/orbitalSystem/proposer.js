const { Order } = require("./satellite");
const EntityInfo = require("./entityInfo");

class Proposer extends EntityInfo {
    /**
     * 次ターンのみに着目して、ペアを生成できる操作を列挙する関数
     * @param {number[][]} board 現在のボード
     * @param {Order[]} suggest 列挙した操作を格納した配列
     * @param {number} limit 枠の太さ
     */
    matchSuggest(board, suggest, limit) {
        //全て揃っている列は操作する必要がないので無視してfor文を回す
        for (let i = this.score.horizon.head.line; i < this.size - this.score.horizon.end.line; i++) {
            for (let j = this.score.vertical.head.line; j < this.size - this.score.vertical.end.line; j++) {
                //この条件式を発動させると枠のような形で位置が指定される
                if (limit <= i && limit == j) {
                    if (this.size - this.score.horizon.head.line - this.score.horizon.end.line - limit - i > 0) {
                        j += this.size - this.score.vertical.head.line - this.score.vertical.end.line - limit * 2 > 0 ? this.size - this.score.vertical.head.line - this.score.vertical.end.line - limit * 2 : 0;
                    }
                }
                //ペアになっていないエンティティに対してサジェストを出す
                if (this.distance[board[i][j]] != 1) {
                    let order = this.matching(board[i][j] % 2 == 0 ? board[i][j] + 1 : board[i][j] - 1);
                    //位置によっては指定した場所がボードを飛び出すことがあるので条件式でふるいにかける
                    if (0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                        suggest.push(order);
                    }
                }
            }
        }
    }

    /**
     * ペアになっていない要素をボードの端から排除する操作を列挙する関数
     * @param {number[][]} board 現在のボード
     * @param {Order[]} suggest 列挙した操作を格納した配列
     */
    removalSuggest(board, suggest) {
        for (let i = 0; i < this.size - this.score.vertical.head.line - this.score.vertical.end.line - 1; i++) {
            for (let j = 2; j <= i + 2 && j < this.size - this.score.horizon.head.line - this.score.horizon.end.line; j++) {
                if (this.distance[board[this.score.horizon.head.line][i + 1 + this.score.vertical.head.line]] != 1) {
                    suggest.push(this.setOrder([i + 1 + this.score.vertical.head.line, this.score.horizon.head.line], 3, j));
                }
                if (this.distance[board[this.size - this.score.horizon.end.line - 1][this.size - i - this.score.vertical.end.line - 2]] != 1) {
                    suggest.push(this.setOrder([this.size - i - this.score.vertical.end.line - 2, this.size - this.score.horizon.end.line - 1], 7, j));
                }
            }
        }
        for (let i = 0; i < this.size - this.score.horizon.head.line - this.score.horizon.end.line - 1; i++) {
            for (let j = 2; j <= i + 2 && j < this.size - this.score.vertical.head.line - this.score.vertical.end.line; j++) {
                if (this.distance[board[i + 1 + this.score.horizon.head.line][this.size - this.score.vertical.end.line - 1]] != 1) {
                    suggest.push(this.setOrder([this.size - this.score.vertical.end.line - 1, i + 1 + this.score.horizon.head.line], 5, j));
                }
                if (this.distance[board[this.size - i - this.score.horizon.end.line - 2][this.score.vertical.head.line]] != 1) {
                    suggest.push(this.setOrder([this.score.vertical.head.line, this.size - i - this.score.horizon.end.line - 2], 2, j));
                }
            }
        }
    }

    /**
     * ペアになっている要素の塊を端に寄せる操作を列挙する関数
     * @param {number[][]} board 現在のボード
     * @param {Order[]} suggest 列挙した操作を格納した配列
     */
    adjustSuggest(board, suggest) {
        //全て揃っている列は操作する必要がないので無視してfor文を回す
        for (let i = this.score.horizon.head.line + 1; i < this.size - this.score.horizon.end.line - 1; i++) {
            for (let j = this.score.vertical.head.line + 1; j < this.size - this.score.vertical.end.line - 1; j++) {
                //ペアになっているエンティティに対してサジェストを出す
                if (this.distance[board[i][j]] == 1) {
                    let order = this.adjusting(board[i][j]);
                    if (order) {
                        suggest.push(order);
                    }
                }
            }
        }
    }

    setStatus(board) {
        const MinimumElements = 60;
        if ((this.size - this.score.horizon.head.line - this.score.horizon.end.line) * (this.size - this.score.vertical.head.line - this.score.vertical.end.line) > MinimumElements) {
            if (this.distance[board.at(this.score.horizon.head.line).at(this.score.vertical.head.line)] != 1) {
                this.status.position.left = this.position[board.at(this.score.horizon.head.line).at(this.score.vertical.head.line)];
                this.status.addFlag(this.status.Corner);
            }
            if (this.distance[board.at(this.score.horizon.head.line).at(-this.score.vertical.end.line - 1)] != 1) {
                this.status.position.top = this.position[board.at(this.score.horizon.head.line).at(-this.score.vertical.end.line - 1)];
                this.status.addFlag(this.status.Corner);
            }
            if (this.distance[board.at(-this.score.horizon.end.line - 1).at(this.score.vertical.head.line)] != 1) {
                this.status.position.bottom = this.position[board.at(-this.score.horizon.end.line - 1).at(this.score.vertical.head.line)];
                this.status.addFlag(this.status.Corner);
            }
            if (this.distance[board.at(-this.score.horizon.end.line - 1).at(-this.score.vertical.end.line - 1)] != 1) {
                this.status.position.right = this.position[board.at(-this.score.horizon.end.line - 1).at(-this.score.vertical.end.line - 1)];
                this.status.addFlag(this.status.Corner);
            }
        }
        if (!this.status.hasFlag(this.status.Corner)) {
            this.status.addFlag(this.status.Normal);
        }
        if (this.distanceSum < 1900) {
            this.status.addFlag(this.status.Middle);
        }
        if ((this.size - this.score.horizon.head.line - this.score.horizon.end.line) * (this.size - this.score.vertical.head.line - this.score.vertical.end.line) < 80) {
            this.status.addFlag(this.status.Finish);
        }
    }

    /**
     * 四つ角にペアを生成する
     * @param {number[][]} board 現在のボード
     * @param {Order[]} suggest 列挙した操作を格納した配列
     */
    cornerSuggest(board, suggest) {
        if (this.status.position.top.length != 0) {
            board.at(this.score.horizon.head.line).slice(this.score.vertical.head.line + 2, -this.score.vertical.end.line - 1).forEach(element => {
                let order = new Order([0, 0], 0, 1);
                if (this.distance[element] == 1) {
                    order = this.setOrder(this.position[element], 2, this.size - this.score.vertical.end.line - this.position[element][0]);
                    //ペアが繋がっている方向によって位置が微調整される
                    if (this.direction[element] == 5) {
                        order.size++;
                        order.position[0]--;
                    }
                }
                else {
                    order = this.matching(element % 2 == 0 ? element + 1 : element - 1);
                }
                if (order.direction != 7 && 0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                    suggest.push(order);
                }
            });
        }
        if (this.status.position.bottom.length != 0) {
            board.at(-this.score.horizon.end.line - 1).slice(this.score.vertical.head.line + 1, -this.score.vertical.end.line - 2).forEach(element => {
                let order = new Order([0, 0], 0, 1);
                if (this.distance[element] == 1) {
                    order = this.setOrder(this.position[element], 5, this.position[element][0] - this.score.vertical.head.line + 1);
                    //ペアが繋がっている方向によって位置が微調整される
                    if (this.direction[element] == 2) {
                        order.size++;
                        order.position[1]--;
                    }
                }
                else {
                    order = this.matching(element % 2 == 0 ? element + 1 : element - 1);
                }
                if (order.direction != 3 && 0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                    suggest.push(order);
                }
            });
        }
        if (this.status.position.left.length != 0) {
            board.slice(this.score.horizon.head.line + 1, -this.score.horizon.end.line - 2).map(array => array.at(this.score.vertical.head.line)).forEach(element => {
                let order = new Order([0, 0], 0, 1);
                if (this.distance[element] == 1) {
                    order = this.setOrder(this.position[element], 7, this.position[element][1] - this.score.horizon.head.line + 1);
                    //ペアが繋がっている方向によって位置が微調整される
                    if (this.direction[element] == 3) {
                        order.size++;
                    }
                }
                else {
                    order = this.matching(element % 2 == 0 ? element + 1 : element - 1);
                }
                if (order.direction != 5 && 0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                    suggest.push(order);
                }
            });
        }
        if (this.status.position.right.length != 0) {
            board.slice(this.score.horizon.head.line + 2, -this.score.horizon.end.line - 1).map(array => array.at(-this.score.vertical.end.line - 1)).forEach(element => {
                let order = new Order([0, 0], 0, 1);
                if (this.distance[element] == 1) {
                    order = this.setOrder(this.position[element], 3, this.size - this.score.horizon.end.line - this.position[element][1]);
                    //ペアが繋がっている方向によって位置が微調整される
                    if (this.direction[element] == 7) {
                        order.size++;
                        order.position[0]--;
                        order.position[1]--;
                    }
                }
                else {
                    order = this.matching(element % 2 == 0 ? element + 1 : element - 1);
                }
                if (order.direction != 2 && 0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                    suggest.push(order);
                }
            });
        }
    }
}

module.exports = Proposer;