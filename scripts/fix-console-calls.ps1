# PowerShell script to batch replace console calls with devLog
# Run this from the project root directory

$ErrorActionPreference = "Stop"

# Get all TypeScript files excluding tests
$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx -Exclude *.test.ts,*.test.tsx,devLogger.ts

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Check if file already imports devLog
    $hasDevLogImport = $content -match "import\s+{[^}]*devLog[^}]*}\s+from\s+['\`"]@/lib/devLogger['\`"]"
    
    # Check if file has any console calls
    $hasConsoleCalls = $content -match "console\.(log|warn|error|debug)\("
    
    if ($hasConsoleCalls) {
        $totalFiles++
        
        # Replace console calls
        $content = $content -replace 'console\.error\(', 'devLog.error('
        $content = $content -replace 'console\.warn\(', 'devLog.warn('
        $content = $content -replace 'console\.log\(', 'devLog.info('
        $content = $content -replace 'console\.debug\(', 'devLog.debug('
        
        # Add devLog import if not present
        if (-not $hasDevLogImport) {
            # Find the last import statement
            if ($content -match '(?ms)(.*)(import\s+.*?from\s+[''"`].*?[''"`];?)(\r?\n)') {
                $beforeLastImport = $Matches[1]
                $lastImport = $Matches[2]
                $lineBreak = $Matches[3]
                
                # Insert devLog import after the last import
                $devLogImport = "import { devLog } from '@/lib/devLogger';"
                $content = $beforeLastImport + $lastImport + $lineBreak + $devLogImport + $lineBreak + $content.Substring($beforeLastImport.Length + $lastImport.Length + $lineBreak.Length)
            }
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            $modifiedFiles++
            Write-Host "✓ Modified: $($file.FullName)" -ForegroundColor Green
        }
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Total files with console calls: $totalFiles" -ForegroundColor Yellow
Write-Host "Modified files: $modifiedFiles" -ForegroundColor Green
Write-Host "`nPlease review changes and run: npm run lint" -ForegroundColor Cyan
