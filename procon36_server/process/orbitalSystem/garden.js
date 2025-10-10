const EntityInfo = require("./entityInfo");
const { LeafInfo, Score, Order, Status } = require("./satellite");

class BranchBase {
    /**
     * 現在のボード
     * @type {number[][]}
     */
    board;
    /**
     * ボードのサイズ
     * @type {number}
     */
    size;
    /**
     * 各エンティティの情報が格納された配列
     * @type {EntityInfo}
     */
    entity;
    /**
     * スコア
     * @type {Score}
     */
    score;
    /**
     * ノードの部分
     * @type {Garden[]}
     */
    branch;
    /**
     * 探索の幅
     * @type {number}
     */
    width;
    /**
     * 操作手順
     * @type {Order}
     */
    order;
    /**
     * このノードの現在地を示すインデックス
     * @type {number[]}
     */
    index;
    status;

    /**
     * @param {number[][]} board
     * @param {number} width
     */
    constructor(board, width) {
        this.size = board.length;
        this.board = board.map(array => [...array]);
        this.entity = new EntityInfo();
        this.score = new Score();
        this.status = new Status();
        this.width = width;
        this.index = [];
    }

    /**
     * 葉の情報を抜き出し剪定を行う
     * @param {LeafInfo[]} leaves 葉の情報
     * @param {number} depth 深さ
     */
    //最初に指定したdepthの回数だけ下の階層へ潜る
    pruning(leaves, depth) {
        //指定した深さまで潜ると実行される
        if (depth == 1) {
            //葉の情報を書き込む
            if (this.branch.length != 0) {
                if (this.branch[0].score.compound > leaves[0].score) {
                    /*
                    三項演算子
                    完成盤面であった場合はそのノードに到達するまでの全てのインデックスが渡される
                    そうでない時はその葉が根に直接繋がっているノードのどれに属しているかを示すインデックスを渡す
                    */
                    //スコアが現在の葉よりも高かった場合葉を上書きする
                    //下のspliceはleaves=[new LeafInfo()]とほとんど等しいが左の場合だと非破壊であるためメソッドの外に値を渡せない
                    leaves.splice(0, leaves.length, new LeafInfo(this.branch[0].score.match == this.size * this.size ? this.branch[0].index : this.branch[0].index[0], this.branch[0].score.compound));
                }
                else if (this.branch[0].score.compound == leaves[0].score) {
                    //スコアが同じであった場合葉に情報を追記する
                    leaves.push(new LeafInfo(this.branch[0].index[0], this.branch[0].score.compound));
                }
            }
        }
        //指定した深さまで潜れていない場合再帰的に関数を実行し一つ下の階層に潜る
        else {
            this.branch.forEach(element => element.pruning(leaves, depth - 1));
        }
    }

    /**
     * 指定した深さまで再帰的に枝を生成する
     * @param {number} depth
     */
    makeTrunk(depth) {
        if (depth != 0) {
            this.extendBranch(this.index);
            this.branch.forEach(element => element.makeTrunk(depth - 1));
        }
    }

    /**
     * 全ての葉の部分から枝を生成する
     * @param {number} depth 
     */
    makeBranch(depth) {
        //指定した深さまで潜ると実行される
        if (depth == 1) {
            this.extendBranch(this.index);
        }
        //指定した深さまで潜れていない場合再帰的に関数を実行し一つ下の階層に潜る
        else {
            this.branch.forEach(element => element.makeBranch(depth - 1));
        }
    }

    /**
     * 現在の葉からノードを作成する
     * @param {number[]} index 
     * @param {boolean} adjust 
     */
    extendBranch(index) {
        let suggest = [];
        if (this.status.hasFlag(this.status.Corner)) {
            this.cornerSuggest(suggest);
            if (suggest.length == 0) {
                this.adjustSuggest(suggest);
            }
        }
        if (this.status.hasFlag(this.status.Normal) || suggest.length == 0) {
            this.removalSuggest(suggest)
            this.matchSuggest(suggest, 5);
        }
        //サジェストをxとyに関して並び替えを行いサイズに関しても並び替えを行う
        suggest.sort((a, b) => a.position[0] == b.position[0] ? (a.position[1] == b.position[1] ? a.size - b.size : a.position[1] - b.position[1]) : a.position[0] - b.position[0]);
        for (let i = 0; i < suggest.length - 1; i++) {
            //並び替えを行ったことにより現在の要素と次の要素が等しかった場合重複した操作となるので削除する
            if (suggest[i].position[0] == suggest[i + 1].position[0] && suggest[i].position[1] == suggest[i + 1].position[1] && suggest[i].size == suggest[i + 1].size) {
                delete suggest[i];
            }
        }
        this.forecast(suggest);
        //インデックスを更新する
        //インデックスの左側をカットして末尾に新しく指定したインデックスを追加する
        this.branch.forEach((element, i) => element.index = index.slice(1).concat(i));
    }

    /**
     * その手のスコアの予測を行い上位のスコアの枝を返す
     * @param {Order[]} suggest 
     */
    forecast(suggest) {
        this.branch = Array(this.width).fill({ score: new Score(), entity: { distanceSum: Infinity } });
        suggest.forEach(element => {
            //操作したボードで候補を作る
            let twig = new Garden(this.board, this.entity, element, this.width);
            if (this.status.hasFlag(this.status.Normal)) {
                //adjustingによるサジェストだった場合ループを防ぐため評価が上昇するものでないと受け付けない
                if (element.type == 1 || (element.type == 2 && twig.score.compound > this.score.compound)) {
                    if (twig.entity.distanceSum < this.branch[0].entity.distanceSum) {
                        twig.status.addFlag(this.status.Short);
                        this.branch[0] = twig;
                    }
                    else {
                        this.branch = this.branch.toSpliced(this.branch.filter(element => element.score.compound > twig.score.compound).length + 1, 0, twig).slice(0, this.width);
                    }
                }
            }
            if (this.status.hasFlag(this.status.Corner)) {
                this.branch = this.branch.toSpliced(this.branch.filter(element => element.entity.distanceSum < twig.entity.distanceSum).length, 0, twig).slice(0, this.width);
            }
        });
        this.branch = this.branch.filter(element => element?.size).toSorted((a, b) => b.score.compound - a.score.compound);
    }

    /**
     * 次ターンのみに着目して、ペアを生成できる操作を列挙する関数
     * @param {Order[]} suggest 列挙した操作を格納した配列
     * @param {number} limit 枠の太さ
     */
    matchSuggest(suggest, limit) {
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
                if (this.entity.distance[this.board[i][j]] != 1) {
                    let order = this.entity.matching(this.board[i][j] % 2 == 0 ? this.board[i][j] + 1 : this.board[i][j] - 1);
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
     * @param {Order[]} suggest 列挙した操作を格納した配列
     */
    removalSuggest(suggest) {
        for (let i = 0; i < this.size - this.score.vertical.head.line - this.score.vertical.end.line - 1; i++) {
            for (let j = 2; j <= i + 2 && j < this.size - this.score.horizon.head.line - this.score.horizon.end.line; j++) {
                if (this.entity.distance[this.board[this.score.horizon.head.line][i + 1 + this.score.vertical.head.line]] != 1) {
                    suggest.push(this.entity.setOrder([i + 1 + this.score.vertical.head.line, this.score.horizon.head.line], 3, j));
                }
                if (this.entity.distance[this.board[this.size - this.score.horizon.end.line - 1][this.size - i - this.score.vertical.end.line - 2]] != 1) {
                    suggest.push(this.entity.setOrder([this.size - i - this.score.vertical.end.line - 2, this.size - this.score.horizon.end.line - 1], 7, j));
                }
            }
        }
        for (let i = 0; i < this.size - this.score.horizon.head.line - this.score.horizon.end.line - 1; i++) {
            for (let j = 2; j <= i + 2 && j < this.size - this.score.vertical.head.line - this.score.vertical.end.line; j++) {
                if (this.entity.distance[this.board[i + 1 + this.score.horizon.head.line][this.size - this.score.vertical.end.line - 1]] != 1) {
                    suggest.push(this.entity.setOrder([this.size - this.score.vertical.end.line - 1, i + 1 + this.score.horizon.head.line], 5, j));
                }
                if (this.entity.distance[this.board[this.size - i - this.score.horizon.end.line - 2][this.score.vertical.head.line]] != 1) {
                    suggest.push(this.entity.setOrder([this.score.vertical.head.line, this.size - i - this.score.horizon.end.line - 2], 2, j));
                }
            }
        }
    }

    cornerSuggest(suggest) {
        if (this.status.position.top.length != 0) {
            this.board.at(this.score.horizon.head.line).slice(this.score.vertical.head.line + 2, -this.score.vertical.end.line - 1).forEach(element => {
                let order = new Order([0, 0], 0, 1);
                if (this.entity.distance[element] == 1) {
                    order = this.entity.setOrder(this.entity.position[element], 2, this.size - this.score.vertical.end.line - this.entity.position[element][0]);
                    //ペアが繋がっている方向によって位置が微調整される
                    if (this.entity.direction[element] == 5) {
                        order.size++;
                        order.position[0]--;
                    }
                }
                else {
                    order = this.entity.matching(element % 2 == 0 ? element + 1 : element - 1);
                }
                if (order.direction != 7 && 0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                    suggest.push(order);
                }
            });
        }
        if (this.status.position.bottom.length != 0) {
            this.board.at(-this.score.horizon.end.line - 1).slice(this.score.vertical.head.line + 1, -this.score.vertical.end.line - 2).forEach(element => {
                let order = new Order([0, 0], 0, 1);
                if (this.entity.distance[element] == 1) {
                    order = this.entity.setOrder(this.entity.position[element], 5, this.entity.position[element][0] - this.score.vertical.head.line + 1);
                    //ペアが繋がっている方向によって位置が微調整される
                    if (this.entity.direction[element] == 2) {
                        order.size++;
                        order.position[1]--;
                    }
                }
                else {
                    order = this.entity.matching(element % 2 == 0 ? element + 1 : element - 1);
                }
                if (order.direction != 3 && 0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                    suggest.push(order);
                }
            });
        }
        if (this.status.position.left.length != 0) {
            this.board.slice(this.score.horizon.head.line + 1, -this.score.horizon.end.line - 2).map(array => array.at(this.score.vertical.head.line)).forEach(element => {
                let order = new Order([0, 0], 0, 1);
                if (this.entity.distance[element] == 1) {
                    order = this.entity.setOrder(this.entity.position[element], 7, this.entity.position[element][1] - this.score.horizon.head.line + 1);
                    //ペアが繋がっている方向によって位置が微調整される
                    if (this.entity.direction[element] == 3) {
                        order.size++;
                    }
                }
                else {
                    order = this.entity.matching(element % 2 == 0 ? element + 1 : element - 1);
                }
                if (order.direction != 5 && 0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                    suggest.push(order);
                }
            });
        }
        if (this.status.position.right.length != 0) {
            this.board.slice(this.score.horizon.head.line + 2, -this.score.horizon.end.line - 1).map(array => array.at(-this.score.vertical.end.line - 1)).forEach(element => {
                let order = new Order([0, 0], 0, 1);
                if (this.entity.distance[element] == 1) {
                    order = this.entity.setOrder(this.entity.position[element], 3, this.size - this.score.horizon.end.line - this.entity.position[element][1]);
                    //ペアが繋がっている方向によって位置が微調整される
                    if (this.entity.direction[element] == 7) {
                        order.size++;
                        order.position[0]--;
                        order.position[1]--;
                    }
                }
                else {
                    order = this.entity.matching(element % 2 == 0 ? element + 1 : element - 1);
                }
                if (order.direction != 2 && 0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                    suggest.push(order);
                }
            });
        }
    }

    /**
     * ペアになっている要素の塊を端に寄せる操作を列挙する関数
     * @param {Order[]} suggest 列挙した操作を格納した配列
     */
    adjustSuggest(suggest) {
        //全て揃っている列は操作する必要がないので無視してfor文を回す
        for (let i = this.score.horizon.head.line + 1; i < this.size - this.score.horizon.end.line - 1; i++) {
            for (let j = this.score.vertical.head.line + 1; j < this.size - this.score.vertical.end.line - 1; j++) {
                //ペアになっているエンティティに対してサジェストを出す
                if (this.entity.distance[this.board[i][j]] == 1) {
                    let order = this.entity.adjusting(this.board[i][j]);
                    if (order) {
                        suggest.push(order);
                    }
                }
            }
        }
    }

    /**
     * 現在のボードを参照して「導き」を行う
     * @param {number[]} position 園の左上の座標[x,y]
     * @param {number} size 園のサイズ
     */
    engage(position, size) {
        let area = new Array(size).fill(0).map(() => [...Array(size)]);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                area[i][j] = this.board[j + position[1]][i + position[0]];
            }
        }
        area = area.map(array => array.reverse());
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                this.board[i + position[1]][j + position[0]] = area[i][j];
                this.entity.position[area[i][j]] = [j + position[0], i + position[1]];
                this.entity.update(area[i][j]);
            }
        }
    }

    /**
     * scoreの数値を設定する関数
     */
    evaluation() {
        this.lineEvaluation();
        this.score.match = this.size * this.size - (this.size - this.score.vertical.head.line - this.score.vertical.end.line) * (this.size - this.score.horizon.head.line - this.score.horizon.end.line);
        this.matchCount(24);
        this.setStatus();
        this.score.compound = this.score.horizon.head.value + this.score.horizon.end.value + this.score.vertical.head.value + this.score.vertical.end.value;
    }

    lineEvaluation() {
        const addScore = (index, line, side) => {
            if (line.flag && line.flag[side]) {
                if (this.entity.distance[this.board.at(index[0]).at(index[1])] == 1) {
                    line.value++;
                }
                else {
                    line.flag[side] = false;
                }
            }
        }
        const setLine = (line) => {
            if (line.flag[0]) {
                line.line++;
            }
            else {
                line.flag = false;
            }
        }
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                addScore([i, j], this.score.horizon.head, 0);
                addScore([i, -j - 1], this.score.horizon.head, 1);
                addScore([-i - 1, j], this.score.horizon.end, 0);
                addScore([-i - 1, -j - 1], this.score.horizon.end, 1);
                addScore([j, i], this.score.vertical.head, 0);
                addScore([-j - 1, i], this.score.vertical.head, 1);
                addScore([j, -i - 1], this.score.vertical.end, 0);
                addScore([-j - 1, -i - 1], this.score.vertical.end, 1);
            }
            setLine(this.score.horizon.head);
            setLine(this.score.horizon.end);
            setLine(this.score.vertical.head);
            setLine(this.score.vertical.end);
            if (!this.score.horizon.head.flag && !this.score.horizon.end.flag && !this.score.vertical.head.flag && !this.score.vertical.end.flag) {
                break;
            }
            if (this.size == this.score.horizon.head.line + this.score.horizon.end.line && this.size == this.score.vertical.head.line + this.score.vertical.end.line) {
                break;
            }
        }
    }

    matchCount(limit) {
        //この条件式を発動させると枠のような形で位置が指定される
        //全て揃っている列は操作する必要がないので無視してfor文を回す
        for (let i = this.score.horizon.head.line; i < this.size - this.score.horizon.end.line; i++) {
            for (let j = this.score.vertical.head.line; j < this.size - this.score.vertical.end.line; j++) {
                //この条件式を発動させると枠のような形で位置が指定される
                if (limit <= i && limit == j) {
                    if (this.size - this.score.horizon.head.line - this.score.horizon.end.line - limit - i > 0) {
                        j += this.size - this.score.vertical.head.line - this.score.vertical.end.line - limit * 2 > 0 ? this.size - this.score.vertical.head.line - this.score.vertical.end.line - limit * 2 : 0;
                    }
                }
                if (this.entity.distance[this.board[i][j]] == 1) {
                    this.score.match++;
                }
            }
        }
    }

    setStatus() {
        const MinimumElements = 50;
        if ((this.size - this.score.horizon.head.line - this.score.horizon.end.line) * (this.size - this.score.vertical.head.line - this.score.vertical.end.line) > MinimumElements) {
            if (this.entity.distance[this.board.at(this.score.horizon.head.line).at(this.score.vertical.head.line)] != 1) {
                this.status.position.left = this.entity.position[this.board.at(this.score.horizon.head.line).at(this.score.vertical.head.line)];
                this.status.addFlag(this.status.Corner);
            }
            if (this.entity.distance[this.board.at(this.score.horizon.head.line).at(-this.score.vertical.end.line - 1)] != 1) {
                this.status.position.top = this.entity.position[this.board.at(this.score.horizon.head.line).at(-this.score.vertical.end.line - 1)];
                this.status.addFlag(this.status.Corner);
            }
            if (this.entity.distance[this.board.at(-this.score.horizon.end.line - 1).at(this.score.vertical.head.line)] != 1) {
                this.status.position.bottom = this.entity.position[this.board.at(-this.score.horizon.end.line - 1).at(this.score.vertical.head.line)];
                this.status.addFlag(this.status.Corner);
            }
            if (this.entity.distance[this.board.at(-this.score.horizon.end.line - 1).at(-this.score.vertical.end.line - 1)] != 1) {
                this.status.position.right = this.entity.position[this.board.at(-this.score.horizon.end.line - 1).at(-this.score.vertical.end.line - 1)];
                this.status.addFlag(this.status.Corner);
            }
        }
        if (!this.status.hasFlag(this.status.Corner)) {
            this.status.addFlag(this.status.Normal);
        }
    }
}

/**
 * ノードとなるクラス
 */
class Garden extends BranchBase {
    /**
     * @param {number[][]} board エンゲージ後のボード
     * @param {EntityInfo} entity　エンゲージ後のボード
     * @param {Order} order エンゲージ時の操作
     * @param {number} width
     */
    constructor(board, entity, order, width) {
        super(board, width);
        this.entity.copyInfo(entity);
        this.engage(order.position, order.size);
        this.evaluation();
        this.entity.score = this.score;
        this.order = order;
    }
}

class Root extends BranchBase {
    /**
     * @param {number[][]} board エンゲージ後のボード
     * @param {number} depth
     * @param {number} width
     */
    constructor(board, depth, width) {
        super(board, width);
        this.entity.initialize(this.board, this.score);
        this.evaluation();
        //エンティティの情報を作る
        //とりあえずインデックスを[0,0,0,.....]で初期化する
        this.index = [...Array(depth).fill(0)];
        //探索の木を指定された深さと幅で成長させる
        this.makeTrunk(depth - 1);
    }
}

module.exports.Garden = Garden;
module.exports.Root = Root;