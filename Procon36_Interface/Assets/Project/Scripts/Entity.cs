using UnityEngine;
using TMPro;

public class Entity : MonoBehaviour
{
    [SerializeField] private TextMeshPro numberField;
    public TextMeshPro NumberField => numberField;
    public Vector2 Position { get; set; }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
