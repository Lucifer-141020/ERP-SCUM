param(
  [string]$ProjectRoot = "O:\AI\Open AI_Codex\SCUM用户网页"
)

$ErrorActionPreference = "Stop"

function ConvertFrom-Utf8Base64($value) {
  return [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($value))
}

$releaseAreaName = ConvertFrom-Utf8Base64 "5Y+R5biD5Yy6"
$codePackageName = ConvertFrom-Utf8Base64 "5Luj56CB5Y+R5biD5YyF"
$currentName = ConvertFrom-Utf8Base64 "5b2T5YmN54mI5pys"
$historyName = ConvertFrom-Utf8Base64 "5Y6G5Y+y54mI5pys"
$backupName = ConvertFrom-Utf8Base64 "5aSH5Lu9"

$releaseRoot = Join-Path (Join-Path $ProjectRoot $releaseAreaName) $codePackageName
$currentRelease = Join-Path $releaseRoot $currentName
$historyRoot = Join-Path $releaseRoot $historyName
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
New-Item -ItemType Directory -Path $historyRoot -Force | Out-Null

if (Test-Path -LiteralPath $currentRelease) {
  $historyTarget = Join-Path $historyRoot "release-$timestamp"
  Move-Item -LiteralPath $currentRelease -Destination $historyTarget
}

New-Item -ItemType Directory -Path $currentRelease -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $currentRelease "backend") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $currentRelease "backend\middleware") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $currentRelease "backend\db") -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $ProjectRoot "erp14-server-showcase.html") -Destination (Join-Path $currentRelease "erp14-server-showcase.html") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "backend\server.js") -Destination (Join-Path $currentRelease "backend\server.js") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "backend\package.json") -Destination (Join-Path $currentRelease "backend\package.json") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "backend\package-lock.json") -Destination (Join-Path $currentRelease "backend\package-lock.json") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "backend\config.js") -Destination (Join-Path $currentRelease "backend\config.js") -Force
Copy-Item -Path (Join-Path $ProjectRoot "backend\middleware\*") -Destination (Join-Path $currentRelease "backend\middleware") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "backend\db\schema.sql") -Destination (Join-Path $currentRelease "backend\db\schema.sql") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "backend\db\init.sql") -Destination (Join-Path $currentRelease "backend\db\init.sql") -Force

$include = @()
$include += "erp14-server-showcase.html"
$include += "backend/server.js"
$include += "backend/package.json"
$include += "backend/package-lock.json"
$include += "backend/config.js"
$include += "backend/middleware"
$include += "backend/db/schema.sql"
$include += "backend/db/init.sql"

$exclude = @()
$exclude += ".git"
$exclude += ".agents"
$exclude += $backupName
$exclude += $releaseAreaName
$exclude += "backend/data"
$exclude += "backend/uploads"
$exclude += "backend/test"
$exclude += "*.backup*.html"
$exclude += "verify_*.js"
$exclude += "update_*.js"

$manifest = [ordered]@{
  generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss");
  packageType = "code-release";
  uploadRoot = $currentRelease;
  include = $include;
  exclude = $exclude;
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $currentRelease "release-manifest.json") -Encoding UTF8

Write-Output "code release package generated: $currentRelease"
