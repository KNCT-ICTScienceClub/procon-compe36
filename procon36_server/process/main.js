/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./orbitalSystem/lampyrisma");

let lampyrisma=new Lampyrisma(8,10,3);
lampyrisma.makeProblemFile();
lampyrisma.allLink();
lampyrisma.makeAnswerFile();
lampyrisma.timer.end();
lampyrisma.timer.show();