using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// プロコンの問題を解く機能を持つクラス
/// </summary>
[Serializable]
public class Procon
{
    [SerializeField, Range(4, 24)] private int fieldSize;
    [SerializeField] private bool isUseJSON = false;
    [SerializeField] private bool isRandom = true;
    /// <summary>
    /// 問題の初期状態
    /// </summary>
    // 実装はしていないがこの配列を使えば最初の状態に戻ることができる
    // 必要なさそうな気がするから消しても良いが、Initialization関数の中身をうまいことしないいけないかも => リセット機能つくります
    public int[,] initialProblem;
    /// <summary>
    /// 現在の問題の状態を表す
    /// </summary>
    public int[,] problem = new int[24, 24];
    /// <summary>
    /// 問題フィールドのサイズ
    /// </summary>
    public int FieldSize => fieldSize;
    /// <summary>
    /// 操作手順を表す
    /// </summary>
    List<Order> orders = new();
    /// <summary>
    /// 操作を記録するためのクラス
    /// </summary>
    class Order
    {
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
        /// 座標
        /// </summary>
        public Vector2 position;
        /// <summary>
        /// サイズ
        /// </summary>
        public int size;
    }

    /// <summary>
    /// 外部からJSONを読み込んで問題を生成する
    /// </summary>
    public Procon()
    {
        // 問題のJSONを読み込む
        string jsonFile = File.ReadAllText("../procon36_server/informationLog/problem.json", System.Text.Encoding.GetEncoding("utf-8"));
        ReceiveData receiveData = JsonUtility.FromJson<ReceiveData>(jsonFile);
        fieldSize = receiveData.problem.field.size;
        initialProblem = new int[fieldSize, fieldSize];
        for (int i = 0; i < fieldSize; i++)
        {
            for (int j = 0; j < fieldSize; j++)
            {
                initialProblem[i, j] = receiveData.problem.field.entities[i * fieldSize + j];
            }
        }
        Initialize();
    }
    /// <summary>
    /// フィールドサイズを指定して問題を生成する
    /// </summary>
    /// <param name="size">フィールドのサイズ</param>
    /// <param name="randomFlag"><c>true</c>にすると自動で生成した問題をシャッフルする</param>
    public Procon(int size, bool randomFlag)
    {
        // 問題のサイズは偶数であるため奇数であると数値を自動で+1する
        if (size % 2 == 1)
        {
            size++;
        }
        this.fieldSize = size;
        MakeProblem(randomFlag);
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
    /// <param name="isRandom">問題をシャッフルするかどうか</param>
    void MakeProblem(bool isRandom)
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
        if (isRandom)
        {
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
        orders.Add(new(position, size));
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
        }
        ReverseEngage(orders[orders.Count - 1].position, orders[orders.Count - 1].size);
        // orderの操作を削除
        orders.RemoveAt(orders.Count - 1);
    }
    
    /// <summary>
    /// 隣り合った数値が同じである要素の数
    /// </summary>
    public int PairCount
    {
        get
        {
            int count = 0;
            for (int i = 0; i < fieldSize - 1; i++)
            {
                for (int j = 0; j < fieldSize - 1; j++)
                {
                    if (problem[i, j] == problem[i + 1, j] || problem[i, j] == problem[i, j + 1])
                    {
                        count++;
                    }
                }
            }
            return count;
        }
    }
    /// <summary>
    /// 現在のターン数を調べる
    /// </summary>
    public int Turn => orders.Count;

    /// <summary>
    /// 問題jsonのクラスの形式
    /// </summary>
    [Serializable]
    public class ReceiveData
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
    public class SendData
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