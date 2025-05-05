const EntityInfo = require("./entityInfo");
const { LeafInfo, Score, Order } = require("./satellite");

/**
 * ノードとなるクラス
 */
class Garden {
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
     * ノードの部分
     * @type {Garden[]}
     */
    branch = [];
    /**
     * スコア
     * @type {Score}
     */
    score = new Score();
    /**
     * 探索の幅
     * @type {number}
     */
    width;
    /**
     * このノードの現在地を示すインデックス
     * @type {number[]}
     */
    index = [];
    /**
     * 操作手順
     * @type {Order}
     */
    order;

    /**
     * @param {number[][]} board エンゲージ後のボード
     * @param {EntityInfo} entity　エンゲージ後のボード
     * @param {Order} order エンゲージ時の操作
     * @param {number} width
     */
    constructor(board, entity, order, width) {
        this.size = board.length;
        this.board = board.map(array => [...array]);
        this.entity = new EntityInfo();
        this.entity.copyInfo(entity);
        this.evaluation();
        this.entity.score = this.score;
        this.width = width;
        this.order = order;
    }

    /**
     * 葉の情報を抜き出し剪定を行う
     * @param {LeafInfo} leaves 葉の情報
     * @param {number} depth 深さ
     */
    //最初に指定したdepthの回数だけ下の階層へ潜る
    pruning(leaves, depth) {
        //指定した深さまで潜ると実行される
        if (depth == 1) {
            //葉の情報を書き込む
            /*
            三項演算子
            完成盤面であった場合はそのノードに到達するまでの全てのインデックスが渡される
            そうでない時はその葉が根に直接繋がっているノードのどれに属しているかを示すインデックスを渡す
            */
            //総合的なスコアを渡す
            leaves.push(new LeafInfo(this.branch[0]?.score.match == this.size * this.size ? this.branch[0].index : this.branch[0]?.index[0], this.branch[0].score.compound));
        }
        //指定した深さまで潜れていない場合再帰的に関数を実行し一つ下の階層に潜る
        else {
            this.branch.map(element => element.pruning(leaves, depth - 1));
        }
    }

    /**
     * 指定した深さまで再帰的に枝を生成する
     * @param {number} depth
     */
    makeTrunk(depth) {
        if (depth != 0) {
            this.extendBranch(this.index, false);
            this.branch.map(element => element.makeTrunk(depth - 1));
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
            this.branch.map(element => element.makeBranch(depth - 1));
        }
    }

    /**
     * 現在の葉からノードを作成する
     * @param {number[]} index 
     * @param {boolean} adjust 
     */
    extendBranch(index, adjust = true) {
        let suggest = [];
        this.matchSuggest(suggest);
        if (adjust) {
            this.adjustSuggest(suggest);
        }
        //サジェストをxとyに関して並び替えを行いサイズに関しても並び替えを行う
        suggest.sort((a, b) => a.position[0] == b.position[0] ? (a.position[1] == b.position[1] ? a.size - b.size : a.position[1] - b.position[1]) : a.position[0] - b.position[0]);
        for (let i = 0; i < suggest.length - 1; i++) {
            //並び替えを行ったことにより現在の要素と次の要素が等しかった場合重複した操作となるので削除する
            if (suggest[i].position[0] == suggest[i + 1].position[0] && suggest[i].position[1] == suggest[i + 1].position[1] && suggest[i].size == suggest[i + 1].size) {
                delete suggest[i];
            }
        }
        suggest.map(element => {
            //その操作に従ってエンゲージを行う
            this.engage(element.position, element.size);
            //操作したボードで枝を作る
            let twig = new Garden(this.board, this.entity, element, this.width);
            //adjustingによるサジェストだった場合ループを防ぐため評価が上昇するものでないと受け付けない
            if (element.type == 2) {
                if (twig.score.compound > this.score.compound) {
                    this.branch.push(twig);
                }
            }
            else {
                this.branch.push(twig);
            }
            //逆の操作をしてボードを元に戻す
            this.engage(element.position, element.size, true);
        });
        //スコアの高い順に並び替えて上位のスコアの操作を幅の数値の分だけ残す
        this.branch = this.branch.toSorted((a, b) => b.score.compound - a.score.compound).slice(0, this.width);
        //インデックスを更新する
        for (let i = 0; i < this.branch.length; i++) {
            //インデックスの左側をカットして末尾に新しく指定したインデックスを追加する
            this.branch[i].index = index.slice(1).concat(i);
        }
    }

    /**
     * 次ターンのみに着目して、ペアを生成できる操作を列挙する関数
     * @param {Order[]} suggest 列挙した操作を格納した配列
     * @param {number} limit 揃ってないところから+limitの数値までの幅の枠を作ってそこの地点についてだけサジェストを出す
     */
    matchSuggest(suggest, limit = this.size) {
        //全て揃っている列は操作する必要がないので無視してfor文を回す
        for (let i = this.score.horizon.headLine; i < this.size - this.score.horizon.endLine; i++) {
            for (let j = this.score.vertical.headLine; j < this.size - this.score.vertical.endLine; j++) {
                //この条件式を発動させると枠のような形で位置が指定される
                if (limit <= i && limit == j) {
                    if (this.size - this.score.horizon.headLine - this.score.horizon.endLine - limit - i > 0) {
                        j += this.size - this.score.vertical.headLine - this.score.vertical.endLine - limit * 2 > 0 ? this.size - this.score.vertical.headLine - this.score.vertical.endLine - limit * 2 : 0;
                    }
                }
                //ペアになっていないエンティティに対してサジェストを出す
                if (this.entity.distance[this.board[i][j]] != 1) {
                    let order = this.entity.matching(this.board[i][j]);
                    //位置によっては指定した場所がボードを飛び出すことがあるので条件式でふるいにかける
                    if (0 <= order.position[0] && order.position[0] + order.size <= this.size && 0 <= order.position[1] && order.position[1] + order.size <= this.size) {
                        suggest.push(order);
                    }
                }
            }
        }
    }

    /**
     * ペアになっている要素の塊を端に寄せる操作を列挙する関数
     * @param {Order[]} suggest 列挙した操作を格納した配列
     */
    adjustSuggest(suggest) {
        //全て揃っている列は操作する必要がないので無視してfor文を回す
        for (let i = this.score.horizon.headLine + 1; i < this.size - this.score.horizon.endLine - 1; i++) {
            for (let j = this.score.vertical.headLine + 1; j < this.size - this.score.vertical.endLine - 1; j++) {
                //ペアになっているエンティティに対してサジェストを出す
                if (this.entity.distance[this.board[i][j]] == 1) {
                    suggest.push(this.entity.adjusting(this.board[i][j]));
                }
            }
        }
    }

    /**
     * 現在のボードを参照して「導き」を行う
     * @param {number[]} position 園の左上の座標[x,y]
     * @param {number} size 園のサイズ
     * @param {boolean} reverse trueにすると左回転になる
     */
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

    /**
     * scoreの数値を設定する関数
     */
    evaluation() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.entity.distance[this.board[i][j]] == 1) {
                    this.score.match++;
                }
                if (this.score.horizon.headFlag) {
                    if (this.entity.distance[this.board[i][j]] == 1) {
                        this.score.horizon.head += this.score.horizon.headFlag == 1 ? 3 : 1;
                    }
                    else {
                        this.score.horizon.headFlag = 2;
                    }
                }
                if (this.score.horizon.endFlag) {
                    if (this.entity.distance[this.board[this.size - i - 1][this.size - j - 1]] == 1) {
                        this.score.horizon.end += this.score.horizon.endFlag == 1 ? 3 : 1;
                    }
                    else {
                        this.score.horizon.endFlag = 2;
                    }
                }
                if (this.score.vertical.headFlag) {
                    if (this.entity.distance[this.board[j][i]] == 1) {
                        this.score.vertical.head += this.score.vertical.headFlag == 1 ? 3 : 1;
                    }
                    else {
                        this.score.vertical.headFlag = 2;
                    }
                }
                if (this.score.vertical.endFlag) {
                    if (this.entity.distance[this.board[this.size - j - 1][this.size - i - 1]] == 1) {
                        this.score.vertical.end += this.score.vertical.endFlag == 1 ? 3 : 1;
                    }
                    else {
                        this.score.vertical.endFlag = 2;
                    }
                }
            }
            switch (this.score.horizon.headFlag) {
                case 1:
                    this.score.horizon.headLine++;
                    break;
                case 2:
                    this.score.horizon.headFlag = false;
                    break;
            }
            switch (this.score.horizon.endFlag) {
                case 1:
                    this.score.horizon.endLine++;
                    break;
                case 2:
                    this.score.horizon.endFlag = false;
                    break;
            }
            switch (this.score.vertical.headFlag) {
                case 1:
                    this.score.vertical.headLine++;
                    break;
                case 2:
                    this.score.vertical.headFlag = false;
                    break;
            }
            switch (this.score.vertical.endFlag) {
                case 1:
                    this.score.vertical.endLine++;
                    break;
                case 2:
                    this.score.vertical.endFlag = false;
                    break;
            }
        }
        this.score.compound = this.score.match + this.score.horizon.head * 3 + this.score.horizon.end * 3 + this.score.vertical.head * 3 + this.score.vertical.end * 3;
    }
}

module.exports = Garden;