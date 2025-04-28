using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// フィールド上のエンティティの選択範囲を決めるクラス
/// </summary>
[System.Serializable]
public class Selection
{
    /// <summary>
    /// 現在選択されているエンティティ
    /// </summary>
    [SerializeField] private Entity current;
    /// <summary>
    /// 範囲選択の原点となるエンティティ
    /// </summary>
    [SerializeField] private Entity origin;
    /// <summary>
    /// 選択範囲の大きさ
    /// </summary>
    [SerializeField] private int areaSize = 0;
    /// <summary>
    /// <see cref="entities"/> のスライスの原点とする場所<br/>
    /// 常に選択範囲の正方形の左上になるようにする
    /// </summary>
    [SerializeField] private Vector2Int slicePosition;
    [SerializeField] private SelectionStatus status;
    public int AreaSize => areaSize;
    public Vector2Int SlicePosition => slicePosition;
    public SelectionStatus Status => status; 
    /// <summary>
    /// フィールド上に存在する全てのエンティティを2次元に格納したリスト
    /// </summary>
    /// <remarks>
    /// <see cref="EntityManager.entities"/> を参照するように、コンストラクタ呼び出し時に指定 
    /// </remarks>
    private readonly List<List<Entity>> entities;
    /// <summary>
    /// 範囲選択の状態
    /// </summary>
    public enum SelectionStatus
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

    /// <summary>
    /// <see cref="EntityManager.entities"/> が代入された後に呼び出すこと 
    /// </summary>
    /// <param name="entities"><see cref="EntityManager.entities"/> を参照</param>
    public Selection(in List<List<Entity>> entities)
    {
        this.entities = entities;
    }
    /// <summary>
    /// 選択範囲を決める
    /// </summary>
    /// <param name="entity">選択したエンティティ（呼び出し元）</param>
    /// <param name="status">選択の状態</param>
    public void Select(Entity entity, SelectionStatus status)
    {
        this.status = status;
        switch (status)
        {
            case SelectionStatus.None:
                // 選択されたエンティティが変わった時だけ更新
                if (current != entity) current = entity;
                break;
            case SelectionStatus.Start:
                // 原点に設定
                origin = entity;
                break;
            case SelectionStatus.Continue:
                // 選択されたエンティティが変わった時だけ更新と選択範囲のリセット
                if (current != entity)
                {
                    current = entity;
                    Clear();
                }
                else break;
                // 現在選択中のエンティティと原点のエンティティを比較して範囲の大きさを算出
                areaSize = Mathf.Max(Mathf.Abs(origin.Position.x - current.Position.x), Mathf.Abs(origin.Position.y - current.Position.y)) + 1;
                // 選択範囲の原点を調整する（常に正方形の左上角）
                slicePosition = origin.Position;
                // 選択中の位置が原点より左上にある場合
                if (origin.Position.x > current.Position.x && origin.Position.y > current.Position.y)
                {
                    // 選択中の位置をスライスの原点にする
                    slicePosition = current.Position;
                }
                // 選択中のx座標だけが原点より左にある場合
                else if (origin.Position.x > current.Position.x)
                {
                    // 原点のx座標をその位置に移動し、y座標を上に上げる
                    slicePosition.x = current.Position.x;
                    slicePosition.y = current.Position.y - (areaSize - 1);
                }
                // 選択中のy座標だけが原点より上にある場合
                else if (origin.Position.y > current.Position.y)
                {
                    // 原点のy座標をその位置に移動し、x座標を左にずらす
                    slicePosition.x = current.Position.x - (areaSize - 1);
                    slicePosition.y = current.Position.y;
                }
                // 選択範囲の原点のy座標が0を下回った（フィールドの上側を超えた）場合
                if (slicePosition.y < 0 && slicePosition.y - (areaSize - 1) < 0)
                {
                    // その分選択範囲全体を下げる
                    slicePosition += Vector2Int.down * slicePosition.y;
                }
                // 選択範囲の原点のy座標がフィールドサイズを上回った（フィールドの下側を超えた）場合
                else if (slicePosition.y + areaSize > entities.Count)
                {
                    // その分選択範囲全体を上げる
                    slicePosition -= Vector2Int.up * (slicePosition.y + areaSize - entities.Count);
                }
                // 選択範囲の原点のx座標が0を下回った（フィールドの左側を超えた）場合
                if (slicePosition.x < 0)
                {
                    // その分選択範囲全体を右にずらす
                    slicePosition -= Vector2Int.right * slicePosition.x;
                }
                // 選択範囲の原点のx座標がフィールドサイズを上回った（フィールドの右側を超えた）場合
                else if (slicePosition.x + areaSize > entities.Count)
                {
                    // その分選択範囲全体を左にずらす
                    slicePosition += Vector2Int.left * (slicePosition.x + areaSize - entities.Count);
                }
                // entitiesをスライスして選択範囲を作成する
                entities.GetRange(slicePosition.x, areaSize).ForEach(line => line.GetRange(slicePosition.y, areaSize).ForEach(entity => entity.IsSelected = true));
                break;
            case SelectionStatus.Finish:
                // 原点を再設定
                origin = entities[slicePosition.x][slicePosition.y];
                break;
            case SelectionStatus.Cancel:
                Clear();
                break;
        }
    }

    /// <summary>
    /// 選択範囲をクリアする
    /// </summary>
    public void Clear() => entities.ForEach(line => line.ForEach(entity => entity.IsSelected = false));
}