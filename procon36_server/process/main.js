/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./functions/orbitalSystem");

let procon=new Lampyrisma(24,5,5);
procon.timer.start();
for(let i=0;i<1000000;i++){
    procon.engage(procon.board,[2,2],20);
}
procon.timer.end();
procon.timer.show();