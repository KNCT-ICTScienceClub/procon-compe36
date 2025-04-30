using System;
using System.IO;
using UnityEngine;

/// <summary>
/// 送受信データの基底クラス
/// </summary>
/// <typeparam name="IData">このクラスの派生クラス</typeparam>
[Serializable]
public class CommunicationData<IData> where IData : CommunicationData<IData>
{
    /// <summary>
    /// JSONファイルを読み込んで自分の型に合った形式に変換する
    /// </summary>
    /// <param name="filename">読み込むファイル名（パスは<c>../procon36_server/informationLog/</c>）</param>
    /// <param name="instance"></param>
    public static void Load(string filename, out IData instance) => instance = JsonUtility.FromJson<IData>(File.ReadAllText($"../procon36_server/informationLog/{filename}.json", System.Text.Encoding.UTF8));
}