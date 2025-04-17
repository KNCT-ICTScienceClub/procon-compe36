/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./orbitalSystem/lampyrisma");

let procon=new Lampyrisma(4);
procon.timer.start();
console.log(procon.encodedBoard);
procon.garden.evaluation();
console.log(procon.garden.score);
procon.garden.extendBranch(5);
procon.timer.end();
procon.timer.show();