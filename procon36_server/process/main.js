/*
cd ./procon36_server/process
*/

const Lampyrisma = require("./orbitalSystem/lampyrisma");
/*デバック用のボード
let board = [
    [0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17],
    [0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17]
]*/
//node --max-old-space-size=16000 main.js
let lampyrisma = new Lampyrisma(8, 10, 3, 270);
lampyrisma.makeProblemFile();
lampyrisma.allLink();
lampyrisma.makeAnswerFile();
lampyrisma.timer.end();
lampyrisma.timer.show();