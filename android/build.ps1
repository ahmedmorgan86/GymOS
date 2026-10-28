param(
 [string]$SdkPath = "$env:LOCALAPPDATA\Android\Sdk",
 [string]$JavaHome = 'C:\Program Files\Android\Android Studio\jbr',
 [Parameter(Mandatory=$true)][string]$SigningKey,
 [string]$KeyAlias = 'gymos-member-release',
 [string]$PasswordEnv = 'GYMOS_ANDROID_STORE_PASSWORD'
)
$ErrorActionPreference='Stop'
if(-not [Environment]::GetEnvironmentVariable($PasswordEnv)){throw 'Set the signing password through the named environment variable.'}
$env:GYMEG_KEYSTORE=(Resolve-Path -LiteralPath $SigningKey).Path
$env:GYMEG_KEY_ALIAS=$KeyAlias
$env:GYMEG_KEYSTORE_PASSWORD=[Environment]::GetEnvironmentVariable($PasswordEnv)
$env:JAVA=Join-Path $JavaHome 'bin/java.exe'
$buildTools=Get-ChildItem -LiteralPath (Join-Path $SdkPath 'build-tools') -Directory | Sort-Object Name -Descending | Select-Object -First 1
$platform=Get-ChildItem -LiteralPath (Join-Path $SdkPath 'platforms') -Directory | Sort-Object Name -Descending | Select-Object -First 1
if(-not $buildTools -or -not $platform){throw 'Install official Android SDK build tools and a platform.'}
$env:ANDROID_BUILD_TOOLS=$buildTools.FullName
$env:ANDROID_PLATFORM_JAR=Join-Path $platform.FullName 'android.jar'
try{& python (Join-Path $PSScriptRoot '../mobile-android/build.py') --target legacy-members;if($LASTEXITCODE -ne 0){throw 'Android build failed.'}}
finally{Remove-Item Env:GYMEG_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue}
