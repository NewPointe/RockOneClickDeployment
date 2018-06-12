#r "System.Web"
#r "Newtonsoft.Json"

#load "../Shared/Util.csx"

using System.Net;
using System.Net.Http;
using System.Web;
using System.Text;
using System.Text.RegularExpressions;
using System.Security.Cryptography;

using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

private const string API_BASEURL = "https://api.dnsmadeeasy.com/V2.0/dns/managed";
private const string API_KEY = "00000000-0000-0000-0000-000000000000";
private const string API_SECRET = "00000000-0000-0000-0000-000000000000";
private const string DNS_ID = "123456";
private const bool ENFORCE_IP_CHECKING = true;
private const string NAME_VALIDATION_REGEX = "^rock-[0-9A-z-_\\.]+\\.[A-z]+\\.cloudapp\\.azure\\.com$";
private const string NAME_VALIDATION_COMMENT = "Requested name must be in the format 'rock-*.*.cloudapp.azure.com' without special characters. For example: rock-newpointe-01.eastus.cloudapp.azure.com";

private static void UpdateDMEHeaders(HttpClient client, string apiKey, string apiSecret) {
    string requestDate = DateTime.UtcNow.ToString("r");
    string hmac = Util.GetHmac(requestDate, apiSecret);
    client.DefaultRequestHeaders.Clear();
    client.DefaultRequestHeaders.Add("x-dnsme-apiKey", apiKey);
    client.DefaultRequestHeaders.Add("x-dnsme-requestDate", requestDate);
    client.DefaultRequestHeaders.Add("x-dnsme-hmac", hmac);
}

public static async Task<HttpResponseMessage> Run(HttpRequestMessage req, TraceWriter log) {
    
    log.Info("Begin - New Domain Registration Request.");

    // Try to get name from query parameter
    string name = Util.GetQueryParameter(req, "name");

    // Otherwise try to get it from the request body
    if (name == null) {
        NameRequest postData = await Util.ParseJsonResponseAsync<NameRequest>(req.Content);
        name = postData.Name;
    }

    // If it's still null, throw an error
    if (string.IsNullOrWhiteSpace(name)) {
        log.Info("End - No name requested.");
        return req.CreateResponse(HttpStatusCode.BadRequest, "Please pass a name on the query string or in the request body!");
    }

    log.Info($"    Requested Name: {name}");

    // Check the name to make sure it's valid
    if (!Regex.IsMatch(name, NAME_VALIDATION_REGEX)) {
        log.Info("End - Invalid name requested.");
        return req.CreateResponse(HttpStatusCode.BadRequest, $"Invalid Name! {NAME_VALIDATION_COMMENT}");
    }

    // Attempt to resolve the name
    string[] ips = Dns.GetHostAddresses(name).Select(ip => ip.ToString()).ToArray();
    
    log.Info("    Resolved IPs: " + String.Join(", ", ips));
    
    // Get the client's ip
    string clientIP = Util.GetClientIp(req);

    log.Info("    Client ip: " + clientIP);
    
    if(ENFORCE_IP_CHECKING) {
        // Make sure the ips match
        if(!ips.Contains(clientIP)) {
            log.Info("End - No IP match found.");
            return req.CreateResponse(HttpStatusCode.BadRequest, "Request must originate from the named host!");
        }
    }

    // Get the hostname
    string hostname = name.Replace(".cloudapp.azure.com", "");
    
    log.Info("    Hostname: " + hostname);

    // Setup an http client
    HttpClient client = new HttpClient();
    UpdateDMEHeaders(client, API_KEY, API_SECRET);

    // Check if the hostname is already registered
    HttpResponseMessage response = await client.GetAsync($"{API_BASEURL}/{DNS_ID}/records?recordName={hostname}&type=CNAME");

    // Check for a successful response
    if(!response.IsSuccessStatusCode) {
        string responseText = await response.Content.ReadAsStringAsync();
        log.Info($"End - DNS provider returned an error during hostname check: [{response.StatusCode}] {responseText}");
        return req.CreateResponse(HttpStatusCode.BadRequest, $"Got error code from dns provider: {response.StatusCode}");
    }

    // Parse the return content 
    RecordSearchResult searchResult = await Util.ParseJsonResponseAsync<RecordSearchResult>(response.Content);

    // If it already has a CNAME, return
    if (searchResult.TotalRecords > 0) {
        log.Info($"End - hostname already registered with DNS provider.");
        return req.CreateResponse(HttpStatusCode.OK, "Your name is already configured!");
    }

    // Otherwise add one
    UpdateDMEHeaders(client, API_KEY, API_SECRET);
    HttpResponseMessage postResponse = await client.PostAsync(
        $"{API_BASEURL}/{DNS_ID}/records",
        Util.CreateJsonResponse(
            new CNameRecord {
                Name = hostname,
                Value = $"{name}."
            }
        )
    );

    // Check for a successful response
    if(!postResponse.IsSuccessStatusCode) {
        string responseText = await postResponse.Content.ReadAsStringAsync();
        log.Info($"End - DNS provider returned an error during hostname creation: [{postResponse.StatusCode}] {responseText}");
        return req.CreateResponse(HttpStatusCode.BadRequest, $"Got error code from dns provider: {postResponse.StatusCode}");
    }

    log.Info($"End - hostname successfully registered.");
    return req.CreateResponse(HttpStatusCode.OK, $"Hello {name}, your new name is {hostname}.therock.ninja!");
}

private class RecordSearchResult_Data {
    public bool Failover { get; set; }
    public bool Monitor { get; set; }
    public int SourceId { get; set; }
    public bool DynamicDns { get; set; }
    public bool Failed { get; set; }
    public string GtdLocation { get; set; }
    public int Ttl { get; set; }
    public int Source { get; set; }
    public string Name { get; set; }
    public string Value { get; set; }
    public int Id { get; set; }
    public string Type { get; set; }
}

private class RecordSearchResult {
    public int TotalPages { get; set; }
    public int TotalRecords { get; set; }
    public RecordSearchResult_Data[] Data { get; set; }
    public int Page { get; set; }
}

private class CNameRecord {
    public int Ttl { get; set; } = 1800;
    public string Type { get; set; } = "CNAME";
    public string GtdLocation { get; set; } = "DEFAULT";
    public string Name { get; set; }
    public string Value { get; set; }
}

private class NameRequest {
    public string Name { get; set; }
}