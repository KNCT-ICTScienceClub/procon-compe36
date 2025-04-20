/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./orbitalSystem/lampyrisma");

let procon=new Lampyrisma(24,4,4);
procon.allLink();
procon.timer.end();
procon.timer.show();