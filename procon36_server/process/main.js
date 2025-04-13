/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./functions/orbitalSystem");

let procon=new Lampyrisma(4,5,5);
procon.timer.start();
console.log(procon.board);
console.log(procon.position);
for(let i=0;i<16;i++){
    console.log(procon.calcCenter(i));
}
procon.timer.end();
procon.timer.show();