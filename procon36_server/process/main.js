/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./functions/orbitalSystem");

let procon=new Lampyrisma(24);
procon.timer.start();
console.log(procon.board);
procon.makeAnswerFile();
procon.makeProblemFile();
procon.timer.end();
procon.timer.show();