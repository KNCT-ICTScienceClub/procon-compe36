using UnityEngine;
using TMPro;

public class Entity : MonoBehaviour
{
    [SerializeField] private EntityManager entityManager;
    [SerializeField] private TextMeshPro numberField;
    [SerializeField] private MeshRenderer meshRenderer;
    [SerializeField] private bool isSelected = false;
    private Color defaultColor;
    public Vector2Int Position { get; set; }
    public int Number { get; set; } = 0;
    public int Size { get; set; }
    public bool IsHovered => Physics.Raycast(Camera.main.ScreenPointToRay(Input.mousePosition), out RaycastHit hit) && hit.transform == transform;
    public bool IsSelected { get { return isSelected; } set { isSelected = value; } }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Awake()
    {
        entityManager = entityManager == null ? GameObject.Find("EntityManager").GetComponent<EntityManager>() : entityManager;
    }

    // Update is called once per frame
    void Update()
    {
        if (IsHovered)
        {
            // entityManager.area.current = this;[
            if (!IsSelected && Input.GetMouseButtonDown(0))
            {
                entityManager.SelectArea(this, EntityManager.Selection.Start);
                isSelected = true;
            }

            if (Input.GetMouseButton(0))
            {
                entityManager.SelectArea(this, EntityManager.Selection.Continue);
                isSelected = true;
            }
            else if (Input.GetMouseButtonUp(0))
            {
                entityManager.SelectArea(this, EntityManager.Selection.Finish);
            }            
        }
        if (IsSelected && Input.GetMouseButtonDown(1))
        {
            isSelected = false;
            // Debug.LogWarning($"area selection calcel");
        }
        
        if (IsSelected)
        {
            meshRenderer.material.color = Color.magenta;
        }
        else if (IsHovered)
        {
            meshRenderer.material.color = Color.Lerp(meshRenderer.material.color, Color.white, Time.deltaTime * 5f);
        }
        else
        {
            meshRenderer.material.color = defaultColor;
        }
    }

    public Entity Initialize(int number, Vector2Int position, int size)
    {
        numberField.text = number.ToString();
        Number = number;
        Position = position;
        Size = size;
        SetColor(Size);
        defaultColor = meshRenderer.material.color;
        return this;
    }

    public Entity SetColor(int size)
    {
        // 数値によって、同じ色相について 普通の色と、彩度を半分にした色と、明度を半分にした色 の3種類の色を作る
        // 彩度 or 明度 半分がみにくそうならもうちょっと明るくしたりして調整する
        meshRenderer.material.color = Color.HSVToRGB
        (
            H: (float)(Number % Mathf.Ceil(size * size / 6)) / (size * size / 6),
            S: Number < Mathf.Ceil(size * size / 6) ? 0.5f : 1f,
            V: Number > Mathf.Ceil(size * size / 6) * 2 ? 0.5f : 1f
        );
        return this;
    }
}
