Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Function Invoke-DownloadAndExtract([string] $DownloadUrl, [string] $ExtractTo) {

    # Get a tmp file to store the download
    $tmpFile = [System.IO.Path]::GetTempFileName() + ".zip"

    # Force TLS 1.2 (needed for some sites like Github)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    # Download file
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $tmpFile

    # Extract file
    if(Get-Command "Expand-Archive" -ErrorAction SilentlyContinue) {
        Expand-Archive $tmpFile -DestinationPath $ExtractTo
    }
    else {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($tmpFile, $ExtractTo)
    }

    # Cleanup
    Remove-Item $tmpFile
}

# Set a maximised Powershell window for the login shell
Write-Host "Replacing startup CMD with PowerShell..."
Set-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -Name Shell -Value 'PowerShell.exe -NoExit -WindowStyle Maximized'

# Install IIS
Write-Host "Installing IIS and ASP.NET 4.5..."
Install-WindowsFeature Web-Server,Web-Asp-Net45

Write-Host "Securing the server a bit..."

# Setup Secure Cipher Suits
Write-Host "    Setting up secure SSL/TLS Cipher Suites..."
(Get-TlsCipherSuite).Name | Disable-TlsCipherSuite
"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256","TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384","TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA","TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA","TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256","TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384","TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256","TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384","TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA","TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA","TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256","TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384","TLS_DHE_RSA_WITH_AES_128_GCM_SHA256","TLS_DHE_RSA_WITH_AES_256_GCM_SHA384","TLS_DHE_RSA_WITH_AES_128_CBC_SHA","TLS_DHE_RSA_WITH_AES_256_CBC_SHA","TLS_DHE_RSA_WITH_AES_128_CBC_SHA256","TLS_DHE_RSA_WITH_AES_256_CBC_SHA256" | Enable-TlsCipherSuite

# SSL version config is found in
# HKLM:\System\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols
# Everything looks good already so not doing anything there

# Disable all firewall rules except Core Networking, Remote Desktop, and IIS
Write-Host "    Setting up firewall..."
Get-NetFireWallRule | Where-Object { ($_.Enabled -eq $true) -and !($_.Name -match "^(CoreNet|RemoteDesktop|IIS-WebServerRole)-" ) } | Disable-NetFirewallRule

# If we have a FQDN, setup Let's Encrypt
$fqdn = ""
$email = ""
If (![String]::IsNullOrWhiteSpace($fqdn) -and ![String]::IsNullOrWhiteSpace($email)) {

    Write-Host "    Setting up Let's Encrypt..."

    $acmeRoot = Join-Path $env:ProgramFiles "win-acme"
    $acmeDownloadVersion = "v1.9.10.1"
    
    Write-Host "        Installing ACME client..."
    Invoke-DownloadAndExtract https://github.com/PKISharp/win-acme/releases/download/$acmeDownloadVersion/win-acme.$acmeDownloadVersion.zip $acmeRoot

    Write-Host "        Getting a cert for $fqdn..."
    Push-Location $acmeRoot
    & $acmeRoot\letsencrypt.exe --accepttos --emailaddress "$email" --plugin manual --manualhost "$fqdn" --manualtargetisiis --validationmode http-01 --validation selfhosting --certificatestore My --installation iis,manual --installationsiteid 1 --script "./Scripts/PSScript.bat" --scriptparameters "./Scripts/ImportRDListener.ps1 {5}"
    Pop-Location
}


Write-Host "Setting up for Rock..."

# Set DefaultAppPool to use the "LocalSystem" identity
Write-Host "    Configuring AppPool..."
Set-ItemProperty IIS:\AppPools\DefaultAppPool -Name processModel.identityType -Value 0

# Clear the webroot
Write-Host "    Clearing some space..."
Remove-Item C:\inetpub\wwwroot\* -Recurse

# Download Rock RMS
Write-Host "    Downloading Rock installer..."
Invoke-DownloadAndExtract https://rockrms.blob.core.windows.net/install/installer/rockrms-install.zip C:/inetpub/wwwroot

# Get Public Ip
$publicIp = Invoke-RestMethod http://ipinfo.io/json | Select-Object -ExpandProperty ip

Write-Host "Webserver Prepared!"
Write-Host "You should be able to complete the installation either locally at http://localhost/Start.aspx or over the internet at http://$publicIp/Start.aspx"