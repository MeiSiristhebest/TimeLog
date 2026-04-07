# TimeLog 一键全栈启动脚本 (v1.0)
# 功能：清理残留进程 -> 启动 Android App -> 启动 AI Agent

Write-Host "--- 🧪 正在提升系统稳定性：清理残留进程 ---" -ForegroundColor Cyan

# 1. 强制结束 Node 和 Python 进程
$ProcessesToKill = @("node", "python")
foreach ($proc in $ProcessesToKill) {
    if (Get-Process -Name $proc -ErrorAction SilentlyContinue) {
        Write-Host "[-] 正在结束进程: $proc" -ForegroundColor Yellow
        Stop-Process -Name $proc -Force -ErrorAction SilentlyContinue
    }
}

# 2. 清理端口 8081 (Metro Bundler)
$port = 8081
$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connection) {
    Write-Host "[!] 发现端口 $port 被占用，正在释放..." -ForegroundColor Red
    $connection | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Write-Host "--- 🚀 正在并行启动服务 ---" -ForegroundColor Green

# 3. 启动 Android App 开发端 (新窗口)
Write-Host "[+] 正在新窗口启动 Android 开发环境..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='📱 TimeLog-App (Android)'; npm run android"

# 4. 启动 AI Story Agent (新窗口)
Write-Host "[+] 正在新窗口启动 Story Agent (Gemini API)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='🤖 TimeLog-Agent'; npm run agent:dev"

Write-Host "-------------------------------------------"
Write-Host "✅ 服务已分流到独立窗口运行。" -ForegroundColor Green
Write-Host "💡 提示：如果 LiveKit 连接失败，请检查 .env 中的 LIVEKIT_URL 是否正确。" -ForegroundColor Yellow
