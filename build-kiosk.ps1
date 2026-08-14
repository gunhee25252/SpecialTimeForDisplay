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

  # IIS 호스팅용 산출물과 디버그 심볼은 실행에 쓰이지 않으므로 배포본에서 제외한다.
  # (서버는 Kestrel이 web 폴더를 직접 서빙한다.)
  $unusedFiles = @(
    'web.config',
    'aspnetcorev2_inprocess.dll',
    'SpecialTimeKiosk.staticwebassets.endpoints.json'
  )
  foreach ($name in $unusedFiles) {
    $path = Join-Path $resolvedPackage $name
    if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
  }
  Get-ChildItem -LiteralPath $resolvedPackage -Filter '*.pdb' -File | Remove-Item -Force

  Copy-Item -LiteralPath '.\dist' -Destination (Join-Path $resolvedPackage 'web') -Recurse
  Copy-Item -LiteralPath '.\kiosk-settings.json' -Destination $resolvedPackage
  Copy-Item -LiteralPath '.\KIOSK_HANDOFF.md' -Destination (Join-Path $resolvedPackage 'README.md')
  New-Item -ItemType Directory -Path (Join-Path $resolvedPackage 'print-results') -Force | Out-Null

  # 월드컵 라운드에서 쓰지 않는 사진은 배포본에서만 제외한다(public/ 원본은 그대로 둔다).
  node.exe '.\scripts\prune-kiosk-assets.mjs' $resolvedPackage
  if ($LASTEXITCODE -ne 0) { throw '배포본 자산 정리에 실패했습니다.' }

  Write-Host "`n키오스크 배포 폴더 생성 완료: $resolvedPackage" -ForegroundColor Green

  # 압축 파일은 압축을 풀면 kiosk-package 폴더 하나가 통째로 나오도록 만든다.
  $zipPath = Join-Path $root 'SpecialTimeKiosk-win-x64.zip'
  if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory(
    $resolvedPackage,
    $zipPath,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $true)

  $zipMegabytes = [math]::Round((Get-Item -LiteralPath $zipPath).Length / 1MB, 1)
  Write-Host "압축 파일 생성 완료: $zipPath ($zipMegabytes MB)" -ForegroundColor Green
}
finally {
  Pop-Location
}
