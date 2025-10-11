const { Score, Order, Status } = require("./satellite");

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
     * そのインデックスの数値に対応したエンティティから、ペアとなるエンティティの座標を向くベクトルの縦と横の絶対値の総和
     * @type {number}
     */
    distanceSum;
    /**
     * ボードのスコア
     * @type {Score}
     */
    score = new Score();
    /**
    * 盤面タイプ
    * @type {Status}
    */
    status = new Status();

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
        this.distanceSum = this.distance.reduce((previous, current) => previous + current - 1, 0);
    }

    /**
     * 渡されたエンティティの情報をコピーして取り込む
     * @param {EntityInfo} source 
     */
    copyInfo(source) {
        this.status = new Status();
        this.size = source.size;
        this.position = [...source.position];
        this.vector = [...source.vector];
        this.distance = [...source.distance];
        this.distanceSum = source.distanceSum;
        this.direction = [...source.direction];
    }

    /**
     * その値のエンティティの情報とペアとなるエンティティの情報を更新する
     * @param {number} value 更新したいエンティティの値 
     */
    update(value) {
        let pair = value % 2 == 0 ? value + 1 : value - 1;
        this.vector[value] = [this.position[pair][0] - this.position[value][0], this.position[pair][1] - this.position[value][1]];
        this.vector[pair] = [-this.vector[value][0], -this.vector[value][1]];
        this.distanceSum -= (this.distance[value] - 1) * 2;
        this.distance[value] = Math.abs(this.vector[value][0]) + Math.abs(this.vector[value][1]);
        this.distance[pair] = this.distance[value];
        this.distanceSum += (this.distance[value] - 1) * 2;
        this.direction[value] = (this.vector[value][0] > 0 ? 2 : (this.vector[value][0] != 0) ? 5 : 1) * (this.vector[value][1] > 0 ? 3 : (this.vector[value][1] != 0) ? 7 : 1);
        this.direction[pair] = (this.vector[pair][0] > 0 ? 2 : (this.vector[pair][0] != 0) ? 5 : 1) * (this.vector[pair][1] > 0 ? 3 : (this.vector[pair][1] != 0) ? 7 : 1);
    }

    /**
     * //サイズと方向によって位置を計算し操作を返す
     * @param {number[]} position 
     * @param {number} direction 
     * @param {number} size 
     * @returns {Order}
     */
    setOrder(position, direction, size) {
        switch (direction) {
            case 2:
                return new Order(position, size, 2);
            case 3:
                return new Order([position[0] - size + 1, position[1]], size, 2);
            case 5:
                return new Order([position[0] - size + 1, position[1] - size + 1], size, 2);
            case 7:
                return new Order([position[0], position[1] - size + 1], size, 2);
        }
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
            { direction: 2, size: this.size - this.score.vertical.end.line - this.position[value][0] },
            { direction: 3, size: this.size - this.score.horizon.end.line - this.position[value][1] },
            { direction: 5, size: this.position[value][0] - this.score.vertical.head.line + 1 },
            { direction: 7, size: this.position[value][1] - this.score.horizon.head.line + 1 }
        ];
        aim = aim.map(element => {
            let order;
            //ペアとなるエンティティが指定したエンティティに対して上下左右どこに繋がっているかで動作が変わる
            switch (this.direction[value]) {
                case 2:
                    order = this.setOrder(this.position[value], element.direction, element.size);
                    //動かす方向と繋がっている方向によって位置が微調整される
                    switch (element.direction) {
                        case 3:
                            order.size++;
                            break;
                        case 5:
                            order.size++
                            order.position[1]--;
                            break;
                    }
                    break;
                case 3:
                    order = this.setOrder(this.position[value], element.direction, element.size);
                    switch (element.direction) {
                        case 5:
                            order.size++;
                            order.position[0]--;
                            break;
                        case 7:
                            order.size++
                            break;
                    }
                    break;
                case 5:
                    order = this.setOrder(this.position[value], element.direction, element.size);
                    switch (element.direction) {
                        case 2:
                            order.size++
                            order.position[0]--;
                            break;
                        case 7:
                            order.position[0]--;
                            break;
                    }
                    break;
                case 7:
                    order = this.setOrder(this.position[value], element.direction, element.size);
                    switch (element.direction) {
                        case 2:
                            order.position[1]--;
                            break;
                        case 3:
                            order.size++
                            order.position[1]--;
                            break;
                    }
                    break;
            }
            return order;
        }).filter(element => this.score.vertical.head.line <= element.position[0] && element.position[0] + element.size <= this.size - this.score.vertical.head.line - this.score.vertical.end.line && this.score.horizon.head.line <= element.position[1] && element.position[1] + element.size <= this.size - this.score.horizon.head.line - this.score.horizon.end.line);
        return aim.length == 0 ? undefined : aim.reduce((previous, current) => previous.size > current.size ? current : previous);
    }
}

module.exports = EntityInfo;