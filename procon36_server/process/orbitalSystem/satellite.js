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

    /**
     * 渡されたスコアの情報をコピーして取り込む
     * @param {Score} source 
     */
    copyScore(source) {
        this.match = source.match;
        this.compound = source.compound;
        this.horizon.head = source.horizon.head;
        this.horizon.headLine = source.horizon.headLine;
        this.horizon.headFlag = source.horizon.headFlag;
        this.horizon.end = source.horizon.end;
        this.horizon.endLine = source.horizon.endLine;
        this.horizon.endFlag = source.horizon.endFlag;
        this.vertical.head = source.vertical.head;
        this.vertical.headLine = source.vertical.headLine;
        this.vertical.headFlag = source.vertical.headFlag;
        this.vertical.end = source.vertical.end;
        this.vertical.endLine = source.vertical.endLine;
        this.vertical.endFlag = source.vertical.endFlag;
    }
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