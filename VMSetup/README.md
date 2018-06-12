# VM Setup

Setup scripts for rock rms and rock related systems.

## Rock RMS - Web Server (IIS on Windows Server 2016)

[Rock_IIS_WindowsServer2016Setup.ps1](./Rock_IIS_WindowsServer2016Setup.ps1)

 - Changes startup shell from CMD to Powershell
 - Installs IIS and ASP.NET features
 - Sets up secure defaults for TLS Cipher Suites
 - Configures Windows Firewall
 - Sets up Let's Encrypt (if configured)
   - Downloads and installs win-acme
   - Requests a cert and adds it to IIS and RDP
 - Configures the AppPool Identity for Rock
 - Downloads and sets up the Rock RMS installer

## Rock RMS - SQL Server (SQL Server 2016 on Windows Server 2016)

[Rock_IIS_WindowsServer2016Setup.ps1](./Rock_IIS_WindowsServer2016Setup.ps1)

 - Changes startup shell from CMD to Powershell
 - Downloads and runs a silent install of SQL Server 2016 Express