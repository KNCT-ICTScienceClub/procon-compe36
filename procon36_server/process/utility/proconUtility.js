const fs = require('fs');
const path = require("path");

/**
 * プロコン用の汎用機能をまとめたクラス
 * (これを継承してクラスを作ると便利かも)
 */
class Procon {
    /**
     * 操作手順を順に格納した配列
     * @type {Answer[]}
     */
    answer = [];
    /**
     * 問題の状態を格納した配列
     * @description 
     * 今回で言うところのフィールド
     * @type {number[][]}
     */
    board;
    /**
     * 問題のサイズ
     * @type {number}
     */
    size;
    /**
     * 時間測定用の機能を格納した変数
     * @type {Timer}
     */
    timer = new Timer();
    /**
     * 現在のターン数
     * @returns {number}
     */
    get turn() {
        return this.answer.length;
    }

    /**
     * 数値を渡すとそのサイズの問題をランダムに作成する
     * @other 問題を表す配列
     * @param {number | number[][]} element ボードを生成するための要素
     */
    constructor(element) {
        //引数が数値だったときの処理
        if (typeof element == "number") {
            if ((element < 4 || 24 < element)) {
                throw new RangeError("ボードのサイズは4~24の値を指定してください.\n問題箇所--->new Procon(element=" + element + "...");
            }
            this.board = this.#makeRandomProblem(element);
            this.size = element;
        }
        //引数が配列だった時の処理
        else if ((element[0]?.length ?? 0) >= 2) {
            this.board = element;
            this.size = this.board.length;
        }
        else {
            throw new TypeError("引数には数値か2次元配列を入力してください.\n問題箇所--->new Procon(element=" + element + "...");
        }
    }

    /**
     * 現在のボードを参照して「導き」を行う
     * @summary 詳細はプロコンの募集要項参照
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
        /*
        右回転するときは配列を転置したあと左右反転を行う
        左回転するときは配列を左右反転したあと転置を行う
        */
        let area = new Array(size).fill(0).map(() => new Array(size).fill(0));
        //指定したエリアの配列を作る
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (reverse) {
                    area[i][j] = this.board[i + position[1]][j + position[0]];
                }
                else {
                    //右回転時は転置した状態で読み込む
                    area[i][j] = this.board[j + position[1]][i + position[0]];
                }
            }
        }
        //配列を左右反転する
        area = area.map(array => array.reverse());
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (reverse) {
                    //左回転時は転置したものをボードに書き込む
                    this.board[i + position[1]][j + position[0]] = area[j][i];
                }
                else {
                    this.board[i + position[1]][j + position[0]] = area[i][j];
                }
            }
        }
    }

    /**
     * 現在のボードを参照して「導き」を行ったあとanswerに操作を書き込む
     * @param {number[]} position 園の左上の座標[x,y]
     * @param {number} size 園のサイズ
     */
    turnAdd(position, size) {
        this.answer.push(new Answer(position, size));
        this.engage(position, size);
    }

    /**
     * answerを参照してボードの状態を一手戻す
     * @description answerも末尾を削除する
     */
    turnBack() {
        if ((this.answer?.length ?? 0) == 0) {
            throw new Error("Procon.answer値が存在しないためこれ以上手数を戻すことはできません.\n問題箇所--->turnBack();");
        }
        let answer = this.answer.pop();
        this.engage(answer.position, answer.size, true);
    }

    /**
     * ランダムにボードを生成する
     * @param {number} size ボードのサイズ
     * @returns {number[][]} 生成したボード
     */
    #makeRandomProblem(size) {
        let count = -1;
        let zeroFill = new Array(size).fill(0);
        //混ざってない状態でエンティティの構成要素を作成する
        let entities = [...zeroFill].map(() => [...zeroFill].map(() => Math.floor((count += 1) / 2)));
        //二次元配列を一次元配列に変換する
        //[0,0,1,1,2,2,3,3,......]という感じになっている
        let array = entities.flat();
        //配列要素をシャッフルする
        //フィッシャー–イェーツのシャッフルを使用している
        for (let i = 0; i < size * size - 1; i++) {
            let random = Math.floor(Math.random() * (size * size - i - 1)) + i + 1;
            let swap = array[i];
            array[i] = array[random];
            array[random] = swap;
        }
        //一次元配列を二次元配列に戻す
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                entities[i][j] = array[i * size + j];
            }
        }
        return entities;
    }

    /**
     * 現在のボードの状態を今回のプロコン形式でjsonファイルを生成する
     */
    makeProblemFile() {
        let receiveData = new ReceiveData(this.board);
        //unity側で読み込むときに二次元配列を渡すと都合が悪いので一次元に変換して渡す
        receiveData.problem.field.entities = receiveData.problem.field.entities.flat();
        fs.writeFileSync(path.resolve(__dirname, "../../informationLog/problem.json"), JSON.stringify(receiveData, undefined, ' '), 'utf-8', (err) => console.error(err));
    }

    /**
     * 現在の回答を今回のプロコン形式でjsonファイルを生成する
     */
    makeAnswerFile() {
        let sendData = new SendData(this.answer);
        let json = JSON.stringify(sendData, undefined, ' ');
        fs.writeFileSync(path.resolve(__dirname, "../../informationLog/answer.json"), json, 'utf-8', (err) => console.error(err));
        return JSON.parse(json);
    }
}

/**
 * 計算時間測定用のクラス
 */
class Timer {
    /**
     * @type {number}
     */
    #startTime = null;
    /**
     * @type {number}
     */
    #accuracy;
    /**
     * @type {number}
     */
    result;

    /**
     * 測定開始地点を指定する
     * @param {number} value 測定精度(1/valueの位まで測定する)
     */
    start(value = 10000) {
        this.#accuracy = value;
        this.#startTime = performance.now();
    }

    /**
     * 測定終了地点を指定する
     */
    end() {
        this.result = (Math.round((performance.now() - this.#startTime) * this.#accuracy) / (1000 * this.#accuracy));
    }

    /**
     * 測定結果を表示する
     */
    show() {
        console.log("計算時間:" + this.result + "秒");
    }
}

/**
 * 操作手順を記録するクラス
 */
class Answer {
    /**
     * x座標
     * @type {number}
     */
    x;
    /**
     * y座標
     * @type {number}
     */
    y;
    /**
     * サイズ
     * @type {number}
     */
    n;
    /**
     * サイズ
     * @type {number}
     */
    get size() {
        return this.n;
    }
    /**
     * 座標
     * @type {number[]}
     */
    get position() {
        return [this.x, this.y];
    }
    /**
     * @param {number[]} position 座標 
     * @param {number} size サイズ
     */
    constructor(position, size) {
        this.x = position[0];
        this.y = position[1];
        this.n = size;
    }
}

//以下大会側の通信形式に合わせるためのクラス
class Field {
    size;
    entities;
    constructor(board) {
        this.size = board.length;
        this.entities = board;
    }
}

class Problem {
    field;
    constructor(board) {
        this.field = new Field(board);
    }
}

/**
 * 受信用jsonの形式になっているクラス
 */
class ReceiveData {
    startsAt = 0;
    problem;
    constructor(board) {
        this.problem = new Problem(board);
    }
}

/**
 * 送信用jsonの形式になっているクラス
 */
class SendData {
    ops;
    constructor(answer) {
        this.ops = answer;
    }
}

module.exports = Procon;
