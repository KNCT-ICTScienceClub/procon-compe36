const fs = require('fs');

class Procon {
    answer = [];

    board;

    size;

    get turn() {
        return this.answer.length;
    }

    constructor(size, board = null) {
        if (board) {

        }
        else {
            this.makeProblem(size);
        }
    }

    engage(position, size) {
        let area = new Array(size).fill(0).map(() => new Array(size).fill(0));
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                area[i][j] = this.board[j + position[1]][i + position[0]];
            }
        }
        area = area.map(array => array.reverse());
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                this.board[i + position[1]][j + position[0]] = area[i][j];
            }
        }
        this.answer.push(new order(position, size));
    }

    turnBack() {
        let answer = this.answer.pop();
        let area = new Array(answer.size).fill(0).map(() => new Array(answer.size).fill(0));
        for (let i = 0; i < answer.size; i++) {
            for (let j = 0; j < answer.size; j++) {
                area[i][j] = this.board[i + answer.y][j + answer.x];
            }
        }
        area = area.map(array => array.reverse());
        for (let i = 0; i < answer.size; i++) {
            for (let j = 0; j < answer.size; j++) {
                this.board[i + answer.y][j + answer.x] = area[j][i];
            }
        }
    }

    #makeRandom(size) {
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

    makeProblem(size) {
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
        this.size = size;
        let receiveData = new ReceiveData(this.#makeRandom(size));
        this.board = receiveData.problem.field.entities;

        fs.writeFileSync(`../informationLog/problem.json`, JSON.stringify(receiveData, undefined, ' '), 'utf-8', (err) => console.error(err));
    }

    makeAnswer() {
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

class order {
    x;
    y;
    n;
    get size() {
        return this.n;
    }
    constructor(position, size) {
        this.x = position[0];
        this.y = position[1];
        this.n = size;
    }
}

module.exports = Procon;