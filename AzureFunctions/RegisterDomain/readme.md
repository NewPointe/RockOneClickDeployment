# [Experiment] Register Domain (C#)

Preface: This was just an experiment in using Azure Functions + external APIs, idk how useful it would actually be  ¯\\\_(ツ)\_/¯

The `Register Domain` endpoint allows Azure-VM based rock installations to register a matching sub-domain of `*.therock.ninja`.

## How to Use

Simply send a POST to this api function with the following parameters:
 - `name` - Your Azure-provided domain
 - `code` - The authorization key for this Azure Function (provided by us)

For example:  
```
POST https://therockninja.azurewebsites.net/api/RegisterDomain?code=<FunctionKey>&name=rock-newpointe-01.eastus.cloudapp.azure.com
```
Will return:
```
Hello rock-newpointe-01.eastus.cloudapp.azure.com, your new name is rock-newpointe-01.eastus.therock.ninja!
```

## Limitations

To prevent abuse, this api has some limitations on the requested name:
 - The requested name *must* be a subdomain of `cloudapp.azure.com`
 - The requested name *must* begin with `rock-`
 - The requested name *must not* contain extra special characters
 - The registration request *must* originate from an IP that the requested name resolves to.
 
Some of these restrictions may be lifted in the future as things develop.

## Other Notes
This api works by registering a matching CNAME record for a given cloudapp subdomain. The cloudapp subdomain and the registered subdomain are always the same, meaning there's no chance of conflicting records and no way of "stealing" anyone else's domain - even if you requested a domain you don't control, you'd just be setting up the link for whoever does. Also, since it's set up as a CNAME, the record will always point to the same host as the cloudapp domain. If you're familiar with a DNAME record, this kind of works the same way - except you have to explicitly request a link though this endpoint.