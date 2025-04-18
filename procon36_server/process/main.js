/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./orbitalSystem/lampyrisma");

let procon=new Lampyrisma(8);
procon.timer.start();
procon.garden.evaluation();
console.log(procon.garden.score);
console.log("result");
procon.garden.extendBranch(50);
procon.timer.end();
procon.timer.show();