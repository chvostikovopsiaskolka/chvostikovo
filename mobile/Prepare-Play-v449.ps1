# Chvostikovo Android v449: reproducible local Firebase + Android Studio handoff.
# This script NEVER signs, uploads or changes Google Play, and it never reads passwords.
param([string]$FirebaseJson = "", [switch]$PreflightOnly)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$mobile = Split-Path -Parent $PSCommandPath
$root = Split-Path -Parent $mobile
$manifest = Join-Path $root "version.json"
if (-not (Test-Path -LiteralPath $manifest)) { throw "Chyba version.json. Spusti skript z kompletneho checkoutu." }
$release = Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
if ($release.build -ne "v449" -or $release.version -ne "2.0.122") {
  throw "Toto nie je Android v449/2.0.122. Aktualne: $($release.build) $($release.version)."
}
$keystore = Join-Path $env:USERPROFILE "Documents\Chvostikovo-Keys\chvostikovo-upload.jks"
if (-not (Test-Path -LiteralPath $keystore -PathType Leaf)) {
  throw "Nenasiel som povodny upload keystore: $keystore. Nevytvaraj novy podpisovy kluc."
}
# Private Firebase config is never in git; reuse the same previously working local file.
# Only named historical Chvostikovo checkouts are consulted (never scan all drives).
function Test-ExistingFirebase {
  param([string]$Candidate)
  if (-not (Test-Path -LiteralPath $Candidate -PathType Leaf)) { return $false }
  try {
    $candidateConfig = Get-Content -LiteralPath $Candidate -Raw | ConvertFrom-Json
    $matching = @($candidateConfig.client | Where-Object {
      $_.client_info.android_client_info.package_name -eq "sk.chvostikovo.app"
    })
    return ($matching.Count -gt 0)
  } catch { return $false }
}

$firebaseTarget = Join-Path $mobile "android\app\google-services.json"
if (-not (Test-Path -LiteralPath $firebaseTarget -PathType Leaf)) {
  $candidates = @()
  if ($FirebaseJson) {
    $candidates += $FirebaseJson.Trim('"').Trim("'")
  } else {
    foreach ($oldVersion in @("v448", "v444", "v440", "v436", "v435", "v434", "v431", "v412", "v418", "v407")) {
      $candidates += Join-Path $env:USERPROFILE "Chvostikovo-Android-$oldVersion\mobile\android\app\google-services.json"
    }
    $candidates += Join-Path $env:USERPROFILE ".codex\visualizations\2026\10\28\01a182ee-0d2d-74a3-b1d6-12d8193cbac2\chvostikovo-android-v403\mobile\android\app\google-services.json"
  }
  $firebaseSource = $null
  foreach ($candidate in $candidates) {
    if (Test-ExistingFirebase -Candidate $candidate) {
      $firebaseSource = $candidate
      break
    }
  }
  if (-not $firebaseSource) {
    if ($FirebaseJson) { throw "Zadany Firebase subor neexistuje alebo nepatri k sk.chvostikovo.app: $FirebaseJson" }
    throw "Povodny Firebase google-services.json sa nenasiel v znamych Android v448/v444/v440/v436/v435/v434/v431/v412/v418/v407/v403 priecinkoch. Nespustaj novy Firebase setup."
  }
  Copy-Item -LiteralPath $firebaseSource -Destination $firebaseTarget
  Write-Host "Firebase: povodny konfiguracny subor prevzaty automaticky z lokalneho Android projektu." -ForegroundColor Green
}
if (-not (Test-ExistingFirebase -Candidate $firebaseTarget)) {
  throw "Nespravny Firebase google-services.json: neobsahuje package sk.chvostikovo.app."
}
if ($PreflightOnly) {
  Write-Host "Firebase a povodny keystore: lokalny preflight PASS (bez buildu a podpisu)." -ForegroundColor Green
  return
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue) -or
    -not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
  throw "Vyzaduje sa Node.js/npm (preferovany Node 22) a lokalne Android SDK/Android Studio."
}
Write-Host ""
Write-Host "Chvostikovo Android v449 / 2.0.122" -ForegroundColor Cyan
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
