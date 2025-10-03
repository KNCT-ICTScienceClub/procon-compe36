using System.Collections;
using System.Net.Http;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

public class Communication
{
    public async Task<string> Receive()
    {
        using HttpClient client = new();
        client.DefaultRequestHeaders.Add("Procon-Token", "kure3037997297c7e6e840bb98658ca5175aa607a40d7f59a343ff7ecf182c45");
        var response = await client.GetAsync(@"http://localhost:8000/problem");
        return await response.Content.ReadAsStringAsync();
    }

    public async Task Send()
    {
        using HttpClient client = new();
        StringContent content = new("{}", System.Text.Encoding.UTF8, "application/json");
        var request = await client.PostAsync(@"http;//localhost:8000/answer", content);
    }
}