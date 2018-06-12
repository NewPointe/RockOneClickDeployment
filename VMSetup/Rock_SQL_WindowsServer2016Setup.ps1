Param(
    [Parameter(Mandatory=$true, Position=0, HelpMessage="What SA Password do you want to use for this server?")]
    [SecureString]$SAPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Set a maximised Powershell window for the login shell
Set-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' -Name Shell -Value 'PowerShell.exe -NoExit -WindowStyle Maximized'

# Download SQL Server
Write-Host "Downloading SQL Server 2016 Express installer..."
Invoke-WebRequest -Uri https://download.microsoft.com/download/9/0/7/907AD35F-9F9C-43A5-9789-52470555DB90/ENU/SQLEXPR_x64_ENU.exe -OutFile $Env:TEMP/SQLEXPR_x64_ENU.exe

# Extract the installer
Write-Host "Extracting the installer..."
$Env:TEMP\SQLEXPR_x64_ENU.exe

# Run installer
Write-Host "Installing SQL Server 2016 Express..."
$Env:TEMP\SQLEXPR_x64_ENU\SETUP.EXE /QS /ACTION=Install /FEATURES=SQLENGINE /INSTANCENAME=MSSQLSERVER /IACCEPTSQLSERVERLICENSETERMS /SECURITYMODE=SQL /SAPWD="$SAPassword" /SQLSVCACCOUNT="NT Authority\System"

# Clean up installer
Write-Host "Cleaning up..."
Remove-Item $Env:TEMP\SQLEXPR_x64_ENU -Recurse
Remove-Item $Env:TEMP\SQLEXPR_x64_ENU.exe


Write-Host "Done!"