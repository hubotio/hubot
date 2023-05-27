#Botforge PowerShell Start Script
#Invoke from the PowerShell prompt or start via automated tools 

$BotforgePath = "drive:\path\to\botforge"
$BotforgeAdapter = "Botforge adapter"

Write-Host "Starting Botforge Watcher"
While (1)
{
    Write-Host "Starting Botforge"
    Start-Process powershell -ArgumentList "$BotforgePath\bin\botforge –adapter $BotforgeAdapter" -wait
}