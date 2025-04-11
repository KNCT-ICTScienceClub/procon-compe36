/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./functions/orbitalSystem");

let procon=new Lampyrisma(4);
procon.timer.start();
console.log(procon.boardValue);
procon.engage(procon.board,[0,0],2);
console.log(procon.boardValue);
procon.board.flat().map(element=>console.log(element.position));
procon.timer.end();
procon.timer.show();