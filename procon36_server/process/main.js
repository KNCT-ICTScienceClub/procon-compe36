const Procon=require("./functions/commonFunctions");

let procon=new Procon(4);
procon.engage([0,0],3);
procon.engage([1,2],2);
procon.makeAnswer();