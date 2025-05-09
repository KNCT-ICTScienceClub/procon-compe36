using System.Text;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class EntityManager : MonoBehaviour
{
    [Header("問題情報")]
    public Procon procon;
    /// <summary>
    /// 選択範囲
    /// </summary>
    [Header("現在の選択範囲の状態")]
    public Selection selection;
    [Header("基本設定")]
    [SerializeField] private Mode mode;
    /// <summary>
    /// エンティティのプレハブ
    /// </summary>
    [SerializeField] GameObject entityPrefab;
    /// <summary>
    /// コピー元となる水平方向のフレーム
    /// </summary>
    [SerializeField] GameObject originalVerticalFrame;
    /// <summary>
    /// コピー元となる垂直方向のフレーム
    /// </summary>
    [SerializeField] GameObject originalHorizontalFrame;
    /// <summary>
    /// フレームの親となるオブジェクト
    /// </summary>
    [SerializeField] GameObject frameParent;
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
    [SerializeField] private TextMeshProUGUI status;
    /// <summary>
    /// モード選択のためのドロップダウン
    /// </summary>
    [SerializeField] private TMP_Dropdown modeDropdown;
    /// <summary>
    /// 
    /// </summary>
    [SerializeField] private Toggle toggle;
    /// <summary>
    /// 生成したエンティティを格納する二次元リスト
    /// </summary>
    private List<List<Entity>> entities = new();
    public enum Mode
    {
        Generate,
        Reception,
        Replay
    }
    
    void OnValidate()
    {
        modeDropdown.value = (int)mode;
        AdjustView(procon.FieldSize);
    }

    async void OnEnable()
    {
        // 通信テスト
        // Communication communication = new();
        // Debug.Log(await communication.Receive());
        modeDropdown.value = (int)mode;
        modeDropdown.onValueChanged.AddListener((mode) => this.mode = (Mode)mode);
        toggle.onValueChanged.AddListener((isOn) => entities?.ForEach(line => line.ForEach(entity => entity.IsArrangePairsColor = isOn)));
    }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        // モードによってインスタンスを作り変え
        procon = (mode == Mode.Reception || mode == Mode.Replay) ? new() : new(procon.FieldSize);
        if (mode == Mode.Replay)
        {
            // リプレイなら回答読み込み
            Procon.SendData.Load("answer", out var sendData);
            procon.orders = sendData.ops.Select(o => Procon.Order.FromOps(o)).ToList();
            procon.IsUseOrders = false;
        }
        // テーブルやカメラを動かす
        AdjustView(procon.FieldSize);
        // フィールドサイズの数だけエンティティを生成し、実際の問題の数値を入れる
        entities = Enumerable.Repeat<List<Entity>>(new(procon.FieldSize), procon.FieldSize).Select(line => line = new(Enumerable.Repeat<Entity>(null, procon.FieldSize))).ToList();
        for (int i = 0; i < procon.FieldSize; i++)
        {
            for (int j = 0; j < procon.FieldSize; j++)
            {
                // この数値指定でいい感じ
                GameObject entity = Instantiate(entityPrefab, new Vector3(-procon.FieldSize / 2f + 0.5f + j, 0.5f, procon.FieldSize / 2f - 0.5f - i), Quaternion.identity, transform);
                entity.name = $"Entity ({j}, {i})";
                entities[j][i] = entity.GetComponent<Entity>().Initialize(procon.initialProblem[i, j], new(j, i), procon.FieldSize);
            }
        }
        // 選択範囲の初期化
        selection = new(in entities);
        // 「導き」したときの問題の変更を表示にも反映させるようにする
        procon.OnEngage += (problem, pairs, turn) => 
        {
            // エンティティの移動によるその座標の数値を変更
            for (int i = 0; i < entities.Count; i++)
            {
                for (int j = 0; j < entities.Count; j++)
                {
                    entities[j][i].SetNumber(problem[i, j]);                    
                }
            }
            // ペアができているエンティティに情報を渡す
            entities.ForEach(line => line.ForEach(entity => entity.HasPair = false));
            pairs.ForEach(pair => 
            {
                // 一旦タプルに保存して
                var p = (entities[pair.a.x][pair.a.y], entities[pair.b.x][pair.b.y]);
                // ペアができていることをそれぞれに知らせる
                (p.Item1.HasPair, p.Item2.HasPair) = (true, true);
                (p.Item1.MyPair, p.Item2.MyPair) = (p.Item2, p.Item1);
            });
            // UIに反映
            status.text = string.Format("turn: {0}\npair: {1}", turn, pairs.Count);
        };
        // リプレイする
        if (mode == Mode.Replay)
        {
            StartCoroutine(Replay(0.5f));
        }
    }

    // Update is called once per frame
    void Update()
    {
        if (selection.Status == Selection.SelectionStatus.Finish)
        {
            if (Input.GetMouseButtonDown(0))
            {
                procon.Engage(selection.SlicePosition, selection.AreaSize);
            }
            if (Input.GetMouseButtonDown(1))
            {
                selection.Select(null, Selection.SelectionStatus.Cancel);
            }
        }
        // Rを押すと1手戻る
        if (Input.GetKeyDown(KeyCode.R) && (selection.Status != Selection.SelectionStatus.Start || selection.Status != Selection.SelectionStatus.Continue) && procon.Turn != 0)
        {
            procon.TurnBack();
        }
    }

    /// <summary>
    /// テーブルやカメラを動かしてフィールドサイズに合わせた丁度良い大きさに表示させる
    /// </summary>
    private void AdjustView(int fieldSize)
    {
        Camera.main.transform.position = new Vector3(0, 0.88f * fieldSize + 1.15f, 0);
        tableFrame.transform.position = new Vector3(0, 0f, 0);
        tableFrame.GetComponent<TableManager>().Resize(fieldSize);
    }

    private IEnumerator Replay(float seconds)
    {
        // 回転操作を行う
        foreach (var order in procon.orders)
        {
            procon.Engage(order.position, order.size);
            yield return new WaitForSeconds(seconds);
        }
    } 
}
