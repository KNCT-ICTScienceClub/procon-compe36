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
     * 先端部分の列の評価値
     * @type {number}
     */
    head = 0;
    /**
     * 先端部分の列がどれだけ連続で完璧に揃っていたかカウントすうる変数
     * @type {number}
     */
    headLine = 0;
    /**
     * 先端部分の列の連続性が失われたときに変化する変数
     * @type {number}
     */
    headFlag = 1;
    /**
     * 終端部分の列の評価値
     * @type {number}
     */
    end = 0;
    /**
     * 終端部分の列がどれだけ連続で完璧に揃っていたかカウントすうる変数
     * @type {number}
     */
    endLine = 0;
    /**
     * 終端部分の列の連続性が失われたときに変化する変数
     * @type {number}
     */
    endFlag = 1;
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

module.exports.LeafInfo = LeafInfo;
module.exports.Score = Score;
module.exports.Order = Order;