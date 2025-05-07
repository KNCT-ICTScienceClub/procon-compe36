using UnityEngine;
using TMPro;
using System;

/// <summary>
/// エンティティを制御するコンポーネント
/// </summary>
public class Entity : MonoBehaviour
{
    /// <summary>
    /// <see cref="EntityManager"/>
    /// </summary>
    [SerializeField] private EntityManager entityManager;
    /// <summary>
    /// 自身に割り当てられた番号を表示しておくフィールド
    /// </summary>
    [SerializeField] private TextMeshPro numberField;
    /// <summary>
    /// 自身のMeshRenderer
    /// </summary>
    [SerializeField] private MeshRenderer meshRenderer;
    /// <summary>
    /// 自身が選択範囲に含まれているか（表示用）
    /// </summary>
    [SerializeField] private bool isSelected = false;
    /// <summary>
    /// 自身がペア（同じ番号で隣接しているエンティティ）を持っているか（表示用）
    /// </summary>
    [SerializeField] private bool hasPair = false;
    /// <summary>
    /// できている全てのペアを同じ色で表示するか（表示用）
    /// </summary>
    [SerializeField] private bool isArrangePairsColor = false;
    /// <summary>
    /// 自分のペア（表示用）
    /// </summary>
    [SerializeField] private Entity myPair;
    /// <summary>
    /// 自身に割り当てられた番号
    /// </summary>
    [SerializeField] private int number = 0;
    /// <summary>
    /// フィールド（盤の）サイズ
    /// </summary>
    [SerializeField] private int fieldSize;
    /// <summary>
    /// このエンティティの位置する座標
    /// </summary>
    public Vector2Int Position { get; set; }
    /// <summary>
    /// このエンティティに割り当てられた番号
    /// </summary>
    public int Number { get => number; }
    /// <summary>
    /// 自分のペア
    /// </summary>
    public Entity MyPair { private get => myPair; set => myPair = value; }
    /// <summary>
    /// このエンティティがマウスカーソルでホバーされているか
    /// </summary>
    public bool IsHovered => Physics.Raycast(Camera.main.ScreenPointToRay(Input.mousePosition), out RaycastHit hit) && hit.transform == transform;
    /// <summary>
    /// このエンティティが選択範囲に含まれているか
    /// </summary>
    /// <remarks>
    /// 外部（主に <see cref="EntityManager"/> ）からフラグをセットする
    /// </remarks>
    public bool IsSelected { private get => isSelected; set => isSelected = value; }
    /// <summary>
    /// このエンティティがペア（隣接した同じ番号のエンティティ）を持っているか
    /// </summary>
    /// <remarks>
    /// 外部（主に <see cref="EntityManager"/> ）からフラグをセットする
    /// </remarks>
    public bool HasPair { private get => hasPair; set => hasPair = value; }
    /// <summary>
    /// できている全てのペアを同じ色で表示するか
    /// </summary>
    /// <remarks>
    /// 外部（主に <see cref="EntityManager"/> ）からフラグをセットする
    /// </remarks>
    public bool IsArrangePairsColor { private get => isArrangePairsColor; set => isArrangePairsColor = value; }
    /// <summary>
    /// シェーダーのプロパティをIDとしてキャッシュする
    /// </summary>
    private class ShaderPropertyID
    {
        /// <summary>
        /// マテリアルの色
        /// </summary>
        public static readonly int _color = Shader.PropertyToID("_color");
        /// <summary>
        /// ホバーされたら <c>true</c>
        /// </summary>
        public static readonly int _isHovered = Shader.PropertyToID("_isHovered");
        /// <summary>
        /// ペアがあれば <c>true</c>
        /// </summary>
        public static readonly int _hasPair = Shader.PropertyToID("_hasPair");
        /// <summary>
        /// 左右方向のペアなら <c>true</c>
        /// </summary>
        public static readonly int _isHorizontalDirection = Shader.PropertyToID("_isHorizontalDirection");
        /// <summary>
        /// 自分がペアに対して下か左に位置するなら <c>true</c>
        /// </summary>
        public static readonly int _isInvertDirection = Shader.PropertyToID("_isInvertDirection");
        /// <summary>
        /// 全てのペアを同じ色にするなら <c>true</c>
        /// </summary>
        public static readonly int _isArrangePairsColor = Shader.PropertyToID("_isArrangePairsColor");
    }

    void Awake()
    {
        entityManager = entityManager == null ? GameObject.Find("EntityManager").GetComponent<EntityManager>() : entityManager;
    }

    void Update()
    {
        // ホバーされている場合
        if (IsHovered)
        {
            // まだ選択範囲のフラグが立っていない状態で、マウスがクリックされていたら
            if (!IsSelected && Input.GetMouseButtonDown(0))
            {
                // 範囲選択を開始して、選択範囲に含ませる
                entityManager.selection.Select(this, Selection.SelectionStatus.Start);
                isSelected = true;
            }
            // まだマウスが押されていて、範囲選択中なら（マウスがドラッグされているシチュを含む）
            if (Input.GetMouseButton(0) && (entityManager.selection.Status == Selection.SelectionStatus.Start || entityManager.selection.Status == Selection.SelectionStatus.Continue))
            {
                // 選択範囲に追加する
                entityManager.selection.Select(this, Selection.SelectionStatus.Continue);
                isSelected = true;
            }
            // マウスが離されて、選択中なら
            else if (Input.GetMouseButtonUp(0) && entityManager.selection.Status == Selection.SelectionStatus.Continue)
            {
                // 範囲選択を終わる
                entityManager.selection.Select(this, Selection.SelectionStatus.Finish);
            }            
        }
        // ホバーされているか選択範囲に含まれていて、かつフラグが立っていなかったら
        if ((IsHovered || IsSelected) && meshRenderer.material.GetFloat(ShaderPropertyID._isHovered) == 0)
        {
            // シェーダーのフラグを立てる
            meshRenderer.material.SetFloat(ShaderPropertyID._isHovered, 1);
        }
        // ホバーも選択もされてなかったらフラグを下げる
        else if (!IsHovered && !IsSelected)
        {
            meshRenderer.material.SetFloat(ShaderPropertyID._isHovered, 0);
        }
        // ペアができていたら（途中でペアの向きが変わる可能性があるので随時更新）
        if (HasPair)
        {
            // シェーダーのフラグを立てる
            meshRenderer.material.SetFloat(ShaderPropertyID._hasPair, 1);
            // 横方向のペア
            if (this.Position.x != MyPair.Position.x)
            {
                meshRenderer.material.SetFloat(ShaderPropertyID._isHorizontalDirection, 1);
            }
            // 縦方向のペア
            else
            {
                meshRenderer.material.SetFloat(ShaderPropertyID._isHorizontalDirection, 0);
            }
            // 自分がペアより左か下に位置する場合
            if (this.Position.x < MyPair.Position.x || this.Position.y > MyPair.Position.y)
            {
                meshRenderer.material.SetFloat(ShaderPropertyID._isInvertDirection, 1);
            }
            // 自分がペアより右か上に位置する場合
            else
            {
                meshRenderer.material.SetFloat(ShaderPropertyID._isInvertDirection, 0);
            }
        }
        else
        {
            meshRenderer.material.SetFloat(ShaderPropertyID._hasPair, 0);
        }
        // 
        meshRenderer.material.SetFloat(ShaderPropertyID._isArrangePairsColor, isArrangePairsColor ? 1 : 0);
    }

    /// <summary>
    /// エンティティを初期化する
    /// </summary>
    /// <param name="number">自身に割り当てる番号</param>
    /// <param name="position">位置する座標</param>
    /// <param name="fieldSize">フィールドサイズ</param>
    /// <returns>このエンティティ</returns>
    public Entity Initialize(int number, Vector2Int position, int fieldSize)
    {
        SetNumber(number);
        Position = position;
        this.fieldSize = fieldSize;
        SetColor(this.fieldSize);
        return this;
    }
    /// <summary>
    /// 自身に番号を割り当てて、色を更新する
    /// </summary>
    /// <param name="number"></param>
    /// <returns>このエンティティ</returns>
    public Entity SetNumber(int number)
    {
        this.number = number;
        numberField.text = number.ToString();
        SetColor(fieldSize);
        return this;
    }
    /// <summary>
    /// 自身の色を設定する
    /// </summary>
    /// <param name="fieldSize"></param>
    /// <returns>このエンティティ</returns>
    private Entity SetColor(int fieldSize)
    {
        // 数値によって、同じ色相について 普通の色と、彩度を半分にした色と、明度を半分にした色 の3種類の色を作る
        // 彩度 or 明度 半分がみにくそうならもうちょっと明るくしたりして調整する
        Color color = Color.HSVToRGB
        (
            H: (float)(number % Mathf.Ceil(fieldSize * fieldSize / 6)) / (fieldSize * fieldSize / 6),
            // S: number < Mathf.Ceil(fieldSize * fieldSize / 6) ? 0.75f : 0.95f,
            S: Math.Clamp(number / (fieldSize * fieldSize / 2f) + 0.5f, 0.65f, 0.9f),
            V: number > Mathf.Ceil(fieldSize * fieldSize / 6) * 2 ? 0.65f : 0.95f
        );
        meshRenderer.material.SetColor(ShaderPropertyID._color, color);
        return this;
    }
}
