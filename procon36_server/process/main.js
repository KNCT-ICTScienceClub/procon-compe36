/*
cd ./procon36_server/process
*/

const Lampyrisma=require("./orbitalSystem/lampyrisma");

let lampyrisma=new Lampyrisma(8,10,3);
lampyrisma.allLink();
lampyrisma.makeProblemFile();
lampyrisma.makeAnswerFile();
lampyrisma.timer.end();
lampyrisma.timer.show();