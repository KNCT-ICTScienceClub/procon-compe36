/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./orbitalSystem/lampyrisma");

let procon=new Lampyrisma(4);
procon.timer.start();
console.log(procon.board);
for(let i=0;i<16;i++){
    console.log(procon.entities.matching(i));
}
console.log(procon.board);
/*for(let i=0;i<100000;i++){
    procon.engage(procon.board,[1,1],23);
}*/
procon.timer.end();
procon.timer.show();