using UnityEngine;

public class TableManager : MonoBehaviour
{
    [SerializeField] GameObject top;
    [SerializeField] GameObject bottom;
    [SerializeField] GameObject right;
    [SerializeField] GameObject left;
    public void resizeFrame(int size)
    {
        top.transform.localPosition = new Vector3(0f, 0f, (float)size / 2 + 0.25f);
        bottom.transform.localPosition = new Vector3(0f, 0f, -(float)size / 2 - 0.25f);
        right.transform.localPosition = new Vector3((float)size / 2 + 0.25f, 0f, 0f);
        left.transform.localPosition = new Vector3(-(float)size / 2 - 0.25f, 0f, 0f);
        top.transform.localScale = new Vector3(size + 1f, 1f, 0.5f);
        bottom.transform.localScale = new Vector3(size + 1f, 1f, 0.5f);
        right.transform.localScale = new Vector3(0.5f, 1f, size + 1f);
        left.transform.localScale = new Vector3(0.5f, 1f, size + 1f);
    }
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {

    }
}
