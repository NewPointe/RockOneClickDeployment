#r "Newtonsoft.Json"

using System;
using System.Net;
using System.Web;
using System.Text;
using System.Security.Cryptography;

using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

public static class Util 
{
	
	public static JsonSerializerSettings CamelCaseSerializerSettings = new JsonSerializerSettings { 
    	ContractResolver = new CamelCasePropertyNamesContractResolver()
	};
	
	public static string GetHmac(string input, string secret) {
    	KeyedHashAlgorithm sha = KeyedHashAlgorithm.Create("HMACSHA1");
    	sha.Key = Encoding.UTF8.GetBytes(secret);
    	return BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(input))).Replace("-","").ToLower();
	}
	
	public static string GetQueryParameter(HttpRequestMessage req, string key) {
		return req.GetQueryNameValuePairs().FirstOrDefault(q => string.Compare(q.Key, key, true) == 0).Value;
	}
	
	public static string GetClientIp(HttpRequestMessage req) {
		return ((HttpContextWrapper)req.Properties["MS_HttpContext"]).Request.UserHostAddress;
	}
	
	public static HttpContent CreateJsonResponse<T>(T jsonObject) {
		return new StringContent(JsonConvert.SerializeObject(jsonObject, CamelCaseSerializerSettings), Encoding.UTF8, "application/json");
	}
	
	public static async Task<T> ParseJsonResponseAsync<T>(HttpContent content) {
		string body = await content.ReadAsStringAsync();
    	return JsonConvert.DeserializeObject<T>(body);
	}
	
}