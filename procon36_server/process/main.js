/*
cd ./procon36_server/process
*/
const Procon=require("./functions/proconUtility");

let procon=new Procon(4);
procon.engage([0,0],3);
procon.engage([1,2],2);
procon.makeAnswer();