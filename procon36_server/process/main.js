/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./orbitalSystem/lampyrisma");

let procon=new Lampyrisma(6);
procon.timer.start();
console.log(procon.board);
procon.garden.evaluation();
console.log(procon.garden.score);
procon.garden.extendBranch();
procon.timer.end();
procon.timer.show();