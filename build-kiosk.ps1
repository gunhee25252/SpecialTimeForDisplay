$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$packageDirectory = Join-Path $root 'kiosk-package'
$resolvedRoot = [System.IO.Path]::GetFullPath($root)
$resolvedPackage = [System.IO.Path]::GetFullPath($packageDirectory)

if (-not $resolvedPackage.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw '배포 폴더가 프로젝트 밖을 가리키고 있습니다.'
}

Push-Location $root
try {
  npm.cmd run build

  if (Test-Path -LiteralPath $resolvedPackage) {
    Remove-Item -LiteralPath $resolvedPackage -Recurse -Force
  }

  dotnet publish '.\kiosk-server\SpecialTimeKiosk.csproj' `
    --configuration Release `
    --runtime win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    --output $resolvedPackage

  Copy-Item -LiteralPath '.\dist' -Destination (Join-Path $resolvedPackage 'web') -Recurse
  Copy-Item -LiteralPath '.\kiosk-settings.json' -Destination $resolvedPackage
  Copy-Item -LiteralPath '.\KIOSK_HANDOFF.md' -Destination (Join-Path $resolvedPackage 'README.md')
  New-Item -ItemType Directory -Path (Join-Path $resolvedPackage 'print-results') -Force | Out-Null

  Write-Host "`n키오스크 배포 폴더 생성 완료: $resolvedPackage" -ForegroundColor Green
}
finally {
  Pop-Location
}
