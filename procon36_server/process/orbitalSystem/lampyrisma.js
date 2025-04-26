const Procon = require("../utility/proconUtility");
const Trunk = require("./garden");
const EntityInfo = require("./entityInfo");

class Lampyrisma extends Procon {
    garden;
    encodedBoard;
    entity;
    width;
    depth;
    goal;

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
            let goal=[];
            this.garden.pruning(highScoreIndex, this.depth, goal);
            if (goal.length==0) {
                highScoreIndex.sort((a, b) => b.score - a.score);
                let duplicate = [...Array(this.width).fill(0)];
                let i = 0;
                while (highScoreIndex[0].score == highScoreIndex[i].score && i < highScoreIndex.length) {
                    duplicate[highScoreIndex[i++].index]++;
                }
                this.garden = this.garden.branch[duplicate.indexOf(Math.max(...duplicate))];
            }
            else {
                goal[0].map(index => {
                    this.garden = this.garden.branch[index];
                    this.turnAdd(this.garden.order.position, this.garden.order.size);
                    console.log("turn:" + this.turn + ",score:" + this.garden.score+",左端:"+this.entity.continuity.vertical.head+",右端:"+this.entity.continuity.vertical.end+",上端:"+this.entity.continuity.horizon.head+",下端:"+this.entity.continuity.horizon.end);
                });
                break;
            }
            this.turnAdd(this.garden.order.position, this.garden.order.size);
            console.log("turn:" + this.turn + ",score:" + this.garden.score+",左端:"+this.entity.continuity.vertical.head+",右端:"+this.entity.continuity.vertical.end+",上端:"+this.entity.continuity.horizon.head+",下端:"+this.entity.continuity.horizon.end);
            this.garden.extendBranch(this.depth);
        }
    }
}

module.exports = Lampyrisma;