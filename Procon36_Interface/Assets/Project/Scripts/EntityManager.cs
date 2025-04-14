using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class EntityManager : MonoBehaviour
{
    [SerializeField] Procon procon;
    /// <summary>
    /// フィールドのサイズ
    /// </summary>
    [SerializeField, Range(4, 24)] int fieldSize;
    /// <summary>
    /// コピー元となるエンティティ
    /// </summary>
    [SerializeField] GameObject originalEntity;
    /// <summary>
    /// コピー元となる水平方向のフレーム
    /// </summary>
    [SerializeField] GameObject originalVerticalFrame;
    /// <summary>
    /// コピー元となる垂直方向のフレーム
    /// </summary>
    [SerializeField] GameObject originalHorizontalFrame;
    /// <summary>
    /// コピー元となるエンティティの数値を表すテキストメッシュ
    /// </summary>
    [SerializeField] GameObject originalEntityText;
    /// <summary>
    /// エンティティの親となるオブジェクト
    /// </summary>
    [SerializeField] GameObject entityParent;
    /// <summary>
    /// フレームの親となるオブジェクト
    /// </summary>
    [SerializeField] GameObject frameParent;
    /// <summary>
    /// エンティティの数値を表すテキストメッシュの親となるオブジェクト
    /// </summary>
    [SerializeField] GameObject textParent;
    /// <summary>
    /// 選択範囲の枠のオブジェクト
    /// </summary>
    [SerializeField] GameObject selectArea;
    /// <summary>
    /// テーブルの枠のオブジェクト
    /// </summary>
    [SerializeField] GameObject tableFrame;
    /// <summary>
    /// 現在の状態を表すテキストメッシュ
    /// </summary>
    [SerializeField] TextMeshProUGUI statusText;
    /// <summary>
    /// trueにすると外部からjsonを読み込むようになる
    /// </summary>
    [SerializeField] bool receptionFlag;
    /// <summary>
    /// trueにすると自動で生成した問題をシャッフルするようになる
    /// </summary>
    [SerializeField] bool randomFlag;

    /// <summary>
    /// 今回のプロコン必要な関数をまとめたクラス
    /// </summary>
    [Serializable]
    class Procon
    {
        /// <summary>
        /// 外部からJSONを読み込んで問題を生成する
        /// </summary>
        public Procon()
        {
            // 問題のJSONを読み込む
            string jsonFile = File.ReadAllText("../procon36_server/informationLog/problem.json", Encoding.GetEncoding("utf-8"));
            ReceiveData receiveData = JsonUtility.FromJson<ReceiveData>(jsonFile);
            size = receiveData.problem.field.size;
            initialProblem = new int[size, size];
            for (int i = 0; i < size; i++)
            {
                for (int j = 0; j < size; j++)
                {
                    initialProblem[i, j] = receiveData.problem.field.entities[i * size + j];                    }
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
                this.size = size;
                MakeRandomProblem(randomFlag);
        }
        /// <summary>
        /// コピーしたエンティティの情報
        /// </summary>
        public GameObject[,] entities = new GameObject[24, 24];
        /// <summary>
        /// コピーしたフレームの情報が入るクラス
        /// </summary>
        public class Frame
        {
            /// <summary>
            /// 垂直方向のフレームの情報
            /// </summary>
            public GameObject[,] vertical = new GameObject[24, 23];
            /// <summary>
            /// 垂直方向のフレームの情報
            /// </summary>
            public GameObject[,] horizon = new GameObject[23, 24];
        }
        /// <summary>
        /// コピーしたフレームの情報
        /// </summary>
        public Frame frame = new();
        /// <summary>
        /// 問題の初期状態
        /// </summary>
        // 実装はしていないがこの配列を使えば最初の状態に戻ることができる
        // 必要なさそうな気がするから消しても良いが、Initialization関数の中身をうまいことしないいけないかも => リセット機能つくります
        int[,] initialProblem;
        /// <summary>
        /// 現在の問題の状態を表す
        /// </summary>
        int[,] problem = new int[24, 24];
        /// <summary>
        /// フィールドのサイズを表す
        /// </summary>
        private int size;
        /// <summary>
        /// 問題フィールドのサイズ
        /// </summary>
        public int Size => size;
        /// <summary>
        /// エンティティの数値を表す
        /// </summary>
        public GameObject[,] entityNumbers = new GameObject[24, 24];
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
                    if (i < size && j < size)
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
        /// <param name="randomFlag">問題をシャッフルするかどうか</param>
        void MakeRandomProblem(bool randomFlag)
        {
            initialProblem = new int[size, size];
            // 一旦一次元で配列を作る
            int[] array = new int[size * size];
            int count = -1;
            // 配列には[0, 0, 1, 1, 2, 2, 3 ...]と代入される
            for (int i = 0; i < size * size; i++)
            {
                array[i] = (int)Mathf.Floor((count += 1) / 2);
            }
            if (randomFlag)
            {
                // 前回も使用したがフィッシャー–イェーツのシャッフルによってシャッフルを行う
                for (int i = 0; i < size * size - 1; i++)
                {
                    int random = UnityEngine.Random.Range(i + 1, size * size);
                    (array[random], array[i]) = (array[i], array[random]);
                }
                // 一次元の配列を2次元に変換
                for (int i = 0; i < size; i++)
                {
                    for (int j = 0; j < size; j++)
                    {
                        initialProblem[i, j] = array[i * size + j];
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
            // ボードの数値が変わったので表示を更新
            SetColor();
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
            // ボードの数値が変わったので表示を更新
            SetColor();
        }
        /// <summary>
        /// エンティティをボードの数値に合わせて色を付ける
        /// </summary>
        public void SetColor()
        {
            for (int i = 0; i < size; i++)
            {
                for (int j = 0; j < size; j++)
                {
                    Renderer renderer = entities[i, j].GetComponent<Renderer>();
                    // 数値によって同じ色相の色を3個作り普通の色と、彩度を半分にした色と、明度を半分にした色に分けて色をつける
                    renderer.material.color = Color.HSVToRGB((float)(problem[i, j] % Mathf.Ceil(size * size / 6)) / (size * size / 6), problem[i, j] < Mathf.Ceil(size * size / 6) ? 0.5f : 1f, problem[i, j] > Mathf.Ceil(size * size / 6) * 2 ? 0.5f : 1f);
                    // フレームの表示、非表示も設定する
                    if (i != size - 1)
                    {
                        frame.horizon[i, j].SetActive(problem[i, j] == problem[i + 1, j]);
                    }
                    if (j != size - 1)
                    {
                        frame.vertical[i, j].SetActive(problem[i, j] == problem[i, j + 1]);
                    }
                    // 数値をテキストメッシュに反映
                    entityNumbers[i, j].GetComponent<TextMeshProUGUI>().text = string.Format("{0:000}", problem[i, j]);
                }
            }
        }
        /// <summary>
        /// 隣り合った数値が同じである要素の数
        /// </summary>
        public int MatchCount
        {
            get
            {
                int count = 0;
                foreach (GameObject element in frame.vertical)
                {
                    count += element.activeSelf ? 1 : 0;
                }
                foreach (GameObject element in frame.horizon)
                {
                    count += element.activeSelf ? 1 : 0;
                }
                return count;
            }
        }
        /// <summary>
        /// 現在のターン数を調べる
        /// </summary>
        public int Turn => orders.Count;
        /// <summary>
        /// 範囲を選択する時の基準となるエンティティの座標
        /// </summary>
        [NonSerialized] public Vector2 initialPosition;
        /// <summary>
        /// 範囲を選択する時の基準となるエンティティの持つ配列の添字
        /// </summary>
        [NonSerialized] public Vector2 initialIndex;
        /// <summary>
        /// 選択範囲のフレームの座標
        /// </summary>
        [NonSerialized] public Vector3 holdArea = new(-1, -1, -1);
        /// <summary>
        /// 範囲選択中であるかを判断するフラグ
        /// </summary>
        [NonSerialized] public bool holdFlag = false;
        /// <summary>
        /// 範囲選択が始まったことを判断するフラグ
        /// </summary>
        [NonSerialized] public bool initialFlag = false;
        /// <summary>
        /// マウスがエンティティにヒットしたことを判断するフラグ
        /// </summary>
        public bool HitFlag => Physics.Raycast(Camera.main.ScreenPointToRay(Input.mousePosition), out RaycastHit hit) && hit.collider.gameObject.CompareTag("Entity");
        /// <summary>
        /// マウスが選択したエンティティの座標
        /// </summary>
        public Vector2 Position =>
                Physics.Raycast(Camera.main.ScreenPointToRay(Input.mousePosition), out RaycastHit hit)
                ? (hit.collider.gameObject.CompareTag("Entity") ? new Vector2(hit.collider.gameObject.transform.position.x, hit.collider.gameObject.transform.position.z) : Vector2.zero)
                : Vector2.zero;
        /// <summary>
        /// マウスが選択したエンティティの持つ配列の添え字
        /// </summary>
        public Vector2 Index =>
                Physics.Raycast(Camera.main.ScreenPointToRay(Input.mousePosition), out RaycastHit hit)
                ? (hit.collider.gameObject.CompareTag("Entity") ? hit.collider.GetComponent<IndexManager>().Index : Vector2.zero)
                : Vector2.zero;
        /// <summary>
        /// 範囲選択の大きさ
        /// </summary>
        // なんかxの座標を同じにしたときの最小サイズ
        public int AreaSize
        {
            get
            {
                int size;
                if (Index.x - initialIndex.x > Index.y - initialIndex.y)
                {
                    size = (int)(Index.x - initialIndex.x) + 1;
                    if (initialIndex.y + size >= this.size)
                    {
                        return this.size - (int)initialIndex.y;
                    }
                }
                else
                {
                    size = (int)(Index.y - initialIndex.y) + 1;
                    if (initialIndex.x + size >= this.size)
                    {
                        return this.size - (int)initialIndex.x;
                    }
                }
                return size;
            }
        }
        /// <summary>
        /// 各パラメータの初期化が行われる
        /// </summary>
        public void SetInitial()
        {
            initialPosition = Position;
            initialIndex = Index;
            holdArea = Vector3.zero;
            initialFlag = true;
        }
    }
    /// <summary>
    /// 問題jsonのクラスの形式
    /// </summary>
    [Serializable]
    class ReceiveData
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
    class SendData
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

    void OnValidate()
    {
        // テーブルやカメラを動かす
        Camera.main.transform.position = new Vector3(-12 + fieldSize / 2, 0.88f * fieldSize + 1.15f, 12 - fieldSize / 2);
        tableFrame.transform.position = new Vector3(-12 + fieldSize / 2, 0f, 12 - fieldSize / 2);
        tableFrame.GetComponent<TableManager>().Resize(fieldSize);
    }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        procon = receptionFlag ? new() : new(fieldSize, randomFlag);
        fieldSize = procon.Size;
        // テーブルやカメラを動かす
        Camera.main.transform.position = new Vector3(-12 + fieldSize / 2, 0.88f * fieldSize + 1.15f, 12 - fieldSize / 2);
        tableFrame.transform.position = new Vector3(-12 + fieldSize / 2, 0f, 12 - fieldSize / 2);
        tableFrame.GetComponent<TableManager>().Resize(fieldSize);
        for (int i = 0; i < 24; i++)
        {
            for (int j = 0; j < 24; j++)
            {
                // エンティティをコピーする
                procon.entities[i, j] = Instantiate(originalEntity, new Vector3(-11.5f + j, 0, 11.5f - i), Quaternion.identity);
                procon.entities[i, j].transform.SetParent(entityParent.transform);
                procon.entities[i, j].SetActive(i < fieldSize && j < fieldSize);
                // 配列の添え字を割り当てる
                procon.entities[i, j].GetComponent<IndexManager>().Index = new(j, i);
                if (j != 23)
                {
                    // 垂直方向のフレームをコピーする
                    procon.frame.vertical[i, j] = Instantiate(originalVerticalFrame, new Vector3(-11f + j, 0.05f, 11.5f - i), Quaternion.identity);
                    procon.frame.vertical[i, j].transform.SetParent(frameParent.transform);
                    procon.frame.vertical[i, j].SetActive(false);
                }
                if (i != 23)
                {
                    // 水平方向のフレームをコピーする
                    procon.frame.horizon[i, j] = Instantiate(originalHorizontalFrame, new Vector3(-11.5f + j, 0.05f, 11f - i), Quaternion.identity);
                    procon.frame.horizon[i, j].transform.SetParent(frameParent.transform);
                    procon.frame.horizon[i, j].SetActive(false);
                }
                // エンティティの番号のテキストメッシュをコピーする
                procon.entityNumbers[i, j] = Instantiate(originalEntityText, new Vector3(-11.5f + j, 0.51f, 11.5f - i), Quaternion.Euler(90f, 0f, 0f));
                procon.entityNumbers[i, j].transform.SetParent(textParent.transform);
                procon.entityNumbers[i, j].SetActive(i < fieldSize && j < fieldSize);
            }
        }
        procon.SetColor();
        if (receptionFlag)
        {
            // 回答のjsonファイルを読み込む
            string jsonFile = File.ReadAllText("../procon36_server/informationLog/answer.json", Encoding.GetEncoding("utf-8"));
            SendData sendData = JsonUtility.FromJson<SendData>(jsonFile);
            // 回転操作を行う
            foreach (SendData.Ops ops in sendData.ops)
            {
                procon.Engage(new Vector2(ops.x, ops.y), ops.n);
            }
        }
        // ステータスを更新する
        statusText.text = string.Format("turn:{0}\nmatch:{1}", procon.Turn, procon.MatchCount);
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            // 範囲選択がされていないときの処理
            if (!procon.holdFlag)
            {
                if (procon.HitFlag)
                {
                    procon.SetInitial();
                    selectArea.SetActive(true);
                }
            }
            // 範囲選択がされているときの処理
            else
            {
                procon.Engage(procon.holdArea, (int)procon.holdArea.z);
                statusText.text = string.Format("turn:{0}\nmatch:{1}", procon.Turn, procon.MatchCount);
                selectArea.transform.position = new Vector3(0f, -1f, 0f);
                selectArea.SetActive(false);
                procon.holdFlag = false;
                procon.initialFlag = false;
            }
        }
        // 範囲選択中の処理
        if (Input.GetMouseButton(0))
        {
            if (procon.HitFlag && procon.initialFlag)
            {
                // AreaSizeが2以上になるときに処理を行う
                if (procon.Index.x - procon.initialIndex.x > 0 || procon.Index.y - procon.initialIndex.y > 0)
                {
                    selectArea.transform.position = new Vector3(procon.initialPosition.x - 0.5f + (float)procon.AreaSize / 2, 0.07f, procon.initialPosition.y + 0.5f - (float)procon.AreaSize / 2);
                    selectArea.GetComponent<AreaManager>().Resize(procon.AreaSize);
                    procon.holdArea = new Vector3(procon.initialIndex.x, procon.initialIndex.y, procon.AreaSize);
                }
                // そうでないときは表示を消す
                else
                {
                    selectArea.transform.position = new Vector3(0f, -1f, 0f);
                    procon.holdArea = Vector3.zero;
                }
            }
        }
        // フラグをあげて範囲選択を確定する
        if (Input.GetMouseButtonUp(0))
        {
            if (procon.initialFlag && procon.holdArea != Vector3.zero)
            {
                procon.holdFlag = true;
            }
        }
        // 途中で右クリックを押すとキャンセルされる
        if (Input.GetMouseButtonDown(1))
        {
            selectArea.transform.position = new Vector3(0f, -1f, 0f);
            selectArea.SetActive(false);
            procon.holdArea = Vector3.zero;
            procon.holdFlag = false;
            procon.initialFlag = false;
        }
        // Rを押すと1手戻る
        if (Input.GetKeyDown(KeyCode.R) && !procon.initialFlag && procon.Turn != 0)
        {
            procon.TurnBack();
            statusText.text = string.Format("turn:{0}\nmatch:{1}", procon.Turn, procon.MatchCount);
        }
    }
}
