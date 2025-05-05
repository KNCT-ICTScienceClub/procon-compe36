const Procon = require("../utility/proconUtility");
const Garden = require("./garden");
const EntityInfo = require("./entityInfo");
const {LeafInfo} = require("./satellite");

/**
 * メインとなるクラス
 */
class Lampyrisma extends Procon {
    /**
     * 探索の根の部分
     * @type {Garden}
     */
    garden;
    /**
     * ボードを計算上都合の良い状態に変形させたボードが入っている
     * @type {number[][]}
     */
    //ペア同士の識別ができないので要素を倍化させている
    //0と1,2と3,4と5......がペア同士になっている状態
    encodedBoard;
    /**
     * 各エンティティの情報が格納された配列
     * @type {EntityInfo}
     */
    //「要素の数値=配列インデックス」になるように配置されているため
    //配列の位置に関係なく要素を指定するだけでダイレクトに情報を抜き出せるようになっている
    entity;
    /**
     * 探索の幅
     * @type {number} 
     */
    width;
    /**
     * 探索の深さ
     * @type {number}
     */
    depth;

    /**
     * 数値を渡すとそのサイズの問題をランダムに作成する
     * @description 配列を渡すとそれを問題とみなす
     * @param {number | number[][]} element ボードを生成するための要素
     * @param {number} depth 探索の深さ
     * @param {number} width 探索の幅
     */
    constructor(element, depth, width) {
        super(element);
        this.timer.start();
        this.depth = depth;
        this.width = width;
        let flag = [...Array(this.size * this.size / 2).fill(false)];
        //ここで要素の数値を倍化させている
        //ペアは正確に言うと2nと2n+1がペアになる
        this.encodedBoard = this.board.map(array => array.map(element => {
            if (!flag[element]) {
                flag[element] = true;
                return Math.abs(element) * 2;
            }
            else {
                return Math.abs(element) * 2 + 1;
            }
        }));
        //エンティティの情報を作る
        this.entity = new EntityInfo();
        this.entity.initialize(this.encodedBoard);
        //探索の根を作る
        this.garden = new Garden(this.encodedBoard, this.entity, 0, this.width);
        //とりあえずインデックスを[0,0,0,.....]で初期化する
        this.garden.index = [...Array(depth).fill(0)];
        //探索の木を指定された深さと幅で成長させる
        this.garden.makeTrunk(depth);
    }

    /**
     * この関数を実行すると問題を解き始める
     */
    allLink() {
        //完成盤面が見つかるまでループする
        while (true) {
            /**
             * @type {LeafInfo[]} 全ての葉の情報
             */
            let leaves = [];
            //参照渡しで直接書き換える
            this.garden.pruning(leaves, this.depth);
            //スコアを高い順に並び替える
            leaves.sort((a, b) => b.score - a.score);
            let index = [];
            //インデックスが配列かどうか調べる
            if (!leaves[0].index.length) {
                let duplicate = [...Array(this.width).fill(0)];
                //console.log(highScoreIndex);
                //スコアが最高値の葉が複数あったときには数が多い方を選択する
                for (let i = 0; leaves[0].score == leaves[i].score && i < leaves.length - 1; i++) {
                    duplicate[leaves[i].index]++;
                }
                //スコアが良い葉があるノードを選択してそれ以外を削除することでノードを進める
                index = [duplicate.indexOf(Math.max(...duplicate))];
            }
            //配列だった場合完成盤面が見つかったということになる
            else {
                index = leaves[0].index;
            }
            //通常は1回しか操作を行わない
            index.map(element => {
                //指定したインデックスのブランチだけを残してノードを進める
                this.garden = this.garden.branch[element];
                //ターンを追加して操作を確定する
                this.turnAdd(this.garden.order.position, this.garden.order.size);
                console.log("turn:" + this.turn + ",match:" + this.garden.score.match + ",compound:" + this.garden.score.compound + ",左端:" + this.garden.score.vertical.head + ",右端:" + this.garden.score.vertical.end + ",上端:" + this.garden.score.horizon.head + ",下端:" + this.garden.score.horizon.end);
            });
            //現在の盤面が完成しているか調べる
            if (this.garden.score.match != this.size * this.size) {
                //揃っていない場合深さが一個減っているので末端のノードを追加する
                this.garden.makeBranch(this.depth);
            }
            else {
                break;
            }
            //デバック用のループ防止に500ターンになると強制終了するようにしてる
            if (this.turn > 500) {
                break;
            }
        }
    }
}

module.exports = Lampyrisma;