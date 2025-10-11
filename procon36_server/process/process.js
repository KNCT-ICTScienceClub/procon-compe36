const Lampyrisma = require("./orbitalSystem/lampyrisma");

process.once("message", ({ board, depth, width, timeLimit }) => {

    let lampyrisma = new Lampyrisma(board, depth, width, timeLimit);

    lampyrisma.makeProblemFile();
    lampyrisma.allLink();
    const answer = lampyrisma.makeAnswerFile();

    console.log(`手数: ${answer.ops?.length}`);
    lampyrisma.timer.end();
    lampyrisma.timer.show();

    process.send(answer);
    process.exit();
});
