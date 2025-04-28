class EntityInfo {
    size;
    position;
    vector;
    direction;
    distance;
    continuity = new Continuity();

    initialize(board) {
        this.size = board.length;
        this.position = new Array(this.size * this.size);
        this.vector = new Array(this.size * this.size);
        this.direction = new Array(this.size * this.size);
        this.distance = new Array(this.size * this.size);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.position[board[i][j]] = [j, i];
            }
        }
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (board[i][j] % 2 == 0) {
                    this.update(board[i][j]);
                }
            }
        }
    }

    copyInfo(source) {
        this.size = source.size;
        this.position = [...source.position];
        this.vector = [...source.vector];
        this.distance = [...source.distance];
        this.direction = [...source.direction];
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
        let target = new Target(this.position[value], this.distance[value], 1);
        switch (this.direction[value]) {
            case 3:
            case 15:
                target.position[0] += 1;
                break;
            case 7:
            case 14:
                target.position[1] += 1;
                break;
            case 5:
            case 35:
                target.position[0] += 1;
                target.position[1] += 1;
                break;
        }
        if (this.direction[value] % 3 == 0) {
            target.position[0] -= this.vector[value][1];
        }
        if (this.direction[value] % 5 == 0) {
            target.position[0] += this.vector[value][0];
            target.position[1] += this.vector[value][0];
        }
        if (this.direction[value] % 7 == 0) {
            target.position[1] += this.vector[value][1];
        }
        return target;
    }

    adjusting(value) {
        let aim = [
            { direction: 2, size: this.size - this.continuity.vertical.end - this.position[value][0] },
            { direction: 3, size: this.size - this.continuity.horizon.end - this.position[value][1] },
            { direction: 5, size: this.position[value][0] - this.continuity.vertical.head + 1 },
            { direction: 7, size: this.position[value][1] - this.continuity.horizon.head + 1 }
        ];
        const setTarget = (aim) => {
            switch (aim.direction) {
                case 2:
                    return new Target(this.position[value], aim.size, 2);
                case 3:
                    return new Target([this.position[value][0] - aim.size + 1, this.position[value][1]], aim.size, 2);
                case 5:
                    return new Target([this.position[value][0] - aim.size + 1, this.position[value][1] - aim.size + 1], aim.size, 2);
                case 7:
                    return new Target([this.position[value][0], this.position[value][1] - aim.size + 1], aim.size, 2);
            }
        }
        let target;
        switch (this.direction[value]) {
            case 2:
                aim[2].size++;
                aim = aim.reduce((previous, current) => previous.size > current.size ? current : previous);
                target = setTarget(aim);
                switch (aim.direction) {
                    case 3:
                        target.position[0]++;
                        break;
                    case 5:
                        target.position[0]++;
                        break;
                }
                break;
            case 3:
                aim[3].size++;
                aim = aim.reduce((previous, current) => previous.size > current.size ? current : previous);
                target = setTarget(aim);
                switch (aim.direction) {
                    case 5:
                        target.position[1]++;
                        break;
                    case 7:
                        target.position[1]++;
                        break;
                }
                break;
            case 5:
                aim[0].size++;
                aim = aim.reduce((previous, current) => previous.size > current.size ? current : previous);
                target = setTarget(aim);
                switch (aim.direction) {
                    case 2:
                        target.position[0]--;
                        break;
                    case 7:
                        target.position[0]--;
                        break;
                }
                break;
            case 7:
                aim[1].size++;
                aim = aim.reduce((previous, current) => previous.size > current.size ? current : previous);
                target = setTarget(aim);
                switch (aim.direction) {
                    case 2:
                        target.position[1]--;
                        break;
                    case 3:
                        target.position[1]--;
                        break;
                }
                break;
        }
        return target;
    }
}

class Target {
    position;
    size;
    type;
    constructor(position, size, type) {
        this.position = [...position];
        this.size = size;
        this.type = type;
    }
}

class Continuity {
    horizon = {
        headFlag: 0,
        endFlag: 0
    };
    vertical = {
        headFlag: 0,
        endFlag: 0
    };
}

module.exports = EntityInfo;