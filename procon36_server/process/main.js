/*
cd ./procon36_server/process
*/

const Lampyrisma = require("./orbitalSystem/lampyrisma");
/*デバック用のボード
let board = [
    [0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17],
    [0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17]
]*/
let array=[];
let test=[];
[
    69,
    0,
    21,
    33,
    22,
    19,
    20,
    45,
    49,
    5,
    60,
    31,
    30,
    51,
    49,
    63,
    24,
    68,
    66,
    68,
    58,
    12,
    59,
    48,
    38,
    53,
    15,
    26,
    28,
    57,
    64,
    13,
    65,
    48,
    60,
    63,
    0,
    3,
    52,
    25,
    54,
    10,
    62,
    42,
    23,
    1,
    5,
    33,
    47,
    7,
    26,
    43,
    17,
    13,
    19,
    53,
    4,
    40,
    50,
    32,
    71,
    61,
    28,
    44,
    58,
    8,
    24,
    9,
    55,
    62,
    12,
    2,
    52,
    47,
    25,
    41,
    39,
    64,
    37,
    46,
    46,
    32,
    67,
    59,
    34,
    8,
    1,
    29,
    34,
    41,
    29,
    23,
    6,
    7,
    56,
    55,
    61,
    39,
    15,
    65,
    6,
    38,
    36,
    44,
    31,
    27,
    40,
    43,
    16,
    37,
    70,
    14,
    11,
    56,
    18,
    50,
    42,
    2,
    57,
    35,
    4,
    22,
    9,
    35,
    71,
    16,
    11,
    18,
    30,
    36,
    17,
    10,
    27,
    3,
    45,
    66,
    51,
    21,
    70,
    14,
    54,
    69,
    20,
    67
   ].forEach((element,index)=>{
    if(index%12==11){
        test.push(element);
        array.push(test);
        test=[];
    }
    else{
        test.push(element);
    }
   })
let lampyrisma = new Lampyrisma(24, 4, 3);
lampyrisma.makeProblemFile();
lampyrisma.allLink();
lampyrisma.makeAnswerFile();
lampyrisma.timer.end();
lampyrisma.timer.show();