/**
 * 葉の情報を示すクラス
 */
class LeafInfo {
    /**
     * 根の直下に接続されたノードのインデックス
     * @other 葉に到達するまでのインデックス
     * @type {number | number[]}
     */
    index;
    /**
     * 葉のスコア
     * @type {number}
     */
    score;
    /**
     * @param {number | number[]} index 葉に到達するまでのインデックス
     * @param {number} score 葉のスコア
     */
    constructor(index, score) {
        this.index = index;
        this.score = score;
    }
}

/**
 * ボードの外側がどれくらい綺麗に揃っているかについてのスコアを記録するクラス
 */
class Line {
    /**
     * 先端部分の列の評価
     * @type {LineSide}
     */
    head = new LineSide();
    /**
     * 終端部分の列の評価
     * @type {LineSide}
     */
    end = new LineSide();
}

class LineSide {
    /**
     * 列の評価値
     * @type {number}
     */
    value = 0;
    /**
     * 列がどれだけ連続で完璧に揃っていたかカウントする変数
     * @type {number}
     */
    line = 0;
    /**
     * 列の連続性が失われたときに変化するフラグ
     * @type {number}
     */
    flag = [true, true];
}

/**
 * ボードのスコアを記録するクラス
 */
class Score {
    /**
     * ボードにどれだけペアができているかカウントする変数
     * @type {number}
     */
    match = 0;
    /**
     * 総合的な評価値
     * @type {number}
     */
    compound = 0;
    /**
     * 水平方向の列に関するスコア
     * @type {Line}
     */
    horizon = new Line();
    /**
     * 垂直方向の列に関するスコア
     * @type {Line}
     */
    vertical = new Line();
}

class Order {
    /**
     * 座標
     * @type {number[]}
     */
    position;
    /**
     * サイズ
     * @type {number}
     */
    size;
    /**
     * どの種類のサジェストから作成された操作か
     * @type {number} 1→matching,2→adjusting
     */
    type;
    /**
     * @param {number[]} position 座標
     * @param {number} size サイズ
     * @param {number} type サジェストの種類
     */
    constructor(position, size, type) {
        this.position = [...position];
        this.size = size;
        this.type = type;
    }
}

class StatusPosition {
    top;
    bottom;
    right;
    left;
    constructor() {
        this.top = [];
        this.bottom = [];
        this.right = [];
        this.left = [];
    }
}

class Status {
    position;
    #current;
    #normal;
    #short;
    #corner;
    #finish;
    #middle;

    get Current() {
        return this.#current;
    }
    get Normal() {
        return this.#normal;
    }
    get Short() {
        return this.#short;
    }
    get Corner() {
        return this.#corner;
    }
    get Finish() {
        return this.#finish;
    }
    get Middle() {
        return this.#middle;
    }

    constructor() {
        this.#current = 1;
        this.#normal = 2;
        this.#short = 3;
        this.#corner = 5;
        this.#finish = 7;
        this.#middle = 11;
        this.position = new StatusPosition();
    }

    hasFlag(flag) {
        return this.#current % flag == 0;
    }

    addFlag(flag) {
        if (!this.hasFlag(flag)) {
            this.#current *= flag;
        }
    }
}

module.exports.LeafInfo = LeafInfo;
module.exports.Score = Score;
module.exports.Order = Order;
module.exports.Status = Status;