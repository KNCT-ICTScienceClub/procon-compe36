class EntityInfo {
    position;
    vector;
    direction;
    distance;

    initialize(board){
        let size = board.length;
        this.position = new Array(size * size);
        this.vector = new Array(size * size);
        this.direction = new Array(size * size);
        this.distance = new Array(size * size);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                this.position[board[i][j]] = [j, i];
            }
        }
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] % 2 == 0) {
                    this.update(board[i][j]);
                }
            }
        }
    }

    copyInfo(source){
        this.position=[...source.position];
        this.vector=[...source.vector];
        this.distance=[...source.distance];
        this.direction=[...source.direction];
    }

    update(value) {
        let pair = (value % 2 == 0 ? value + 1 : value - 1);
        this.vector[value] = [this.position[pair][0] - this.position[value][0], this.position[pair][1] - this.position[value][1]];
        this.vector[pair] = [-this.vector[value][0], -this.vector[value][1]];
        this.distance[value] = Math.abs(this.vector[value][0]) + Math.abs(this.vector[value][1]);
        this.distance[pair] = this.distance[value];
        this.direction[value] = (this.vector[value][0] > 0 ? 2 : (this.vector[value][0] != 0) ? 5 : 1) * (this.vector[value][1] > 0 ? 3 : (this.vector[value][1] != 0) ? 7 : 1);
        this.direction[pair] = (this.vector[pair][0] > 0 ? 2 : (this.vector[pair][0] != 0) ? 5 : 1) * (this.vector[pair][1] > 0 ? 3 : (this.vector[pair][1] != 0) ? 7 : 1);
    }

    matching(value) {
        if (this.distance[value] != 1) {
            let target = [...this.position[value]];
            switch (this.direction[value]) {
                case 3:
                case 15:
                    target[0] += 1;
                    break;
                case 7:
                case 14:
                    target[1] += 1;
                    break;
                case 5:
                case 35:
                    target[0] += 1;
                    target[1] += 1;
                    break;
            }
            if (this.direction[value] % 3 == 0) {
                target[0] -= this.vector[value][1];
            }
            if (this.direction[value] % 5 == 0) {
                target[0] += this.vector[value][0];
                target[1] += this.vector[value][0];
            }
            if (this.direction[value] % 7 == 0) {
                target[1] += this.vector[value][1];
            }
            return { target: target, size: this.distance[value] };
        }
        return false;
    }
}

module.exports=EntityInfo;