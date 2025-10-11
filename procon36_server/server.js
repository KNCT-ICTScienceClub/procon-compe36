const express = require("express");
const { spawn, fork, ChildProcess } = require("child_process");
const path = require("path");

const isFinal = true;

const app = express();
const port = 5500;
const targetURL = isFinal ? "http://172.19.0.1:80" : "http://localhost:3001";

const server = app.listen(port, async (err) => {
    
    if (!err) {
        // サーバーを開いたことを通知
        console.log(`サーバーを ポート ${ port } で開きました。`);
        
        // 現在の進捗を表す「.」の数
        let progressDotCount = 0;

        /**
         * 「.」の数で進捗を表し、ログを吐く
         * @param {string} message メッセージ
         * @param {number} ms 進捗ドットの更新間隔
         */
        const progressLog = async (message, ms) => {
            // GPT参考
            await new Promise((resolve) => {
                            setTimeout(() => {
                                resolve();
                                progressDotCount = progressDotCount > 3 ? 0 : progressDotCount;
                                process.stdout.clearLine();
                                process.stdout.write(`\r${ message }` + ".".repeat(progressDotCount));
                                ++progressDotCount;
                            }, ms)}
                        );
        }

        /**
         * 試合情報を取得する
         */
        const getMatchInfo = async () => {

            /**
             * @type { Response | undefined }
             * fetch からのレスポンスを格納
             */
            let response;

            /**
             * @type { { "startAt": number, "problem": {} | undefined } | undefined }
             * レスポンス結果を格納
             * 一発で "problem" が取得できない場合があったので、ループさせるようにしている
             */
            let result = undefined;

            /**
             * @type {Error | null}
             * レスポンス待機中（次のループ）でエラーが出た場合それを保存する変数
             */
            let errorCache = null;

            // "problem" データが返ってくるまで繰り返し
            while (!result?.problem) {

                // レスポンスがOKステータスになるまで繰り返す
                // ほんとはここの条件式でそれを明示したかったが、
                // OKになったあとも処理が少しあるので、それを考慮して全体としては無限ループに
                while (true) {

                    // レスポンスを検証
                    try {
                        response = await fetch(targetURL.concat("/"), {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                "Procon-Token": "kurec526e1864ceff3498f856380652755122e46e659d433c1df12883fb3cfe1"
                            }
                        });

                        // OKステータス (200) が返ってきたら
                        if (response.ok) {
                            // この時既に何らかの結果が格納されていた場合
                            // -> 大方 "problem" が取得できなかった場合
                            if (result) {
                                if (!result.problem) {
                                    // データ取得中のログを吐く
                                    await progressLog("データ取得中", 250);
                                }
                            }
                            // 上記以外で、エラーのキャッシュがあるとき
                            // 一度はこのループに失敗しているということなので、
                            // catch 式部分のログは、少なくとも一回は出てる状態
                            else if (errorCache) {
                                // stdout のせいで改行できないなので、改行しておく
                                process.stdout.write("\n");
                            }
                            break;
                        }

                        // 例外処理
                        switch (response?.status) {
                            // 401 Unauthorized: トークンが違う
                            case 401:
                                console.error("Token is wrong.");
                                process.exit(-1);
                            // 403 Forbidden: サーバーは起動しているが試合がまだ開かれていない
                            case 403:
                                // process.stderr.write("\rMatch isn't held.\n");
                                await progressLog("Match isn't held", 400);
                                break;
                            // 404 Not found: URLが間違っている
                            case 404:
                                console.error("URL is wrong.");
                                process.exit(-1);
                            default:
                                console.error(`${response.status}: unexpected error`);
                                process.exit(-1);
                        }
                        
                    }
                    catch (err) {
                        // エラーキャッシュ保存
                        errorCache = err;
                        await progressLog("サーバーに接続中", 500);
                    }
                }

                // 結果を取得
                result = await response.json();
            }

            // もしレスポンスのループでエラーが一回もでなかったら
            // L87 行付近でもう既に解放してるので改行はいらない！
            if (errorCache) {
                process.stdout.write("\n");
            }

            console.log(`データの取得が終了しました。`);
            process.stdout.write("\n");
            console.log(result);
            process.stdout.write("\n");

            return result;
        };
        
        /**
         * 問題を解くプロセスを子プロセスで立ち上げて、結果を受け取る
         * @param {number[][]} board 問題のボード（エンティティの集合体）
         * @param {number} depth 探索の深さ
         * @param {number} width 探索の幅
         * @param {number} timeLimit 制限時間(sec)
         */
        const forkProcess = async (board, depth, width, timeLimit) => {

            // process.js の終了まで待機可能
            return new Promise((resolve, reject) => {

                /**
                 * 回答
                 * @type {{ ops: { x: number, y: number, n: number }[] } | undefined}
                 */
                let result;

                /**
                 * process.js を子プロセスで起動したインスタンス
                 */
                let child = fork(path.resolve(__dirname, "./process/process.js"));

                // 子プロセス生成時、各データを送信する
                child.on("spawn", () => child.send({
                    board: board,
                    depth: depth,
                    width: width,
                    timeLimit: timeLimit
                }));

                // 子プロセスからメッセージが送信されたとき
                child.on("message", (data) => {
                    // 現段階では、process.js 側から送られてくるデータは、回答情報しかない
                    // ので、直に代入してしまう
                    // 向こう側で console.log した内容は別に送信内容と関係ない
                    result = data;
                });

                // 子プロセスが終了したら、Promise を解決する
                child.on("exit", () => {
                    if (result) {
                        resolve(result);
                    }
                    else {
                        // process.ks 内でエラーが起きた時の処理に相当
                        // もう一回プログラムを回すとかか書いてもいいかもやけど
                        reject(new Error("Error!"));
                    }
                });
            });
        }
        
        /**
         * 回答を送信する
         * 正常に送信できたらサーバーを閉じる
         * @param {{ ops: { x: number, y: number, n: number }[] }} answer 
         */
        const postAnswer = async (answer) => {

            if (answer) {
                /**
                 * リクエスト結果を格納
                 */
                let request = await fetch(targetURL.concat("/"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Procon-Token": "kurec526e1864ceff3498f856380652755122e46e659d433c1df12883fb3cfe1"
                    },
                    body: JSON.stringify(answer)
                });

                // 回答の受理が確認されたら、サーバーを閉じる
                if (request.ok) {
                    let res = await request.json();
                    console.log(`回答を送信しました。 [受理番号: ${ res.revision}]`);
                    server.close();
                }
            }
            else {
                throw new Error("回答データがありません。");
            }
        }

        const matchInfo = await getMatchInfo();

        const answer = await forkProcess(matchInfo.problem.field.entities, 7, 3, 270);
    
        await postAnswer(answer);
    }
});


