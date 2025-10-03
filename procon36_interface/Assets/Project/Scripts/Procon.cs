using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// プロコンの問題を解く機能を持つクラス
/// </summary>
[Serializable]
public class Procon
{
    /// <summary>
    /// 盤面のサイズ (4~24)
    /// </summary>
    [SerializeField, Range(4, 24)] private int fieldSize;
    /// <summary>
    /// ペアができている全てのエンティティの座標
    /// </summary>
    public List<Pair> pairs = new();
    /// <summary>
    /// <see cref="Engage"/> 実行時に発火するイベントを登録する
    /// <para>3つの引数を渡す</para>
    /// <para>1. 現在の問題の状態 (problem)</para>
    /// <para>2. 現在できているペア (pairs)</para>
    /// <para>3. 現在のターン数 (turn)</para>
    /// </summary>
    public event Action<int[,], List<Pair>, int> OnEngage;
    /// <summary>
    /// 問題の初期状態
    /// </summary>
    // 実装はしていないがこの配列を使えば最初の状態に戻ることができる
    // 必要なさそうな気がするから消しても良いが、Initialization関数の中身をうまいことしないいけないかも
    public int[,] initialProblem;
    /// <summary>
    /// 現在の問題の状態を表す
    /// </summary>
    public int[,] problem = new int[24, 24];
    /// <summary>
    /// 操作手順を表す
    /// </summary>
    public List<Order> orders = new();
    /// <summary>
    /// <see cref="IsUseOrders"/> が <c>false</c> のときに代わりに使用するターン数のカウンタ 
    /// </summary>
    private int turn = 0;
    /// <summary>
    /// <see cref="orders"/> に操作履歴を記録するか
    /// </summary>
    /// <remarks>
    /// 回答のリプレイをするときは使用しない (<c>false</c>にする) のが良い
    /// </remarks>
    public bool IsUseOrders { get; set; } = true;
    /// <summary>
    /// 問題フィールドのサイズ
    /// </summary>
    public int FieldSize => fieldSize;
    /// <summary>
    /// 現在のターン数を調べる
    /// </summary>
    public int Turn => IsUseOrders ? orders.Count : turn;

    /// <summary>
    /// 操作を記録するためのクラス
    /// </summary>
    [Serializable]
    public class Order
    {
        /// <summary>
        /// 座標
        /// </summary>
        public Vector2 position;
        /// <summary>
        /// サイズ
        /// </summary>
        public int size;

        /// <summary>
        /// コンストラクタ(Vector2で指定するのに注意)
        /// </summary>
        /// <param name="position">座標</param>
        /// <param name="size">サイズ</param>
        public Order(Vector2 position, int size)
        {
            this.position = position;
            this.size = size;
        }
        /// <summary>
        /// 送信用の操作記録 (<see cref="SendData.Ops"/>) からこのクラス形式に変換する
        /// </summary>
        /// <param name="ops"><see cref="SendData.Ops"/> 形式の操作履歴</param>
        /// <returns>変換後のデータ</returns>
        public static Order FromOps(SendData.Ops ops) => new(new(ops.x, ops.y), ops.n);
    }

    /// <summary>
    /// ペアになっているエンティティのそれぞれの座標
    /// </summary>
    [Serializable]
    public struct Pair
    {
        /// <summary>
        /// 一方のエンティティの座標
        /// </summary>
        public Vector2Int a;
        /// <summary>
        /// もう一方のエンティティの座標
        /// </summary>
        public Vector2Int b;
        public Pair(Vector2Int a, Vector2Int b)
        {
            this.a = a;
            this.b = b;
        }
    }

    /// <summary>
    /// 外部からJSONを読み込んで問題を生成する
    /// </summary>
    public Procon()
    {
        // 問題データの読み込みと反映
        ReceiveData.Load("problem", out ReceiveData receiveData);
        fieldSize = receiveData.problem.field.size;
        initialProblem = new int[fieldSize, fieldSize];
        for (int i = 0; i < fieldSize; i++)
        {
            for (int j = 0; j < fieldSize; j++)
            {
                initialProblem[i, j] = receiveData.problem.field.entities[i * fieldSize + j];
            }
        }
        // 問題の初期化
        Initialize();
    }
    /// <summary>
    /// フィールドサイズを指定して問題を生成する
    /// </summary>
    /// <param name="size">フィールドのサイズ</param>
    public Procon(int size)
    {
        // 問題のサイズは偶数であるため奇数であると数値を自動で+1する
        if (size % 2 == 1)
        {
            size++;
        }
        this.fieldSize = size;
        MakeProblem();
    }

    /// <summary>
    /// 問題を初期化する関数
    /// 使用しない場所の数値はとりあえず999にしとく
    /// </summary>
    // initialProblemの説明にも書いてあるがいちいちこの関数を仲介する意味はあまりなくダイレクトに代入して良い気がする
    public void Initialize()
    {
        for (int i = 0; i < 24; i++)
        {
            for (int j = 0; j < 24; j++)
            {
                if (i < fieldSize && j < fieldSize)
                {
                    problem[i, j] = initialProblem[i, j];
                }
                else
                {
                    problem[i, j] = 999;
                }
            }
        }
    }
    /// <summary>
    /// 問題を自動生成する関数
    /// </summary>
    void MakeProblem()
    {
        initialProblem = new int[fieldSize, fieldSize];
        // 一旦一次元で配列を作る
        int[] array = new int[fieldSize * fieldSize];
        int count = -1;
        // 配列には[0, 0, 1, 1, 2, 2, 3 ...]と代入される
        for (int i = 0; i < fieldSize * fieldSize; i++)
        {
            array[i] = (int)Mathf.Floor((count += 1) / 2);
        }
        // 前回も使用したがフィッシャー–イェーツのシャッフルによってシャッフルを行う
            for (int i = 0; i < fieldSize * fieldSize - 1; i++)
            {
                int random = UnityEngine.Random.Range(i + 1, fieldSize * fieldSize);
                (array[random], array[i]) = (array[i], array[random]);
            }
            // 一次元の配列を2次元に変換
            for (int i = 0; i < fieldSize; i++)
            {
                for (int j = 0; j < fieldSize; j++)
                {
                    initialProblem[i, j] = array[i * fieldSize + j];
                }
            }
        Initialize();
    }
    /// <summary>
    /// 指定した範囲を90度回転させる
    /// </summary>
    /// <remarks><i>導き</i></remarks>
    /// <param name="position">左上の座標</param>
    /// <param name="size">サイズ</param>
    public void Engage(Vector2 position, int size)
    {
        // 転置して配列を反転させると90度右回転する
        int[,] cell = new int[size, size];
        for (int i = 0; i < size; i++)
        {
            int[] array = new int[size];
            for (int j = 0; j < size; j++)
            {
                // 転置したいので縦列を読み込む
                array[j] = problem[(int)position.y + j, (int)position.x + i];
            }
            // 配列を左右反転
            Array.Reverse(array);
            for (int j = 0; j < size; j++)
            {
                cell[i, j] = array[j];
            }
        }
        // 変形した配列を元に戻す
        for (int i = 0; i < size; i++)
        {
            for (int j = 0; j < size; j++)
            {
                problem[(int)position.y + i, (int)position.x + j] = cell[i, j];
            }
        }
        // orderに操作を追加
        if (IsUseOrders)
        {
            orders.Add(new(position, size));
        }
        else
        {
            turn++;
        }
        
        OnEngage?.Invoke(problem, FindPairs(), Turn);
    }
    /// <summary>
    /// 一手操作を戻す関数
    /// </summary>
    public void TurnBack()
    {
        // 90度左回転させる
        void ReverseEngage(Vector2 position, int size)
        {
            // 配列を反転した後に転置をすると90度左回転する
            int[,] cell = new int[size, size];
            for (int i = 0; i < size; i++)
            {
                int[] array = new int[size];
                for (int j = 0; j < size; j++)
                {
                    array[j] = problem[(int)position.y + i, (int)position.x + j];
                }
                // 配列を左右反転
                Array.Reverse(array);
                for (int j = 0; j < size; j++)
                {
                    cell[i, j] = array[j];
                }
            }
            // 変形した配列を転置して元に戻す
            for (int i = 0; i < size; i++)
            {
                for (int j = 0; j < size; j++)
                {
                    problem[(int)position.y + j, (int)position.x + i] = cell[i, j];
                }
            }
            
            OnEngage?.Invoke(problem, FindPairs(), Turn);
        }
        // orderの操作を削除
        if (IsUseOrders)
        {
            ReverseEngage(orders[orders.Count - 1].position, orders[orders.Count - 1].size);
            orders.RemoveAt(orders.Count - 1);
        }
        else
        {
            turn--;
            ReverseEngage(orders[turn].position, orders[turn].size);
        }
    }

    /// <summary>
    /// 現在ペアになっているエンティティを探す
    /// </summary>
    /// <returns>全てのペア（<c>Count</c> プロパティでペアの数を取得可能）</returns>
    private List<Pair> FindPairs()
    {
        // リストをクリアして探し直し
        pairs.Clear();
        // 下と右方向の隣同士を比較していく
        for (int i = 0; i < fieldSize; i++)
        {
            for (int j = 0; j < fieldSize; j++)
            {
                if (i + 1 < fieldSize && j + 1 < fieldSize)
                {
                    if (problem[i, j] == problem[i + 1, j])
                    {
                        // 実際の画面表示に合うようにxy座標を反対にして追加しておく
                        pairs.Add(new(new(j, i), new(j, i + 1)));
                    }
                    if (problem[i, j] == problem[i, j + 1])
                    {
                        pairs.Add(new(new(j, i), new(j + 1, i)));
                    }
                }
                // 下か右隣を数えるとはみ出してしまいそうなときはどっちかしか数えん
                else if (i == fieldSize - 1 && j + 1 < fieldSize)
                {
                    if (problem[i, j] == problem[i, j + 1])
                    {
                        pairs.Add(new(new(j, i), new(j + 1, i)));
                    }
                }
                else if (j == fieldSize - 1 && i + 1 < fieldSize)
                {
                    if (problem[i, j] == problem[i + 1, j])
                    {
                        pairs.Add(new(new(j, i), new(j, i + 1)));
                    }
                }
            }
        }
        return pairs;
    }

    /// <summary>
    /// 問題jsonのクラスの形式
    /// </summary>
    [Serializable]
    public class ReceiveData : CommunicationData<ReceiveData>
    {
        public int startAt;
        public Problem problem = new();
        [Serializable]
        public class Problem
        {
            public Field field = new();
            [Serializable]
            public class Field
            {
                public int size;
                public int[] entities;
            }
        }
    }
    /// <summary>
    /// 回答jsonのクラスの形式
    /// </summary>
    [Serializable]
    public class SendData : CommunicationData<SendData>
    {
        public Ops[] ops;
        [Serializable]
        public class Ops
        {
            public int x;
            public int y;
            public int n;
        }
    }
}