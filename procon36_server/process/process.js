const Lampyrisma = require("./orbitalSystem/lampyrisma");

process.once("message", ({ board, depth, width, timeLimit }) => {

    let lampyrisma = new Lampyrisma(board, depth, width, timeLimit);

    lampyrisma.makeProblemFile();
    lampyrisma.allLink();
    lampyrisma.makeAnswerFile();
    lampyrisma.timer.end();
    lampyrisma.timer.show();

    process.send()
    process.exit();
});
