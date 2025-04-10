/*
cd ./procon36_server/process
*/
const Lampyrisma=require("./functions/orbitalSystem");

let procon=new Lampyrisma(2);

procon.timer.start();
console.log(procon.currentBoard);
console.log("--------");
procon.turnAdd([1,1],2);
procon.turnBack();
console.log(procon.currentBoard);
procon.timer.end();
procon.timer.show();