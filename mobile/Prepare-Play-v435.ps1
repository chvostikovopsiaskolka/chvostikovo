# Chvostikovo Android v435: reproducible local Firebase + Android Studio handoff.
# This script NEVER signs, uploads or changes Google Play, and it never reads passwords.
param([string]$FirebaseJson = "")
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$mobile = Split-Path -Parent $PSCommandPath
$root = Split-Path -Parent $mobile
$manifest = Join-Path $root "version.json"
if (-not (Test-Path -LiteralPath $manifest)) { throw "Chyba version.json. Spusti skript z kompletneho checkoutu." }
$release = Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
if ($release.build -ne "v435" -or $release.version -ne "2.0.108") {
  throw "Toto nie je Android v435/2.0.108. Aktualne: $($release.build) $($release.version)."
}
$keystore = Join-Path $env:USERPROFILE "Documents\Chvostikovo-Keys\chvostikovo-upload.jks"
if (-not (Test-Path -LiteralPath $keystore -PathType Leaf)) {
  throw "Nenasiel som povodny upload keystore: $keystore. Nevytvaraj novy podpisovy kluc."
}
$firebaseTarget = Join-Path $mobile "android\app\google-services.json"
if (-not (Test-Path -LiteralPath $firebaseTarget -PathType Leaf)) {
  if (-not $FirebaseJson) {
    try {
      Add-Type -AssemblyName System.Windows.Forms
      $dialog = New-Object System.Windows.Forms.OpenFileDialog
      $dialog.Title = "Vyber POVODNY Firebase google-services.json z posledneho funkcneho Android projektu"
      $dialog.Filter = "Firebase konfiguracia (google-services.json)|google-services.json|JSON (*.json)|*.json"
      if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $FirebaseJson = $dialog.FileName
      }
      $dialog.Dispose()
    } catch {
      Write-Host "Graficky vyber nebol dostupny." -ForegroundColor Yellow
    }
    if (-not $FirebaseJson) {
      $FirebaseJson = Read-Host "Zadaj lokalnu cestu k povodnemu google-services.json"
    }
  }
  $FirebaseJson = $FirebaseJson.Trim('"').Trim("'")
  if (-not (Test-Path -LiteralPath $FirebaseJson -PathType Leaf)) {
    throw "Povodny Firebase JSON neexistuje: $FirebaseJson"
  }
  Copy-Item -LiteralPath $FirebaseJson -Destination $firebaseTarget -Force
}
$config = Get-Content -LiteralPath $firebaseTarget -Raw | ConvertFrom-Json
$matchingClients = @($config.client | Where-Object {
  $_.client_info.android_client_info.package_name -eq "sk.chvostikovo.app"
})
if ($matchingClients.Count -lt 1) {
  throw "Nespravny Firebase projekt: google-services.json neobsahuje Android package sk.chvostikovo.app."
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue) -or
    -not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
  throw "Vyzaduje sa Node.js/npm (preferovany Node 22) a lokalne Android SDK/Android Studio."
}
Write-Host ""
Write-Host "Chvostikovo Android v435 / 2.0.108" -ForegroundColor Cyan
Write-Host "Firebase: povodny google-services.json pre sk.chvostikovo.app [overene]" -ForegroundColor Green
Write-Host "Upload keystore: $keystore" -ForegroundColor Cyan
Write-Host "Key alias: chvostikovo-upload" -ForegroundColor Cyan
Write-Host "Hesla sem ani do GitHubu nezadavaj. Zadas ich az v Android Studio." -ForegroundColor Yellow
Push-Location $mobile
try {
  & npm.cmd ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci zlyhalo" }
  & npm.cmd run sync
  if ($LASTEXITCODE -ne 0) { throw "Capacitor sync zlyhal" }
  & npm.cmd test
  if ($LASTEXITCODE -ne 0) { throw "Nativne regresne testy zlyhali" }
  Write-Host "Otvaram Android Studio..." -ForegroundColor Green
  & npx.cmd cap open android
  if ($LASTEXITCODE -ne 0) { throw "Android Studio sa nepodarilo otvorit" }
} finally { Pop-Location }
Write-Host ""
Write-Host "V Android Studio: Build > Generate Signed Bundle / APK > Android App Bundle > release." -ForegroundColor Cyan
Write-Host "Pouzi POVODNY upload keystore a alias uvedene vyssie; neklikaj na Create New." -ForegroundColor Yellow
Write-Host "Pred uploadom do Play over najvyssi versionCode, certifikat, Firebase FCM a App Links na fyzickom Androide." -ForegroundColor Yellow
