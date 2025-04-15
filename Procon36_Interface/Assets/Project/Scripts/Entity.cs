using UnityEngine;
using TMPro;

public class Entity : MonoBehaviour
{
    [SerializeField] private TextMeshPro numberField;
    [SerializeField] private MeshRenderer meshRenderer;
    public Vector2 Position { get; set; }
    public int Number { get; set; } = 0;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void Initialize(int number, Vector2 position)
    {
        numberField.text = number.ToString();
        Position = position;
    }
}
