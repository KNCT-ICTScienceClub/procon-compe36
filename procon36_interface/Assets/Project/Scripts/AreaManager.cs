using System;
using UnityEngine;

public class AreaManager : MonoBehaviour
{   
    /// <summary>
    /// エリアの上側
    /// </summary>
    [SerializeField] GameObject top;
    /// <summary>
    /// エリアの下側
    /// </summary>
    [SerializeField] GameObject bottom;
    /// <summary>
    /// エリアの右側
    /// </summary>
    [SerializeField] GameObject right;
    /// <summary>
    /// エリアの左側
    /// </summary>
    [SerializeField] GameObject left;
    /// <summary>
    /// サイズを渡すとエリアを拡大縮小する
    /// </summary>
    /// <param name="size">エリアのサイズ</param>
    public void Resize(int size)
    {
        top.transform.localPosition = new Vector3(0f, 0f, (float)size / 2);
        bottom.transform.localPosition = new Vector3(0f, 0f, -(float)size / 2);
        right.transform.localPosition = new Vector3((float)size / 2, 0f, 0f);
        left.transform.localPosition = new Vector3(-(float)size / 2, 0f, 0f);
        top.transform.localScale = new Vector3(size + 0.1f, 1f, 0.1f);
        bottom.transform.localScale = new Vector3(size + 0.1f, 1f, 0.1f);
        right.transform.localScale = new Vector3(0.1f, 1f, size + 0.1f);
        left.transform.localScale = new Vector3(0.1f, 1f, size + 0.1f);
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
