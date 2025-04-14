const Procon = require("../utility/proconUtility");
const Garden = require("./garden");
const EntityInfo = require("./entityInfo");

class Lampyrisma extends Procon {
    garden;
    encodedBoard;
    entities;

    constructor(element) {
        super(element);
        let flag = [...Array(this.size * this.size).fill(false)];
        this.encodedBoard = this.board.map(array => array.map(element => {
            if (!flag[element]) {
                flag[element] = true;
                return Math.abs(element) * 2;
            }
            else {
                return Math.abs(element) * 2 + 1;
            }
        }));
        this.entities = new EntityInfo(this.encodedBoard);
        this.garden = new Garden(this.encodedBoard, this.entities, 0, 0);
    }
}

module.exports = Lampyrisma;