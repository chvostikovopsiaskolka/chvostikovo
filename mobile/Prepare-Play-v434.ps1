# Chvostikovo Android v434: reproducible local Firebase + Android Studio handoff.
# This script NEVER signs, uploads or changes Google Play, and it never reads passwords.
param([string]$FirebaseJson = "")
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$mobile = Split-Path -Parent $PSCommandPath
$root = Split-Path -Parent $mobile
$manifest = Join-Path $root "version.json"
if (-not (Test-Path -LiteralPath $manifest)) { throw "Chýba version.json. Spusti skript z kompletného checkoutu." }
$release = Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
if ($release.build -ne "v434" -or $release.version -ne "2.0.107") {
  throw "Toto nie je Android v434/2.0.107. Aktuálne: $($release.build) $($release.version)."
}
$keystore = Join-Path $env:USERPROFILE "Documents\Chvostikovo-Keys\chvostikovo-upload.jks"
if (-not (Test-Path -LiteralPath $keystore -PathType Leaf)) {
  throw "Nenašiel som pôvodný upload keystore: $keystore. Nevytváraj nový podpisový kľúč."
}
$firebaseTarget = Join-Path $mobile "android\app\google-services.json"
if (-not (Test-Path -LiteralPath $firebaseTarget -PathType Leaf)) {
  if (-not $FirebaseJson) {
    try {
      Add-Type -AssemblyName System.Windows.Forms
      $dialog = New-Object System.Windows.Forms.OpenFileDialog
      $dialog.Title = "Vyber PÔVODNÝ Firebase google-services.json z posledného funkčného Android projektu"
      $dialog.Filter = "Firebase konfigurácia (google-services.json)|google-services.json|JSON (*.json)|*.json"
      if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $FirebaseJson = $dialog.FileName
      }
      $dialog.Dispose()
    } catch {
      Write-Host "Grafický výber nebol dostupný." -ForegroundColor Yellow
    }
    if (-not $FirebaseJson) {
      $FirebaseJson = Read-Host "Zadaj lokálnu cestu k pôvodnému google-services.json"
    }
  }
  $FirebaseJson = $FirebaseJson.Trim('"').Trim("'")
  if (-not (Test-Path -LiteralPath $FirebaseJson -PathType Leaf)) {
    throw "Pôvodný Firebase JSON neexistuje: $FirebaseJson"
  }
  Copy-Item -LiteralPath $FirebaseJson -Destination $firebaseTarget -Force
}
$config = Get-Content -LiteralPath $firebaseTarget -Raw | ConvertFrom-Json
$matchingClients = @($config.client | Where-Object {
  $_.client_info.android_client_info.package_name -eq "sk.chvostikovo.app"
})
if ($matchingClients.Count -lt 1) {
  throw "Nesprávny Firebase projekt: google-services.json neobsahuje Android package sk.chvostikovo.app."
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue) -or
    -not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
  throw "Vyžaduje sa Node.js/npm (preferovaný Node 22) a lokálne Android SDK/Android Studio."
}
Write-Host ""
Write-Host "Chvostíkovo Android v434 / 2.0.107" -ForegroundColor Cyan
Write-Host "Firebase: pôvodný google-services.json pre sk.chvostikovo.app [overené]" -ForegroundColor Green
Write-Host "Upload keystore: $keystore" -ForegroundColor Cyan
Write-Host "Key alias: chvostikovo-upload" -ForegroundColor Cyan
Write-Host "Heslá sem ani do GitHubu nezadávaj. Zadáš ich až v Android Studio." -ForegroundColor Yellow
Push-Location $mobile
try {
  & npm.cmd ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci zlyhalo" }
  & npm.cmd run sync
  if ($LASTEXITCODE -ne 0) { throw "Capacitor sync zlyhal" }
  & npm.cmd test
  if ($LASTEXITCODE -ne 0) { throw "Natívne regresné testy zlyhali" }
  Write-Host "Otváram Android Studio..." -ForegroundColor Green
  & npx.cmd cap open android
  if ($LASTEXITCODE -ne 0) { throw "Android Studio sa nepodarilo otvoriť" }
} finally { Pop-Location }
Write-Host ""
Write-Host "V Android Studio: Build > Generate Signed Bundle / APK > Android App Bundle > release." -ForegroundColor Cyan
Write-Host "Použi PÔVODNÝ upload keystore a alias uvedené vyššie; neklikaj na Create New." -ForegroundColor Yellow
Write-Host "Pred uploadom do Play over najvyšší versionCode, certifikát, Firebase FCM a App Links na fyzickom Androide." -ForegroundColor Yellow
