# 全国高専プロコン 第36回松江大会 競技部門 呉高専 ソースリポジトリ
## 使用言語・ライブラリ・フォントと開発環境
### バックエンド
- Node.js
  - [Express](https://expressjs.com)
  - [lodash](https://lodash.com)
  
### フロントエンド
- Unity
  - [Version](https://unity.com/ja/releases/editor/whats-new/6000.0.37f1)

## 画面一覧
### Process
- VSCode上でmain.jsファイルを実行します。
- コンストラクタの引数に二次元配列を渡すとそれを問題とみなします。数値nを与えるとn×nの問題をランダムに生成します。
- 回答のjsonファイルが作成されます。ランダムに問題を生成した場合受け取った問題のjsonファイルが作成されます。


![screenshot of process](/ReadmeImage/process_view.jpg)

### Visualizer
- 問題のjsonファイルがあればそれを元に初期盤面を表示します。　　
- 回答のjsonファイルがある場合自動で操作を再現します。　　
  - モードを変更すれば手動で問題を解くこともできます。　　

![screenshot of visualizer](/ReadmeImage/visualizer_view.jpg)

## 開発者
- メインプログラム・アルゴリズム： @stonekiln
- GUI・通信： @PopCorn-Xeno
