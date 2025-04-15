class Garden {
    board;
    size;
    entity;
    branch;
    score;
    depth;
    index;

    constructor(board, entity, depth, index) {
        this.board = board;
        this.size=board.length;
        this.score = 0;
        this.depth = depth;
        this.index = index;
        this.entity = entity;
    }

    addBranch() {
        this.branch.push(new Garden(this.board, this.entity));
    }

    engage(position, size, reverse = false) {
        if ((position?.length ?? 0) < 2) {
            throw new RangeError("positionの要素数は2つ必要です.\n問題箇所--->engage(board=<object>,position=" + position + "...");
        }
        else if (board[0].length < position[0] + size || board.length < position[1] + size) {
            throw new RangeError("選択範囲がboardからはみ出しています.\n問題箇所--->engage(board=<object>,position=" + position + ",size=" + size + "...");
        }
        let area = new Array(size).fill(0).map(() => [...Array(size)]);
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
                    this.entity.position[area[j][i]] = [i, j];
                    this.entity.update(area[j][i]);
                }
                else {
                    this.board[i + position[1]][j + position[0]] = area[i][j];
                    this.entity.position[area[i][j]] = [j, i];
                    this.entity.update(area[i][j]);
                }
            }
        }
    }

    evaluation() {
        let horizonContinuity=new Array(this.size);
        let verticalContinuity=new Array(this.size);
        for(let i=0;i<this.size;i++){
            horizonContinuity[i]=true;
            verticalContinuity[i]=true;
            for(let j=0;j<this.size;j++){
                if(this.entity[this.board[i][j]].distance==1){
                    this.score+=1;
                }
                else{
                    horizonContinuity[i]=false;
                }
                if(this.entity[this.board[j][i]].distance!=1){
                    verticalContinuity[i]=false;
                }
            }
        }
        
    }
}

module.exports = Garden;