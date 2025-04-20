const Procon = require("../utility/proconUtility");
const Garden = require("./garden").Garden;
const Trunk = require("./garden").Trunk;
const EntityInfo = require("./entityInfo");

class Lampyrisma extends Procon {
    garden;
    encodedBoard;
    entity;
    width;
    depth;
    goal = [];

    constructor(element, depth, width) {
        super(element);
        this.timer.start();
        this.depth = depth;
        this.width = width;
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
        this.entity = new EntityInfo();
        this.entity.initialize(this.encodedBoard);
        this.garden = new Trunk(this.encodedBoard, this.entity, 0, this.width, 0);
        this.garden.index = [...Array(depth).fill(0)];
        this.garden.extendTrunk(depth);
    }

    allLink() {
        while (true) {
            let highScoreIndex = [];
            this.garden.pruning(highScoreIndex, this.depth, this.goal);
            if (this.goal.length == 0) {
                highScoreIndex.sort((a, b) => b.score - a.score);
                let duplicate = [...Array(this.width).fill(0)];
                let i = 0;
                while (highScoreIndex[0].score == highScoreIndex[i].score && i < highScoreIndex.length) {
                    duplicate[highScoreIndex[i++].index]++;
                }
                this.garden = this.garden.branch[duplicate.indexOf(Math.max(...duplicate))];
            }
            else {
                this.goal.map(index => {
                    this.garden = this.garden.branch[index];
                    this.turnAdd(this.garden.order.target, this.garden.order.size);
                });
                break;
            }
            this.turnAdd(this.garden.order.target, this.garden.order.size);
            console.log("turn:" + this.turn + ",score:" + this.garden.score);
            this.garden.extendBranch(this.depth);
        }
    }
}

module.exports = Lampyrisma;