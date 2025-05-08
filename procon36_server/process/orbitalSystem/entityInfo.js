const { Score, Order } = require("./satellite");

/**
 * エンティティの情報を管理するためのクラス
 */
class EntityInfo {
    /**
     * ボードのサイズ
     * @type {number}
     */
    size;
    /**
     * そのインデックスの数値に対応したエンティティの数値の座標を格納した配列
     * @type {number[][]} [エンティティの数値][座標]
     */
    position;
    /**
     * そのインデックスの数値に対応したエンティティから、ペアとなるエンティティの座標を向くベクトルを格納した配列
     * @type {number[][]} [エンティティの数値][ベクトル]
     */
    vector;
    /**
     * そのインデックスの数値に対応したエンティティから、ペアとなるエンティティの座標を向くベクトルの方向のみを格納した配列
     * @type {number[]} [エンティティの数値][方向]
     * @description 右→2,下→3,左→5,上→7の数値を割り当てている(乗算で斜め方向の指定も可能)
     */
    direction;
    /**
     * そのインデックスの数値に対応したエンティティから、ペアとなるエンティティの座標を向くベクトルの縦と横の絶対値の和を格納した配列
     * @type {number[]}
     */
    distance;
    /**
     * ボードのスコア
     * @type {Score}
     */
    score;
    /**
     * アップデートが必要な値
     * @type {boolean[]}
     */
    updateFlag;

    /**
     * 渡されたボードに対しての情報を作成する
     * @param {number[][]} board
     */
    initialize(board) {
        this.size = board.length;
        this.position = new Array(this.size * this.size);
        this.vector = new Array(this.size * this.size);
        this.direction = new Array(this.size * this.size);
        this.distance = new Array(this.size * this.size);
        this.updateFlag = new Array(this.size * this.size).fill(true);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.position[board[i][j]] = [j, i];
            }
        }
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (board[i][j] % 2 == 0) {
                    this.update(board[i][j]);
                }
            }
        }
    }

    /**
     * 渡されたエンティティの情報をコピーして取り込む
     * @param {EntityInfo} source 
     */
    copyInfo(source) {
        this.size = source.size;
        this.position = [...source.position];
        this.vector = [...source.vector];
        this.distance = [...source.distance];
        this.direction = [...source.direction];
        this.updateFlag = new Array(this.size * this.size).fill(false);
    }

    /**
     * その値のエンティティの情報とペアとなるエンティティの情報を更新する
     * @param {number} value 更新したいエンティティの値 
     */
    update(value) {
        let pair = (value % 2 == 0 ? value + 1 : value - 1);
        this.vector[value] = [this.position[pair][0] - this.position[value][0], this.position[pair][1] - this.position[value][1]];
        this.vector[pair] = [-this.vector[value][0], -this.vector[value][1]];
        this.distance[value] = Math.abs(this.vector[value][0]) + Math.abs(this.vector[value][1]);
        this.distance[pair] = this.distance[value];
        this.direction[value] = (this.vector[value][0] > 0 ? 2 : (this.vector[value][0] != 0) ? 5 : 1) * (this.vector[value][1] > 0 ? 3 : (this.vector[value][1] != 0) ? 7 : 1);
        this.direction[pair] = (this.vector[pair][0] > 0 ? 2 : (this.vector[pair][0] != 0) ? 5 : 1) * (this.vector[pair][1] > 0 ? 3 : (this.vector[pair][1] != 0) ? 7 : 1);
        this.updateFlag[value] = false;
        this.updateFlag[value] = false;
    }

    /**
     * その値のエンティティをペアとなるエンティティの位置まで動かすことでペアを完成できる操作を返す関数
     * @param {number} value 動かすエンティティの値
     * @returns {Order}
     */
    matching(value) {
        let order = new Order(this.position[value], this.distance[value], 1);
        //このままの状態ではペアのエンティティがあった位置にエンティティが移動するため方向によって一つ位置をずらす
        switch (this.direction[value]) {
            case 3:
            case 15:
                order.position[0] += 1;
                break;
            case 7:
            case 14:
                order.position[1] += 1;
                break;
            case 5:
            case 35:
                order.position[0] += 1;
                order.position[1] += 1;
                break;
        }
        //方向によってベクトルの数値だけ位置をずらす
        //斜め方向も移動の合成によって対応する
        //右方向は位置を移動しなくてよい
        //下方向は左に移動
        //左方向は左上に移動
        //上方向は上に移動
        if (this.direction[value] % 3 == 0) {
            order.position[0] -= this.vector[value][1];
        }
        if (this.direction[value] % 5 == 0) {
            order.position[0] += this.vector[value][0];
            order.position[1] += this.vector[value][0];
        }
        if (this.direction[value] % 7 == 0) {
            order.position[1] += this.vector[value][1];
        }
        return order;
    }

    /**
     * その値のエンティティがペアになっている状態ならば、そのペアの塊をボードの端の方に寄せる操作を返す関数
     * @param {number} value エンティティの値 
     * @returns {Order}
     */
    adjusting(value) {
        //全ての方向で端に寄せたときのサイズを計算する
        let aim = [
            { direction: 2, size: this.size - this.score.vertical.endLine - this.position[value][0] },
            { direction: 3, size: this.size - this.score.horizon.endLine - this.position[value][1] },
            { direction: 5, size: this.position[value][0] - this.score.vertical.headLine + 1 },
            { direction: 7, size: this.position[value][1] - this.score.horizon.headLine + 1 }
        ];
        //サイズと方向によって位置を計算し操作を返す
        const setOrder = (aim) => {
            switch (aim.direction) {
                case 2:
                    return new Order(this.position[value], aim.size, 2);
                case 3:
                    return new Order([this.position[value][0] - aim.size + 1, this.position[value][1]], aim.size, 2);
                case 5:
                    return new Order([this.position[value][0] - aim.size + 1, this.position[value][1] - aim.size + 1], aim.size, 2);
                case 7:
                    return new Order([this.position[value][0], this.position[value][1] - aim.size + 1], aim.size, 2);
            }
        }
        let order;
        //ペアとなるエンティティが指定したエンティティに対して上下左右どこに繋がっているかで動作が変わる
        switch (this.direction[value]) {
            case 2:
                aim[2].size++;
                //一番サイズが小さいものを指定する
                aim = aim.reduce((previous, current) => previous.size > current.size ? current : previous);
                order = setOrder(aim);
                //動かす方向と繋がっている方向によって位置が微調整される
                switch (aim.direction) {
                    case 3:
                        order.position[0]++;
                        break;
                    case 5:
                        order.position[0]++;
                        break;
                }
                break;
            case 3:
                aim[3].size++;
                aim = aim.reduce((previous, current) => previous.size > current.size ? current : previous);
                order = setOrder(aim);
                switch (aim.direction) {
                    case 5:
                        order.position[1]++;
                        break;
                    case 7:
                        order.position[1]++;
                        break;
                }
                break;
            case 5:
                aim[0].size++;
                aim = aim.reduce((previous, current) => previous.size > current.size ? current : previous);
                order = setOrder(aim);
                switch (aim.direction) {
                    case 2:
                        order.position[0]--;
                        break;
                    case 7:
                        order.position[0]--;
                        break;
                }
                break;
            case 7:
                aim[1].size++;
                aim = aim.reduce((previous, current) => previous.size > current.size ? current : previous);
                order = setOrder(aim);
                switch (aim.direction) {
                    case 2:
                        order.position[1]--;
                        break;
                    case 3:
                        order.position[1]--;
                        break;
                }
                break;
        }
        return order;
    }
}
module.exports = EntityInfo;