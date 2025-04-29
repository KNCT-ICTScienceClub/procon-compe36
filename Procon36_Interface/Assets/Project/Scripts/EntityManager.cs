using System.Text;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class EntityManager : MonoBehaviour
{
    public Procon procon;
    /// <summary>
    /// 選択範囲
    /// </summary>
    public Selection selection;
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
    [SerializeField] TextMeshProUGUI status;
    /// <summary>
    /// trueにすると外部からjsonを読み込むようになる
    /// </summary>
    [SerializeField] bool receptionFlag;
    /// <summary>
    /// trueにすると自動で生成した問題をシャッフルするようになる
    /// </summary>
    [SerializeField] bool randomFlag;
    /// <summary>
    /// 生成したエンティティを格納する二次元リスト
    /// </summary>
    private List<List<Entity>> entities = new();
    
    void OnValidate()
    {
        // テーブルやカメラを動かす
        // Camera.main.transform.position = new Vector3(-12 + fieldSize / 2, 0.88f * fieldSize + 1.15f, 12 - fieldSize / 2);
        // tableFrame.transform.position = new Vector3(-12 + fieldSize / 2, 0f, 12 - fieldSize / 2);
        Camera.main.transform.position = new Vector3(0, 0.88f * procon.FieldSize + 1.15f, 0);
        tableFrame.transform.position = new Vector3(0, 0f, 0);
        tableFrame.GetComponent<TableManager>().Resize(procon.FieldSize);
    }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        procon = receptionFlag ? new() : new(procon.FieldSize, randomFlag);
        if (receptionFlag)
        {
            // 回答のjsonファイルを読み込む
            string jsonFile = System.IO.File.ReadAllText("../procon36_server/informationLog/answer.json", Encoding.GetEncoding("utf-8"));
            sendData = JsonUtility.FromJson<Procon.SendData>(jsonFile);
        }
        // テーブルやカメラを動かす
        Camera.main.transform.position = new Vector3(0, 0.88f * procon.FieldSize + 1.15f, 0);
        tableFrame.transform.position = new Vector3(0, 0f, 0);
        tableFrame.GetComponent<TableManager>().Resize(procon.FieldSize);
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
        selection = new(in entities);
        // 「導き」したときの問題の変更を表示にも反映させるようにする
        procon.OnEngage += (problem) => 
        {
            for (int i = 0; i < entities.Count; i++)
            {
                for (int j = 0; j < entities.Count; j++)
                {
                    entities[j][i].SetNumber(problem[i, j]);
                    status.text = string.Format("turn: {0}\npair: {1}", procon.Turn, procon.PairCount);
                    
                }
            }
        };
        procon.OnEngage += (problem) =>
        {
            entities.ForEach(line => line.ForEach(entity => entity.IsPair = false));
            procon.pairPositions.ForEach(pos => entities[pos.x][pos.y].IsPair = true);
        };
        if (receptionFlag)
        {
            StartCoroutine(Replay(0.5f));
        }
        // for (int i = 0; i < 24; i++)
        // {
        //     for (int j = 0; j < 24; j++)
        //     {
        //         // エンティティをコピーする
        //         procon.entities[i, j] = Instantiate(entityPrefab, new Vector3(-11.5f + j, 0, 11.5f - i), Quaternion.identity);
        //         procon.entities[i, j].transform.SetParent(entityParent.transform);
        //         procon.entities[i, j].SetActive(i < fieldSize && j < fieldSize);
        //         // 配列の添え字を割り当てる
        //         // procon.entities[i, j].GetComponent<IndexManager>().Index = new(j, i);
        //         procon.entities[i, j].GetComponent<Entity>().Position = new(i, j);
        //         if (j != 23)
        //         {
        //             // 垂直方向のフレームをコピーする
        //             procon.frame.vertical[i, j] = Instantiate(originalVerticalFrame, new Vector3(-11f + j, 0.05f, 11.5f - i), Quaternion.identity);
        //             procon.frame.vertical[i, j].transform.SetParent(frameParent.transform);
        //             procon.frame.vertical[i, j].SetActive(false);
        //         }
        //         if (i != 23)
        //         {
        //             // 水平方向のフレームをコピーする
        //             procon.frame.horizon[i, j] = Instantiate(originalHorizontalFrame, new Vector3(-11.5f + j, 0.05f, 11f - i), Quaternion.identity);
        //             procon.frame.horizon[i, j].transform.SetParent(frameParent.transform);
        //             procon.frame.horizon[i, j].SetActive(false);
        //         }
        //         // エンティティの番号のテキストメッシュをコピーする
        //         procon.entityNumbers[i, j] = Instantiate(originalEntityText, new Vector3(-11.5f + j, 0.51f, 11.5f - i), Quaternion.Euler(90f, 0f, 0f));
        //         procon.entityNumbers[i, j].transform.SetParent(textParent.transform);
        //         procon.entityNumbers[i, j].SetActive(i < fieldSize && j < fieldSize);
        //     }
        // }
        // procon.SetColor();
        // ステータスを更新する
        // statusText.text = string.Format("turn:{0}\nmatch:{1}", procon.Turn, procon.PairsCount);
    }

    Procon.SendData sendData;
    private IEnumerator Replay(float seconds)
    {
        // 回転操作を行う
        foreach (var ops in sendData.ops)
        {
            procon.Engage(new(ops.x, ops.y), ops.n);
            yield return new WaitForSeconds(seconds);
            for (int i = 0; i < procon.FieldSize; i++)
            {
                for (int j = 0; j < procon.FieldSize; j++)
                {
                    entities[j][i].SetNumber(procon.problem[i, j]);
                    status.text = string.Format("turn: {0}\npair: {1}", procon.Turn, procon.PairCount);
                }
            }
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
        // if (Input.GetMouseButtonDown(0))
        // {
        //     // 範囲選択がされていないときの処理
        //     if (!procon.holdFlag)
        //     {
        //         if (IsHoverEntity)
        //         {
        //             procon.SetInitial();
        //             selectArea.SetActive(true);
        //         }
        //     }
        //     // 範囲選択がされているときの処理
        //     else
        //     {
        //         procon.Engage(procon.holdArea, (int)procon.holdArea.z);
        //         statusText.text = string.Format("turn:{0}\nmatch:{1}", procon.Turn, procon.PairsCount);
        //         selectArea.transform.position = new Vector3(0f, -1f, 0f);
        //         selectArea.SetActive(false);
        //         procon.holdFlag = false;
        //         procon.initialFlag = false;
        //     }
        // }
        // // 範囲選択中の処理
        // if (Input.GetMouseButton(0))
        // {
        //     if (IsHoverEntity && procon.initialFlag)
        //     {
        //         // AreaSizeが2以上になるときに処理を行う
        //         // この条件は右下方向のみ
        //         // 現在選択中のエンティティが最初に選択したエンティティよりも右下ならば
        //         // それらを結ぶ四角形領域のエンティティのマテリアルを弄る（for文でできる）
        //         // そのときEntity内の選択フラグを立てることで、トリガー式にマテリアルの色をかえれる
        //         if (procon.Index.x - procon.initialIndex.x > 0 || procon.Index.y - procon.initialIndex.y > 0)
        //         {
        //             selectArea.transform.position = new Vector3(procon.initialPosition.x - 0.5f + (float)procon.AreaSize / 2, 0.07f, procon.initialPosition.y + 0.5f - (float)procon.AreaSize / 2);
        //             selectArea.GetComponent<AreaManager>().Resize(procon.AreaSize);
        //             procon.holdArea = new Vector3(procon.initialIndex.x, procon.initialIndex.y, procon.AreaSize);
        //         }
        //         // そうでないときは表示を消す
        //         else
        //         {
        //             selectArea.transform.position = new Vector3(0f, -1f, 0f);
        //             procon.holdArea = Vector3.zero;
        //         }
        //     }
        // }
        // // フラグをあげて範囲選択を確定する
        // if (Input.GetMouseButtonUp(0))
        // {
        //     if (procon.initialFlag && procon.holdArea != Vector3.zero)
        //     {
        //         procon.holdFlag = true;
        //     }
        // }
        // // 途中で右クリックを押すとキャンセルされる
        // if (Input.GetMouseButtonDown(1))
        // {
        //     selectArea.transform.position = new Vector3(0f, -1f, 0f);
        //     selectArea.SetActive(false);
        //     procon.holdArea = Vector3.zero;
        //     procon.holdFlag = false;
        //     procon.initialFlag = false;
        // }
        // // Rを押すと1手戻る
        // if (Input.GetKeyDown(KeyCode.R) && !procon.initialFlag && procon.Turn != 0)
        // {
        //     procon.TurnBack();
        //     statusText.text = string.Format("turn:{0}\nmatch:{1}", procon.Turn, procon.PairsCount);
        // }
    }
}
