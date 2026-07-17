$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$codeScript = Join-Path $scriptDir "build-code-release-package.ps1"
$fullScript = Join-Path $scriptDir "build-full-restore-package.ps1"

function ConvertFrom-Utf8Base64($value) {
  return [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($value))
}

function Assert-PathExists($path) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Expected path to exist: $path"
  }
}

function Assert-PathMissing($path) {
  if (Test-Path -LiteralPath $path) {
    throw "Expected path to be missing: $path"
  }
}

Assert-PathExists $codeScript
Assert-PathExists $fullScript

$releaseAreaName = ConvertFrom-Utf8Base64 "5Y+R5biD5Yy6"
$codePackageName = ConvertFrom-Utf8Base64 "5Luj56CB5Y+R5biD5YyF"
$fullPackageName = ConvertFrom-Utf8Base64 "5a6M5pW05oGi5aSN5YyF"
$currentName = ConvertFrom-Utf8Base64 "5b2T5YmN54mI5pys"

$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("erp14-release-script-test-" + [guid]::NewGuid().ToString("N"))

try {
  New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $testRoot "backend\data") -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $testRoot "backend\uploads") -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $testRoot "backend\middleware") -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $testRoot "backend\db") -Force | Out-Null

  Set-Content -LiteralPath (Join-Path $testRoot "erp14-server-showcase.html") -Value "<html>ERP14</html>" -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\server.js") -Value "console.log('server');" -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\package.json") -Value '{"name":"test"}' -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\package-lock.json") -Value '{"name":"test","lockfileVersion":3}' -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\config.js") -Value "module.exports = {};" -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\middleware\authMiddleware.js") -Value "module.exports = {};" -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\db\schema.sql") -Value "-- schema" -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\db\init.sql") -Value "-- init" -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\data\site-config.json") -Value '{"site":"config"}' -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\data\event-signups.json") -Value '[]' -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $testRoot "backend\uploads\image.png") -Value "fake-image" -Encoding UTF8

  & $codeScript -ProjectRoot $testRoot | Out-Null
  $codeRelease = Join-Path (Join-Path (Join-Path $testRoot $releaseAreaName) $codePackageName) $currentName
  Assert-PathExists (Join-Path $codeRelease "erp14-server-showcase.html")
  Assert-PathExists (Join-Path $codeRelease "backend\server.js")
  Assert-PathExists (Join-Path $codeRelease "backend\package.json")
  Assert-PathExists (Join-Path $codeRelease "backend\package-lock.json")
  Assert-PathExists (Join-Path $codeRelease "backend\config.js")
  Assert-PathExists (Join-Path $codeRelease "backend\middleware\authMiddleware.js")
  Assert-PathExists (Join-Path $codeRelease "backend\db\schema.sql")
  Assert-PathExists (Join-Path $codeRelease "backend\db\init.sql")
  Assert-PathExists (Join-Path $codeRelease "release-manifest.json")
  Assert-PathMissing (Join-Path $codeRelease "backend\data")
  Assert-PathMissing (Join-Path $codeRelease "backend\uploads")

  & $fullScript -ProjectRoot $testRoot | Out-Null
  $fullRelease = Join-Path (Join-Path (Join-Path $testRoot $releaseAreaName) $fullPackageName) $currentName
  Assert-PathExists (Join-Path $fullRelease "erp14-server-showcase.html")
  Assert-PathExists (Join-Path $fullRelease "backend\server.js")
  Assert-PathExists (Join-Path $fullRelease "backend\package.json")
  Assert-PathExists (Join-Path $fullRelease "backend\data\site-config.json")
  Assert-PathExists (Join-Path $fullRelease "backend\data\event-signups.json")
  Assert-PathExists (Join-Path $fullRelease "backend\uploads\image.png")
  Assert-PathExists (Join-Path $fullRelease "release-manifest.json")
}
finally {
  if (Test-Path -LiteralPath $testRoot) {
    Remove-Item -LiteralPath $testRoot -Recurse -Force
  }
}

Write-Output "release script tests passed"
