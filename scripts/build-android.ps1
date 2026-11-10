<#
  Builds release Android artifacts (APK + AAB) on Windows.

  Why the extra step: this project lives in a deep folder
  (C:\Users\USER\Documents\RCCG_NYAYA_360_Trybe\trybe). Native libraries such
  as react-native-worklets compile with CMake/Ninja, which mirror absolute
  source paths into their build folders and exceed Windows' 260-character
  path limit. So we mirror the project into a short folder, build there, and
  copy the finished files back into ./builds.

  Usage:  npm run build:android            (APK + AAB)
          npm run build:android -- -Apk    (APK only, faster)
#>
param(
  [switch]$Apk,
  [string]$WorkDir = 'C:\t\trybe'
)

$ErrorActionPreference = 'Stop'
$Src = Split-Path $PSScriptRoot -Parent
$OutDir = Join-Path $Src 'builds'

# 1. Generate the native Android project if it doesn't exist yet (CNG).
if (-not (Test-Path (Join-Path $Src 'android'))) {
  Write-Host '> Generating android/ with expo prebuild...'
  Push-Location $Src
  npx expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }
  Pop-Location
}

# 2. Mirror the project into the short work folder. Only changed files are
#    copied; Gradle/CMake outputs in the work folder are kept for fast rebuilds.
Write-Host "> Syncing project to $WorkDir ..."
$exclude = @(
  '.git', '.expo', '.cxx', 'builds',
  (Join-Path $Src 'android\app\build'),
  (Join-Path $Src 'android\build'),
  (Join-Path $Src 'android\.gradle'),
  (Join-Path $Src 'android\.kotlin')
)
robocopy $Src $WorkDir /MIR /XD @exclude /NFL /NDL /NJH /NJS /NP /MT:16 | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

# 3. Build. Architectures cover real phones (arm) and emulators (x86_64).
$tasks = if ($Apk) { @('assembleRelease') } else { @('assembleRelease', 'bundleRelease') }
Write-Host "> Running Gradle: $($tasks -join ', ')"
Push-Location (Join-Path $WorkDir 'android')
try {
  .\gradlew.bat @tasks '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64' --console=plain
  if ($LASTEXITCODE -ne 0) { throw 'Gradle build failed' }
} finally {
  Pop-Location
}

# 4. Copy the results back into the project.
$version = (Get-Content (Join-Path $Src 'app.json') -Raw | ConvertFrom-Json).expo.version
New-Item -ItemType Directory -Force $OutDir | Out-Null
$apk = Join-Path $WorkDir 'android\app\build\outputs\apk\release\app-release.apk'
$aab = Join-Path $WorkDir 'android\app\build\outputs\bundle\release\app-release.aab'
Copy-Item $apk (Join-Path $OutDir "trybe360-$version.apk") -Force
if (-not $Apk) { Copy-Item $aab (Join-Path $OutDir "trybe360-$version.aab") -Force }

Write-Host ''
Write-Host "Done. Files in $OutDir :"
Get-ChildItem $OutDir | ForEach-Object { '  {0}  ({1:N1} MB)' -f $_.Name, ($_.Length / 1MB) }
