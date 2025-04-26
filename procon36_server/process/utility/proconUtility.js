const fs = require('fs');

class Procon {
    answer = [];
    board;
    size;
    timer = new Timer();

    get turn() {
        return this.answer.length;
    }

    constructor(element) {
        if (typeof element == "number") {
            if ((element < 4 || 24 < element)) {
                throw new RangeError("ボードのサイズは4~24の値を指定してください.\n問題箇所--->new Procon(element=" + element + "...");
            }
            this.board = this.#makeRandomProblem(element);
            this.size = element;
        }
        else if ((element[0]?.length ?? 0) >= 2) {
            this.board = element;
            this.size = this.board.length;
        }
        else {
            throw new TypeError("引数には数値か2次元配列を入力してください.\n問題箇所--->new Procon(element=" + element + "...");
        }
    }

    engage(position, size, reverse = false) {
        if ((position?.length ?? 0) < 2) {
            throw new RangeError("positionの要素数は2つ必要です.\n問題箇所--->engage(board=<object>,position=" + position + "...");
        }
        else if (position[0] < 0 || this.size < position[0] + size || position[1] < 0 || this.size < position[1] + size) {
            throw new RangeError("選択範囲がboardからはみ出しています.\n問題箇所--->engage(board=<object>,position=" + position + ",size=" + size + "...");
        }
        let area = new Array(size).fill(0).map(() => new Array(size).fill(0));
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
                }
                else {
                    this.board[i + position[1]][j + position[0]] = area[i][j];
                }
            }
        }
        return area;
    }

    turnAdd(position, size) {
        this.answer.push(new Order(position, size));
        this.engage(position, size);
    }

    turnBack() {
        if ((this.answer?.length ?? 0) == 0) {
            throw new Error("Procon.answer値が存在しないためこれ以上手数を戻すことはできません.\n問題箇所--->turnBack();");
        }
        let answer = this.answer.pop();
        this.engage(answer.position, answer.size, true);
    }

    #makeRandomProblem(size) {
        let count = -1;
        let zeroFill = new Array(size).fill(0);
        let entities = [...zeroFill].map(() => [...zeroFill].map(() => Math.floor((count += 1) / 2)));
        let array = entities.flat();
        for (let i = 0; i < size * size - 1; i++) {
            let random = Math.floor(Math.random() * (size * size - i - 1)) + i + 1;
            let swap = array[i];
            array[i] = array[random];
            array[random] = swap;
        }
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                entities[i][j] = array[i * size + j];
            }
        }
        return entities;
    }

    makeProblemFile() {
        let receiveData = new ReceiveData(this.board);
        receiveData.problem.field.entities = receiveData.problem.field.entities.flat();
        fs.writeFileSync(`../informationLog/problem.json`, JSON.stringify(receiveData, undefined, ' '), 'utf-8', (err) => console.error(err));
    }

    makeAnswerFile() {
        let sendData = new SendData(this.answer);
        fs.writeFileSync(`../informationLog/answer.json`, JSON.stringify(sendData, undefined, ' '), 'utf-8', (err) => console.error(err));
    }
}

class Timer {
    #startTime = null;
    #accuracy;
    result;
    start(value = 10000) {
        this.#accuracy = value;
        this.#startTime = performance.now();
    }

    end() {
        this.result = (Math.round((performance.now() - this.#startTime) * this.#accuracy) / (1000 * this.#accuracy));
    }

    show() {
        console.log("計算時間:" + this.result + "秒");
    }
}

class Order {
    x;
    y;
    n;
    get size() {
        return this.n;
    }
    get position() {
        return [this.x, this.y];
    }
    constructor(position, size) {
        this.x = position[0];
        this.y = position[1];
        this.n = size;
    }
}

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

class ReceiveData {
    startsAt = 0;
    problem;
    constructor(board) {
        this.problem = new Problem(board);
    }
}

class SendData {
    ops;
    constructor(answer) {
        this.ops = answer;
    }
}

module.exports = Procon;