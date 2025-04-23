using System;
using System.Text;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class EntityManager : MonoBehaviour
{
    [SerializeField] Procon procon;
    /// <summary>
    /// フィールドのサイズ
    /// </summary>
    // [SerializeField, Range(4, 24)] int fieldSize;
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
    /// 生成したエンティティを格納する二次元リスト
    /// </summary>
    private List<List<Entity>> entities = new();
    /// <summary>
    /// 現在選択されているエンティティ
    /// </summary>
    private Entity current;
    /// <summary>
    /// 範囲選択の原点となるエンティティ
    /// </summary>
    private Entity origin;
    /// <summary>
    /// 範囲選択の状態
    /// </summary>
    public enum Selection
    {
        /// <summary>
        /// 範囲選択されていないとき
        /// </summary>
        None,
        /// <summary>
        /// 範囲選択を始めるとき
        /// </summary>
        Start,
        /// <summary>
        /// 範囲選択中のとき
        /// </summary>
        Continue,
        /// <summary>
        /// 範囲選択を終えるとき
        /// </summary>
        Finish,
        /// <summary>
        /// 範囲選択をキャンセルするとき
        /// </summary>
        Cancel
    }
    public void SelectArea(Entity entity, Selection selection)
    {
        switch (selection)
        {
            case Selection.None:
                // 選択されたエンティティが変わった時だけ更新
                if (current != entity) current = entity;
                break;
            case Selection.Start:
                // 原点に設定
                origin = entity;
                break;
            case Selection.Continue:
                // 選択されたエンティティが変わった時だけ更新と選択範囲のリセット
                if (current != entity)
                {
                    current = entity;
                    entities.ForEach(line => line.ForEach(entity => entity.IsSelected = false));
                }
                else break;
                // 現在選択中のエンティティと原点のエンティティを比較して範囲の大きさを算出
                int areaSize = Math.Max(Math.Abs(origin.Position.x - current.Position.x), Math.Abs(origin.Position.y - current.Position.y)) + 1;
                // 選択範囲の原点を調整する
                Vector2Int slicePosition = origin.Position;
                // 選択中が原点より左上にある場合
                if (origin.Position.x > current.Position.x && origin.Position.y > current.Position.y)
                {
                    slicePosition = current.Position;
                }
                // 選択中のx座標だけが原点より左にある場合
                else if (origin.Position.x > current.Position.x)
                {
                    slicePosition.x = current.Position.x;
                    slicePosition.y = current.Position.y - (areaSize - 1);
                }
                // 選択中のy座標だけが原点より上にある場合
                else if (origin.Position.y > current.Position.y)
                {
                    slicePosition.x = current.Position.x - (areaSize - 1);
                    slicePosition.y = current.Position.y;
                }
                if (slicePosition.y < 0 && slicePosition.y - (areaSize - 1) < 0)
                {
                    slicePosition += Vector2Int.down * slicePosition.y;
                }
                else if (slicePosition.y + (areaSize - 1) >= entities.Count)
                {

                }
                if ((slicePosition.y < 0 && slicePosition.y - (areaSize - 1) < 0) || (slicePosition.y >= entities.Count && slicePosition.y + (areaSize - 1) >= entities.Count))
                {
                    // slicePosition 
                }
                // Debug.Log(slicePosition);
                // entitiesをスライスして選択範囲を作成する
                entities.GetRange(slicePosition.x, areaSize).ForEach(line => line.GetRange(slicePosition.y, areaSize).ForEach(entity => entity.IsSelected = true));
                break;
            case Selection.Finish:
                Debug.Log("selection finished");
                break;
        }
    }
    
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
        // 新しい方、フィールドサイズの数だけのエンティティしか生成しない
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
            entities.ForEach(line => line.ForEach(entities => Destroy(entities.gameObject)));
            entities.Clear();
            entities = Enumerable.Repeat<List<Entity>>(new(procon.FieldSize), procon.FieldSize).Select(line => line = new(Enumerable.Repeat<Entity>(null, procon.FieldSize))).ToList();
            for (int i = 0; i < procon.FieldSize; i++)
            {
                for (int j = 0; j < procon.FieldSize; j++)
                {
                    // この数値指定でいい感じ
                    GameObject entity = Instantiate(entityPrefab, new Vector3(-procon.FieldSize / 2f + 0.5f + j, 0.5f, procon.FieldSize / 2f - 0.5f - i), Quaternion.identity, transform);
                    entity.name = $"Entity ({j}, {i})";
                    entities[j][i] = entity.GetComponent<Entity>().Initialize(procon.problem[i, j], new(j, i), procon.FieldSize);
                }
            }
        }
    } 
    // Update is called once per frame
    void Update()
    {        
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
