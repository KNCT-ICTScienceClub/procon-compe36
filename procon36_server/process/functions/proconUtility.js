const fs = require('fs');

class Procon {
    answer = [];

    currentBoard;

    size;

    timer = new Timer();

    get turn() {
        return this.answer.length;
    }

    constructor(size, board = null) {
        if ((size < 4 || 24 < size)) {
            throw new RangeError("ボードのサイズは4~24の値を指定してください.\n問題箇所--->new Procon(size="+size+"...");
        }
        if (board) {

        }
        else {
            this.currentBoard = this.makeRandomProblem(size);
        }
    }

    engage(board, position, size, reverse = false) {
        if(!board[0].length){
            throw new TypeError("boardの引数は2次元配列を指定してください.\n問題箇所--->Procon.engage(board="+board+"...");
        }
        else if(board[0].length<position[0]+size||board.length<position[1]+size){
            throw new RangeError("選択範囲がboardからはみ出しています.\n\tposition:"+position+",size:"+size);
        }
        let area = new Array(size).fill(0).map(() => new Array(size).fill(0));
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (reverse) {
                    area[i][j] = board[i + position[1]][j + position[0]];
                }
                else {
                    area[i][j] = board[j + position[1]][i + position[0]];
                }
            }
        }
        area = area.map(array => array.reverse());
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (reverse) {
                    board[i + position[1]][j + position[0]] = area[j][i];
                }
                else {
                    board[i + position[1]][j + position[0]] = area[i][j];
                }
            }
        }
        return area;
    }

    turnAdd(position, size) {
        this.answer.push(new Order(position, size));
        this.engage(this.currentBoard, position, size);
    }

    turnBack() {
        let answer = this.answer.pop();
        this.engage(this.currentBoard, answer.position, answer.size, true);
    }

    makeRandomProblem(size) {
        let count = -1;
        let entities = new Array(size).fill(0).map(() => new Array(size).fill(0).map(() => Math.floor((count += 1) / 2)));
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
        let receiveData = new ReceiveData(this.currentBoard);
        receiveData.problem.field.entities = receiveData.problem.field.entities.flat();
        fs.writeFileSync(`../informationLog/problem.json`, JSON.stringify(receiveData, undefined, ' '), 'utf-8', (err) => console.error(err));
    }

    makeAnswerFile() {
        class SendData {
            ops;
            constructor(answer) {
                this.ops = answer;
            }
        }
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

module.exports = Procon;